// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IPetManager
 * @notice 电子宠物管理接口
 */
interface IPetManager {
    enum PetStatus { Alive, Dead }

    struct Pet {
        uint8 hp;              // 生命值 (0-100)
        PetStatus status;
        uint256 createdAt;
        uint256 deathCount;    // 累计死亡次数
    }

    event PetCreated(address indexed owner);
    event PetDamaged(address indexed owner, uint8 damage, uint8 remainingHp);
    event PetDied(address indexed owner, uint256 deathCount);
    event PetRevived(address indexed owner, uint256 cost);
    event PetHealed(address indexed owner, uint8 amount, uint8 newHp);

    function createPet() external;
    function damagePet(address owner, uint8 multiplier) external;
    function healPet(address owner, uint8 amount) external;
    function revive() external payable;
    function getPet(address owner) external view returns (Pet memory);
    function isAlive(address owner) external view returns (bool);
}
