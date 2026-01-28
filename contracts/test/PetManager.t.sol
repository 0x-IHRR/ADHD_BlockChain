// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {PetManager} from "../src/PetManager.sol";
import {IPetManager} from "../src/interfaces/IPetManager.sol";

contract PetManagerTest is Test {
    PetManager public petManager;
    
    address public user = address(0x1);
    address public taskManager = address(0x2);
    address payable public jackpot = payable(address(0x3));

    function setUp() public {
        // 部署 PetManager，taskManager 模拟为 address(0x2)
        petManager = new PetManager(taskManager, jackpot);
        
        // 给 user 一些 ETH
        vm.deal(user, 10 ether);
    }

    // ============ 创建宠物测试 ============

    function test_CreatePet_Success() public {
        vm.prank(user);
        petManager.createPet();

        IPetManager.Pet memory pet = petManager.getPet(user);
        assertEq(pet.hp, 100);
        assertEq(uint(pet.status), uint(IPetManager.PetStatus.Alive));
        assertEq(pet.deathCount, 0);
        assertTrue(pet.createdAt > 0);
    }

    function test_CreatePet_RevertIfExists() public {
        vm.prank(user);
        petManager.createPet();

        vm.prank(user);
        vm.expectRevert("Pet already exists");
        petManager.createPet();
    }

    // ============ 伤害测试 ============

    function test_DamagePet_Success() public {
        vm.prank(user);
        petManager.createPet();

        // TaskManager 造成 1x 伤害 (10 HP)
        vm.prank(taskManager);
        petManager.damagePet(user, 1);

        IPetManager.Pet memory pet = petManager.getPet(user);
        assertEq(pet.hp, 90);
        assertEq(uint(pet.status), uint(IPetManager.PetStatus.Alive));
    }

    function test_DamagePet_HighMultiplier() public {
        vm.prank(user);
        petManager.createPet();

        // 3x 伤害 (30 HP)
        vm.prank(taskManager);
        petManager.damagePet(user, 3);

        IPetManager.Pet memory pet = petManager.getPet(user);
        assertEq(pet.hp, 70);
    }

    function test_DamagePet_CausesDeath() public {
        vm.prank(user);
        petManager.createPet();

        // 多次伤害直到死亡
        for (uint i = 0; i < 10; i++) {
            vm.prank(taskManager);
            petManager.damagePet(user, 1);
        }

        IPetManager.Pet memory pet = petManager.getPet(user);
        assertEq(pet.hp, 0);
        assertEq(uint(pet.status), uint(IPetManager.PetStatus.Dead));
        assertEq(pet.deathCount, 1);
    }

    function test_DamagePet_SkipsDeadPet() public {
        vm.prank(user);
        petManager.createPet();

        // 杀死宠物
        vm.prank(taskManager);
        petManager.damagePet(user, 10); // 100 HP damage

        uint256 deathCount = petManager.getPet(user).deathCount;

        // 再次伤害应跳过（宠物已死）
        vm.prank(taskManager);
        petManager.damagePet(user, 1);

        // 死亡次数不变
        assertEq(petManager.getPet(user).deathCount, deathCount);
    }

    function test_DamagePet_RevertIfNotTaskManager() public {
        vm.prank(user);
        petManager.createPet();

        // 非 TaskManager 调用
        vm.expectRevert("Only TaskManager");
        vm.prank(user); // user 不是 taskManager
        petManager.damagePet(user, 1);
    }

    // ============ 治愈测试 ============

    function test_HealPet_Success() public {
        vm.prank(user);
        petManager.createPet();

        // 先造成伤害
        vm.prank(taskManager);
        petManager.damagePet(user, 2); // -20 HP

        // 治愈 5 HP
        vm.prank(taskManager);
        petManager.healPet(user, 5);

        assertEq(petManager.getPet(user).hp, 85);
    }

    function test_HealPet_DoesNotExceedMax() public {
        vm.prank(user);
        petManager.createPet();

        // 治愈 10 HP (应该保持 100)
        vm.prank(taskManager);
        petManager.healPet(user, 10);

        assertEq(petManager.getPet(user).hp, 100);
    }

    // ============ 复活测试 ============

    function test_Revive_Success() public {
        vm.prank(user);
        petManager.createPet();

        // 杀死宠物
        vm.prank(taskManager);
        petManager.damagePet(user, 10);

        // 复活
        vm.prank(user);
        petManager.revive{value: 0.01 ether}();

        IPetManager.Pet memory pet = petManager.getPet(user);
        assertEq(pet.hp, 100);
        assertEq(uint(pet.status), uint(IPetManager.PetStatus.Alive));
    }

    function test_Revive_SendsToJackpot() public {
        vm.prank(user);
        petManager.createPet();

        // 杀死
        vm.prank(taskManager);
        petManager.damagePet(user, 10);

        uint256 jackpotBalanceBefore = jackpot.balance;

        // 复活
        vm.prank(user);
        petManager.revive{value: 0.01 ether}();

        assertEq(jackpot.balance, jackpotBalanceBefore + 0.01 ether);
    }

    function test_Revive_RevertIfNotDead() public {
        vm.prank(user);
        petManager.createPet();

        vm.prank(user);
        vm.expectRevert("Pet is not dead");
        petManager.revive{value: 0.01 ether}();
    }

    function test_Revive_RevertIfInsufficientPayment() public {
        vm.prank(user);
        petManager.createPet();

        vm.prank(taskManager);
        petManager.damagePet(user, 10);

        vm.prank(user);
        vm.expectRevert("Insufficient payment");
        petManager.revive{value: 0.005 ether}();
    }

    // ============ 视图函数测试 ============

    function test_IsAlive_ReturnsTrueForLivingPet() public {
        vm.prank(user);
        petManager.createPet();

        assertTrue(petManager.isAlive(user));
    }

    function test_IsAlive_ReturnsFalseForDeadPet() public {
        vm.prank(user);
        petManager.createPet();

        vm.prank(taskManager);
        petManager.damagePet(user, 10);

        assertFalse(petManager.isAlive(user));
    }

    function test_IsAlive_ReturnsFalseForNoPet() public {
        assertFalse(petManager.isAlive(user));
    }
}
