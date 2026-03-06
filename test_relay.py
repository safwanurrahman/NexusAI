import requests
import time

# The address of your Waiter (FastAPI)
BASE_URL = "http://localhost:8000" 

def run_master_test(query, country="all"):
    print(f"🏁 Starting Relay Race for Query: '{query}'")
    
    # 1. THE START: Send the request to main.py
    payload = {"query": query, "country": country}
    try:
        print(f"📤 STEP 1: Sending request to {BASE_URL}/research...")
        response = requests.post(f"{BASE_URL}/research", json=payload)
        response.raise_for_status()
        
        data = response.json()
        task_id = data.get("task_id")
        print(f"✅ STEP 2: Request Accepted! Beeper (Task ID) received: {task_id}")
        
    except Exception as e:
        print(f"❌ FAILED at the Starting Line: {e}")
        return

    # 2. THE WAIT: Poll the results endpoint
    print(f"⏳ STEP 3: Waiting for the Kitchen (Worker) to finish...")
    
    attempts = 0
    max_attempts = 30 # Wait up to 60 seconds
    
    while attempts < max_attempts:
        attempts += 1
        result_response = requests.get(f"{BASE_URL}/results/{task_id}")
        result_data = result_response.json()
        status = result_data.get("status")
        
        if status == "success":
            print(f"\n🎉 STEP 4: Dish is Ready! Received {len(result_data['data'])} articles.")
            for i, article in enumerate(result_data['data'][:2]): # Show first 2
                print(f"   📜 Result {i+1}: {article['title']}")
                print(f"   🤖 AI Summary: {article['summary'][:100]}...")
            break
        elif status == "error":
            print(f"\n🚨 STEP 4: The Kitchen reported an error.")
            break
        else:
            # Still pending
            print(f"   ... [{attempts}] Kitchen is still cooking (Status: {status})")
            time.sleep(2) # Wait 2 seconds before checking again
    else:
        print("\n😴 TEST TIMED OUT: The kitchen took too long.")

if __name__ == "__main__":
    # You can change this query to test anything!
    run_master_test("AI trends in Bangladesh", country="bd")
