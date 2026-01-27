# Requirements Document: FocusFlow 黑客松版

## Introduction

FocusFlow (Hard Mode) 是一款 Web3 原生的 ADHD 执行力工具。它利用区块链的金融质押机制，将"任务完成"与"真金白银"挂钩，迫使用户在"损失厌恶"心理驱动下完成任务。同时借助 AI Agent (SpoonOS) 进行任务拆解和完成度验证。

**核心 Slogan**: "Put Your Money Where Your Mind Is."

## Alignment with Product Vision

本项目是为 SpoonOS 黑客松设计的 Demo 原型，核心目标：
1.  **验证对赌机制 (Staking for Commitment)** 的可行性与用户心理影响。
2.  **展示 SpoonOS Agent Framework 的能力**，特别是 Graph Agent 在多步骤任务验证中的应用。
3.  **产出一个可演示的 MVP**，包含前端交互、智能合约和 AI 裁判。

---

## Requirements

### Requirement 1: 任务质押 (Staking)

**User Story:** 作为一个 ADHD 患者/拖延症患者，我希望能在创建任务时质押一定金额的 Token，以便迫使自己在截止时间前完成任务。

#### Acceptance Criteria

1.  WHEN 用户创建任务并设置截止时间 THEN 系统 SHALL 提示用户输入质押金额。
2.  WHEN 用户确认质押 THEN 系统 SHALL 调用智能合约锁定用户资金。
3.  IF 质押成功 THEN 系统 SHALL 在界面上显示任务倒计时及已锁定金额。
4.  IF 用户钱包余额不足 THEN 系统 SHALL 拒绝创建任务并提示。

### Requirement 2: AI 任务拆解 (Magic Breakdown)

**User Story:** 作为一个难以启动复杂任务的用户，我希望 AI 能帮我将一个大任务自动拆解成小步骤，以便降低我的认知负担和启动阻力。

#### Acceptance Criteria

1.  WHEN 用户输入一个任务描述（如"准备面试"）THEN 系统 SHALL 调用 SpoonOS Agent 进行拆解。
2.  THEN Agent SHALL 返回一个包含多个子任务（带时间建议）的列表。
3.  IF 用户对拆解结果不满意 THEN 用户 SHALL 能够请求重新拆解或手动编辑。

### Requirement 3: AI 验证任务完成 (AI Referee)

**User Story:** 作为一个准备提交已完成任务的用户，我希望 AI 能作为"裁判"来验证我的任务是否真的完成了，以便公正地决定我的质押资金去向。

#### Acceptance Criteria

1.  WHEN 用户点击"提交完成证明" THEN 系统 SHALL 允许用户上传截图或输入文字描述。
2.  THEN 系统 SHALL 将证明内容发送给 SpoonOS Graph Agent。
3.  THEN Agent SHALL 返回一个 `verified: true/false` 结果。
4.  IF `verified: true` THEN 系统 SHALL 调用合约退还质押资金。
5.  IF `verified: false` THEN 系统 SHALL 显示"验证失败"提示，用户可再次尝试或等待截止。

### Requirement 4: 结算 (Settlement)

**User Story:** 作为一个逾期未完成任务的用户或成功完成任务的用户，我希望系统能自动处理我的质押资金。

#### Acceptance Criteria

1.  IF 截止时间到达且任务未验证通过 THEN 合约 SHALL 将质押资金转入"惩罚池"或销毁。
2.  IF 截止时间到达且任务已验证通过 THEN 合约 SHALL 将质押资金退还给用户并可选地发放 NFT 勋章。
3.  WHEN 结算发生 THEN 系统 SHALL 在界面上显示最终状态（成功/失败）及金额变化。

---

## Non-Functional Requirements

### Code Architecture and Modularity
- **Monorepo 结构**: 严格遵循 `/contracts`, `/ai_engine`, `/app` 的职责划分。
- **Clean Interfaces**: 前端通过 Wagmi/Viem 调用合约；通过 HTTP/stdio 调用 SpoonOS。

### Performance
- AI 拆解响应时间应小于 5 秒。
- 合约交互确认应在 15 秒内（取决于链）。

### Security
- 智能合约必须通过基本的 Reentrancy Guard。
- AI Agent 不应持有用户私钥（用户自行签名）。

### Reliability
- 如果 AI 服务暂时不可用，任务仍可手动标记完成。

### Usability
- 界面应极简，核心流程（创建任务-质押-验证-结算）点击不超过 5 步。
- 使用类似深色主题的视觉风格，倒计时时界面应有紧迫感反馈（如颜色变红）。
