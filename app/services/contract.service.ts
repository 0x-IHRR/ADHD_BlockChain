/**
 * Contract Service - 与 TaskManager 智能合约交互
 * 使用 ethers.js v6 实现
 */
import { ethers } from 'ethers';

// 合约 ABI (简化版 - 只包含需要的函数)
export const TASK_MANAGER_ABI = [
    'function createTask(string calldata description, uint256 deadline, uint8 multiplier) external payable',
    'function submitProof(uint256 taskId, bool verified) external',
    'function claimRefund(uint256 taskId) external',
    'function settle(uint256 taskId) external',
    'function getTask(uint256 taskId) external view returns (tuple(uint256 id, address owner, string description, uint256 stakeAmount, uint256 deadline, uint8 status, uint256 createdAt, uint8 multiplier))',
    'function getUserTasks(address user) external view returns (uint256[])',
    'function getJackpot() external view returns (uint256)',
    'event TaskCreated(uint256 indexed taskId, address indexed owner, uint256 stakeAmount, uint256 deadline, uint8 multiplier)',
    'event TaskVerified(uint256 indexed taskId, bool success)',
    'event TaskSettled(uint256 indexed taskId, bool refunded)',
] as const;

// 任务状态枚举
export enum TaskStatus {
    Pending = 0,
    Verified = 1,
    Failed = 2,
    Settled = 3,
}

export interface OnChainTask {
    id: bigint;
    owner: string;
    description: string;
    stakeAmount: bigint;
    deadline: bigint;
    status: TaskStatus;
    createdAt: bigint;
    multiplier: number;
}

// 默认 Anvil 测试账户私钥 (仅用于开发!)
const ANVIL_PRIVATE_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
const DEFAULT_RPC_URL = 'http://localhost:8545';

/**
 * 获取合约地址 (从环境变量)
 */
export function getContractAddress(): string {
    const address = process.env.EXPO_PUBLIC_CONTRACT_ADDRESS;
    if (!address) {
        // 开发环境默认地址 (Anvil 本地链部署)
        return '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9';
    }
    return address;
}

export function getAchievementNFTAddress(): string {
    const address = process.env.EXPO_PUBLIC_ACHIEVEMENT_NFT_ADDRESS;
    if (!address) {
        return '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0';
    }
    return address;
}

/**
 * 获取 Provider
 */
export function getProvider(): ethers.JsonRpcProvider {
    const rpcUrl = process.env.EXPO_PUBLIC_RPC_URL || DEFAULT_RPC_URL;
    return new ethers.JsonRpcProvider(rpcUrl);
}

/**
 * 获取 Signer (使用 Anvil 测试私钥)
 */
export function getSigner(): ethers.Wallet {
    const provider = getProvider();
    const privateKey = process.env.EXPO_PUBLIC_PRIVATE_KEY || ANVIL_PRIVATE_KEY;
    return new ethers.Wallet(privateKey, provider);
}

/**
 * 获取合约实例 (使用默认 signer - 仅用于只读操作或本地测试)
 */
export function getContract(): ethers.Contract {
    const signer = getSigner();
    return new ethers.Contract(getContractAddress(), TASK_MANAGER_ABI, signer);
}

/**
 * 获取合约实例 (使用外部 signer - 用于需要钱包签名的操作)
 */
export function getContractWithSigner(signer: ethers.Signer): ethers.Contract {
    return new ethers.Contract(getContractAddress(), TASK_MANAGER_ABI, signer);
}

/**
 * 格式化 ETH 金额显示
 */
export function formatEth(wei: bigint): string {
    const eth = Number(wei) / 1e18;
    return `${eth.toFixed(4)} ETH`;
}

/**
 * 解析 ETH 输入为 Wei
 */
export function parseEth(eth: string): bigint {
    return ethers.parseEther(eth);
}

/**
 * 计算截止时间戳
 */
export function calculateDeadline(hoursFromNow: number): bigint {
    return BigInt(Math.floor(Date.now() / 1000) + hoursFromNow * 3600);
}

// ============ 合约交互方法 ============

/**
 * 创建新任务 (质押 ETH)
 * @param signer - 用户钱包 signer (必须传入，否则使用默认 signer 仅限本地测试)
 */
