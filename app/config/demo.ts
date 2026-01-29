/**
 * Demo Config - 控制是否使用 Mock 数据
 * 
 * 在 Hackathon 演示时设为 true，显示精心准备的假数据
 * 生产环境或真实测试时设为 false，使用链上真实数据
 */

// 主开关
export const USE_MOCK_DATA = true;

// 单独开关 (高级)
export const MOCK_CONFIG = {
    leaderboard: true,  // 排行榜 Mock
    jackpot: true,      // 奖金池 Mock
    pet: true,          // 宠物状态 Mock
    tasks: false,       // 任务列表 (通常用真实数据)
    heatmap: true,      // 热力图 Mock (开发阶段使用)
};

// ============ 演示模式配置 ============

/**
 * 管理员钱包地址 - 拥有完整功能访问权限
 * 在演示模式下，管理员钱包可以绕过某些限制
 */
export const ADMIN_WALLET = '0xad3df8c77c5d3c78de9b4c465b758804a8c7f748'.toLowerCase();

/**
 * 检查是否为管理员钱包
 */
export function isAdminWallet(address: string | null | undefined): boolean {
    if (!address) return false;
    return address.toLowerCase() === ADMIN_WALLET;
}
