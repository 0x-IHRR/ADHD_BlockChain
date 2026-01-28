// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./interfaces/IVerifier.sol";
import "./interfaces/IPenaltyStrategy.sol";
import "./interfaces/IPetManager.sol";
import "./interfaces/IAchievementNFT.sol";

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
        uint8 multiplier;  // 质押倍率: 1, 2, 或 3
    }

    // ============ 状态变量 ============
    uint256 public nextTaskId;
    mapping(uint256 => Task) public tasks;
    mapping(address => uint256[]) public userTasks;

    IVerifier public verifier;
    IPenaltyStrategy public penaltyStrategy;
    IPetManager public petManager;     // 电子宠物管理合约
    IAchievementNFT public achievementNFT; // 成就徽章 NFT 合约
    address public owner;
    address public authorizedVerifier; // Oracle 地址，唯一可调用 submitProof
    
    // ============ 奖金池系统 ============
    address public treasury;           // 平台金库地址
    uint256 public jackpot;            // 用户奖金池余额
    uint256 public constant PLATFORM_FEE_PERCENT = 30;  // 平台抽成 30%
    uint256 public constant JACKPOT_PERCENT = 70;       // 奖金池 70%

    // ============ 事件 ============
    event TaskCreated(uint256 indexed taskId, address indexed owner, uint256 stakeAmount, uint256 deadline, uint8 multiplier);
    event TaskVerified(uint256 indexed taskId, bool success);
    event TaskSettled(uint256 indexed taskId, bool refunded);
    event VerifierUpdated(address indexed newVerifier);
    event PenaltyStrategyUpdated(address indexed newStrategy);
    event AuthorizedVerifierUpdated(address indexed newAuthorizedVerifier);
    event JackpotIncreased(uint256 indexed taskId, uint256 amount, uint256 newTotal);
    event TreasuryWithdrawn(address indexed to, uint256 amount);

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
    constructor(
        address _verifier, 
        address _penaltyStrategy,
        address _authorizedVerifier,
        address _treasury,
        address _petManager
    ) {
        require(_authorizedVerifier != address(0), "Oracle address required");
        
        owner = msg.sender;
        verifier = IVerifier(_verifier);
        penaltyStrategy = IPenaltyStrategy(_penaltyStrategy);
        authorizedVerifier = _authorizedVerifier;
        treasury = _treasury;
        petManager = IPetManager(_petManager);
    }

    // ============ 核心函数 ============

    /**
     * @notice 创建新任务并质押资金
     * @param description 任务描述
     * @param deadline 截止时间戳
     * @param multiplier 质押倍率 (1, 2, 或 3)
     */
    function createTask(string calldata description, uint256 deadline, uint8 multiplier) external payable {
        require(msg.value > 0, "Stake required");
        require(deadline > block.timestamp, "Deadline must be future");
        
        // 倍率验证: 1-3 免费，5/10 需要 Master 徽章
        if (multiplier <= 3) {
            require(multiplier >= 1, "Multiplier must be >= 1");
        } else {
            require(multiplier == 5 || multiplier == 10, "High multiplier must be 5 or 10");
            require(
                address(achievementNFT) != address(0) && achievementNFT.canUseHighMultiplier(msg.sender),
                "Need Master badge for 5x/10x"
            );
        }

        uint256 taskId = nextTaskId++;
        tasks[taskId] = Task({
            id: taskId,
            owner: msg.sender,
            description: description,
            stakeAmount: msg.value,
            deadline: deadline,
            status: TaskStatus.Pending,
            createdAt: block.timestamp,
            multiplier: multiplier
        });
        userTasks[msg.sender].push(taskId);

        emit TaskCreated(taskId, msg.sender, msg.value, deadline, multiplier);
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
            // 验证成功，治愈宠物
            if (address(petManager) != address(0)) {
                petManager.healPet(task.owner, 5);
            }
            // 增加用户完成任务数 (用于成就徽章)
            if (address(achievementNFT) != address(0)) {
                try achievementNFT.incrementCompletedCount(task.owner) {} catch {}
            }
        } else {
            task.status = TaskStatus.Failed;
            // 验证失败，对宠物造成伤害
            if (address(petManager) != address(0)) {
                petManager.damagePet(task.owner, task.multiplier);
            }
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

        // 奖金池分成: 30% 平台, 70% 奖金池
        uint256 platformFee = (amount * PLATFORM_FEE_PERCENT) / 100;
        uint256 toJackpot = amount - platformFee;
        
        // 平台费用转入 treasury
        if (treasury != address(0) && platformFee > 0) {
            (bool success, ) = payable(treasury).call{value: platformFee}("");
            require(success, "Treasury transfer failed");
        }
        
        // 剩余进入奖金池
        jackpot += toJackpot;
        emit JackpotIncreased(taskId, toJackpot, jackpot);

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

    function setTreasury(address _treasury) external onlyOwner {
        treasury = _treasury;
    }

    function setAchievementNFT(address _achievementNFT) external onlyOwner {
        achievementNFT = IAchievementNFT(_achievementNFT);
    }

    /**
     * @notice 从合约提取奖金池资金 (仅 owner 可调用，用于分配给成功者)
     * @param amount 提取金额
     * @param to 提取地址
     */
    function withdrawJackpot(uint256 amount, address to) external onlyOwner {
        require(amount <= jackpot, "Insufficient jackpot");
        jackpot -= amount;
        (bool success, ) = payable(to).call{value: amount}("");
        require(success, "Withdraw failed");
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

    function getJackpot() external view returns (uint256) {
        return jackpot;
    }
}