export async function createTaskOnChain(
    description: string,
    deadlineHours: number,
    stakeEth: string,
    multiplier: number = 1,
    signer?: ethers.Signer
): Promise<{ taskId: number; txHash: string }> {
    // 优先使用传入的 signer，否则回退到默认 signer (本地测试)
    const contract = signer ? getContractWithSigner(signer) : getContract();
    const deadline = calculateDeadline(deadlineHours);
    const value = parseEth(stakeEth);

    // 验证 multiplier 是否为有效值
    const validMultipliers = [1, 2, 3, 5, 10];
    const validMultiplier = validMultipliers.includes(multiplier) ? multiplier : 1;

    console.log('Creating task on chain:', { description, deadline, value, multiplier: validMultiplier });

    const tx = await contract.createTask(description, deadline, validMultiplier, { value });
    const receipt = await tx.wait();

    // 从事件中获取 taskId
    const event = receipt.logs.find((log: any) => {
        try {
            const parsed = contract.interface.parseLog(log);
            return parsed?.name === 'TaskCreated';
        } catch {
            return false;
        }
    });

    let taskId = 1;
    if (event) {
        const parsed = contract.interface.parseLog(event);
        taskId = Number(parsed?.args?.taskId || 1);
    }

    return { taskId, txHash: receipt.hash };
}

/**
 * 提交验证结果
 */
export async function submitProofOnChain(
    taskId: number,
    verified: boolean
): Promise<string> {
    const contract = getContract();
    const tx = await contract.submitProof(taskId, verified);
    const receipt = await tx.wait();
    return receipt.hash;
}

/**
 * 领取退款 (验证成功后)
 */
export async function claimRefundOnChain(taskId: number): Promise<string> {
    const contract = getContract();
    const tx = await contract.claimRefund(taskId);
    const receipt = await tx.wait();
    return receipt.hash;
}

/**
 * 结算任务 (超时后罚没)
 */
export async function settleTaskOnChain(taskId: number): Promise<string> {
    const contract = getContract();
    const tx = await contract.settle(taskId);
    const receipt = await tx.wait();
    return receipt.hash;
}

/**
 * 获取链上任务详情
 */
export async function getTaskFromChain(taskId: number): Promise<OnChainTask | null> {
    try {
        const contract = getContract();
        const task = await contract.getTask(taskId);
        return {
            id: task.id,
            owner: task.owner,
            description: task.description,
            stakeAmount: task.stakeAmount,
            deadline: task.deadline,
            status: task.status,
            createdAt: task.createdAt,
            multiplier: Number(task.multiplier),
        };
    } catch (error) {
        console.error('Failed to get task from chain:', error);
        return null;
    }
}

/**
 * 获取用户所有任务 ID
 */
export async function getUserTaskIds(userAddress?: string): Promise<number[]> {
    try {
        const contract = getContract();
        const address = userAddress || (await getSigner().getAddress());
        const taskIds = await contract.getUserTasks(address);
        return taskIds.map((id: bigint) => Number(id));
    } catch (error) {
        console.error('Failed to get user tasks:', error);
        return [];
    }
}

/**
 * 获取钱包余额
 */
export async function getWalletBalance(): Promise<string> {
    const signer = getSigner();
    const balance = await signer.provider?.getBalance(await signer.getAddress());
    return balance ? formatEth(balance) : '0 ETH';
}

/**
 * 获取奖金池余额 (Wei)
 */
export async function getJackpotBalance(): Promise<string> {
    try {
        const contract = getContract();
        const jackpot = await contract.getJackpot();
        return formatEth(jackpot);
    } catch (error) {
        console.error('Failed to get jackpot:', error);
        return '0.0000 ETH';
    }
}

/**
 * 获取总任务数
 */
export async function getTaskCountOnChain(): Promise<number> {
    try {
        const contract = getContract();
        const count = await contract.getTaskCount();
        return Number(count);
    } catch (error) {
        console.error('Failed to get task count:', error);
        return 0;
    }
}

/**
 * 获取这所有任务 (用于排行榜)
 * 注意：实际生产中应该使用 Graph 索引，这里循环获取仅用于 Hackathon Demo
 */
export async function getAllTasksFromChain(): Promise<OnChainTask[]> {
    try {
        const count = await getTaskCountOnChain();
        const tasks: OnChainTask[] = [];

        // 倒序获取最近的任务，最多获取 50 个
        const start = Math.max(0, count - 50);

        const promises = [];
        for (let i = count - 1; i >= start; i--) {
            promises.push(getTaskFromChain(i));
        }

        const results = await Promise.all(promises);
        return results.filter((t): t is OnChainTask => t !== null);
    } catch (error) {
        console.error('Failed to get all tasks:', error);
        return [];
    }
}
