/**
 * App Context - 全局状态管理
 * 管理任务列表、钱包状态等
 */
import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { Subtask } from '../services/ai.service';
import { getJackpotBalance } from '../services/contract.service';

// 任务状态类型
export type TaskStatus = 'pending' | 'verified' | 'failed' | 'settled';

// 任务类型
export interface Task {
    id: number;             // 本地 ID (用于 UI)
    chainTaskId?: number;   // 链上任务 ID (用于合约交互)
    description: string;
    platform?: string;
    stakeAmount: string;
    multiplier?: number;    // 质押倍率 (1, 2, 3)
    deadline: Date;
    status: TaskStatus;
    subtasks: Subtask[];
    createdAt: Date;
    txHash?: string;        // 创建任务的交易哈希
}

// 钱包状态类型
export interface WalletState {
    isConnected: boolean;
    address: string | null;
    balance: string | null;
}

// Context 类型
interface AppContextType {
    // 任务状态
    tasks: Task[];
    addTask: (task: Omit<Task, 'id' | 'createdAt'> & { chainTaskId?: number }) => Task;
    updateTaskStatus: (taskId: number, status: TaskStatus) => void;
    updateTaskChainId: (localId: number, chainTaskId: number, txHash?: string) => void;
    getTaskById: (taskId: number) => Task | undefined;
    getTaskByChainId: (chainTaskId: number) => Task | undefined;

    // 游戏数据
    jackpotAmount: string;
    fetchJackpot: () => Promise<void>;

    // 钱包状态
    wallet: WalletState;
    connectWallet: () => Promise<void>;
    disconnectWallet: () => void;

    // 加载状态
    isLoading: boolean;
}

// 初始值
const initialWallet: WalletState = {
    isConnected: false,
    address: null,
    balance: null,
};

// 模拟初始任务数据
const initialTasks: Task[] = [
    {
        id: 1,
        description: 'Complete Solidity tutorial',
        stakeAmount: '0.1 ETH',
        deadline: new Date(Date.now() + 86400000),
        status: 'pending',
        subtasks: [
            { title: 'Set up development environment', estimated_minutes: 15, priority: 1 },
            { title: 'Learn basic syntax', estimated_minutes: 30, priority: 2 },
            { title: 'Write first smart contract', estimated_minutes: 45, priority: 3 },
        ],
        createdAt: new Date(Date.now() - 3600000),
    },
    {
        id: 2,
        description: 'Review smart contract',
        stakeAmount: '0.05 ETH',
        deadline: new Date(Date.now() + 3600000),
        status: 'verified',
        subtasks: [],
        createdAt: new Date(Date.now() - 7200000),
    },
];

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
    const [tasks, setTasks] = useState<Task[]>(initialTasks);
    const [wallet, setWallet] = useState<WalletState>(initialWallet);
    const [isLoading, setIsLoading] = useState(false);
    const [jackpotAmount, setJackpotAmount] = useState('0.0000');

    // 获取奖金池余额
    const fetchJackpot = useCallback(async () => {
        const amount = await getJackpotBalance();
        setJackpotAmount(amount.replace(' ETH', '')); // 保持纯数字格式或根据 UI 需求调整
    }, []);

    // 定时刷新奖金池
    useEffect(() => {
        fetchJackpot();
        const interval = setInterval(fetchJackpot, 30000); // 30s 刷新一次
        return () => clearInterval(interval);
    }, [fetchJackpot]);

    // 添加任务 (返回新任务对象，支持链上 ID)
    const addTask = useCallback((taskData: Omit<Task, 'id' | 'createdAt'> & { chainTaskId?: number }): Task => {
        const newTask: Task = {
            ...taskData,
            id: Date.now(),
            createdAt: new Date(),
        };
        setTasks(prev => [newTask, ...prev]);
        return newTask;
    }, []);

    // 更新任务的链上 ID (创建任务后从事件获取)
    const updateTaskChainId = useCallback((localId: number, chainTaskId: number, txHash?: string) => {
        setTasks(prev => prev.map(task =>
            task.id === localId
                ? { ...task, chainTaskId, txHash }
                : task
        ));
    }, []);

    // 更新任务状态
    const updateTaskStatus = useCallback((taskId: number, status: TaskStatus) => {
        setTasks(prev => prev.map(task =>
            task.id === taskId ? { ...task, status } : task
        ));
    }, []);

    // 获取单个任务 (通过本地 ID)
    const getTaskById = useCallback((taskId: number) => {
        return tasks.find(task => task.id === taskId);
    }, [tasks]);

    // 获取单个任务 (通过链上 ID)
    const getTaskByChainId = useCallback((chainTaskId: number) => {
        return tasks.find(task => task.chainTaskId === chainTaskId);
    }, [tasks]);

    // 连接钱包 (模拟实现)
    const connectWalletHandler = useCallback(async () => {
        setIsLoading(true);
        // 模拟连接延迟
        await new Promise(resolve => setTimeout(resolve, 1000));
        setWallet({
            isConnected: true,
            address: '0x742d35Cc6634C0532925a3b844Bc9e7595f8fE00',
            balance: '10.0 ETH',
        });
        setIsLoading(false);
    }, []);

    // 断开钱包
    const disconnectWalletHandler = useCallback(() => {
        setWallet(initialWallet);
    }, []);

    return (
        <AppContext.Provider value={{
            tasks,
            addTask,
            updateTaskStatus,
            updateTaskChainId,
            getTaskById,
            getTaskByChainId,
            wallet,
            connectWallet: connectWalletHandler,
            disconnectWallet: disconnectWalletHandler,
            isLoading,
            jackpotAmount,
            fetchJackpot,
        }}>
            {children}
        </AppContext.Provider>
    );
}

// Hook
export function useApp() {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useApp must be used within AppProvider');
    }
    return context;
}

// 便捷 Hooks
export function useTasks() {
    const { tasks, addTask, updateTaskStatus, updateTaskChainId, getTaskById, getTaskByChainId, jackpotAmount, fetchJackpot } = useApp();
    return { tasks, addTask, updateTaskStatus, updateTaskChainId, getTaskById, getTaskByChainId, jackpotAmount, fetchJackpot };
}

export function useWallet() {
    const { wallet, connectWallet, disconnectWallet, isLoading } = useApp();
    return { wallet, connectWallet, disconnectWallet, isLoading };
}
