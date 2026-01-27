// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IVerifier
 * @notice 任务验证接口 - 定义如何验证任务是否完成
 * @dev 可扩展实现：AI 验证、DAO 投票、Oracle 验证等
 */
interface IVerifier {
    /**
     * @notice 验证任务完成状态
     * @param taskId 任务 ID
     * @param user 任务所有者地址
     * @param proof 验证证明数据 (可以是 AI 签名、投票结果等)
     * @return verified 是否验证通过
     */
    function verify(
        uint256 taskId,
        address user,
        bytes calldata proof
    ) external returns (bool verified);

    /**
     * @notice 检查是否支持某种验证类型
     * @param verifyType 验证类型标识
     * @return supported 是否支持
     */
    function supportsVerifyType(bytes4 verifyType) external view returns (bool supported);
}
