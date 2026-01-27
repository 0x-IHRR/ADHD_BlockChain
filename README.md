# FocusFlow - Put Your Money Where Your Mind Is 💰🧠

> **赌注驱动的专注力应用** - 用经济激励对抗拖延症

[![Foundry](https://img.shields.io/badge/Built%20with-Foundry-FFDB1C.svg)](https://getfoundry.sh/)
[![Expo](https://img.shields.io/badge/Built%20with-Expo-000020.svg)](https://expo.dev/)
[![SpoonOS](https://img.shields.io/badge/AI-SpoonOS-6366F1.svg)](https://github.com/spoon-ai/spoon-core)

## 🎯 核心理念

**问题**: ADHD 患者和拖延症人群难以完成任务，传统 TODO 应用缺乏"后果"。

**解决方案**: 将真金白银质押到智能合约，AI 验证任务完成度，失败则失去质押！

```
创建任务 → 质押 ETH → AI 拆解子任务 → 完成后提交证明 → AI 验证 → 通过则退款 / 失败则销毁
```

## 🏗️ 技术架构

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (Expo RN)                     │
│  HomeScreen │ CreateTaskScreen │ TaskDetailScreen           │
└──────────────────────────┬──────────────────────────────────┘
                           │
           ┌───────────────┴───────────────┐
           ▼                               ▼
┌─────────────────────┐         ┌─────────────────────┐
│   AI Engine (Py)    │         │  Smart Contracts    │
│  ┌───────────────┐  │         │  ┌───────────────┐  │
│  │BreakdownAgent│  │         │  │ TaskManager   │  │
│  │  (任务拆解)   │  │         │  │   (核心合约)   │  │
│  └───────────────┘  │         │  └───────────────┘  │
│  ┌───────────────┐  │         │  ┌───────────────┐  │
│  │ VerifyAgent   │  │         │  │ IVerifier     │  │
│  │  (验证完成)   │  │         │  │ IPenalty      │  │
│  └───────────────┘  │         │  └───────────────┘  │
└─────────────────────┘         └─────────────────────┘
```

## 🚀 快速开始

### 1. 环境准备

```bash
# 安装依赖
npm install

# 配置环境变量
cp ai_engine/.env.example ai_engine/.env
# 编辑 .env 填入 API Key
```

### 2. 启动服务

```bash
# 终端 1: 启动本地区块链
npm run chain:start

# 终端 2: 部署合约
npm run contracts:deploy

# 终端 3: 启动 AI Engine
npm run ai:start

# 终端 4: 启动前端
npm run app:start
```

### 3. 运行 E2E 测试

```bash
cd contracts
forge script script/DeployAndTest.s.sol --rpc-url http://127.0.0.1:8545 --broadcast --private-key <ANVIL_KEY>
```

## 📁 项目结构

```
ADHD_APP/
├── contracts/              # Solidity 智能合约 (Foundry)
│   ├── src/
│   │   ├── TaskManager.sol         # 核心任务管理
│   │   ├── interfaces/             # IVerifier, IPenaltyStrategy
│   │   ├── verifiers/              # SimpleAIVerifier
│   │   └── strategies/             # BurnPenalty
│   └── test/                       # 单元测试 (10/10 通过)
│
├── ai_engine/              # Python AI Agent (SpoonOS)
│   ├── agents/
│   │   ├── breakdown_agent.py      # 任务拆解
│   │   └── verify_agent.py         # 完成验证
│   └── api.py                      # FastAPI HTTP 服务
│
└── app/                    # React Native 前端 (Expo)
    ├── screens/                    # UI 页面
    └── services/                   # API/合约/钱包服务
```

## 🧪 测试结果

```
Running 12 tests...
✅ test_CreateTask_Success
✅ test_CreateTask_RevertIfNoStake
✅ test_CreateTask_RevertIfPastDeadline
✅ test_SubmitProof_Success
✅ test_SubmitProof_Fail
✅ test_ClaimRefund_Success
✅ test_ClaimRefund_RevertIfNotVerified
✅ test_Settle_BurnsStakeAfterDeadline
✅ test_Settle_RevertIfNotExpired
✅ test_GetUserTasks
✅ testFuzz_SetNumber
✅ test_Increment

Result: 12 passed, 0 failed
```

## 🎬 Demo 脚本

1. **创建任务**: 用户输入 "完成 Python 教程第一章"，质押 0.1 ETH
2. **AI 拆解**: 自动生成 4 个子任务，每个 15-20 分钟
3. **完成工作**: 用户学习并完成子任务
4. **提交证明**: 用户描述完成情况，可附图片
5. **AI 验证**: 返回 verified: true, confidence: 0.95
6. **领取退款**: 0.1 ETH 退回钱包

## 🔮 未来扩展

- [ ] DAO 投票验证（取代纯 AI）
- [ ] 社交惩罚（失败发推特认怂）
- [ ] 积分奖励系统
- [ ] 多链部署（Base, Arbitrum）

## 📄 License

MIT
