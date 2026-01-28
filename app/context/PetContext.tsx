/**
 * PetContext - 全局宠物 (Spoons) 状态管理
 * 
 * 提供全局访问宠物 HP、状态等信息
 * 保持所有页面的 Spoons 形象统一
 */
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useWallet } from './WalletContext';
import { ethers } from 'ethers';
import { USE_MOCK_DATA, MOCK_CONFIG } from '../config/demo';
import { MOCK_PET } from '../mocks/leaderboard';

// 宠物状态类型
export type PetStatus = 'alive' | 'dead' | 'none';

// 宠物数据接口
export interface PetData {
    hp: number;              // 0-100
    status: PetStatus;
    deathCount: number;      // 累计死亡次数
    createdAt: number;       // 创建时间戳
}

// Context 接口
interface PetContextValue {
    pet: PetData | null;
    loading: boolean;
    error: string | null;

    // 状态计算
    isAlive: boolean;
    isDying: boolean;        // HP < 30
    isDead: boolean;

    // 操作
    refreshPet: () => Promise<void>;
    createPet: () => Promise<void>;
    revivePet: () => Promise<void>;
}

const PetContext = createContext<PetContextValue | null>(null);

// PetManager ABI (简化版本)
const PET_MANAGER_ABI = [
    "function getPet(address owner) view returns (tuple(uint8 hp, uint8 status, uint256 createdAt, uint256 deathCount))",
    "function createPet() external",
    "function revive() external payable",
    "function reviveCost() view returns (uint256)",
    "function isAlive(address owner) view returns (bool)"
];

interface PetProviderProps {
    children: ReactNode;
    petManagerAddress?: string;
}

export function PetProvider({ children, petManagerAddress }: PetProviderProps) {
    const { address, provider } = useWallet();

    const [pet, setPet] = useState<PetData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // 计算属性
    const isAlive = pet?.status === 'alive';
    const isDying = isAlive && (pet?.hp ?? 100) < 30;
    const isDead = pet?.status === 'dead';

    // 刷新宠物状态
    const refreshPet = useCallback(async () => {
        // 如果启用 Mock 数据，使用预设宠物状态
        if (USE_MOCK_DATA && MOCK_CONFIG.pet) {
            setPet({
                hp: MOCK_PET.hp,
                status: MOCK_PET.status,
                deathCount: MOCK_PET.deathCount,
                createdAt: MOCK_PET.createdAt,
            });
            return;
        }

        if (!address || !petManagerAddress || !provider) {
            setPet(null);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const contract = new ethers.Contract(
                petManagerAddress,
                PET_MANAGER_ABI,
                provider
            );

            const data = await contract.getPet(address);

            // 解析合约返回的数据
            const hp = Number(data.hp);
            const statusNum = Number(data.status);
            const createdAt = Number(data.createdAt);
            const deathCount = Number(data.deathCount);

            // 如果 createdAt 为 0，表示没有宠物
            if (createdAt === 0) {
                setPet(null);
                return;
            }

            setPet({
                hp,
                status: statusNum === 0 ? 'alive' : 'dead',
                deathCount,
                createdAt,
            });
        } catch (e: any) {
            console.error('Failed to fetch pet:', e);
            setError(e.message || 'Failed to fetch pet');
            setPet(null);
        } finally {
            setLoading(false);
        }
    }, [address, petManagerAddress, provider]);

    // 创建宠物
    const createPet = useCallback(async () => {
        if (!petManagerAddress || !provider) {
            throw new Error('PetManager not configured');
        }

        setLoading(true);
        try {
            const signer = await provider.getSigner();
            const contract = new ethers.Contract(
                petManagerAddress,
                PET_MANAGER_ABI,
                signer
            );

            const tx = await contract.createPet();
            await tx.wait();

            await refreshPet();
        } catch (e: any) {
            setError(e.message || 'Failed to create pet');
            throw e;
        } finally {
            setLoading(false);
        }
    }, [petManagerAddress, provider, refreshPet]);

    // 复活宠物
    const revivePet = useCallback(async () => {
        if (!petManagerAddress || !provider) {
            throw new Error('PetManager not configured');
        }

        setLoading(true);
        try {
            const signer = await provider.getSigner();
            const contract = new ethers.Contract(
                petManagerAddress,
                PET_MANAGER_ABI,
                signer
            );

            // 获取复活费用
            const cost = await contract.reviveCost();

            const tx = await contract.revive({ value: cost });
            await tx.wait();

            await refreshPet();
        } catch (e: any) {
            setError(e.message || 'Failed to revive pet');
            throw e;
        } finally {
            setLoading(false);
        }
    }, [petManagerAddress, provider, refreshPet]);

    // 钱包地址变化时刷新
    useEffect(() => {
        if (address && petManagerAddress) {
            refreshPet();
        } else {
            setPet(null);
        }
    }, [address, petManagerAddress, refreshPet]);

    const value: PetContextValue = {
        pet,
        loading,
        error,
        isAlive,
        isDying,
        isDead,
        refreshPet,
        createPet,
        revivePet,
    };

    return (
        <PetContext.Provider value={value}>
            {children}
        </PetContext.Provider>
    );
}

// Hook
export function usePet() {
    const context = useContext(PetContext);
    if (!context) {
        // 如果没有 Provider，返回默认值 (不阻塞渲染)
        return {
            pet: null,
            loading: false,
            error: null,
            isAlive: true,
            isDying: false,
            isDead: false,
            refreshPet: async () => { },
            createPet: async () => { },
            revivePet: async () => { },
        };
    }
    return context;
}
