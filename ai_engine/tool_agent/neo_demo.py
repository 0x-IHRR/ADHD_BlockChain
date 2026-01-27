"""
Streaming demo that uses the reusable Neo ToolCallAgent factory.
"""

import asyncio
import sys
from pathlib import Path
from asyncio import Task
from typing import Any, List, Tuple

from spoon_ai.agents.toolcall import ToolCallAgent

try:
    from .neo_toolcall_agent import create_blockchain_agent
except ImportError:  # Allow running as a stand-alone script
    script_dir = Path(__file__).resolve().parent
    project_root = script_dir.parent
    for candidate in (project_root, script_dir):
        path_str = str(candidate)
        if path_str not in sys.path:
            sys.path.insert(0, path_str)
    from neo_toolcall_agent import create_blockchain_agent


async def stream_agent_response(
    agent: ToolCallAgent, user_message: str, timeout: float = 120.0
) -> Tuple[List[Any], str]:
    """Run the agent while collecting streaming events."""
    agent.clear()
    agent.task_done.clear()

    original_timeout = getattr(agent, "_default_timeout", timeout)
    agent._default_timeout = timeout

    async def run_and_signal() -> str:
        try:
            return await agent.run(request=user_message)
        finally:
            agent.task_done.set()

    run_task: Task[str] = asyncio.create_task(run_and_signal())
    queue = agent.output_queue
    collected: List[Any] = []

    try:
        while True:
            if agent.task_done.is_set() and queue.empty():
                break

            try:
                chunk = await asyncio.wait_for(queue.get(), timeout=0.5)
                collected.append(chunk)
            except asyncio.TimeoutError:
                if run_task.done():
                    break

        final_response = await run_task
    finally:
        agent._default_timeout = original_timeout

    return collected, final_response


async def run_demo(network: str = "testnet", limit: int = 10, skip: int = 0) -> None:
    print("=" * 80)
    print(f"Streaming Neo Agent Demo (network={network})")
    print("=" * 80)

    agent = create_blockchain_agent(network=network, limit=limit, skip=skip)
    user_message = (
        f"What's the current status of the Neo {network}? "
        "Show me the latest block information and total block count."
    )

    print("\nScenario: Current Network Status")
    events, final_response = await stream_agent_response(agent, user_message)

    print(f"\nCaptured {len(events)} streaming events")
    print("\n✅ Final result")
    print(final_response)


def main() -> None:
    try:
        asyncio.run(run_demo())
    finally:
        try:
            asyncio.set_event_loop(asyncio.new_event_loop())
        except Exception:
            pass


if __name__ == "__main__":
    main()
