import os
import requests
from dotenv import load_dotenv

load_dotenv()

PROXYCURL_API_KEY = os.getenv("PROXYCURL_API_KEY")

def fetch_linkedin_data(query: str) -> dict:
    if not PROXYCURL_API_KEY:
        return {"error": "PROXYCURL_API_KEY is missing from the .env file."}
    
    api_endpoint = 'https://nubela.co/proxycurl/api/v2/linkedin'
    headers = {'Authorization': f'Bearer {PROXYCURL_API_KEY}'}
    params = {'url': query}

    try:
        response = requests.get(api_endpoint, params=params, headers=headers)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Proxycurl Error: {e}")
        return {"error": str(e)}
