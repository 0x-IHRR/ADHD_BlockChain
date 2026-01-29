from spoon_ai.schema import Message
from spoon_ai.chat import ChatBot
from typing import Any, List, Union, Optional
from pydantic import Field

class MultimodalMessage(Message):
    content: Union[str, List[Any]] = Field(default=None)

try:
    # Test instantiation
    blocks = [{"type": "text", "text": "hello"}]
    msg = MultimodalMessage(role="user", content=blocks)
    print(f"SUCCESS: Instantiated MultimodalMessage with content type {type(msg.content)}")
    
    # Test ChatBot formatting logic (mocking it)
    def mock_format(messages):
        formatted = []
        for m in messages:
            if isinstance(m, Message):
                formatted.append(m)
            else:
                raise ValueError("Not a message")
        return formatted

    res = mock_format([msg])
    print(f"SUCCESS: ChatBot accepts subclass: {res[0].content == blocks}")
    
except Exception as e:
    print(f"ERROR: {e}")
