import os
import requests
import json
from dotenv import load_dotenv

load_dotenv()

SERPER_API_KEY = os.getenv("SERPER_API_KEY")

# backend/services/linkedin_search.py

def search_linkedin(query: str, country: str = "all"):
    url = "https://google.serper.dev/search"
    
    # BROADENED: Removed /posts/ to ensure we get results. 
    # Added "LinkedIn" to the query to reinforce the platform.
    search_query = f"site:linkedin.com {query}"
    
    payload_dict = {
        "q": search_query,
        "num": 10
    }

    # Serper uses 'gl' for country codes (bd, us, gb, etc.)
    if country and country != "all":
        payload_dict["gl"] = country.lower()

    headers = {
        'X-API-KEY': SERPER_API_KEY,
        'Content-Type': 'application/json'
    }

    try:
        response = requests.post(url, headers=headers, json=payload_dict)
        response.raise_for_status()
        results = response.json()
        
        # Log this so you can see the count in Terminal 2
        organic = results.get('organic', [])
        print(f"📡 Serper: Found {len(organic)} results for '{query}' in {country}")
        
        return organic
    except Exception as e:
        print(f"❌ Serper API Error: {e}")
        return []