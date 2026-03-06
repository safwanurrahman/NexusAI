# backend/main.py
import time
from typing import Any, Dict

from fastapi import FastAPI, HTTPException
from celery.result import AsyncResult

from backend.core.cors import setup_cors
from backend.models.schemas import ResearchRequest, ResearchResponse
from backend.worker import conduct_research_task

# --- MANUAL TOGGLE: APP TITLE ---
# LOCAL MODE (Active)
app = FastAPI(title="Scalable LinkedIn AI - LOCAL", version="2.0")

# CLOUD MODE (Commented out)
# app = FastAPI(title="Scalable LinkedIn AI - PRODUCTION", version="2.0")

# Centralized CORS config (Handled via manual toggle in backend/core/cors.py)
setup_cors(app)

# In‑memory cache: query+country -> articles
search_cache: Dict[str, Dict[str, Any]] = {}
CACHE_TTL = 3600  # seconds

# Map Celery task_id -> cache_key so we can cache on completion
task_metadata: Dict[str, str] = {}


@app.get("/")
def health_check() -> dict:
    """Simple health endpoint for uptime checks."""
    print("🌐 [DEBUG] GET /: Health check triggered. System is alive.")
    return {"status": "online", "message": "API is listening"}


@app.post("/research", response_model=ResearchResponse)
async def start_research(request: ResearchRequest) -> ResearchResponse:
    """
    Entry point from the frontend.
    1) Normalizes query + country.
    2) Checks in‑memory cache.
    3) If cached → return success + data.
    4) Otherwise kicks off Celery worker and returns processing + task_id.
    """
    print("📥 [DEBUG] POST /research: Received new order.")

    query = request.query.strip().lower()
    country = (request.country or "all").strip().lower()

    print(f"🔎 [DEBUG] Parsing Data: Query='{query}' | Country='{country}'")

    now = time.time()
    cache_key = f"{query}_{country}"

    # 1. Cache check
    cached_entry = search_cache.get(cache_key)
    if cached_entry:
        if now < cached_entry["expires"]:
            print(f"⚡ [CACHE HIT]: Serving cached result for '{cache_key}'.")
            return ResearchResponse(status="success", data=cached_entry["data"])
        else:
            # Expired cache -> remove it
            print(f"🗑️ [CACHE EXPIRED]: Dropping stale cache for '{cache_key}'.")
            search_cache.pop(cache_key, None)

    # 2. Hand off to Celery worker
    print("📡 [DEBUG] CACHE MISS: Dispatching task to worker...")
    try:
        task = conduct_research_task.delay(query, country)
        task_metadata[task.id] = cache_key
        print(f"✅ [DEBUG] Ticket pinned! Task ID: {task.id}")
        return ResearchResponse(status="processing", task_id=task.id)
    except Exception as e:  # noqa: BLE001
        print(f"❌ [CRITICAL] Celery Error: {e}")
        raise HTTPException(status_code=500, detail="Worker queue is unavailable") from e


@app.get("/results/{task_id}", response_model=ResearchResponse)
async def get_results(task_id: str) -> ResearchResponse:
    """
    Polled by the frontend.
    1) Looks up Celery AsyncResult.
    2) If failed → status=error.
    3) If ready → store in cache (if we know the cache_key) and return success + data.
    4) Otherwise → status=pending.
    """
    print(f"🔍 [DEBUG] GET /results/{task_id}: Checking task status...")
    task_result = AsyncResult(task_id)

    # If the task backend doesn't know this ID at all, treat as error
    if task_result is None:
        print(f"🚨 [DEBUG] Task {task_id} not found in backend.")
        return ResearchResponse(status="error", message="Task not found", task_id=task_id)

    if task_result.ready():
        if task_result.failed():
            print(f"🚨 [DEBUG] Worker reported a failure for Task {task_id}.")
            return ResearchResponse(status="error", message="Worker task failed", task_id=task_id)

        data = task_result.result or []
        print(f"🎉 [DEBUG] Success! Task {task_id} is finished. Delivering data.")

        # Persist in cache keyed by original query+country if we have it
        cache_key = task_metadata.pop(task_id, None)
        if cache_key:
            search_cache[cache_key] = {
                "data": data,
                "expires": time.time() + CACHE_TTL,
            }
            print(f"💾 [CACHE STORE]: Cached result under '{cache_key}'.")

        return ResearchResponse(status="success", data=data, task_id=task_id)

    print(f"⏳ [DEBUG] Task {task_id} is still pending.")
    return ResearchResponse(status="pending", task_id=task_id)

# =================================================================
# 📖 THE STORY OF THIS FILE (THE FRONT DESK)
# =================================================================
# * THE WAITER’S ARRIVAL: main.py is the Waiter at the front desk.
#
# * THE ID CHECK (CORS): Before taking an order, the Waiter checks 
#   trust based on the manual toggle in backend/core/cors.py.
#
# * THE QUICK SEARCH (CACHE): Checks the "Already Prepared" cabinet.
#
# * SENDING TO THE KITCHEN: Handed to Celery (Terminal 3). 
#
# * THE FOLLOW-UP: GET /results checks the kitchen progress.
# =================================================================

# =================================================================
# 📖 THE STORY OF THIS FILE (THE FRONT DESK)
# =================================================================
# * THE WAITER’S ARRIVAL: Imagine a busy restaurant. main.py is the 
#   Waiter standing at the front desk. He waits for customers 
#   (the User's Frontend) to walk in with an order.
#
# * THE ID CHECK (CORS): Before taking an order, the Waiter checks 
#   if the customer is from a trusted neighborhood (Netlify or 
#   Localhost). If they aren't, he doesn't let them in.
#
# * THE QUICK SEARCH (CACHE): If someone asks for a research query, 
#   the Waiter first checks his "Already Prepared" cabinet (the Cache). 
#   If the exact same dish was made an hour ago, he just hands it over 
#   instantly.
#
# * SENDING TO THE KITCHEN: If it's a new order, the Waiter writes a 
#   ticket and pins it to the kitchen wheel (Celery Task). He then 
#   hands the customer a "Beeper" (the Task ID) and says, "Relax, 
#   we'll buzz you when it's ready."
#
# * THE FOLLOW-UP: Every few seconds, the customer holding the beeper 
#   asks, "Is it done yet?" (GET /results). The Waiter checks the 
#   kitchen and either gives them the "Plate" (Data) or tells them 
#   to keep waiting.
# =================================================================

# 🛡️ WHY WE IMPORT HEADERS HERE?
# In main.py, we define 'allow_headers' in the CORS middleware. 
# Think of these as the "Acceptable Handshakes." We are telling the 
# user's browser: "It's okay for the frontend to send us special 
# information like 'Content-Type' or 'Authorization' in their 
# request headers. We won't block them for it."