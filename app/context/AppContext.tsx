/**
 * App Context - 全局状态管理
 * 管理任务列表、钱包状态等
 */
import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Subtask } from '../services/ai.service';

// 任务状态类型
export type TaskStatus = 'pending' | 'verified' | 'failed' | 'settled';

// 任务类型
export interface Task {
    id: number;
    description: string;
    stakeAmount: string;
    deadline: Date;
    status: TaskStatus;
    subtasks: Subtask[];
    createdAt: Date;
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
    addTask: (task: Omit<Task, 'id' | 'createdAt'>) => void;
    updateTaskStatus: (taskId: number, status: TaskStatus) => void;
    getTaskById: (taskId: number) => Task | undefined;

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

    // 添加任务
    const addTask = useCallback((taskData: Omit<Task, 'id' | 'createdAt'>) => {
        const newTask: Task = {
            ...taskData,
            id: Date.now(),
            createdAt: new Date(),
        };
        setTasks(prev => [newTask, ...prev]);
    }, []);

    // 更新任务状态
    const updateTaskStatus = useCallback((taskId: number, status: TaskStatus) => {
        setTasks(prev => prev.map(task =>
            task.id === taskId ? { ...task, status } : task
        ));
    }, []);

    // 获取单个任务
    const getTaskById = useCallback((taskId: number) => {
        return tasks.find(task => task.id === taskId);
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
            getTaskById,
            wallet,
            connectWallet: connectWalletHandler,
            disconnectWallet: disconnectWalletHandler,
            isLoading,
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
    const { tasks, addTask, updateTaskStatus, getTaskById } = useApp();
    return { tasks, addTask, updateTaskStatus, getTaskById };
}

export function useWallet() {
    const { wallet, connectWallet, disconnectWallet, isLoading } = useApp();
    return { wallet, connectWallet, disconnectWallet, isLoading };
}
