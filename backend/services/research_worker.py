import time
import threading
import uuid
from typing import Dict, List, Tuple

# Importing your specific service logic
from .proxycurl import fetch_linkedin_data
from .openai_ext import summarize_with_ai
from ..models.article import BackendArticle, TaskStatus, BackendResponse
from ..core.config import get_settings

# Internal stores for local development tracking
_task_store: Dict[str, Tuple[float, BackendResponse]] = {}
_cache_store: Dict[str, Tuple[float, List[BackendArticle]]] = {}

settings = get_settings()

def _clean_expired() -> None:
    """Cleans up the local memory so it doesn't leak during long dev sessions."""
    now = time.time()
    # Pulling from your .env settings
    max_age = settings.MAX_TASK_AGE_SECONDS or 3600 
    for store in (_task_store, _cache_store):
        expired_keys = [
            k for k, (created_at, _) in store.items()
            if now - created_at > max_age
        ]
        for k in expired_keys:
            store.pop(k, None)

def start_research_task(query: str, country: str = "all") -> BackendResponse:
    """
    The Entry Point: Creates a background task for the worker.
    """
    _clean_expired()
    cache_key = f"{query.strip().lower()}::{country}"

    # 1. LOCAL CACHE CHECK
    if cache_key in _cache_store:
        _, articles = _cache_store[cache_key]
        print(f"⚡ [WORKER CACHE] Hit for: {cache_key}")
        return BackendResponse(status=TaskStatus.success, data=articles)

    # 2. START ASYNC WORK
    task_id = str(uuid.uuid4())
    _task_store[task_id] = (time.time(), BackendResponse(status=TaskStatus.pending))

    # --- MANUAL TOGGLE: EXECUTION MODE ---
    # LOCAL MODE: Uses threading for immediate local feedback
    thread = threading.Thread(
        target=_worker_run,
        args=(task_id, cache_key, query, country),
        daemon=True,
    )
    thread.start()

    # CLOUD MODE: (On Railway, you would use celery_app.send_task here)
    # return BackendResponse(status=TaskStatus.pending, task_id=task_id)

    print(f"📡 [WORKER] Task {task_id} dispatched to the kitchen.")
    return BackendResponse(status=TaskStatus.pending, task_id=task_id)

def _worker_run(task_id: str, cache_key: str, query: str, country: str) -> None:
    """
    The Kitchen Logic: This actually executes the Scraper and the AI.
    """
    try:
        print(f"👨‍🍳 [WORKER RUN] Sourcing data for: {query}")
        
        # 1. Call Proxycurl (The Scraper)
        # Note: Using profile_url logic from your proxycurl.py
        # In a real search, you'd find the URL first, but here we process the query.
        raw_data = fetch_linkedin_data(profile_url=f"https://www.linkedin.com/in/{query}")
        
        if "error" in raw_data:
            raise Exception(raw_data["error"])

        # 2. Call OpenAI (The Brain)
        # We pass the 'summary' or 'experience' from Proxycurl to OpenAI
        raw_text = raw_data.get("summary") or "No profile summary available."
        ai_summary = summarize_with_ai(raw_text)

        # 3. Map to BackendArticle (Matching Frontend Headers)
        # Frontend expects: title, link, author, summary
        processed_articles = [
            BackendArticle(
                title=f"Insight: {raw_data.get('full_name', 'LinkedIn Professional')}",
                link=f"https://www.linkedin.com/in/{query}",
                author=raw_data.get('full_name', 'Contributor'),
                summary=ai_summary,
            )
        ]

        resp = BackendResponse(status=TaskStatus.success, data=processed_articles)
        
        # Save results for the Frontend Poller
        _task_store[task_id] = (time.time(), resp)
        _cache_store[cache_key] = (time.time(), processed_articles)
        print(f"✅ [WORKER SUCCESS] Task {task_id} complete.")

    except Exception as exc:
        print(f"❌ [WORKER ERROR] Task {task_id} failed: {exc}")
        _task_store[task_id] = (
            time.time(),
            BackendResponse(
                status=TaskStatus.error,
                message=str(exc) or "Worker failed during AI analysis.",
            ),
        )

def get_task_result(task_id: str) -> BackendResponse:
    """Polled by GET /results/{task_id} in main.py"""
    _clean_expired()
    record = _task_store.get(task_id)
    if not record:
        return BackendResponse(status=TaskStatus.pending)

    _, resp = record
    return resp