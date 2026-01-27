# Tasks Document: FocusFlow 黑客松版

## Phase 1: 智能合约层 (`/contracts`)

- [x] 1. 创建核心接口
  - File: `contracts/src/interfaces/IVerifier.sol`
  - File: `contracts/src/interfaces/IPenaltyStrategy.sol`
  - File: `contracts/src/interfaces/IRewardStrategy.sol` (额外添加)
  - 定义 `verify()` 和 `execute()` 方法签名
  - Purpose: 建立可扩展的验证和惩罚策略接口
  - _Requirements: Req-3, Req-4_

- [x] 2. 实现 TaskManager 主合约
  - File: `contracts/src/TaskManager.sol`
  - 实现 `createTask`, `submitProof`, `settle`, `claimRefund` 方法
  - 包含 Task 结构体和状态枚举
  - Purpose: 核心任务生命周期管理
  - _Requirements: Req-1, Req-4_

- [x] 3. 实现 MVP 验证器
  - File: `contracts/src/verifiers/SimpleAIVerifier.sol`
  - 实现 `IVerifier` 接口
  - MVP 版本：仅记录 AI 结果（信任调用者）
  - Purpose: 简单验证逻辑，后续可升级
  - _Requirements: Req-3_

- [x] 4. 实现 MVP 惩罚策略
  - File: `contracts/src/strategies/BurnPenalty.sol`
  - 实现 `IPenaltyStrategy` 接口
  - 失败时将资金发送至 `address(0xdead)` (销毁)
  - Purpose: 简单惩罚逻辑，后续可升级
  - _Requirements: Req-4_

- [x] 5. 编写合约单元测试
  - File: `contracts/test/TaskManager.t.sol`
  - 测试创建任务、质押、验证、结算流程
  - 使用 Foundry cheatcodes (`vm.warp`, `vm.prank`)
  - Purpose: 确保合约逻辑正确
  - _Requirements: All_

---

## Phase 2: AI Agent 层 (`/ai_engine`)

- [x] 6. 创建 BreakdownAgent (React Agent)
  - File: `ai_engine/agents/breakdown_agent.py`
  - 配置 LLM Provider 和 System Prompt
  - 输入任务描述，输出子任务列表 JSON
  - Purpose: 任务拆解功能
  - _Requirements: Req-2_

- [x] 7. 创建 VerifyAgent (Graph Agent)
  - File: `ai_engine/agents/verify_agent.py`
  - 定义 Graph 节点：Input → (Vision) → Decision → Output
  - 返回 `{ verified: bool, reason: string }`
  - Purpose: AI 验证任务完成度
  - _Requirements: Req-3_

- [x] 8. 创建 HTTP API 接口
  - File: `ai_engine/api.py`
  - 暴露 `/breakdown` 和 `/verify` 两个 POST 接口
  - 供前端调用
  - Purpose: 提供 RESTful API 层
  - _Requirements: Req-2, Req-3_

---

## Phase 3: 前端层 (`/app`)

- [x] 9. 创建核心 Screens
  - File: `app/screens/HomeScreen.tsx`
  - File: `app/screens/CreateTaskScreen.tsx`
  - File: `app/screens/TaskDetailScreen.tsx`
  - 基础 UI 布局和导航
  - Purpose: 搭建前端页面骨架
  - _Requirements: All_

- [x] 10. 实现钱包连接服务
  - File: `app/services/wallet.service.ts`
  - 模拟钱包连接（MVP）
  - 支持 MetaMask 等钱包 (预留)
  - Purpose: 用户钱包连接
  - _Requirements: Req-1_

- [x] 11. 实现合约交互服务
  - File: `app/services/contract.service.ts`
  - 封装 ABI 和工具函数
  - 处理交易状态和错误
  - Purpose: 前端与合约交互
  - _Requirements: Req-1, Req-4_

- [x] 12. 实现 AI 服务
  - File: `app/services/ai.service.ts`
  - 封装对 `/breakdown` 和 `/verify` 的 HTTP 调用
  - Purpose: 前端与 AI Engine 交互
  - _Requirements: Req-2, Req-3_

---

## Phase 4: 集成与测试

- [x] 13. 端到端流程测试
  - 使用本地 Anvil 链 + 模拟前端
  - 验证完整流程：创建 → 质押 → 拆解 → 验证 → 结算
  - Purpose: 确保系统协作正常
  - _Requirements: All_

- [x] 14. Demo 准备与文档
  - 准备 Demo Day 演示脚本
  - 撰写 README 使用说明
  - Purpose: 黑客松交付物
  - _Requirements: All_
