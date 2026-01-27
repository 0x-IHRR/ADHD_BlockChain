# FocusFlow 黑客松项目深度指南

本文档旨在为黑客松路演及团队内部提供一份详尽的项目技术手册。涵盖项目介绍、技术栈解析、从零部署教程以及针对 **SPOONOS** 的深度技术剖析。

---

# 1. 项目介绍与技术栈

## (a) 技术栈全景

FocusFlow 采用前沿的 **Web3 + AI + Mobile** 混合架构，旨在解决 ADHD 群体专注力缺失的问题。

### 核心技术栈
| 领域 | 技术选型 | 说明 |
|:---|:---|:---|
| **前端 (Mobile/Web)** | **React Native (Expo)** | 一套代码同时构建 iOS, Android 和 Web (SPA)。提供原生级体验与快速迭代能力。 |
| **状态管理** | **React Context + Hooks** | 轻量级状态管理 (WalletContext, ThemeContext)，实现主题切换与钱包连接。 |
| **样式系统** | **NativeWind (Tailwind CSS)** | 为 React Native 定制的原子化 CSS 引擎，支持 Dark/Light 模式与动态主题。 |
| **智能合约** | **Solidity (Foundry)** | 用于编写链上专注力协议 (FocusProtocol)。Foundry 提供极速的编译与测试环境。   |
| **AI 引擎** | **Python (FastAPI) + SPOONOS** | 基于 SPOONOS 框架构建的智能体系统，负责任务拆解与结果验证。 |

### 关键库与工具
- **ethers.js**: 前端与区块链交互的桥梁，处理钱包连接与合约调用。
- **lucide-react-native**: 现代化的跨平台图标库。
- **Expo Router**: 基于文件系统的路由管理 (类似 Next.js)。
- **SPOONOS SDK**: 用于构建多智能体协作系统的核心框架。

## (b) 功能与愿景：我们解决了什么？

**背景**: ADHD (注意力缺陷多动障碍) 群体常因多巴胺调节异常而难以维持长期专注。单纯的 To-Do List 无法提供足够的刺激。

**解决方案**: FocusFlow 是一个 **"专注力对赌协议"**。
1.  **AI 拆解 (Lower Barrier)**: 用户输入模糊目标（如“做完作业”），AI 自动将其拆解为 3 个微步骤，降低启动门槛。
2.  **加密质押 (Loss Aversion)**: 用户必须质押少量 ETH。如果任务未完成，质押金将被捐赠或通过 **"Burn (销毁)"** 机制移除。
3.  **多巴胺反馈 (Variable Reward)**: 只有上传证明并通过 AI 智能体验证，才能取回质押金并获得 NFT/积分奖励。

**最终效果**:
一个结合了 **金融强约束 (Web3)** 与 **智能辅助 (AI)** 的生产力工具，让“专注”本身变成一种可量化的资产。

---

# 2. 本地部署教程：从零开始

## (a) 环境准备

在开始之前，请确保您的开发环境已安装以下工具：

1.  **Node.js (LTS)**: 用于运行前端环境。
    *   *安装*: `brew install node` (Mac) 或官网下载。
    *   *验证*: `node -v` (应 > v18)。
2.  **Python 3.10+**: 用于运行 AI 引擎。
    *   *安装*: `brew install python`。
3.  **Foundry**: 用于智能合约开发。
    *   *安装*: `curl -L https://foundry.paradigm.xyz | bash`，然后运行 `foundryup`。
4.  **Git**: 版本控制。

## (b) 部署流程

### 第一步：克隆项目
```bash
git clone https://github.com/0x-IHRR/ADHD_BlockChain.git
cd ADHD_BlockChain
```

### 第二步：启动前端 (App)
前端基于 Expo，支持 Web 和模拟器运行。

