import google.generativeai as genai
import os
from dotenv import load_dotenv

# 1. Load your API Key
load_dotenv()
api_key = os.getenv("GOOGLE_API_KEY")

if not api_key:
    print("❌ Error: GOOGLE_API_KEY not found in .env file.")
    exit()

genai.configure(api_key=api_key)

print(f"🔍 Checking available models for your API key...\n")

try:
    # 2. Fetch all models
    count = 0
    for m in genai.list_models():
        # 3. Filter for models that support text generation ('generateContent')
        if 'generateContent' in m.supported_generation_methods:
            print(f"✅ {m.name}")
            print(f"   Description: {m.description}")
            print(f"   Max Tokens: {m.input_token_limit}")
            print("-" * 40)
            count += 1
    
    if count == 0:
        print("⚠️ No models found. Check your API key permissions.")
        
except Exception as e:
    print(f"❌ Error fetching models: {e}")