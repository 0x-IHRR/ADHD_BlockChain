// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IAchievementNFT
 * @notice FocusFlow 成就徽章 NFT 接口
 * @dev 定义徽章类型、查询方法和赋能功能
 */
interface IAchievementNFT {
    // ============ 枚举 ============
    
    enum BadgeType {
        Apprentice,  // 青铜 - 完成 5 个任务
        Master,      // 白银 - 完成 20 个任务
        Legend       // 黄金 - 完成 50 个任务
    }

    // ============ 事件 ============
    
    event BadgeClaimed(address indexed user, BadgeType badgeType, uint256 tokenId);

    // ============ 查询函数 ============
    
    /**
     * @notice 检查用户是否持有某类型徽章
     * @param user 用户地址
     * @param badgeType 徽章类型
     * @return 是否持有
     */
    function hasBadge(address user, BadgeType badgeType) external view returns (bool);

    /**
     * @notice 获取用户的折扣率 (基于最高等级徽章)
     * @param user 用户地址
     * @return 折扣百分比 (0-30)
     */
    function getDiscount(address user) external view returns (uint256);

    /**
     * @notice 检查用户是否可使用高倍率 (5x/10x)
     * @param user 用户地址
     * @return 是否解锁高倍率
     */
    function canUseHighMultiplier(address user) external view returns (bool);

    /**
     * @notice 获取用户的 DAO 投票权重
     * @param user 用户地址
     * @return 投票权重总和
     */
    function votingPower(address user) external view returns (uint256);

    /**
     * @notice 检查用户是否有资格领取某徽章
     * @param user 用户地址
     * @param badgeType 徽章类型
     * @return 是否有资格
     */
    function canClaim(address user, BadgeType badgeType) external view returns (bool);

    // ============ 操作函数 ============
    
    /**
     * @notice 领取徽章 (需满足条件且未领取过)
     * @param badgeType 要领取的徽章类型
     */
    function claimBadge(BadgeType badgeType) external;

    /**
     * @notice 增加用户完成任务数 (由 TaskManager 调用)
     * @param user 用户地址
     */
    function incrementCompletedCount(address user) external;
}
