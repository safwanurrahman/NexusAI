import os
import requests
import json
from dotenv import load_dotenv

load_dotenv()

SERPER_API_KEY = os.getenv("SERPER_API_KEY")

# backend/services/linkedin_search.py

def search_linkedin(query: str, country: str = "all"):
    print(f"\n🔍 [SEARCH SERVICE] Initializing LinkedIn Search for: '{query}'")
    
    # 1. Check API Key presence
    if not SERPER_API_KEY:
        print("❌ [CRITICAL] SERPER_API_KEY is missing from .env file!")
        return []

    url = "https://google.serper.dev/search"
    
    # BROADENED: Removed /posts/ to ensure we get results. 
    search_query = f"site:linkedin.com {query}"
    
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
        print(f"📡 [DEBUG] Sending POST request to Serper. Payload: {json.dumps(payload_dict)}")
        
        response = requests.post(url, headers=headers, json=payload_dict)
        
        # Check for HTTP errors (401 Unauthorized, 429 Rate Limit, etc.)
        if response.status_code != 200:
            print(f"⚠️ [API WARNING] Serper returned Status {response.status_code}: {response.text}")
        
        response.raise_for_status()
        results = response.json()
        
        organic = results.get('organic', [])
        
        # Data Quality Check
        if not organic:
            print(f"❓ [DEBUG] Serper returned 200 OK but 'organic' list is empty. Check your query string.")
        else:
            first_title = organic[0].get('title', 'No Title')
            print(f"✅ [SUCCESS] Found {len(organic)} results. Top result: '{first_title}'")
        
        return organic

    except requests.exceptions.HTTPError as http_err:
        print(f"❌ [HTTP ERROR] Serper API call failed: {http_err}")
        return []
    except Exception as e:
        print(f"❌ [SEARCH SERVICE ERROR] Unexpected failure: {e}")
        return []

# =================================================================
# 📖 THE STORY OF THIS FILE (THE SCOUT)
# =================================================================
# * THE SECRET MISSION: This file is like a scout sent out to 
#   reconnaissance the web. He takes the user's topic and puts on 
#   a "LinkedIn Disguise" (site:linkedin.com) so he only looks 
#   at relevant results.
#
# * THE PASSPORT CHECK: Before he talks to the Serper Gatekeeper, 
#   he prepares his "Headers." These act like his official 
#   passport (API Key) and a sign saying "I am sending you JSON data" 
#   (Content-Type). 
#
# * THE INTERNATIONAL MAP: If the user wants a specific country, 
#   the scout adjusts his map (the 'gl' parameter) to focus 
#   only on that region, like Bangladesh (bd) or the US (us).
#
# * THE REPORT: He knocks on the door of the Serper server, shows 
#   his badge (Headers), and waits for the data. If successful, 
#   il returns a list of links. If the gatekeeper turns him 
#   away (Error), he returns empty-handed but tells you why.
# =================================================================

# 🛡️ WHY WE IMPORT HEADERS HERE?
# We use headers in 'linkedin_search.py' to provide the 
# 'X-API-KEY'. Think of the header as the "Seal" on an official 
# envelope. Without this specific seal, the Serper server won't 
# open the envelope to look at our search query; it will reject 
# us immediately to protect its data. By importing the headers 
# from 'linkedin_search.py', we ensure that every time we call 
# the search function, we have the correct "Seal" (API Key) 
# attached to our request, allowing us to access the information we need.