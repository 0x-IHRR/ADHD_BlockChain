// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../interfaces/IPenaltyStrategy.sol";

/**
 * @title BurnPenalty
 * @notice MVP 惩罚策略 - 销毁未完成任务的质押资金
 * @dev 未来可升级为捐赠慈善、分红给成功者等
 */
contract BurnPenalty is IPenaltyStrategy {
    // 销毁地址 (发送到此地址的资金永久丢失)
    address constant BURN_ADDRESS = address(0xdead);

    // 统计
    uint256 public totalBurned;
    mapping(uint256 => uint256) public burnedAmounts;

    // 事件
    event Burned(uint256 indexed taskId, address indexed user, uint256 amount);

    /**
     * @notice 执行惩罚 - 销毁资金
     */
    function execute(
        uint256 taskId,
        address user,
        uint256 amount
    ) external payable override {
        require(msg.value > 0, "Amount must be positive");
        require(msg.value == amount, "Amount mismatch");

        burnedAmounts[taskId] = msg.value;
        totalBurned += msg.value;

        // 将资金发送到销毁地址
        (bool success, ) = payable(BURN_ADDRESS).call{value: msg.value}("");
        require(success, "Burn failed");

        emit Burned(taskId, user, msg.value);
    }

    /**
     * @notice 获取策略名称
     */
    function strategyName() external pure override returns (string memory) {
        return "BurnPenalty";
    }

    /**
     * @notice 获取总销毁金额
     */
    function getTotalBurned() external view returns (uint256) {
        return totalBurned;
    }
}
