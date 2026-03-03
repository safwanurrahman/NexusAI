import time
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from celery.result import AsyncResult

# Import our custom modules
from worker import conduct_research_task
from models.schemas import ResearchRequest

app = FastAPI(title="Scalable LinkedIn AI", version="2.0")

# --- CACHE CONFIGURATION ---
search_cache = {}
CACHE_TTL = 3600

# Updated CORS configuration for Production
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",                # Local development
        "https://nexusresearch-ai.netlify.app"  # Your live Netlify site
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def health_check():
    return {"status": "online", "message": "API is listening"}

@app.post("/research")
async def start_research(request: ResearchRequest):
    query = request.query.strip().lower()
    # Safely get country, fallback to 'all'
    country = getattr(request, 'country', 'all').lower() 
    
    current_time = time.time()
    cache_key = f"{query}_{country}"
    
    # 1. Cache Check
    if cache_key in search_cache:
        cached = search_cache[cache_key]
        if current_time < cached["expires"]:
            print(f"⚡ CACHE HIT: '{query}' [{country}]")
            return {"status": "success", "data": cached["data"]}

    # 2. Hand off to Celery Worker
    print(f"📡 Dispatching task to Worker: {query} ({country})")
    try:
        task = conduct_research_task.delay(query, country)
        return {"status": "processing", "task_id": task.id}
    except Exception as e:
        print(f"❌ Celery Error: {e}")
        raise HTTPException(status_code=500, detail="Worker queue is unavailable")

@app.get("/results/{task_id}")
async def get_results(task_id: str):
    task_result = AsyncResult(task_id)
    
    if task_result.ready():
        if task_result.failed():
            return {"status": "error", "message": "Worker task failed"}
        
        data = task_result.result
        return {"status": "success", "data": data}
    
    return {"status": "pending"}
