import asyncio
from dotenv import load_dotenv
from spoon_ai.chat import ChatBot

load_dotenv()

SYSTEM_MESSAGE = (
    "You are a concise assistant. Answer the questions briefly and to the point."
    " Use bullet points or numbered lists where appropriate."
)

Questions = [
    "Give me a concise overview of the Neo blockchain.",
    "Explain the concept of decentralized finance (DeFi) in simple terms.",
    "List three real-world use cases for agentic OSes like SpoonOS.",
]

def create_chatbot() -> ChatBot:
    return ChatBot(
        llm_provider = "openrouter",
        model_name = "anthropic/claude-3.5-sonnet",
    )

async def stream_chatbot_response(question: str, timeout: float = 60.0) -> None:
    chatbot = create_chatbot()
    messages = [{"role": "user", "content": question}]

    async for chunk in chatbot.astream(
        messages, system_msg=SYSTEM_MESSAGE, timeout=timeout
    ):
        # Flush so each token shows up immediately instead of waiting for a newline
        print(chunk.delta, end="", flush=True)

async def main():
    for question in Questions:
        print("\n" + "=" * 50)
        print(f"Q: {question}")
        print("=" * 50)
        await stream_chatbot_response(question)

if __name__ == "__main__":
    asyncio.run(main())
