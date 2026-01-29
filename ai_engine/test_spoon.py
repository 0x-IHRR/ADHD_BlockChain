try:
    from spoon_ai.chat import ChatBot
    from spoon_ai.schema import Message
    print("SUCCESS: Imported ChatBot and Message")
    
    bot = ChatBot()
    print(f"SUCCESS: Instantiated ChatBot model={bot.model}")
except Exception as e:
    print(f"ERROR: {e}")
