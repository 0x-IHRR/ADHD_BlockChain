/**
 * Mock Data - 排行榜与奖金池
 * 
 * 用于 Hackathon 演示，展示理想中的数据状态
 */

export interface MockPlayer {
    id: string;
    name: string;
    score: number;
    streak: number;
    multiplier: number;
    avatar?: string;
}

export interface MockWinner {
    id: string;
    name: string;
    amount: string;
    task: string;
    timestamp?: number;
}

// 排行榜 Top 10 玩家
export const MOCK_PLAYERS: MockPlayer[] = [
    { id: '0x742d35Cc6634C0532925a3b8D4C9db96590c6F01', name: 'vitalik.eth', score: 2850, streak: 15, multiplier: 3 },
    { id: '0x8ba1f109551bD432803012645Ac136ddd64DBA72', name: 'satoshi.eth', score: 2340, streak: 12, multiplier: 3 },
    { id: '0xdD2FD4581271e230360230F9337D5c0430Bf44C0', name: 'punk6529.eth', score: 1920, streak: 9, multiplier: 2 },
    { id: '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB', name: 'cobie.eth', score: 1650, streak: 8, multiplier: 2 },
    { id: '0xaAaAaAaaAaAaAaaAaAAAAAAAAaaaAaAaAaaAaaAa', name: 'tetranode.eth', score: 1420, streak: 7, multiplier: 3 },
    { id: '0x1111111111111111111111111111111111111111', name: 'giancarlo.eth', score: 1180, streak: 6, multiplier: 1 },
    { id: '0x2222222222222222222222222222222222222222', name: 'hayden.eth', score: 980, streak: 5, multiplier: 2 },
    { id: '0x3333333333333333333333333333333333333333', name: 'stani.eth', score: 820, streak: 4, multiplier: 1 },
    { id: '0x4444444444444444444444444444444444444444', name: 'kain.eth', score: 650, streak: 3, multiplier: 2 },
    { id: '0x5555555555555555555555555555555555555555', name: 'banteg.eth', score: 540, streak: 2, multiplier: 1 },
];

// 最近中奖者
export const MOCK_WINNERS: MockWinner[] = [
    { id: '1', name: 'vitalik.eth', amount: '0.15', task: 'Complete 30-min meditation session', timestamp: Date.now() - 1000 * 60 * 30 },
    { id: '2', name: 'satoshi.eth', amount: '0.08', task: 'Write 1000 words for blog post', timestamp: Date.now() - 1000 * 60 * 120 },
    { id: '3', name: 'punk6529.eth', amount: '0.12', task: 'Finish Solidity tutorial chapter 5', timestamp: Date.now() - 1000 * 60 * 180 },
    { id: '4', name: 'cobie.eth', amount: '0.05', task: 'Review 10 GitHub PRs', timestamp: Date.now() - 1000 * 60 * 300 },
    { id: '5', name: 'tetranode.eth', amount: '0.20', task: 'Ship new feature to production', timestamp: Date.now() - 1000 * 60 * 420 },
];

// 奖金池统计
export const MOCK_JACKPOT = {
    current: '2.45',           // 当前池子
    totalDistributed: '45.2',  // 历史总发放
    totalPlayers: 156,         // 总玩家数
    avgWinRate: 0.72,          // 平均验证通过率
};

// 宠物初始状态 (用于演示)
export const MOCK_PET = {
    hp: 75,                    // 当前血量 (非满血更有戏剧性)
    maxHp: 100,
    status: 'alive' as const,
    deathCount: 1,             // 历史死亡次数 (说明用户曾经失败过)
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 7, // 7天前创建
};
