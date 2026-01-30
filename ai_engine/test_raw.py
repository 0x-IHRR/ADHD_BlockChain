import os
import requests
import json
from dotenv import load_dotenv

load_dotenv()

def test_raw(model):
    api_key = os.getenv("ANTHROPIC_API_KEY")
    base_url = os.getenv("BASE_URL") # https://open.bigmodel.cn/api/anthropic
    
    # Standard Anthropic path
    url = f"{base_url}/v1/messages"
    
    headers = {
        "x-api-key": api_key,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json"
    }
    
    data = {
        "model": model,
        "max_tokens": 1024,
        "messages": [
            {"role": "user", "content": "Hello, raw test."}
        ]
    }
    
    print(f"\n--- Testing Raw URL: {url} Model: {model} ---")
    try:
        resp = requests.post(url, headers=headers, json=data)
        print(f"Status Code: {resp.status_code}")
        print(f"Response: {resp.text}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_raw("glm-4")
    test_raw("glm-4.7")
