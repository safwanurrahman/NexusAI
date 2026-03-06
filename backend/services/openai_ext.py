import os
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

# Check if API Key is actually loaded before initializing
api_key = os.getenv("OPENAI_API_KEY")
if not api_key:
    print("🚨 [CRITICAL] OPENAI_API_KEY not found in environment! AI calls will fail.")
    client= None
else:    
    client = OpenAI(api_key=api_key)  # uses .env locally, platform env in cloud


def summarize_article(text: str) -> str:
    """Uses GPT-4o-mini to turn a messy snippet into a clean summary."""
    if client is None:
        return "Summary unavailable (Available in pro version)."
    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a research assistant. Summarize the following "
                        "LinkedIn content into 2 concise sentences. Focus on the 'Value' provided."
                    ),
                },
                {"role": "user", "content": text},
            ],
            max_tokens=150,
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        print(f"❌ [AI ERROR]: {e}")
        return "Summary unavailable (Available in pro version)."

# =================================================================
# 📖 THE STORY OF THIS FILE (THE TRANSLATOR)
# =================================================================
# * THE QUIET BOOTH: Imagine a world-class translator sitting in a 
#   soundproof booth. This file is that translator. He doesn't go 
#   outside to find news; he waits for the "Chef" (Worker) to 
#   hand him a piece of paper.
#
# * THE SPECIFIC RULES: Every time he starts a job, he reminds 
#   himself of his mission: "I am a professional researcher. I 
#   must be concise—only 2 sentences." This is his internal 
#   compass (the System Message).
#
# * THE BRAIN LINK: He picks up the phone and calls the "Big AI 
#   Brain" (OpenAI API). He reads the content over the phone and 
#   waits for the brain to process it.
#
# * THE POLISHED RESULT: Once the Brain speaks, the translator 
#   writes down the answer, cleans up any extra spaces, and 
#   hands it back to the worker. If the line is busy or the 
#   Brain is tired (Quota/Error), he politely explains what went 
#   wrong.
# =================================================================

# 🛡️ WHY WE IMPORT HEADERS HERE?
# Although the 'OpenAI()' client hides the messy details from us, 
# under the hood, it is building an "Authorization" header. 
# It takes your 'OPENAI_API_KEY' and puts it into a header like:
# {'Authorization': 'Bearer YOUR_KEY'}. 
# This is the "Electronic Pass" that lets you into the OpenAI 
# laboratory. Without this hidden header, the AI Brain wouldn't 
# know who to bill for the "thinking time" it spent on your summary.
