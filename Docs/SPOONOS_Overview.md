# SPOONOS 框架技术深度总结

SPOONOS 是一个专为 AI Agent 开发设计的高性能、模块化框架，特别强调对多模态输入、状态流转（Graph）以及 MCP（Model Context Protocol）协议的原生支持。

## 1. 核心架构设计理念

SPOONOS 采用了“微内核 + 插件式”的设计方案：
- **核心层（Core）**：处理基础的消息路由、多模态数据序列化和 Provider 抽象。
- **Agent 层**：提供了 `BaseAgent`、`ToolCallAgent` (ReAct) 和 `SpoonGraph` 三种核心形态。
- **能力层（Tooling）**：原生支持 MCP 协议，可无缝对接任何符合 MCP 标准的外部工具。

## 2. 关键组件与功能特点

### 2.1 多模态消息系统 (Message System)
- **跨平台兼容**：自动处理 OpenAI、Anthropic、Gemini 之间不同的消息格式。
- **内置 Vision 支持**：支持 Base64、外部 URL 和本地文件（PDF/Image）的自动转换与上传。
- **超时与清理**：内置请求级别的临时文件清理和超时分级升级机制。

### 2.2 LLM 提供商管理 (LLM Provider System)
- **弹性扩展**：通过 `LLMManager` 实现多 Provider 的编排与故障切换。
- **响应标准化**：无论后端是哪种模型，统一输出标准化的 JSON 结构。

### 2.3 代理体系 (Agent Framework)
- **React Agent (ToolCallAgent)**：基于“思考-行动-观察”闭环。支持挂载多个工具（Tools），并能自动处理工具调用的循环直到任务完成。
- **Graph Agent (SpoonGraph)**：支持复杂的非线性工作流。开发者可以通过节点（Node）和边（Edge）定义状态机，非常适合需要分阶段决策和人工干预（Human-in-the-loop）的任务。

---

## 3. 快速上手指南 (Quick Start)

### 3.1 环境初始化
```typescript
import { LLMManager, OpenAIProvider } from '@xspoon/spoon-core';

const manager = new LLMManager();
manager.registerProvider(new OpenAIProvider({ apiKey: 'sk-...' }));
```

### 3.2 实现一个 React Agent
```typescript
import { ToolCallAgent, CalculatorTool } from '@xspoon/spoon-core';

const agent = new ToolCallAgent({
    provider: 'openai',
    tools: [new CalculatorTool()]
});

const response = await agent.run("计算 1234 * 5678 的结果");
```

### 3.3 实现一个 Graph Agent
```typescript
const graph = new SpoonGraph();
graph.addNode("planning", async (state) => { ... });
graph.addNode("execution", async (state) => { ... });
graph.addEdge("planning", "execution");

await graph.execute({ input: "开始黑客松项目" });
```

---

## 4. 黑客松 (Hackathon) 优势体现

- **集成 MCP**：可以直接调用 `context7`、`exa` 等 MCP 服务而无需重复写爬虫。
- **脚手架友好**：`spoon-starter` 提供了可以直接运行的 Demo 模板，节省环境搭建时间。
- **状态持久化**：内置 Checkpoint 机制，Agent 运行到一半断电/断网后可从断点恢复状态。

## 5. 开发者建议
- **简单任务**：直接用 `ToolCallAgent`（ReAct 模式）。
- **复杂业务流**：使用 `SpoonGraph`，它比序列化的 Prompt 更能保证逻辑结果的可预测性。
