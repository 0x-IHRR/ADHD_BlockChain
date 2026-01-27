"""
Reusable Neo ToolCallAgent factory.
"""

from typing import List

from dotenv import load_dotenv

from spoon_ai.agents.toolcall import ToolCallAgent
from spoon_ai.chat import ChatBot
from spoon_ai.tools import ToolManager

from spoon_toolkits.crypto.neo import (
    GetBestBlockHashTool,
    GetBlockByHashTool,
    GetBlockByHeightTool,
    GetBlockCountTool,
    GetBlockRewardByHashTool,
    GetRecentBlocksInfoTool,
)

load_dotenv()


def _build_system_prompt(description: str, network: str, limit: int, skip: int) -> str:
    return f"""
You are a Neo blockchain specialist focused on {description}.
Use the provided tools to analyze Neo blockchain data.
Always set network="{network}" when calling tools.

Pagination defaults:
- Skip = {skip}
- Limit = {limit}

When describing a tool call, include the selected Skip and Limit values
whenever they are supported by the tool.
"""


def _default_toolkit() -> List:
    return [
        GetBlockCountTool(),
        GetBlockByHeightTool(),
        GetBestBlockHashTool(),
        GetRecentBlocksInfoTool(),
        GetBlockByHashTool(),
        GetBlockRewardByHashTool(),
    ]


def create_blockchain_agent(
    network: str = "testnet",
    limit: int = 10,
    skip: int = 0,
    description: str = "block analysis and overall network monitoring",
) -> ToolCallAgent:
    """Create a Neo blockchain ToolCallAgent configured with Neo toolkit."""

    tools = _default_toolkit()
    prompt_text = _build_system_prompt(description, network, limit, skip)
    tool_manager = ToolManager(tools)

    class NeoBlockchainAgent(ToolCallAgent):
        agent_name: str = "Blockchain Explorer"
        agent_description: str = description
        system_prompt: str = prompt_text
        max_steps: int = 5

    return NeoBlockchainAgent(
        llm=ChatBot(
            llm_provider="openrouter",
            model_name="openai/gpt-5.1",
        ),
        available_tools=tool_manager
    )
