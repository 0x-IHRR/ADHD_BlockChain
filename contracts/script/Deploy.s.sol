// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {TaskManager} from "../src/TaskManager.sol";
import {SimpleAIVerifier} from "../src/verifiers/SimpleAIVerifier.sol";
import {BurnPenalty} from "../src/strategies/BurnPenalty.sol";

/**
 * @title Deploy
 * @notice 简化部署脚本 - 仅部署合约并设置 Oracle
 * @dev 运行: forge script script/Deploy.s.sol --rpc-url http://localhost:8545 --broadcast --private-key <KEY>
 */
contract Deploy is Script {
    function run() external {
        console.log("=== FocusFlow Deployment ===");
        
        vm.startBroadcast();

        // 部署依赖合约
        SimpleAIVerifier verifier = new SimpleAIVerifier(msg.sender);
        BurnPenalty penaltyStrategy = new BurnPenalty();
        
        // 部署主合约
        TaskManager taskManager = new TaskManager(address(verifier), address(penaltyStrategy));
        
        // 设置 Oracle (部署者作为 Oracle)
        taskManager.setAuthorizedVerifier(msg.sender);
        
        // 设置 Treasury (部署者接收平台费)
        taskManager.setTreasury(msg.sender);
        
        vm.stopBroadcast();

        console.log("\n=== Deployed Contracts ===");
        console.log("  TaskManager:", address(taskManager));
        console.log("  Verifier:", address(verifier));
        console.log("  PenaltyStrategy:", address(penaltyStrategy));
        console.log("  Oracle:", msg.sender);
        console.log("  Treasury:", msg.sender);
        
        console.log("\n=== Environment Variables ===");
        console.log("  CONTRACT_ADDRESS=", address(taskManager));
        console.log("  RPC_URL=http://localhost:8545");
    }
}
