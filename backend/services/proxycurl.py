# backend/services/proxycurl.py
import requests
from backend.core.config import get_settings

# --- CENTRALIZED CONFIG ---
settings = get_settings()

def fetch_linkedin_data(profile_url: str) -> dict:
    """
    Fetches raw LinkedIn profile data via Proxycurl.
    This is called by the Chef (research_worker.py) in the Kitchen.
    """
    print(f"\n🔍 [PROXYCURL SERVICE] Initializing Deep Fetch for: {profile_url}")
    
    # --- MANUAL TOGGLE: API KEY ---
    # LOCAL MODE: Pulls from your .env via Pydantic
    PROXYCURL_API_KEY = settings.PROXYCURL_API_KEY

    # CLOUD MODE: (Commented out - used for explicit overrides in production)
    # PROXYCURL_API_KEY = "your_actual_railway_key_here"
    
    # 1. API Key Validation
    if not PROXYCURL_API_KEY:
        print("🚨 [CRITICAL] PROXYCURL_API_KEY is missing! Check .env or Railway Variables.")
        return {"error": "PROXYCURL_API_KEY is missing."}
    
    # 2. Input Validation
    if "linkedin.com/" not in profile_url:
        print(f"⚠️ [WARNING] Input '{profile_url}' may be invalid. Proxycurl needs a full URL.")

    api_endpoint = 'https://nubela.co/proxycurl/api/v2/linkedin'
    headers = {'Authorization': f'Bearer {PROXYCURL_API_KEY}'}
    params = {'url': profile_url}

    try:
        print(f"📡 [DEBUG] Sending GET request to Proxycurl API... (Expect 5-10s delay)")
        
        # Note: Proxycurl requests are synchronous and slow; perfect for Celery
        response = requests.get(api_endpoint, params=params, headers=headers)
        
        if response.status_code != 200:
            print(f"❌ [API ERROR] Proxycurl returned {response.status_code}: {response.text}")
            # Handle specific status codes (e.g., 403 for out of credits)
        
        response.raise_for_status()
        data = response.json()
        
        name = data.get('full_name', 'Unknown Profile')
        print(f"✅ [SUCCESS] Successfully fetched data for: {name}")
        
        return data

    except requests.exceptions.HTTPError as http_err:
        print(f"❌ [HTTP ERROR] Proxycurl call failed: {http_err}")
        return {"error": str(http_err)}
    except Exception as e:
        print(f"❌ [SERVICE ERROR] Unexpected failure in Proxycurl service: {e}")
        return {"error": str(e)}