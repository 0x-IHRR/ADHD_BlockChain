import os
import asyncio
from dotenv import load_dotenv
from spoon_ai.chat import ChatBot
from spoon_ai.schema import Message

load_dotenv()

async def test_openai_glm47():
    print(f"\n--- Testing OpenAI Provider + GLM-4.7 ---")
    try:
        # Hardcoding the Zhipu OpenAI endpoint
        provider = "openai"
        base_url = "https://open.bigmodel.cn/api/paas/v4/"
        # Use the Zhipu Key (which is in OPENAI_API_KEY in .env already? No, currently in ANTHROPIC_API_KEY)
        api_key = os.getenv("ANTHROPIC_API_KEY") 
        
        print(f"Provider: {provider}")
        print(f"BaseURL: {base_url}")
        
        bot = ChatBot(
            llm_provider=provider,
            base_url=base_url,
            model_name="glm-4.7",
            api_key=api_key 
        )
        
        msgs = [Message(role="user", content="Hi 4.7 via OpenAI")]
        print(f"Sending request...")
        res = await bot.ask(msgs)
        print(f"✅ SUCCESS! Response: {res}")
        return True
    except Exception as e:
        print(f"❌ FAILED: {e}")
        return False

if __name__ == "__main__":
    asyncio.run(test_openai_glm47())
