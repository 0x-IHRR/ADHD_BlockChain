"""
Oracle Signer - Agent 钱包签名模块
负责以 Oracle 身份调用智能合约的 submitProof 函数
"""
import os
import json
from typing import Optional
from dotenv import load_dotenv
from web3 import Web3
from web3.middleware import ExtraDataToPOAMiddleware

load_dotenv()


# TaskManager ABI (仅包含需要的函数)
TASK_MANAGER_ABI = [
    {
        "inputs": [
            {"name": "taskId", "type": "uint256"},
            {"name": "verified", "type": "bool"}
        ],
        "name": "submitProof",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{"name": "taskId", "type": "uint256"}],
        "name": "getTask",
        "outputs": [
            {
                "components": [
                    {"name": "id", "type": "uint256"},
                    {"name": "owner", "type": "address"},
                    {"name": "description", "type": "string"},
                    {"name": "stakeAmount", "type": "uint256"},
                    {"name": "deadline", "type": "uint256"},
                    {"name": "status", "type": "uint8"},
                    {"name": "createdAt", "type": "uint256"}
                ],
                "type": "tuple"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    }
]


class OracleSigner:
    """
    Oracle 签名器 - 用于以授权验证者身份调用合约
    
    使用方法:
        signer = OracleSigner()
        tx_hash = await signer.submit_verification(task_id=1, verified=True)
    """
    
    def __init__(
        self,
        private_key: Optional[str] = None,
        rpc_url: Optional[str] = None,
        contract_address: Optional[str] = None
    ):
        """
        初始化 Oracle 签名器
        
        Args:
            private_key: Oracle 私钥 (默认从环境变量 ORACLE_PRIVATE_KEY 读取)
            rpc_url: RPC 节点地址 (默认从 RPC_URL 或 http://localhost:8545)
            contract_address: TaskManager 合约地址 (默认从 CONTRACT_ADDRESS 读取)
        """
        self.private_key = private_key or os.getenv("ORACLE_PRIVATE_KEY")
        self.rpc_url = rpc_url or os.getenv("RPC_URL", "http://localhost:8545")
        self.contract_address = contract_address or os.getenv("CONTRACT_ADDRESS")
        
        if not self.private_key:
            raise ValueError("ORACLE_PRIVATE_KEY 未配置")
        if not self.contract_address:
            raise ValueError("CONTRACT_ADDRESS 未配置")
        
        # 初始化 Web3
        self.w3 = Web3(Web3.HTTPProvider(self.rpc_url))
        
        # 添加 POA 中间件 (用于 Anvil/测试网)
        self.w3.middleware_onion.inject(ExtraDataToPOAMiddleware, layer=0)
        
        # 初始化账户
        self.account = self.w3.eth.account.from_key(self.private_key)
        self.oracle_address = self.account.address
        
        # 初始化合约
        self.contract = self.w3.eth.contract(
            address=Web3.to_checksum_address(self.contract_address),
            abi=TASK_MANAGER_ABI
        )
        
        print(f"[OracleSigner] 初始化成功")
        print(f"  - Oracle 地址: {self.oracle_address}")
        print(f"  - 合约地址: {self.contract_address}")
        print(f"  - RPC: {self.rpc_url}")
    
    def get_task(self, task_id: int) -> dict:
        """获取链上任务信息"""
        task = self.contract.functions.getTask(task_id).call()
        return {
            "id": task[0],
            "owner": task[1],
            "description": task[2],
            "stakeAmount": task[3],
            "deadline": task[4],
            "status": task[5],
            "createdAt": task[6]
        }
    
    def submit_verification(self, task_id: int, verified: bool) -> str:
        """
        提交验证结果到链上
        
        Args:
            task_id: 任务 ID
            verified: 验证是否通过
            
        Returns:
            交易哈希
        """
        # 构建交易
        tx = self.contract.functions.submitProof(task_id, verified).build_transaction({
            "from": self.oracle_address,
            "nonce": self.w3.eth.get_transaction_count(self.oracle_address),
            "gas": 200000,
            "gasPrice": self.w3.eth.gas_price,
            "chainId": self.w3.eth.chain_id
        })
        
        # 签名交易
        signed_tx = self.w3.eth.account.sign_transaction(tx, self.private_key)
        
        # 发送交易
        tx_hash = self.w3.eth.send_raw_transaction(signed_tx.raw_transaction)
        
        print(f"[OracleSigner] 已提交验证结果")
        print(f"  - Task ID: {task_id}")
        print(f"  - Verified: {verified}")
        print(f"  - Tx Hash: {tx_hash.hex()}")
        
        # 等待交易确认
        receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash)
        
        if receipt["status"] == 1:
            print(f"[OracleSigner] ✅ 交易成功确认")
        else:
            print(f"[OracleSigner] ❌ 交易失败")
            raise Exception("Transaction failed")
        
        return tx_hash.hex()


# 测试入口
if __name__ == "__main__":
    # 使用 Anvil 默认私钥进行测试
    import os
    os.environ["ORACLE_PRIVATE_KEY"] = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
    os.environ["CONTRACT_ADDRESS"] = "0x5FbDB2315678afecb367f032d93F642f64180aa3"
    
    signer = OracleSigner()
    
    # 获取任务信息 (假设任务 0 存在)
    try:
        task = signer.get_task(0)
        print(f"任务信息: {task}")
    except Exception as e:
        print(f"获取任务失败: {e}")
