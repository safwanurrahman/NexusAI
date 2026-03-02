import os
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

client = OpenAI()

def summarize_article(content: str) -> str:
    if not content:
        return "No content provided to summarize."

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system", 
                    "content": "You are a professional LinkedIn researcher. Provide a concise, insightful 2-sentence summary of the following text."
                },
                {
                    "role": "user", 
                    "content": content
                }
            ],
            max_tokens=150,
            temperature=0.5
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        print(f"OpenAI Error: {e}")
        return "Summary generation failed due to an AI error."
