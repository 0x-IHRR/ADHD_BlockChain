// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IPenaltyStrategy
 * @notice 惩罚策略接口 - 定义任务失败时如何处理质押资金
 * @dev 可扩展实现：销毁、捐赠慈善、分红给成功者等
 */
interface IPenaltyStrategy {
    /**
     * @notice 执行惩罚策略
     * @param taskId 任务 ID
     * @param user 任务所有者地址
     * @param amount 质押金额
     */
    function execute(
        uint256 taskId,
        address user,
        uint256 amount
    ) external payable;

    /**
     * @notice 获取策略名称
     * @return name 策略名称
     */
    function strategyName() external view returns (string memory name);
}
