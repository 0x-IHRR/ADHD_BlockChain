// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {TaskManager} from "../src/TaskManager.sol";
import {SimpleAIVerifier} from "../src/verifiers/SimpleAIVerifier.sol";
import {BurnPenalty} from "../src/strategies/BurnPenalty.sol";
import {AchievementNFT} from "../src/AchievementNFT.sol";
import {PetManager} from "../src/PetManager.sol";

/**
 * @title Deploy
 * @notice 完整部署脚本 - 包含 TaskManager + AchievementNFT + PetManager
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
        
        // 部署主合约 (先使用 address(0) 作为 PetManager 占位)
        TaskManager taskManager = new TaskManager(
            address(verifier), 
            address(penaltyStrategy),
            msg.sender,  // Oracle (授权验证者)
            msg.sender,  // Treasury (资金库)
            address(0)   // PetManager 占位
        );
        
        // 部署 PetManager (需要 TaskManager 地址和 Jackpot 地址)
        PetManager petManager = new PetManager(
            address(taskManager),
            payable(address(taskManager))  // 复活费进入 TaskManager (Jackpot)
        );
        
        // 设置双向引用
        achievementNFT.setTaskManager(address(taskManager));
        taskManager.setAchievementNFT(address(achievementNFT));
        taskManager.setPetManager(address(petManager));
        
        vm.stopBroadcast();

        console.log("\n=== Deployed Contracts ===");
        console.log("  TaskManager:", address(taskManager));
        console.log("  Verifier:", address(verifier));
        console.log("  PenaltyStrategy:", address(penaltyStrategy));
        console.log("  AchievementNFT:", address(achievementNFT));
        console.log("  PetManager:", address(petManager));
        console.log("  Oracle:", msg.sender);
        console.log("  Treasury:", msg.sender);
        
        console.log("\n=== Environment Variables ===");
        console.log("  EXPO_PUBLIC_CONTRACT_ADDRESS=", address(taskManager));
        console.log("  EXPO_PUBLIC_ACHIEVEMENT_NFT_ADDRESS=", address(achievementNFT));
        console.log("  EXPO_PUBLIC_PET_MANAGER_ADDRESS=", address(petManager));
        console.log("  RPC_URL=http://localhost:8545");
    }
}
