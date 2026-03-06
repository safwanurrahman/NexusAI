import os
import time
from celery import Celery
from backend.services.linkedin_search import search_linkedin
from backend.services.openai_ext import summarize_article
from dotenv import load_dotenv

# Load API keys from .env
load_dotenv()

broker_url = os.getenv("REDIS_URL", "redis://localhost:6379")

# Setup Celery: Redis acts as both the Broker (Post Office) and Backend (Storage)
celery_app = Celery(
    "tasks",
    broker=broker_url,
    backend=broker_url,
)

# Configuration for stability
celery_app.conf.update(
    result_expires=3600,
    task_track_started=True,
    worker_prefetch_multiplier=1 
)

@celery_app.task(name="conduct_research_task")
def conduct_research_task(query: str, country: str = "all"):
    """
    Background task logic. Monitor your Railway/Worker logs to see these prints.
    """
    print(f"\n🚀 [WORKER START] Processing Query: '{query}' | Region: '{country}'")
    start_time = time.time()
    
    # 1. Fetch from Serper (LinkedIn Search)
    try:
        print(f"📡 [DEBUG] Calling search_linkedin for: {query}...")
        search_results = search_linkedin(query, country=country)
        
        count = len(search_results) if search_results else 0
        print(f"📥 [DEBUG] Search completed. Found {count} raw results.")
        
    except Exception as e:
        print(f"❌ [SEARCH ERROR] Critical failure in LinkedIn Search: {e}")
        return []
    
    if not search_results:
        print(f"⚠️ [WORKER WARNING] No results found. Ending task early.")
        return []

    # 2. Summarize each with OpenAI
    final_articles = []
    total = len(search_results)
    
    print(f"🧠 [DEBUG] Starting AI Summarization loop for {total} items...")

    for i, res in enumerate(search_results):
        title = res.get('title', 'Untitled Article')
        # Optimization: Truncate to 800 chars to stay within context windows and save $
        truncated = res.get('snippet', '')[:800]
        
        try:
            print(f"  🔄 [LOOP {i+1}/{total}] AI Summarizing: '{title[:30]}...'")
            summary = summarize_article(truncated)
            
            final_articles.append({
                "title": title,
                "link": res.get('link', '#'),
                "author": "LinkedIn Contributor",
                "summary": summary
            })
            
        except Exception as ai_err:
            print(f"    ❌ [AI ERROR] Item {i+1} failed: {ai_err}")
            continue # Keep going to get the rest of the results
    
    end_time = time.time()
    duration = round(end_time - start_time, 2)
    
    print(f"\n✨ [WORKER FINISHED]")
    print(f"📊 Summary: {len(final_articles)}/{total} articles processed.")
    print(f"⏱️ Total Time: {duration}s | Results stored in Redis.")
    
    return final_articles

# =================================================================
# 📖 THE STORY OF THIS FILE (THE HEAD CHEF)
# =================================================================
# * THE KITCHEN OPENS: Imagine a chef in a back kitchen with no 
#   windows. This file is that Head Chef. He doesn't talk to the 
#   customers; he just waits for the "Waiter" (main.py) to pin a 
#   ticket to the board via Redis.
#
# * THE DISPATCH: Once the Chef sees a ticket, he wakes up and 
#   immediately calls his "Scout" (search_linkedin). He says, 
#   "Go find me every scrap of info you can about this topic!"
#
# * THE PREP WORK: When the Scout returns with a pile of raw 
#   LinkedIn snippets, the Chef doesn't just serve them raw. 
#   He starts a loop, treating each snippet like a different 
#   ingredient that needs to be chopped and cooked.
#
# * THE MASTER TASTER: For every single snippet, he sends it to 
#   his "Gourmet Expert" (OpenAI). The Expert tastes the raw text 
#   and turns it into a refined, 2-sentence summary.
#
# * THE FINAL PLATE: The Chef assembles all these refined summaries 
#   on a digital tray and puts it in the "Service Window" (Redis). 
#   He then logs his total time, wipes his counter, and waits 
#   for the next ticket.
# =================================================================

# 🛡️ WHY WE IMPORT HEADERS HERE? (The Broker Connection)
# While worker.py doesn't define HTTP headers itself, it relies 
# on the headers defined in its services. However, it also uses 
# a "Broker" (Redis). Think of the Redis URL as a header of sorts; 
# it contains the "Address" and "Credentials" needed to talk to 
# the database. Without that connection info, the Chef is 
# essentially working in a kitchen with locked doors—he can't 
# receive orders or send food back out. By setting up the Celery 
# app with the correct Redis URL, we ensure that the Chef can 
# communicate with the Waiter and the customers effectively.