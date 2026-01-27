// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./interfaces/IVerifier.sol";
import "./interfaces/IPenaltyStrategy.sol";

/**
 * @title TaskManager
 * @notice FocusFlow 核心合约 - 管理任务生命周期
 * @dev 通过接口抽象支持可插拔的验证器和惩罚策略
 */
contract TaskManager {
    // ============ 状态枚举 ============
    enum TaskStatus {
        Pending,    // 等待验证
        Verified,   // 已验证通过
        Failed,     // 验证失败或超时
        Settled     // 已结算
    }

    // ============ 数据结构 ============
    struct Task {
        uint256 id;
        address owner;
        string description;
        uint256 stakeAmount;
        uint256 deadline;
        TaskStatus status;
        uint256 createdAt;
    }

    // ============ 状态变量 ============
    uint256 public nextTaskId;
    mapping(uint256 => Task) public tasks;
    mapping(address => uint256[]) public userTasks;

    IVerifier public verifier;
    IPenaltyStrategy public penaltyStrategy;
    address public owner;
    address public authorizedVerifier; // Oracle 地址，唯一可调用 submitProof

    // ============ 事件 ============
    event TaskCreated(uint256 indexed taskId, address indexed owner, uint256 stakeAmount, uint256 deadline);
    event TaskVerified(uint256 indexed taskId, bool success);
    event TaskSettled(uint256 indexed taskId, bool refunded);
    event VerifierUpdated(address indexed newVerifier);
    event PenaltyStrategyUpdated(address indexed newStrategy);
    event AuthorizedVerifierUpdated(address indexed newAuthorizedVerifier);

    // ============ 修饰符 ============
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    modifier taskExists(uint256 taskId) {
        require(tasks[taskId].owner != address(0), "Task not found");
        _;
    }

    modifier onlyTaskOwner(uint256 taskId) {
        require(tasks[taskId].owner == msg.sender, "Not task owner");
        _;
    }

    modifier onlyAuthorizedVerifier() {
        require(msg.sender == authorizedVerifier, "Only Oracle can verify");
        _;
    }

    // ============ 构造函数 ============
    constructor(address _verifier, address _penaltyStrategy) {
        owner = msg.sender;
        verifier = IVerifier(_verifier);
        penaltyStrategy = IPenaltyStrategy(_penaltyStrategy);
    }

    // ============ 核心函数 ============

    /**
     * @notice 创建新任务并质押资金
     * @param description 任务描述
     * @param deadline 截止时间戳
     */
    function createTask(string calldata description, uint256 deadline) external payable {
        require(msg.value > 0, "Stake required");
        require(deadline > block.timestamp, "Deadline must be future");

        uint256 taskId = nextTaskId++;
        tasks[taskId] = Task({
            id: taskId,
            owner: msg.sender,
            description: description,
            stakeAmount: msg.value,
            deadline: deadline,
            status: TaskStatus.Pending,
            createdAt: block.timestamp
        });
        userTasks[msg.sender].push(taskId);

        emit TaskCreated(taskId, msg.sender, msg.value, deadline);
    }

    /**
     * @notice 提交验证结果 (由 Verifier 调用)
     * @param taskId 任务 ID
     * @param verified 验证结果
     */
    function submitProof(uint256 taskId, bool verified) external taskExists(taskId) onlyAuthorizedVerifier {
        Task storage task = tasks[taskId];
        require(task.status == TaskStatus.Pending, "Task not pending");
        require(block.timestamp <= task.deadline, "Task expired");

        if (verified) {
            task.status = TaskStatus.Verified;
        } else {
            task.status = TaskStatus.Failed;
        }

        emit TaskVerified(taskId, verified);
    }

    /**
     * @notice 领取退款 (验证通过后)
     * @param taskId 任务 ID
     */
    function claimRefund(uint256 taskId) external taskExists(taskId) onlyTaskOwner(taskId) {
        Task storage task = tasks[taskId];
        require(task.status == TaskStatus.Verified, "Not verified");

        uint256 amount = task.stakeAmount;
        task.stakeAmount = 0;
        task.status = TaskStatus.Settled;

        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "Transfer failed");

        emit TaskSettled(taskId, true);
    }

    /**
     * @notice 结算超时任务 (任何人可调用)
     * @param taskId 任务 ID
     */
    function settle(uint256 taskId) external taskExists(taskId) {
        Task storage task = tasks[taskId];
        require(task.status == TaskStatus.Pending || task.status == TaskStatus.Failed, "Cannot settle");
        require(block.timestamp > task.deadline, "Not expired");

        uint256 amount = task.stakeAmount;
        task.stakeAmount = 0;
        task.status = TaskStatus.Settled;

        // 执行惩罚策略 (传递资金)
        penaltyStrategy.execute{value: amount}(taskId, task.owner, amount);

        emit TaskSettled(taskId, false);
    }

    // ============ 管理函数 ============

    function setVerifier(address _verifier) external onlyOwner {
        verifier = IVerifier(_verifier);
        emit VerifierUpdated(_verifier);
    }

    function setPenaltyStrategy(address _strategy) external onlyOwner {
        penaltyStrategy = IPenaltyStrategy(_strategy);
        emit PenaltyStrategyUpdated(_strategy);
    }

    function setAuthorizedVerifier(address _authorizedVerifier) external onlyOwner {
        authorizedVerifier = _authorizedVerifier;
        emit AuthorizedVerifierUpdated(_authorizedVerifier);
    }

    // ============ 视图函数 ============

    function getTask(uint256 taskId) external view returns (Task memory) {
        return tasks[taskId];
    }

    function getUserTasks(address user) external view returns (uint256[] memory) {
        return userTasks[user];
    }

    function getTaskCount() external view returns (uint256) {
        return nextTaskId;
    }
}
