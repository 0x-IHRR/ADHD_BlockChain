// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./interfaces/IPetManager.sol";

/**
 * @title PetManager
 * @notice FocusFlow 电子宠物 (Spoons) 生命周期管理
 * @dev 用户的 Spoons 宠物有生命值，任务失败会扣血，HP归零则死亡
 */
contract PetManager is IPetManager {
    // ============ 状态变量 ============
    mapping(address => Pet) public pets;
    
    address public taskManager;        // 只有 TaskManager 可调用 damagePet/healPet
    address public owner;              // 合约所有者
    
    uint256 public reviveCost = 0.01 ether;  // 复活费用
    address payable public jackpotAddress;   // 复活费进入 Jackpot
    
    uint8 public constant MAX_HP = 100;
    uint8 public constant DAMAGE_PER_MULTIPLIER = 10;  // 每倍率扣 10 HP
    uint8 public constant HEAL_AMOUNT = 5;             // 任务成功回复 5 HP

    // ============ 修饰符 ============
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    modifier onlyTaskManager() {
        require(msg.sender == taskManager, "Only TaskManager");
        _;
    }

    // ============ 构造函数 ============
    constructor(address _taskManager, address payable _jackpot) {
        owner = msg.sender;
        taskManager = _taskManager;
        jackpotAddress = _jackpot;
    }

    // ============ 核心函数 ============

    /**
     * @notice 创建用户的宠物 (初始 100 HP)
     */
    function createPet() external override {
        require(pets[msg.sender].createdAt == 0, "Pet already exists");
        
        pets[msg.sender] = Pet({
            hp: MAX_HP,
            status: PetStatus.Alive,
            createdAt: block.timestamp,
            deathCount: 0
        });
        
        emit PetCreated(msg.sender);
    }

    /**
     * @notice 对宠物造成伤害 (由 TaskManager 在验证失败时调用)
     * @param petOwner 宠物主人地址
     * @param multiplier 任务倍率 (1/2/3)
     */
    function damagePet(address petOwner, uint8 multiplier) external override onlyTaskManager {
        Pet storage pet = pets[petOwner];
        
        // 如果用户没有宠物或已死亡，跳过
        if (pet.createdAt == 0 || pet.status == PetStatus.Dead) {
            return;
        }

        uint8 damage = multiplier * DAMAGE_PER_MULTIPLIER;
        
        if (pet.hp <= damage) {
            pet.hp = 0;
            pet.status = PetStatus.Dead;
            pet.deathCount++;
            emit PetDied(petOwner, pet.deathCount);
        } else {
            pet.hp -= damage;
        }
        
        emit PetDamaged(petOwner, damage, pet.hp);
    }

    /**
     * @notice 治愈宠物 (由 TaskManager 在验证成功时调用)
     * @param petOwner 宠物主人地址
     * @param amount 治愈量
     */
    function healPet(address petOwner, uint8 amount) external override onlyTaskManager {
        Pet storage pet = pets[petOwner];
        
        // 只有活着的宠物才能治愈
        if (pet.status != PetStatus.Alive) {
            return;
        }
        
        uint8 newHp = pet.hp + amount;
        pet.hp = newHp > MAX_HP ? MAX_HP : newHp;
        
        emit PetHealed(petOwner, amount, pet.hp);
    }

    /**
     * @notice 复活死亡的宠物 (需支付复活费)
     */
    function revive() external payable override {
        Pet storage pet = pets[msg.sender];
        require(pet.status == PetStatus.Dead, "Pet is not dead");
        require(msg.value >= reviveCost, "Insufficient payment");

        pet.hp = MAX_HP;
        pet.status = PetStatus.Alive;

        // 复活费进入 Jackpot
        if (jackpotAddress != address(0)) {
            (bool success, ) = jackpotAddress.call{value: msg.value}("");
            require(success, "Transfer to jackpot failed");
        }

        emit PetRevived(msg.sender, msg.value);
    }

    // ============ 视图函数 ============

    function getPet(address petOwner) external view override returns (Pet memory) {
        return pets[petOwner];
    }

    function isAlive(address petOwner) external view override returns (bool) {
        Pet memory pet = pets[petOwner];
        return pet.createdAt != 0 && pet.status == PetStatus.Alive;
    }

    // ============ 管理函数 ============

    function setTaskManager(address _taskManager) external onlyOwner {
        taskManager = _taskManager;
    }

    function setReviveCost(uint256 _cost) external onlyOwner {
        reviveCost = _cost;
    }

    function setJackpotAddress(address payable _jackpot) external onlyOwner {
        jackpotAddress = _jackpot;
    }
}