```bash
cd app
# 1. 安装依赖
npm install

# 2. 启动开发服务器
npm start
```
*   按 `w` 开启网页版 (http://localhost:8081)。
*   按 `i` 开启 iOS 模拟器 (需安装 Xcode)。

### 第三步：启动 AI 引擎 (Backend)
AI 服务负责任务拆解与验证。

```bash
# 打开新终端，回到根目录
cd ai_engine

# 1. 创建虚拟环境 (推荐)
python3 -m venv venv
source venv/bin/activate  # Mac/Linux

# 2. 安装依赖
pip install -r requirements.txt

# 3. 配置环境变量
cp .env.example .env
# (编辑 .env 填入您的 OpenAI/Gemini API Key)

# 4. 启动服务
python api.py
```
服务将在 `http://localhost:8000` 启动。

### 第四步：部署合约 (可选)
如果是纯前端演示，可暂时跳过此步。若需链上交互：

```bash
cd contracts
forge build
forge test
```

## (c) 手动测试指南

为了确保演示顺利，请按以下路径进行自测：

1.  **UI/UX 冒烟测试**:
    *   打开网页版 (`w`)。
    *   点击右上角 `EN/中` 切换语言，确认界面无乱码。
    *   点击 `Palette` 🎨 图标，循环切换 4 种主题色，确认按钮和背景颜色随动。
    *   点击 `Connect`，确认显示模拟钱包地址。
2.  **业务流程测试**:
    *   点击底部 `+`，输入 "Learn Rust"。
    *   **关键点**: 确保 `ai_engine` 已启动，点击 ✨ 按钮。如果返回了具体的步骤建议，说明 **前后端联调成功**。
    *   输入金额，点击 "确认并质押"。
    *   跳转回首页，点击新生成的任务卡片。
    *   确认详情页状态为 `Pending`，且能看到任务详情。

---

# 3. 技术深度解析：SPOONOS 与黑客松

在黑客松的路演中，评委通常关注“核心创新点”和“技术架构”。以下是关于我们底层架构的深度解读。

## (a) 架构概览

FocusFlow 并非传统的 Client-Server 架构，它是 **Client - Agent - Blockchain** 的三角架构。

1.  **Client (前端)**: 极简的交互层，只负责展示和签名。
2.  **Blockchain (合约)**: 信任层。资金托管、裁判逻辑全部上链，不可篡改。
3.  **SPOONOS Agents (智能体层)**: 这是一个 **"Off-chain Compute, On-chain Verify" (链下计算，链上验证)** 的中间层。

## (b) 什么是 SPOONOS？

SPOONOS 是我们采用的 **“勺子操作系统” (Spoon OS)** —— 一个专为构建 **多智能体协作系统 (Multi-Agent Systems)** 设计的轻量级框架。

在本项目中，SPOONOS 不仅仅是一个后端框架，它是 **ADHD 用户的“数字外脑” (Digital Exocortex)**。

### SPOONOS 在本项目中的应用：

我们基于 SPOONOS 构建了两个核心 Agent：

1.  **BreakdownAgent (拆解官)**:
    *   *角色*: 认知脚手架。
    *   *能力*: 接收模糊指令，利用 LLM 进行思维链 (CoT) 推理，输出结构化的 JSON 任务树。
    *   *技术点*: Prompt Engineering, Context Management。
2.  **VerifierAgent (审计官)**:
    *   *角色*: 链上预言机 (Oracle)。
    *   *能力*: 分析用户上传的图片/文本证明，结合多模态大模型 (Verified Vision) 判断任务完成度。
    *   *技术点*: Multimodal Analysis, Deterministic Output。

## (c) 核心价值：为什么选择 SPOONOS？

在黑客松中，强调以下三点优势：

1.  **模块化 (Modularity)**: SPOONOS 将复杂的 AI 逻辑封装为独立的 "Spoon" (Agent 单元)。我们可以轻松插拔不同的 Agent（例如换一个更严格的“审计官”），而无需重构整个系统。
2.  **标准化 (Standardization)**: 它为 AI 与区块链的交互制定了标准接口。前端不需要知道背后是 GPT-4 还是 Claude，只需要调用统一的 `Spoon.call()` 接口。
3.  **可扩展性 (Scalability)**: 未来我们可以引入 **"Social Agent" (社交智能体)** 负责监督好友，或者 **"Finance Agent" (理财智能体)** 负责管理质押金。SPOONOS 的架构天然支持这种多智能体协作。

**总结话术 (Pitch)**:
> "Most To-Do apps are static lists. FocusFlow is dynamic. By leveraging **SPOONOS**, we transformed a simple task manager into an **Autonomous Productivity Protocol**. We are not just building an app; we are building an operating system for human attention."

---

*文档生成时间: 2026-01-27 | FocusFlow Team*
