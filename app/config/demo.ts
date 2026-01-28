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
};
