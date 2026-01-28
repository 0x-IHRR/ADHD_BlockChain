// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {AchievementNFT} from "../src/AchievementNFT.sol";
import {IAchievementNFT} from "../src/interfaces/IAchievementNFT.sol";

contract AchievementNFTTest is Test {
    AchievementNFT public nft;
    
    address owner = address(this);
    address user1 = address(0x1);
    address user2 = address(0x2);
    address taskManager = address(0x100);

    function setUp() public {
        nft = new AchievementNFT();
        nft.setTaskManager(taskManager);
    }

    // ============ 阈值测试 ============

    function test_Thresholds() public view {
        assertEq(nft.APPRENTICE_THRESHOLD(), 5);
        assertEq(nft.MASTER_THRESHOLD(), 20);
        assertEq(nft.LEGEND_THRESHOLD(), 50);
    }

    // ============ 资格检查 ============

    function test_CannotClaimWithoutEnoughTasks() public {
        // user1 没有完成任何任务
        assertFalse(nft.canClaim(user1, IAchievementNFT.BadgeType.Apprentice));
        
        vm.expectRevert("Not eligible or already claimed");
        vm.prank(user1);
        nft.claimBadge(IAchievementNFT.BadgeType.Apprentice);
    }

    function test_CanClaimAfterThreshold() public {
        // 模拟 TaskManager 增加完成数
        vm.startPrank(taskManager);
        for (uint i = 0; i < 5; i++) {
            nft.incrementCompletedCount(user1);
        }
        vm.stopPrank();

        // 现在应该可以 claim Apprentice
        assertTrue(nft.canClaim(user1, IAchievementNFT.BadgeType.Apprentice));
        assertFalse(nft.canClaim(user1, IAchievementNFT.BadgeType.Master));

        // Claim
        vm.prank(user1);
        nft.claimBadge(IAchievementNFT.BadgeType.Apprentice);

        // 验证
        assertTrue(nft.hasClaimed(user1, IAchievementNFT.BadgeType.Apprentice));
        assertEq(nft.balanceOf(user1), 1);
    }

    function test_CannotDoubleClaim() public {
        // 完成 5 个任务
        vm.startPrank(taskManager);
        for (uint i = 0; i < 5; i++) {
            nft.incrementCompletedCount(user1);
        }
        vm.stopPrank();

        // 第一次 claim
        vm.prank(user1);
        nft.claimBadge(IAchievementNFT.BadgeType.Apprentice);

        // 第二次应该失败
        assertFalse(nft.canClaim(user1, IAchievementNFT.BadgeType.Apprentice));
        
        vm.expectRevert("Not eligible or already claimed");
        vm.prank(user1);
        nft.claimBadge(IAchievementNFT.BadgeType.Apprentice);
    }

    // ============ 折扣测试 ============

    function test_DiscountByBadgeLevel() public {
        // 没有徽章 = 0% 折扣
        assertEq(nft.getDiscount(user1), 0);

        // 给 user1 5 个任务 → Apprentice
        vm.startPrank(taskManager);
        for (uint i = 0; i < 20; i++) {
            nft.incrementCompletedCount(user1);
        }
        vm.stopPrank();

        // Claim Apprentice
        vm.prank(user1);
        nft.claimBadge(IAchievementNFT.BadgeType.Apprentice);
        assertEq(nft.getDiscount(user1), 5);

        // Claim Master (已有 20 个任务)
        vm.prank(user1);
        nft.claimBadge(IAchievementNFT.BadgeType.Master);
        assertEq(nft.getDiscount(user1), 15);
    }

    // ============ 高倍率解锁 ============

    function test_HighMultiplierRequiresMaster() public {
        // 没有徽章 = 不能用 5x/10x
        assertFalse(nft.canUseHighMultiplier(user1));

        // 给 user1 20 个任务
        vm.startPrank(taskManager);
        for (uint i = 0; i < 20; i++) {
            nft.incrementCompletedCount(user1);
        }
        vm.stopPrank();

        // Claim Apprentice 还不够
        vm.prank(user1);
        nft.claimBadge(IAchievementNFT.BadgeType.Apprentice);
        assertFalse(nft.canUseHighMultiplier(user1));

        // Claim Master
        vm.prank(user1);
        nft.claimBadge(IAchievementNFT.BadgeType.Master);
        assertTrue(nft.canUseHighMultiplier(user1));
    }

    // ============ 投票权重 ============

    function test_VotingPowerAccumulates() public {
        // 给 user1 足够任务
        vm.startPrank(taskManager);
        for (uint i = 0; i < 50; i++) {
            nft.incrementCompletedCount(user1);
        }
        vm.stopPrank();

        // 没有徽章 = 0 投票权
        assertEq(nft.votingPower(user1), 0);

        // Claim all badges
        vm.startPrank(user1);
        nft.claimBadge(IAchievementNFT.BadgeType.Apprentice);
        assertEq(nft.votingPower(user1), 1);

        nft.claimBadge(IAchievementNFT.BadgeType.Master);
        assertEq(nft.votingPower(user1), 4); // 1 + 3

        nft.claimBadge(IAchievementNFT.BadgeType.Legend);
        assertEq(nft.votingPower(user1), 14); // 1 + 3 + 10
        vm.stopPrank();
    }

    // ============ 权限测试 ============

    function test_OnlyTaskManagerCanIncrement() public {
        vm.expectRevert("Not TaskManager");
        vm.prank(user1);
        nft.incrementCompletedCount(user1);
    }

    function test_OnlyOwnerCanSetTaskManager() public {
        vm.expectRevert("Not owner");
        vm.prank(user1);
        nft.setTaskManager(user2);
    }

    // ============ 用户进度查询 ============

    function test_GetUserProgress() public {
        vm.startPrank(taskManager);
        for (uint i = 0; i < 7; i++) {
            nft.incrementCompletedCount(user1);
        }
        vm.stopPrank();

        vm.prank(user1);
        nft.claimBadge(IAchievementNFT.BadgeType.Apprentice);

        (uint256 completed, bool hasApprentice, bool hasMaster, bool hasLegend) = nft.getUserProgress(user1);
        
        assertEq(completed, 7);
        assertTrue(hasApprentice);
        assertFalse(hasMaster);
        assertFalse(hasLegend);
    }

    // ============ ERC-721 基础测试 ============

    function test_TransferNFT() public {
        // user1 获得徽章
        vm.startPrank(taskManager);
        for (uint i = 0; i < 5; i++) {
            nft.incrementCompletedCount(user1);
        }
        vm.stopPrank();

        vm.prank(user1);
        nft.claimBadge(IAchievementNFT.BadgeType.Apprentice);

        uint256 tokenId = nft.badgeTokenId(user1, IAchievementNFT.BadgeType.Apprentice);
        
        // 转移给 user2
        vm.prank(user1);
        nft.transferFrom(user1, user2, tokenId);

        assertEq(nft.ownerOf(tokenId), user2);
        assertEq(nft.balanceOf(user1), 0);
        assertEq(nft.balanceOf(user2), 1);
    }
}
