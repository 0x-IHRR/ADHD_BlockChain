import time
from web3 import Web3
import json
import os

# Connect to Anvil
w3 = Web3(Web3.HTTPProvider("http://127.0.0.1:8545"))

# Load ABI/Address
with open('run-latest.json', 'r') as f:
    config = json.load(f)
    CONTRACT_ADDRESS = config['contract_address']

# Minimal ABI for getTask and getUserTasks
ABI = [
    {
        "inputs": [{"internalType": "address", "name": "user", "type": "address"}],
        "name": "getUserTasks",
        "outputs": [{"internalType": "uint256[]", "name": "", "type": "uint256[]"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "uint256", "name": "taskId", "type": "uint256"}],
        "name": "getTask",
        "outputs": [
            {"internalType": "uint256", "name": "id", "type": "uint256"},
            {"internalType": "address", "name": "owner", "type": "address"},
            {"internalType": "string", "name": "description", "type": "string"},
            {"internalType": "uint256", "name": "stakeAmount", "type": "uint256"},
            {"internalType": "uint256", "name": "deadline", "type": "uint256"},
            {"internalType": "enum TaskManager.TaskStatus", "name": "status", "type": "uint8"},
            {"internalType": "uint256", "name": "createdAt", "type": "uint256"},
            {"internalType": "uint256", "name": "multiplier", "type": "uint256"}
        ],
        "stateMutability": "view",
        "type": "function"
    }
]

contract = w3.eth.contract(address=CONTRACT_ADDRESS, abi=ABI)

# Get tasks for the default account (assuming user is using Account 0 for dev, or we check all)
# In Anvil, usually Account 0 is the deployer/user.
account = w3.eth.accounts[0]
print(f"Checking tasks for account: {account}")

task_ids = contract.functions.getUserTasks(account).call()
print(f"Found Task IDs: {task_ids}")

for tid in task_ids:
    task = contract.functions.getTask(tid).call()
    status_map = {0: "Pending", 1: "Verified", 2: "Failed", 3: "Settled"}
    print(f"Task {tid}: Desc='{task[2]}', Status={status_map.get(task[5], 'Unknown')}")
