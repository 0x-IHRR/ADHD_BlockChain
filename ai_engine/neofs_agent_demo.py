"""
NeoFS Demo - Upload, get info, and download an image

This demo demonstrates:
1. Upload an image file to NeoFS container
2. Get image object header information by Object ID
3. Download the image file by Object ID

Container ID: GYvvAa96rZtYCf6w9F35gv46tsAEPfgmDUQKttjYkwVH
Type: eacl-public-read-write (NO bearer token needed)

Usage:
    python neofs_agent_demo.py
"""

import asyncio
import os
from dotenv import load_dotenv

load_dotenv(override=True)

from spoon_ai.agents.toolcall import ToolCallAgent
from spoon_ai.tools import ToolManager
from spoon_ai.chat import ChatBot
from spoon_ai.tools.neofs_tools import (
    UploadObjectTool,
    DownloadObjectByIdTool,
    GetObjectHeaderByIdTool,
)


CONTAINER_ID = "GYvvAa96rZtYCf6w9F35gv46tsAEPfgmDUQKttjYkwVH"
IMAGE_PATH = "IMAGE_PATH"  # Can be relative or absolute path


def setup_agent():
    """Setup NeoFS Agent"""
    tools = [
        UploadObjectTool(),
        DownloadObjectByIdTool(),
        GetObjectHeaderByIdTool(),
    ]

    class NeoFSAgent(ToolCallAgent):
        agent_name: str = "NeoFS Agent"
        system_prompt: str = """
        You are a NeoFS storage assistant.
        Container ID: GYvvAa96rZtYCf6w9F35gv46tsAEPfgmDUQKttjYkwVH
        All operations allowed, NO bearer token needed.
        
        IMPORTANT: When you upload a file, you MUST remember the Object ID from the response.
        Use that Object ID for all subsequent operations (get header, download) on the same object.
        """
        max_steps: int = 10
        available_tools: ToolManager = ToolManager(tools)

    return NeoFSAgent(
        llm=ChatBot(),
        available_tools=ToolManager(tools)
    )


async def main():
    """Main demo: Upload image -> Get info -> Download"""
    # Check required environment variables
    required_env_vars = {
        "NEOFS_OWNER_ADDRESS": os.getenv("NEOFS_OWNER_ADDRESS"),
        "NEOFS_PRIVATE_KEY_WIF": os.getenv("NEOFS_PRIVATE_KEY_WIF")
    }
    
    # Check for missing or placeholder values
    missing_or_placeholder = []
    for var, value in required_env_vars.items():
        if not value or value in ["YourBase58NeoAddress", "YourNeoPrivateKeyWIF"]:
            missing_or_placeholder.append(var)
    
    if missing_or_placeholder:
        print(f"Error: Missing or placeholder environment variables: {', '.join(missing_or_placeholder)}")
        print("Please set them in your .env file:")
        print("  NEOFS_OWNER_ADDRESS=YourBase58NeoAddress")
        print("  NEOFS_PRIVATE_KEY_WIF=YourNeoPrivateKeyWIF")
        print("\nReplace the placeholder values with your actual NeoFS credentials.")
        return

    container_id = CONTAINER_ID
    image_path = IMAGE_PATH
    
    # Handle both relative and absolute paths
    if not os.path.isabs(image_path):
        image_path = os.path.abspath(image_path)
    
    agent = setup_agent()

    if not os.path.exists(image_path):
        print(f"Error: Image file not found: {image_path}")
        return

    # Step 1: Upload image
    upload_query = f"Upload image '{image_path}' to container {container_id}"
    print(f"Query: {upload_query}")
    upload_response = await agent.run(upload_query)
    print(f"Response: {upload_response}\n")

    # Step 2: Get image info (agent remembers Object ID from step 1)
    info_query = f"Get header information for the uploaded object in container {container_id}"
    print(f"Query: {info_query}")
    info_response = await agent.run(info_query)
    print(f"Response: {info_response}\n")

    # Step 3: Download image (agent remembers Object ID from step 1)
    download_path = f"downloaded_{os.path.basename(image_path)}"
    download_query = f"Download the uploaded object from container {container_id} and save to '{download_path}'"
    print(f"Query: {download_query}")
    download_response = await agent.run(download_query)
    print(f"Response: {download_response}")


if __name__ == "__main__":
    asyncio.run(main())
