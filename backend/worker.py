import os
import time
from celery import Celery
from services.linkedin_search import search_linkedin
from services.openai_ext import summarize_article
from dotenv import load_dotenv

# Load API keys from .env
load_dotenv()

# Setup Celery: Redis acts as both the Broker (Post Office) and Backend (Storage)
celery_app = Celery(
    "tasks",
    broker="redis://localhost:6379/0",
    backend="redis://localhost:6379/0"
)

# Configuration for stability
celery_app.conf.update(
    result_expires=3600,
    task_track_started=True,
    worker_prefetch_multiplier=1 
)

@celery_app.task(name="research_task") # REMOVED bind=True to prevent argument errors
def conduct_research_task(query: str, country: str = "all"):  # REMOVED 'self'
    """
    Background task to perform the heavy lifting.
    This runs in Terminal 2 (Worker).
    """
    print(f"🚀 Worker started processing: {query} (Region: {country})")
    
    # 1. Fetch from Serper (LinkedIn Search)
    try:
        search_results = search_linkedin(query, country=country)
    except Exception as e:
        print(f"❌ Search Error: {e}")
        return []
    
    if not search_results:
        print(f"⚠️ No results found for: {query}")
        return []

    # 2. Summarize each with OpenAI
    final_articles = []
    total = len(search_results)
    
    for i, res in enumerate(search_results):
        print(f"🔄 Processing article {i+1}/{total}: {res.get('title', 'Untitled')[:30]}...")
        
        # Optimization: Truncate to 800 chars to save tokens
        truncated = res.get('snippet', '')[:800]
        
        try:
            summary = summarize_article(truncated)
            final_articles.append({
                "title": res.get('title', 'LinkedIn Post'),
                "link": res.get('link', '#'),
                "author": "LinkedIn Contributor",
                "summary": summary
            })
        except Exception as ai_err:
            print(f"❌ AI Error on article {i+1}: {ai_err}")
            # If one fails, we keep going with the others
            continue 
    
    print(f"✅ Worker finished: {query} ({len(final_articles)} articles summarized)")
    return final_articles # This result is saved to Redis for the API to fetch