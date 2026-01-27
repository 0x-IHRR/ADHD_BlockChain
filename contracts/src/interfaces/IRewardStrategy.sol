// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IRewardStrategy
 * @notice 奖励策略接口 - 定义任务成功时如何奖励用户
 * @dev 可扩展实现：NFT 勋章、积分发放、额外 Token 奖励等
 * @notice MVP 阶段仅退款，此接口预留给未来扩展
 */
interface IRewardStrategy {
    /**
     * @notice 执行奖励策略
     * @param taskId 任务 ID
     * @param user 任务所有者地址
     * @param amount 质押金额 (将退还)
     */
    function execute(
        uint256 taskId,
        address user,
        uint256 amount
    ) external;

    /**
     * @notice 获取策略名称
     * @return name 策略名称
     */
    function strategyName() external view returns (string memory name);
}
