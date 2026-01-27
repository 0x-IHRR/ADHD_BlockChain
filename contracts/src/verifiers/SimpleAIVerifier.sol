// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../interfaces/IVerifier.sol";

/**
 * @title SimpleAIVerifier
 * @notice MVP 验证器 - 简单信任 AI 服务提交的结果
 * @dev 未来可升级为 DAO 投票或 Chainlink Oracle 验证
 */
contract SimpleAIVerifier is IVerifier {
    // AI 服务的授权地址（可调用 verify）
    address public aiOperator;
    address public owner;

    // 验证记录
    mapping(uint256 => bool) public verificationResults;
    mapping(uint256 => bool) public hasVerified;

    // 事件
    event Verified(uint256 indexed taskId, address indexed user, bool result);
    event OperatorUpdated(address indexed newOperator);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    modifier onlyOperator() {
        require(msg.sender == aiOperator || msg.sender == owner, "Only AI operator");
        _;
    }

    constructor(address _aiOperator) {
        owner = msg.sender;
        aiOperator = _aiOperator;
    }

    /**
     * @notice 验证任务完成状态
     * @dev MVP 版本：直接信任 AI 服务提交的结果
     */
    function verify(
        uint256 taskId,
        address user,
        bytes calldata proof
    ) external override onlyOperator returns (bool verified) {
        // MVP: 从 proof 中解码布尔结果
        // 生产环境应验证签名等
        verified = abi.decode(proof, (bool));
        
        verificationResults[taskId] = verified;
        hasVerified[taskId] = true;

        emit Verified(taskId, user, verified);
        return verified;
    }

    /**
     * @notice 检查是否支持某种验证类型
     */
    function supportsVerifyType(bytes4 verifyType) external pure override returns (bool) {
        // 支持简单 AI 验证类型
        bytes4 SIMPLE_AI_TYPE = bytes4(keccak256("SIMPLE_AI"));
        return verifyType == SIMPLE_AI_TYPE;
    }

    /**
     * @notice 更新 AI 操作员地址
     */
    function setOperator(address _operator) external onlyOwner {
        aiOperator = _operator;
        emit OperatorUpdated(_operator);
    }

    /**
     * @notice 查询验证结果
     */
    function getResult(uint256 taskId) external view returns (bool verified, bool exists) {
        return (verificationResults[taskId], hasVerified[taskId]);
    }
}
