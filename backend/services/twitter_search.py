import os
import requests
import json
from dotenv import load_dotenv

load_dotenv()

SERPER_API_KEY = os.getenv("SERPER_API_KEY")

# backend/services/twitter_search.py

def search_twitter(query: str, country: str = "all"):
    print(f"\n🔍 [TWITTER SEARCH SERVICE] Initializing Twitter/X Search for: '{query}'")
    
    # 1. Check API Key presence
    if not SERPER_API_KEY:
        print("❌ [CRITICAL] SERPER_API_KEY is missing from .env file!")
        return []

    url = "https://google.serper.dev/search"
    
    # Twitter/X variant: search both twitter.com and x.com
    search_query = f"(site:twitter.com OR site:x.com) {query}"
    
    payload_dict = {
        "q": search_query,
        "num": 10
    }

    # Serper uses 'gl' for country codes (bd, us, gb, etc.)
    if country and country != "all":
        # Ensure country codes are 2 letters (e.g., 'us', 'bd')
        gl_code = country.lower()[:2] 
        payload_dict["gl"] = gl_code
        print(f"🌍 [DEBUG] Applying Country Filter (gl): {gl_code}")
    else:
        print("🌐 [DEBUG] No specific country filter applied (Global Search).")

    headers = {
        'X-API-KEY': SERPER_API_KEY,
        'Content-Type': 'application/json'
    }

    try:
        print(f"📡 [DEBUG] Sending POST request to Serper (Twitter). Payload: {json.dumps(payload_dict)}")
        
        response = requests.post(url, headers=headers, json=payload_dict)
        
        # Check for HTTP errors (401 Unauthorized, 429 Rate Limit, etc.)
        if response.status_code != 200:
            print(f"⚠️ [API WARNING] Serper returned Status {response.status_code}: {response.text}")
        
        response.raise_for_status()
        results = response.json()
        
        organic = results.get('organic', [])
        
        # Data Quality Check
        if not organic:
            print(f"❓ [DEBUG] Serper returned 200 OK but 'organic' list is empty for Twitter query.")
        else:
            first_title = organic[0].get('title', 'No Title')
            print(f"✅ [SUCCESS] Found {len(organic)} Twitter results. Top result: '{first_title}'")
        
        return organic

    except requests.exceptions.HTTPError as http_err:
        print(f"❌ [HTTP ERROR] Serper API call failed (Twitter): {http_err}")
        return []
    except Exception as e:
        print(f"❌ [TWITTER SEARCH SERVICE ERROR] Unexpected failure: {e}")
        return []

# =================================================================
# 📖 THE STORY OF THIS FILE (THE TWITTER SCOUT)
# =================================================================
# * THE TWITTER MISSION: Just like the LinkedIn Scout, this scout is
#   sent out to reconnaissance the web. But instead of looking for
#   "site:linkedin.com", he wears a "Twitter/X Disguise"
#   (site:twitter.com OR site:x.com) to only find tweets and posts.
#
# * THE DUAL-PLATFORM SEARCH: Twitter/X are treated as one entity,
#   so the scout searches both domains to catch all relevant posts,
#   whether they're on the legacy twitter.com or new x.com.
#
# * THE SAME REPORT: He returns the same format as his LinkedIn
#   counterpart: a list of links with title, snippet, and metadata.
#   The Chef doesn't care where the scout went; he just needs
#   results in the expected format.
#
# * THE PROTOCOL: Everything else is identical to linkedin_search.py:
#   country filtering, error handling, logging, and structure.
#   This follows the DRY principle and maintains consistency.
# =================================================================

# 🛡️ WHY WE IMPORT HEADERS HERE?
# We use headers in 'twitter_search.py' to provide the
# 'X-API-KEY', just like LinkedIn does. The Serper API doesn't
# care if you're searching Twitter or LinkedIn; you still need
# to prove who you are with the same badge (API Key).
# This Scout carries the same passport as his LinkedIn twin.
