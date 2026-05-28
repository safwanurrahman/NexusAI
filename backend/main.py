# backend/main.py
#docker compose up --build -d

import time
from typing import Any, Dict

from fastapi import FastAPI, HTTPException
from celery.result import AsyncResult

from backend.core.cors import setup_cors
from backend.models.schemas import ResearchRequest, ResearchResponse
from backend.worker import conduct_research_task
from backend.worker import celery_app

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
    1) Normalizes query + country + platform.
    2) Checks in‑memory cache.
    3) If cached → return success + data.
    4) Otherwise kicks off Celery worker and returns processing + task_id.
    """
    print("📥 [DEBUG] POST /research: Received new order.")

    query = request.query.strip().lower()
    country = (request.country or "all").strip().lower()
    platform = (request.platform or "both").strip().lower()

    print(f"🔎 [DEBUG] Parsing Data: Query='{query}' | Country='{country}' | Platform='{platform}'")

    now = time.time()
    cache_key = f"{query}_{country}_{platform}"

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
        task = conduct_research_task.delay(query, country, platform)
        task_metadata[task.id] = cache_key
        print(f"✅ [DEBUG] Ticket pinned! Task ID: {task.id}")
        return ResearchResponse(status="processing", task_id=task.id)
    except Exception as e:  # noqa: BLE001
        print(f"❌ [CRITICAL] Celery Error: {e}")
        raise HTTPException(status_code=500, detail="Worker queue is unavailable") from e


@app.post("/research/stop/{task_id}")
async def stop_research(task_id: str):
    """
    Aborts an ongoing research task using its Task ID.
    """
    print(f"🛑 [DEBUG] Stop Request: Attempting to revoke Task {task_id}")
    
    try:
        # 1. Revoke the task
        # terminate=True: Kills the process even if it's currently running.
        # signal='SIGKILL': The "hard" stop to ensure the worker drops everything.
        celery_app.control.revoke(task_id, terminate=True, signal='SIGKILL')
        
        # 2. Cleanup local metadata
        if task_id in task_metadata:
            cache_key = task_metadata.pop(task_id, None)
            print(f"🧹 [DEBUG] Cleaned up metadata for {cache_key}")

        return {"status": "stopped", "message": f"Task {task_id} has been terminated."}
    
    except Exception as e:
        print(f"❌ [ERROR] Failed to stop task: {e}")
        raise HTTPException(status_code=500, detail="Could not stop the task")
    
@app.get("/results/{task_id}", response_model=ResearchResponse)
async def get_results(task_id: str) -> ResearchResponse:
    """
    Polled by the frontend.
    1) Checks if the task was Revoked (Stopped).
    2) Checks if the task Failed.
    3) If Ready -> Stores in cache and returns data.
    4) Otherwise -> Returns pending.
    """
    print(f"🔍 [DEBUG] GET /results/{task_id}: Checking task status...")
    task_result = AsyncResult(task_id)

    # 1. Handle missing task
    if task_result is None:
        print(f"🚨 [DEBUG] Task {task_id} not found in backend.")
        return ResearchResponse(status="error", message="Task not found", task_id=task_id)

    # 2. Check if the task is finished (Ready covers Success, Failure, and Revoked)
    if task_result.ready():
        
        # 🛑 NEW: Catch the "Kill Switch" aftermath
        if task_result.state == 'REVOKED':
            print(f"🛑 [DEBUG] Task {task_id} was revoked by user. Cleaning up.")
            task_metadata.pop(task_id, None) # Remove ticket from memory
            return ResearchResponse(status="error", message="Search stopped by user", task_id=task_id)

        # 🚨 Handle internal worker errors
        if task_result.failed():
            print(f"🚨 [DEBUG] Worker reported a failure for Task {task_id}.")
            task_metadata.pop(task_id, None) # Cleanup on failure too
            return ResearchResponse(status="error", message="Worker task failed", task_id=task_id)

        # 🎉 Handle Success
        data = task_result.result or []
        print(f"🎉 [DEBUG] Success! Task {task_id} is finished. Delivering data.")

        # Persist in cache and cleanup metadata
        cache_key = task_metadata.pop(task_id, None)
        if cache_key:
            search_cache[cache_key] = {
                "data": data,
                "expires": time.time() + CACHE_TTL,
            }
            print(f"💾 [CACHE STORE]: Cached result under '{cache_key}'.")

        return ResearchResponse(status="success", data=data, task_id=task_id)

    # ⏳ Task is still in progress
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
