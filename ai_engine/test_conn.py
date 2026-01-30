import os
import asyncio
from dotenv import load_dotenv
from spoon_ai.chat import ChatBot
from spoon_ai.schema import Message

load_dotenv()

async def test_model(model_name):
    print(f"\n--- Testing Model (Anthropic Mode): {model_name} ---")
    try:
        # Load from updated .env
        provider = os.getenv("LLM_PROVIDER", "anthropic")
        base_url = os.getenv("BASE_URL")
        api_key = os.getenv("ANTHROPIC_API_KEY") # Use the anthropic key var
        
        print(f"Provider: {provider}")
        print(f"BaseURL: {base_url}")
        
        bot = ChatBot(
            llm_provider=provider,
            base_url=base_url,
            model_name=model_name,
            api_key=api_key 
        )
        
        msgs = [Message(role="user", content="Hi, are you working via Anthropic interface?")]
        print(f"Sending request...")
        res = await bot.ask(msgs)
        print(f"✅ SUCCESS! Response: {res}")
        return True
    except Exception as e:
        print(f"❌ FAILED: {e}")
        return False

async def main():
    # Test the user-requested models
    await test_model("glm-4.7")
    await test_model("glm-4")

if __name__ == "__main__":
    asyncio.run(main())
