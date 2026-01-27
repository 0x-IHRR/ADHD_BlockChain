// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {TaskManager} from "../src/TaskManager.sol";
import {SimpleAIVerifier} from "../src/verifiers/SimpleAIVerifier.sol";
import {BurnPenalty} from "../src/strategies/BurnPenalty.sol";

/**
 * @title DeployAndTest
 * @notice 端到端部署和测试脚本
 * @dev 运行: forge script script/DeployAndTest.s.sol --rpc-url anvil --broadcast
 */
contract DeployAndTest is Script {
    TaskManager public taskManager;
    SimpleAIVerifier public verifier;
    BurnPenalty public penaltyStrategy;

    function run() external {
        // 使用命令行传入的私钥 (通过 --private-key 参数)
        console.log("=== FocusFlow E2E Test ===");
        
        vm.startBroadcast();

        // Step 1: 部署合约
        console.log("\n[1] Deploying contracts...");
        verifier = new SimpleAIVerifier(msg.sender);
        penaltyStrategy = new BurnPenalty();
        taskManager = new TaskManager(address(verifier), address(penaltyStrategy));
        
        console.log("  - Verifier:", address(verifier));
        console.log("  - PenaltyStrategy:", address(penaltyStrategy));
        console.log("  - TaskManager:", address(taskManager));
        
        // Step 1.5: 设置 Oracle 授权验证者 (部署者地址)
        console.log("\n[1.5] Setting authorized Oracle verifier...");
        taskManager.setAuthorizedVerifier(msg.sender);
        console.log("  - Oracle set to:", msg.sender);

        // Step 2: 创建任务并质押
        console.log("\n[2] Creating task with 0.1 ETH stake...");
        uint256 deadline = block.timestamp + 86400; // 24 hours
        taskManager.createTask{value: 0.1 ether}("Complete Solidity tutorial", deadline, 2);
        console.log("  - Task #0 created");

        // Step 3: 验证任务 (现在 msg.sender 是授权的 Oracle)
        console.log("\n[3] Submitting verification proof (success)...");
        taskManager.submitProof(0, true);
        console.log("  - Task #0 verified");

        // Step 4: 领取退款
        console.log("\n[4] Claiming refund...");
        taskManager.claimRefund(0);
        console.log("  - Refund claimed successfully");

        // Step 5: 创建另一个任务测试失败场景
        console.log("\n[5] Creating another task for failure test...");
        taskManager.createTask{value: 0.05 ether}("Task that will fail", block.timestamp + 1, 1);
        console.log("  - Task #1 created (deadline: 1 second)");

        vm.stopBroadcast();

        console.log("\n=== E2E Test Complete ===");
        console.log("To test settle (burn), wait for deadline and call:");
        console.log("  cast send <TaskManager> 'settle(uint256)' 1 --rpc-url anvil");
    }
}
