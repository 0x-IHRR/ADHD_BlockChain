import os
import sys
import json
import traceback
import asyncio

# Redirect stdout/stderr to log file
log_file = open("debug.log", "w")
sys.stdout = log_file
sys.stderr = log_file

print(f"CWD: {os.getcwd()}")

try:
    from web3 import Web3
    sys.path.append(os.path.dirname(os.path.abspath(__file__)))
    from agents.verify_agent import VerifyAgent 
except Exception as e:
    print("Startup Error:")
    traceback.print_exc()
    sys.exit(1)

async def main():
    try:
        # 1. Setup Web3
        w3 = Web3(Web3.HTTPProvider("http://127.0.0.1:8545"))
        if not w3.is_connected():
            print("Error: Could not connect to Anvil")
            sys.exit(1)

        # 2. Load ABI
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        abi_path = os.path.join(base_dir, "contracts/out/TaskManager.sol/TaskManager.json")
        
        if not os.path.exists(abi_path):
            print(f"ERROR: ABI file not found at {abi_path}")
            sys.exit(1)
            
        with open(abi_path, 'r') as f:
            contract_data = json.load(f)
            ABI = contract_data['abi']

        CONTRACT_ADDRESS = "0xb7f8bc63bbcad18155201308c8f3540b07f84f5e"
        contract = w3.eth.contract(address=Web3.to_checksum_address(CONTRACT_ADDRESS), abi=ABI)
        account = w3.eth.accounts[0]

        print(f"DEBUG: Using Account: {account}")

        # 3. Find Pending Task
        task_ids = contract.functions.getUserTasks(account).call()
        target_task_id = None
        target_task_desc = ""

        print(f"DEBUG: Found Task IDs: {task_ids}")

        for tid in task_ids:
            task = contract.functions.getTask(tid).call()
            # Struct in tuple (id, owner, desc, stake, deadline, status, created, multi)
            t_id = task[0]
            desc = task[2]
            status = task[5]
            
            print(f"Task {t_id}: Status={status}, Desc='{desc}'")
            
            # Status 0 = Pending
            if status == 0 and ("简历" in desc or "Resume" in desc):
                target_task_id = t_id
                target_task_desc = desc
                print("Found match!")
                break
            elif status == 0:
                target_task_id = t_id
                target_task_desc = desc

        if target_task_id is None:
            print("ERROR: No Pending Task found to verify.")
            # Check if it was already verified (Status 1)
            for tid in task_ids:
                task = contract.functions.getTask(tid).call()
                if task[5] == 1 and ("简历" in task[2] or "Resume" in task[2]):
                     print("Task is ALREADY VERIFIED (Status 1).")
                     print("The UI might just be stale. Please refresh.")
                     sys.exit(0)
            sys.exit(1)

        print(f"DEBUG: Target Task ID: {target_task_id}, Desc: {target_task_desc}")

        # 4. Simulate AI Verification
        print("\n--- AI VERIFICATION (Simulation) ---")
        image_path = "/Users/ihrr/Pictures/临时使用/test微信图片_20260129200414_160_886.png"
        verified = False
        
        if not os.path.exists(image_path):
            print(f"ERROR: Image file not found: {image_path}")
            print("Skipping AI check, assuming True for debug...")
            verified = True
        else:
            print(f"Found image: {image_path}")
            agent = VerifyAgent()
            proof_text = "User submitted screenshot proof."
            print("Calling Agent (Async)...")
            try:
                # Call verify (async)
                result = await agent.verify(target_task_desc, proof_text, image_path)
                print(f"AI Result: Verified={result.verified}, Reason='{result.reason}'")
                verified = result.verified
            except Exception as e:
                print(f"AI Agent Error: {e}")
                traceback.print_exc()
                # If AI fails (e.g. key issue), we force verify true for testing chain
                # verified = True 
                verified = False

        # 5. Submit to Chain
        if verified:
            print("\n--- CHAIN SUBMISSION ---")
            try:
                print(f"Submitting proof for Task {target_task_id}...")
                tx_hash = contract.functions.submitProof(target_task_id, True).transact({'from': account})
                print(f"TX Sent: {tx_hash.hex()}")
                receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
                print(f"Transaction Confirmed! Block: {receipt['blockNumber']}")
                print(f"Gas Used: {receipt['gasUsed']}")
            except Exception as e:
                print(f"Transaction Failed: {e}")
                traceback.print_exc()
                sys.exit(1)
                
            # Verify Status Update
            updated_task = contract.functions.getTask(target_task_id).call()
            new_status = updated_task[5]
            print(f"\nFinal On-Chain Status: {new_status}")
            if new_status == 1:
                print("SUCCESS: Task is Verified on Chain!")
            else:
                print(f"FAILURE: Status is {new_status} (Expected 1)")

        else:
            print("Verification Failed by AI. Skipping Chain Submission.")

    except Exception:
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())
