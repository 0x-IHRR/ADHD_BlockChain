import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { useWallet } from '../context/WalletContext';
import { isAdminWallet } from '../config/demo';

// Badge 类型枚举
export enum BadgeType {
    Apprentice = 0,
    Master = 1,
    Legend = 2,
}

// Badge 信息
export interface BadgeInfo {
    type: BadgeType;
    name: string;
    nameZh: string;
    threshold: number;
    discount: number;
    votingPower: number;
    color: string;
}

// 所有徽章元数据
export const BADGES: BadgeInfo[] = [
    {
        type: BadgeType.Apprentice,
        name: 'Igniter',
        nameZh: '点燃者',
        threshold: 5,
        discount: 5,
        votingPower: 1,
        color: '#CD7F32', // Bronze
    },
    {
        type: BadgeType.Master,
        name: 'Flow Keeper',
        nameZh: '心流守护者',
        threshold: 20,
        discount: 15,
        votingPower: 3,
        color: '#C0C0C0', // Silver
    },
    {
        type: BadgeType.Legend,
        name: 'Focus Titan',
        nameZh: '专注泰坦',
        threshold: 50,
        discount: 30,
        votingPower: 10,
        color: '#FFD700', // Gold
    },
];

// 管理员钱包的 Mock NFT 状态 (用于演示)
const ADMIN_MOCK_STATE: UserBadgeState = {
    completedCount: 100,
    hasBadges: [true, true, true],  // 拥有所有徽章
    canClaimBadges: [false, false, false],  // 已领取
    discount: 30,  // 最高折扣
    canUseHighMultiplier: true,  // 可用 5x/10x
    votingPower: 14,  // 1 + 3 + 10
};

// ABI (简化版)
const ACHIEVEMENT_NFT_ABI = [
    "function hasClaimed(address, uint8) view returns (bool)",
    "function canClaim(address, uint8) view returns (bool)",
    "function getDiscount(address) view returns (uint256)",
    "function canUseHighMultiplier(address) view returns (bool)",
    "function votingPower(address) view returns (uint256)",
    "function userCompletedCount(address) view returns (uint256)",
    "function getUserProgress(address) view returns (uint256 completed, bool hasApprentice, bool hasMaster, bool hasLegend)",
    "function claimBadge(uint8 badgeType) external",
    "function APPRENTICE_THRESHOLD() view returns (uint256)",
    "function MASTER_THRESHOLD() view returns (uint256)",
    "function LEGEND_THRESHOLD() view returns (uint256)",
];

export interface UserBadgeState {
    completedCount: number;
    hasBadges: boolean[];  // [Apprentice, Master, Legend]
    canClaimBadges: boolean[];
    discount: number;
    canUseHighMultiplier: boolean;
    votingPower: number;
}

interface UseAchievementNFTReturn {
    loading: boolean;
    error: string | null;
    state: UserBadgeState | null;
    claimBadge: (badgeType: BadgeType) => Promise<void>;
    refresh: () => Promise<void>;
}

export function useAchievementNFT(contractAddress?: string): UseAchievementNFTReturn {
    const { address, provider } = useWallet();

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [state, setState] = useState<UserBadgeState | null>(null);

    // 获取用户状态
    const refresh = useCallback(async () => {
        if (!address) {
            setState(null);
            return;
        }

        // 管理员钱包: 返回 Mock 状态 (拥有所有成就)
        if (isAdminWallet(address)) {
            setState(ADMIN_MOCK_STATE);
            return;
        }

        if (!contractAddress || !provider) {
            setState(null);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const contract = new ethers.Contract(contractAddress, ACHIEVEMENT_NFT_ABI, provider);

            // 批量查询
            const [progress, discount, canHighMult, votePower] = await Promise.all([
                contract.getUserProgress(address),
                contract.getDiscount(address),
                contract.canUseHighMultiplier(address),
                contract.votingPower(address),
            ]);

            // 检查可领取状态
            const canClaimResults = await Promise.all([
                contract.canClaim(address, BadgeType.Apprentice),
                contract.canClaim(address, BadgeType.Master),
                contract.canClaim(address, BadgeType.Legend),
            ]);

            setState({
                completedCount: Number(progress.completed),
                hasBadges: [progress.hasApprentice, progress.hasMaster, progress.hasLegend],
                canClaimBadges: canClaimResults,
                discount: Number(discount),
                canUseHighMultiplier: canHighMult,
                votingPower: Number(votePower),
            });
        } catch (e: any) {
            console.error('Failed to fetch achievement data:', e);
            setError(e.message || 'Failed to fetch');
            setState(null);  // 清空旧状态，防止显示其他钱包的数据
        } finally {
            setLoading(false);
        }
    }, [address, contractAddress, provider]);

    // Claim 徽章
    const claimBadge = useCallback(async (badgeType: BadgeType) => {
        if (!contractAddress || !provider) {
            throw new Error('Contract not configured');
        }

        setLoading(true);
        try {
            const signer = await provider.getSigner();
            const contract = new ethers.Contract(contractAddress, ACHIEVEMENT_NFT_ABI, signer);

            const tx = await contract.claimBadge(badgeType);
            await tx.wait();

            // 刷新状态
            await refresh();
        } catch (e: any) {
            setError(e.message || 'Failed to claim badge');
            throw e;
        } finally {
            setLoading(false);
        }
    }, [contractAddress, provider, refresh]);

    // 初始加载
    useEffect(() => {
        if (address && contractAddress) {
            refresh();
        }
    }, [address, contractAddress, refresh]);

    return {
        loading,
        error,
        state,
        claimBadge,
        refresh,
    };
}
