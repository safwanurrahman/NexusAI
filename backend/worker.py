import os
import time
from celery import Celery
from backend.services.linkedin_search import search_linkedin
from backend.services.twitter_search import search_twitter
from backend.services.openai_ext import summarize_article
from dotenv import load_dotenv
from backend.core.config import get_settings

# Load API keys from .env
load_dotenv()

settings = get_settings()
broker_url = settings.REDIS_URL

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
def conduct_research_task(query: str, country: str = "all", platform: str = "both"):
    """
    Background task logic. Supports single or dual-platform research.
    Monitor your Railway/Worker logs to see these prints.
    
    Platform options: "linkedin", "twitter", or "both"
    """
    print(f"\n🚀 [WORKER START] Processing Query: '{query}' | Region: '{country}' | Platform: '{platform}'")
    start_time = time.time()
    
    all_articles = []
    
    # 1. LinkedIn Search (if applicable)
    if platform in ["linkedin", "both"]:
        try:
            print(f"📡 [DEBUG] Calling search_linkedin for: {query}...")
            linkedin_results = search_linkedin(query, country=country)
            
            count = len(linkedin_results) if linkedin_results else 0
            print(f"📥 [DEBUG] LinkedIn search completed. Found {count} raw results.")
            
            # 2. Summarize each LinkedIn result with OpenAI
            if linkedin_results:
                print(f"🧠 [DEBUG] Starting AI Summarization loop for {count} LinkedIn items...")
                
                for i, res in enumerate(linkedin_results):
                    title = res.get('title', 'Untitled Article')
                    # Optimization: Truncate to 800 chars to stay within context windows and save $
                    truncated = res.get('snippet', '')[:800]
                    
                    try:
                        print(f"  🔄 [LINKEDIN {i+1}/{count}] AI Summarizing: '{title[:30]}...'")
                        summary = summarize_article(truncated)
                        
                        all_articles.append({
                            "title": title,
                            "link": res.get('link', '#'),
                            "author": "LinkedIn Contributor",
                            "summary": summary,
                            "platform": "linkedin"
                        })
                        
                    except Exception as ai_err:
                        print(f"    ❌ [AI ERROR] LinkedIn item {i+1} failed: {ai_err}")
                        continue
        
        except Exception as e:
            print(f"❌ [LINKEDIN SEARCH ERROR] Critical failure: {e}")
    
    # 3. Twitter Search (if applicable)
    if platform in ["twitter", "both"]:
        try:
            print(f"📡 [DEBUG] Calling search_twitter for: {query}...")
            twitter_results = search_twitter(query, country=country)
            
            count = len(twitter_results) if twitter_results else 0
            print(f"📥 [DEBUG] Twitter search completed. Found {count} raw results.")
            
            # 4. Summarize each Twitter result with OpenAI
            if twitter_results:
                print(f"🧠 [DEBUG] Starting AI Summarization loop for {count} Twitter items...")
                
                for i, res in enumerate(twitter_results):
                    title = res.get('title', 'Untitled Tweet')
                    # Optimization: Truncate to 800 chars to stay within context windows and save $
                    truncated = res.get('snippet', '')[:800]
                    
                    try:
                        print(f"  🔄 [TWITTER {i+1}/{count}] AI Summarizing: '{title[:30]}...'")
                        summary = summarize_article(truncated)
                        
                        all_articles.append({
                            "title": title,
                            "link": res.get('link', '#'),
                            "author": "Twitter Contributor",
                            "summary": summary,
                            "platform": "twitter"
                        })
                        
                    except Exception as ai_err:
                        print(f"    ❌ [AI ERROR] Twitter item {i+1} failed: {ai_err}")
                        continue
        
        except Exception as e:
            print(f"❌ [TWITTER SEARCH ERROR] Critical failure: {e}")
    
    end_time = time.time()
    duration = round(end_time - start_time, 2)
    
    print(f"\n✨ [WORKER FINISHED]")
    print(f"📊 Summary: {len(all_articles)} total articles processed.")
    print(f"⏱️ Total Time: {duration}s | Results stored in Redis.")
    
    return all_articles

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