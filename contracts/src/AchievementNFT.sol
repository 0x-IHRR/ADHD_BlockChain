// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./interfaces/IAchievementNFT.sol";

/**
 * @title AchievementNFT
 * @notice FocusFlow 成就徽章 NFT 合约
 * @dev 简化版 ERC-721 实现，支持折扣、高倍率解锁和 DAO 投票权
 */
contract AchievementNFT is IAchievementNFT {
    // ============ 常量 ============
    
    // 徽章解锁阈值
    uint256 public constant APPRENTICE_THRESHOLD = 5;
    uint256 public constant MASTER_THRESHOLD = 20;
    uint256 public constant LEGEND_THRESHOLD = 50;
    
    // 折扣率 (百分比)
    uint256 public constant APPRENTICE_DISCOUNT = 5;
    uint256 public constant MASTER_DISCOUNT = 15;
    uint256 public constant LEGEND_DISCOUNT = 30;
    
    // DAO 投票权重
    uint256 public constant APPRENTICE_VOTING_POWER = 1;
    uint256 public constant MASTER_VOTING_POWER = 3;
    uint256 public constant LEGEND_VOTING_POWER = 10;

    // ============ 状态变量 ============
    
    string public name = "FocusFlow Achievement";
    string public symbol = "FFA";
    
    address public owner;
    address public taskManager;
    
    uint256 private _nextTokenId;
    
    // tokenId => owner
    mapping(uint256 => address) private _owners;
    // owner => token count
    mapping(address => uint256) private _balances;
    // tokenId => approved address
    mapping(uint256 => address) private _tokenApprovals;
    // owner => operator => approved
    mapping(address => mapping(address => bool)) private _operatorApprovals;
    
    // user => badgeType => hasClaimed
    mapping(address => mapping(BadgeType => bool)) public hasClaimed;
    // user => badgeType => tokenId (0 if not owned)
    mapping(address => mapping(BadgeType => uint256)) public badgeTokenId;
    
    // 用户完成任务数 (由 TaskManager 更新)
    mapping(address => uint256) public userCompletedCount;

    // ============ 事件 (ERC-721) ============
    
    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId);
    event ApprovalForAll(address indexed owner, address indexed operator, bool approved);

    // ============ 修饰符 ============
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    
    modifier onlyTaskManager() {
        require(msg.sender == taskManager, "Not TaskManager");
        _;
    }

    // ============ 构造函数 ============
    
    constructor() {
        owner = msg.sender;
    }

    // ============ 管理函数 ============
    
    function setTaskManager(address _taskManager) external onlyOwner {
        taskManager = _taskManager;
    }

    /**
     * @notice TaskManager 调用：增加用户完成任务数
     */
    function incrementCompletedCount(address user) external onlyTaskManager {
        userCompletedCount[user]++;
    }

    // ============ IAchievementNFT 实现 ============
    
    function hasBadge(address user, BadgeType badgeType) external view override returns (bool) {
        return hasClaimed[user][badgeType];
    }

    function getDiscount(address user) external view override returns (uint256) {
        if (hasClaimed[user][BadgeType.Legend]) return LEGEND_DISCOUNT;
        if (hasClaimed[user][BadgeType.Master]) return MASTER_DISCOUNT;
        if (hasClaimed[user][BadgeType.Apprentice]) return APPRENTICE_DISCOUNT;
        return 0;
    }

    function canUseHighMultiplier(address user) external view override returns (bool) {
        // 需要 Master 或 Legend 徽章才能使用 5x/10x
        return hasClaimed[user][BadgeType.Master] || hasClaimed[user][BadgeType.Legend];
    }

    function votingPower(address user) external view override returns (uint256) {
        uint256 power = 0;
        if (hasClaimed[user][BadgeType.Apprentice]) power += APPRENTICE_VOTING_POWER;
        if (hasClaimed[user][BadgeType.Master]) power += MASTER_VOTING_POWER;
        if (hasClaimed[user][BadgeType.Legend]) power += LEGEND_VOTING_POWER;
        return power;
    }

    function canClaim(address user, BadgeType badgeType) public view override returns (bool) {
        if (hasClaimed[user][badgeType]) return false;
        
        uint256 completed = userCompletedCount[user];
        if (badgeType == BadgeType.Apprentice) return completed >= APPRENTICE_THRESHOLD;
        if (badgeType == BadgeType.Master) return completed >= MASTER_THRESHOLD;
        if (badgeType == BadgeType.Legend) return completed >= LEGEND_THRESHOLD;
        return false;
    }

    function claimBadge(BadgeType badgeType) external override {
        require(canClaim(msg.sender, badgeType), "Not eligible or already claimed");
        
        hasClaimed[msg.sender][badgeType] = true;
        
        uint256 tokenId = _nextTokenId++;
        badgeTokenId[msg.sender][badgeType] = tokenId;
        
        _mint(msg.sender, tokenId);
        
        emit BadgeClaimed(msg.sender, badgeType, tokenId);
    }

    // ============ ERC-721 基础实现 ============
    
    function balanceOf(address _owner) external view returns (uint256) {
        require(_owner != address(0), "Zero address");
        return _balances[_owner];
    }

    function ownerOf(uint256 tokenId) external view returns (address) {
        address tokenOwner = _owners[tokenId];
        require(tokenOwner != address(0), "Token does not exist");
        return tokenOwner;
    }

    function approve(address to, uint256 tokenId) external {
        address tokenOwner = _owners[tokenId];
        require(msg.sender == tokenOwner || _operatorApprovals[tokenOwner][msg.sender], "Not authorized");
        _tokenApprovals[tokenId] = to;
        emit Approval(tokenOwner, to, tokenId);
    }

    function getApproved(uint256 tokenId) external view returns (address) {
        require(_owners[tokenId] != address(0), "Token does not exist");
        return _tokenApprovals[tokenId];
    }

    function setApprovalForAll(address operator, bool approved) external {
        _operatorApprovals[msg.sender][operator] = approved;
        emit ApprovalForAll(msg.sender, operator, approved);
    }

    function isApprovedForAll(address _owner, address operator) external view returns (bool) {
        return _operatorApprovals[_owner][operator];
    }

    function transferFrom(address from, address to, uint256 tokenId) external {
        require(_isApprovedOrOwner(msg.sender, tokenId), "Not authorized");
        _transfer(from, to, tokenId);
    }

    function safeTransferFrom(address from, address to, uint256 tokenId) external {
        require(_isApprovedOrOwner(msg.sender, tokenId), "Not authorized");
        _transfer(from, to, tokenId);
    }

    function safeTransferFrom(address from, address to, uint256 tokenId, bytes calldata) external {
        require(_isApprovedOrOwner(msg.sender, tokenId), "Not authorized");
        _transfer(from, to, tokenId);
    }

    // ============ 内部函数 ============
    
    function _mint(address to, uint256 tokenId) internal {
        require(to != address(0), "Mint to zero address");
        _balances[to]++;
        _owners[tokenId] = to;
        emit Transfer(address(0), to, tokenId);
    }

    function _transfer(address from, address to, uint256 tokenId) internal {
        require(_owners[tokenId] == from, "Not owner");
        require(to != address(0), "Transfer to zero address");
        
        delete _tokenApprovals[tokenId];
        _balances[from]--;
        _balances[to]++;
        _owners[tokenId] = to;
        
        emit Transfer(from, to, tokenId);
    }

    function _isApprovedOrOwner(address spender, uint256 tokenId) internal view returns (bool) {
        address tokenOwner = _owners[tokenId];
        return (spender == tokenOwner || 
                _tokenApprovals[tokenId] == spender || 
                _operatorApprovals[tokenOwner][spender]);
    }

    // ============ 元数据 (简化版) ============
    
    function tokenURI(uint256 tokenId) external pure returns (string memory) {
        // 返回占位符 URI，实际可指向 IPFS 或链上 SVG
        return string(abi.encodePacked("https://focusflow.app/nft/", _toString(tokenId)));
    }

    function _toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) return "0";
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits--;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }

    // ============ 查询辅助 ============
    
    function getBadgeThreshold(BadgeType badgeType) external pure returns (uint256) {
        if (badgeType == BadgeType.Apprentice) return APPRENTICE_THRESHOLD;
        if (badgeType == BadgeType.Master) return MASTER_THRESHOLD;
        if (badgeType == BadgeType.Legend) return LEGEND_THRESHOLD;
        return 0;
    }

    function getUserProgress(address user) external view returns (
        uint256 completed,
        bool hasApprentice,
        bool hasMaster,
        bool hasLegend
    ) {
        completed = userCompletedCount[user];
        hasApprentice = hasClaimed[user][BadgeType.Apprentice];
        hasMaster = hasClaimed[user][BadgeType.Master];
        hasLegend = hasClaimed[user][BadgeType.Legend];
    }
}
