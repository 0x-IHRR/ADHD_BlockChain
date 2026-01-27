// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {TaskManager} from "../src/TaskManager.sol";
import {SimpleAIVerifier} from "../src/verifiers/SimpleAIVerifier.sol";
import {BurnPenalty} from "../src/strategies/BurnPenalty.sol";

contract TaskManagerTest is Test {
    TaskManager public taskManager;
    SimpleAIVerifier public verifier;
    BurnPenalty public penaltyStrategy;

    address public user = address(0x1);
    address public aiOperator = address(0x2);
    address public deployer = address(this);

    uint256 constant STAKE_AMOUNT = 1 ether;
    uint256 constant ONE_DAY = 86400;

    function setUp() public {
        // 部署验证器和惩罚策略
        verifier = new SimpleAIVerifier(aiOperator);
        penaltyStrategy = new BurnPenalty();
        
        // 部署主合约
        taskManager = new TaskManager(address(verifier), address(penaltyStrategy));
        
        // 设置测试合约为授权验证者 (Oracle)
        taskManager.setAuthorizedVerifier(address(this));

        // 给测试用户一些 ETH
        vm.deal(user, 10 ether);
    }

    // ============ 创建任务测试 ============

    function test_CreateTask_Success() public {
        vm.prank(user);
        uint256 deadline = block.timestamp + ONE_DAY;
        
        taskManager.createTask{value: STAKE_AMOUNT}("Complete Solidity study", deadline, 1);

        TaskManager.Task memory task = taskManager.getTask(0);
        assertEq(task.owner, user);
        assertEq(task.stakeAmount, STAKE_AMOUNT);
        assertEq(task.deadline, deadline);
        assertEq(uint(task.status), uint(TaskManager.TaskStatus.Pending));
    }

    function test_CreateTask_RevertIfNoStake() public {
        vm.prank(user);
        uint256 deadline = block.timestamp + ONE_DAY;
        
        vm.expectRevert("Stake required");
        taskManager.createTask{value: 0}("No stake task", deadline, 1);
    }

    function test_CreateTask_RevertIfPastDeadline() public {
        vm.prank(user);
        
        vm.expectRevert("Deadline must be future");
        taskManager.createTask{value: STAKE_AMOUNT}("Expired task", block.timestamp - 1, 1);
    }

    // ============ 验证任务测试 ============

    function test_SubmitProof_Success() public {
        // 创建任务
        vm.prank(user);
        taskManager.createTask{value: STAKE_AMOUNT}("Test task", block.timestamp + ONE_DAY, 1);

        // 提交验证成功
        taskManager.submitProof(0, true);

        TaskManager.Task memory task = taskManager.getTask(0);
        assertEq(uint(task.status), uint(TaskManager.TaskStatus.Verified));
    }

    function test_SubmitProof_Fail() public {
        vm.prank(user);
        taskManager.createTask{value: STAKE_AMOUNT}("Test task", block.timestamp + ONE_DAY, 1);

        taskManager.submitProof(0, false);

        TaskManager.Task memory task = taskManager.getTask(0);
        assertEq(uint(task.status), uint(TaskManager.TaskStatus.Failed));
    }

    // ============ 退款测试 ============

    function test_ClaimRefund_Success() public {
        vm.prank(user);
        taskManager.createTask{value: STAKE_AMOUNT}("Test task", block.timestamp + ONE_DAY, 1);

        taskManager.submitProof(0, true);

        uint256 balanceBefore = user.balance;
        
        vm.prank(user);
        taskManager.claimRefund(0);

        assertEq(user.balance, balanceBefore + STAKE_AMOUNT);
        
        TaskManager.Task memory task = taskManager.getTask(0);
        assertEq(uint(task.status), uint(TaskManager.TaskStatus.Settled));
    }

    function test_ClaimRefund_RevertIfNotVerified() public {
        vm.prank(user);
        taskManager.createTask{value: STAKE_AMOUNT}("Test task", block.timestamp + ONE_DAY, 1);

        vm.prank(user);
        vm.expectRevert("Not verified");
        taskManager.claimRefund(0);
    }

    // ============ 结算测试 ============

    function test_Settle_BurnsStakeAfterDeadline() public {
        vm.prank(user);
        taskManager.createTask{value: STAKE_AMOUNT}("Test task", block.timestamp + ONE_DAY, 1);

        // 时间快进超过截止时间
        vm.warp(block.timestamp + ONE_DAY + 1);

        // 结算任务 (资金应被销毁)
        taskManager.settle(0);

        TaskManager.Task memory task = taskManager.getTask(0);
        assertEq(uint(task.status), uint(TaskManager.TaskStatus.Settled));
        assertEq(task.stakeAmount, 0);
    }

    function test_Settle_RevertIfNotExpired() public {
        vm.prank(user);
        taskManager.createTask{value: STAKE_AMOUNT}("Test task", block.timestamp + ONE_DAY, 1);

        vm.expectRevert("Not expired");
        taskManager.settle(0);
    }

    // ============ 用户任务列表测试 ============

    function test_GetUserTasks() public {
        vm.startPrank(user);
        taskManager.createTask{value: STAKE_AMOUNT}("Task 1", block.timestamp + ONE_DAY, 1);
        taskManager.createTask{value: STAKE_AMOUNT}("Task 2", block.timestamp + ONE_DAY, 2);
        vm.stopPrank();

        uint256[] memory userTaskIds = taskManager.getUserTasks(user);
        assertEq(userTaskIds.length, 2);
        assertEq(userTaskIds[0], 0);
        assertEq(userTaskIds[1], 1);
    }
}
