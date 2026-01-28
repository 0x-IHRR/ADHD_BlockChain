// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {TaskManager} from "../src/TaskManager.sol";
import {SimpleAIVerifier} from "../src/verifiers/SimpleAIVerifier.sol";
import {BurnPenalty} from "../src/strategies/BurnPenalty.sol";
import {AchievementNFT} from "../src/AchievementNFT.sol";

/**
 * @title Deploy
 * @notice 完整部署脚本 - 包含 TaskManager + AchievementNFT
 * @dev 运行: forge script script/Deploy.s.sol --rpc-url http://localhost:8545 --broadcast --private-key <KEY>
 */
contract Deploy is Script {
    function run() external {
        console.log("=== FocusFlow Deployment ===");
        
        vm.startBroadcast();

        // 部署依赖合约
        SimpleAIVerifier verifier = new SimpleAIVerifier(msg.sender);
        BurnPenalty penaltyStrategy = new BurnPenalty();
        
        // 部署 AchievementNFT
        AchievementNFT achievementNFT = new AchievementNFT();
        
        // 部署主合约 (构造函数包含 oracle, treasury, petManager)
        TaskManager taskManager = new TaskManager(
            address(verifier), 
            address(penaltyStrategy),
            msg.sender,  // Oracle
            msg.sender,  // Treasury
            address(0)   // PetManager (deploy separately if needed)
        );
        
        // 设置双向引用
        achievementNFT.setTaskManager(address(taskManager));
        taskManager.setAchievementNFT(address(achievementNFT));
        
        vm.stopBroadcast();

        console.log("\n=== Deployed Contracts ===");
        console.log("  TaskManager:", address(taskManager));
        console.log("  Verifier:", address(verifier));
        console.log("  PenaltyStrategy:", address(penaltyStrategy));
        console.log("  AchievementNFT:", address(achievementNFT));
        console.log("  Oracle:", msg.sender);
        console.log("  Treasury:", msg.sender);
        
        console.log("\n=== Environment Variables ===");
        console.log("  CONTRACT_ADDRESS=", address(taskManager));
        console.log("  ACHIEVEMENT_NFT_ADDRESS=", address(achievementNFT));
        console.log("  RPC_URL=http://localhost:8545");
    }
}
