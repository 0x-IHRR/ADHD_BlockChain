/**
 * App Context - 全局状态管理
 * 管理任务列表、钱包状态等
 */
import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { Subtask } from '../services/ai.service';
import { getJackpotBalance, fetchUserTasksOnChain, formatEth, TaskStatus as ChainTaskStatus } from '../services/contract.service';

// 任务状态类型
export type TaskStatus = 'pending' | 'verified' | 'failed' | 'settled';

import { useWallet as useRealWallet } from './WalletContext';

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
    removeTask: (taskId: number) => void;  // 回滚/删除任务
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

// 初始值 removed


const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
    const [tasks, setTasks] = useState<Task[]>([]);
    // 使用真实的 WalletContext
    const { isConnected, address, balance, connect, disconnect, signer } = useRealWallet();

    // 构建兼容的 wallet 对象
    const wallet = {
        isConnected,
        address,
        balance
    };

    const [isLoading, setIsLoading] = useState(false);
    const [jackpotAmount, setJackpotAmount] = useState('0.0000');

    // 获取奖金池余额
    const fetchJackpot = useCallback(async () => {
        const amount = await getJackpotBalance();
        setJackpotAmount(amount.replace(' ETH', '')); // 保持纯数字格式或根据 UI 需求调整
    }, []);

    // 从链上获取任务
    const fetchTasksFromChain = useCallback(async () => {
        if (!wallet.isConnected || !wallet.address) {
            setTasks([]);
            return;
        }

        try {
            setIsLoading(true);
            const chainTasks = await fetchUserTasksOnChain(wallet.address);

            const mappedTasks: Task[] = chainTasks.map(ct => {
                // 状态映射
                let status: TaskStatus = 'pending';
                switch (ct.status) {
                    case ChainTaskStatus.Verified: status = 'verified'; break;
                    case ChainTaskStatus.Failed: status = 'failed'; break;
                    case ChainTaskStatus.Settled: status = 'settled'; break;
                    default: status = 'pending';
                }

                return {
                    id: Number(ct.id),
                    chainTaskId: Number(ct.id),
                    description: ct.description,
                    stakeAmount: formatEth(ct.stakeAmount), // e.g., "0.1 ETH"
                    deadline: new Date(Number(ct.deadline) * 1000),
                    status: status,
                    subtasks: [], // 链上不存储子任务，暂为空
                    createdAt: new Date(Number(ct.createdAt) * 1000),
                    multiplier: ct.multiplier,
                    txHash: undefined // 读取时暂无 hash
                };
            });

            setTasks(mappedTasks);
        } catch (error) {
            console.error('Failed to fetch tasks from chain:', error);
        } finally {
            setIsLoading(false);
        }
    }, [isConnected, address, signer]);

    // 监听钱包变化加载任务
    useEffect(() => {
        fetchTasksFromChain();
    }, [fetchTasksFromChain]);

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

    // 删除/回滚任务 (链上创建失败时使用)
    const removeTask = useCallback((taskId: number) => {
        setTasks(prev => prev.filter(task => task.id !== taskId));
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

    // Mock handlers removed


    return (
        <AppContext.Provider value={{
            tasks,
            addTask,
            removeTask,
            updateTaskStatus,
            updateTaskChainId,
            getTaskById,
            getTaskByChainId,
            wallet,
            connectWallet: connect,
            disconnectWallet: disconnect,
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
    const { tasks, addTask, removeTask, updateTaskStatus, updateTaskChainId, getTaskById, getTaskByChainId, jackpotAmount, fetchJackpot } = useApp();
    return { tasks, addTask, removeTask, updateTaskStatus, updateTaskChainId, getTaskById, getTaskByChainId, jackpotAmount, fetchJackpot };
}

// export function useWallet is REMOVED to avoid conflict with real WalletContext
// MainLayout uses the real one. Internal components using useApp().wallet will still work.
