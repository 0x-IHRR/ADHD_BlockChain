""" ReAct agent demo for x402 payments (v2 compatible)."""
import asyncio
import os
import sys
import json
from decimal import Decimal
from typing import Any

from eth_account import Account
from rich.console import Console

from spoon_ai.agents.spoon_react import SpoonReactAI
from spoon_ai.chat import ChatBot
from spoon_ai.payments import X402PaymentReceipt, X402PaymentService
from spoon_ai.tools.tool_manager import ToolManager
from spoon_ai.tools.x402_payment import X402PaywalledRequestTool
from spoon_toolkits.web.web_scraper import WebScraperTool
from x402.encoding import safe_base64_decode

# Config
PAYWALLED_URL = os.getenv("X402_DEMO_URL", "https://www.x402.org/protected")
PAYMENT_USDC = Decimal("0.01")
console = Console()

def setup_wallet(service: X402PaymentService) -> None:
    """Configures wallet and address, failing fast if missing."""
    client = service.settings.client
    if not client.private_key and not client.use_turnkey:
        raise ValueError("Missing configuration: Set PRIVATE_KEY or enable Turnkey.")

    if client.private_key and not client.private_key.startswith("0x"):
        client.private_key = "0x" + client.private_key

    # Infer address if not set
    if not service.settings.pay_to or service.settings.pay_to.startswith("0xYourAgent"):
        if client.private_key:
            service.settings.pay_to = Account.from_key(client.private_key).address
        elif client.turnkey_address:
            service.settings.pay_to = client.turnkey_address
        else:
            raise ValueError("Cannot determine wallet address.")
    
    # Cap payment amount safety
    service.settings.max_amount_usdc = min(service.settings.max_amount_usdc or PAYMENT_USDC, PAYMENT_USDC)

class X402ReactAgent(SpoonReactAI):
    name: str = "x402_agent"
    
    def __init__(self, service: X402PaymentService, url: str, **kwargs: Any) -> None:
        super().__init__(service=service, target_url=url, **kwargs)
        self.payment_tool = X402PaywalledRequestTool(service=service)
        self.web_scraper = WebScraperTool()
        self.available_tools = ToolManager([self.web_scraper, self.payment_tool])
        
        tool_desc = self._build_tool_list()
        # Keep the strict "Probe -> Pay" flow
        self.system_prompt = (
            f"TARGET: {url}\n"
            "You are an agent executing an x402 payment demonstration. Follow this strict sequence:\n"
            "1. FIRST, call `web_scraper` on the target. Verify it fails with '402 Payment Required'.\n" 
            f"2. THEN, use `x402_paywalled_request` (amount={PAYMENT_USDC}) to pay and access the content.\n" 
            "3. FINALLY, verify the content is unlocked and summarise the music track details.\n"
            f"\nTools:\n{tool_desc}"
        )

async def main():
    console.print("[bold green]x402 ReAct Agent Demo [/]")
    
    service = X402PaymentService()
    try:
        setup_wallet(service)
    except ValueError as e:
        console.print(f"[bold red]Config Error:[/] {e}")
        return

    agent = X402ReactAgent(service=service, url=PAYWALLED_URL, llm=ChatBot())
    
    console.print(f"Payer: [bold]{service.settings.pay_to}[/] | Target: {PAYWALLED_URL}")
    console.print("[yellow]Running agent...[/]")

    # Run with specific instruction
    try:
        await agent.run(f"Demonstrate the paywall flow for {PAYWALLED_URL}")
    except Exception as e:
        console.print(f"[red]Execution failed:[/] {e}")
        return

    # Output Results
    messages = agent.memory.get_messages()
    last_assistant_msg = next((m for m in reversed(messages) if m.role == "assistant"), None)
    
    if last_assistant_msg:
        console.print("\n[bold cyan]Agent Result:[/]")
        console.print(last_assistant_msg.content)

    # --- 2. Enhanced Receipt Verification (Sync with original v2 support) ---
    for msg in reversed(messages):
        if msg.role == "tool" and msg.name == "x402_paywalled_request" and msg.content:
            try:
                data = json.loads(msg.content) if isinstance(msg.content, str) else msg.content
                if isinstance(data, dict):
                    headers = data.get("headers") or {}
                    # Case-insensitive lookup for both v1 and v2 headers
                    lowered_headers = {k.lower(): v for k, v in headers.items()}
                    
                    # Look for v2 (payment-response) OR v1 (x-payment-response)
                    receipt_header = lowered_headers.get("payment-response") or lowered.get("x-payment-response")
                    
                    if receipt_header:
                        receipt = X402PaymentReceipt.model_validate_json(safe_base64_decode(receipt_header))
                        console.print("\n[bold green]Payment Confirmed (Receipt Decoded):[/]")
                        console.print(json.dumps(receipt.model_dump(), indent=2))
                        break
            except Exception:
                continue

if __name__ == "__main__":
    asyncio.run(main())