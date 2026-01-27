# FocusFlow 架构图集 (基于现状代码)

> **⚠️ 警告**: 以下图表真实反映了当前代码 (`commit: feat: setup Vercel...`) 的实现逻辑。
> **发现偏差**: 当前实现与理想架构存在显著差异，特别是在安全性方面（用户充当了 Oracle 的中继者，且合约未做权限检查）。

## 1. 智能合约层逻辑流程 (实际现状)

```mermaid
sequenceDiagram
    participant User as 用户 (Frontend)
    participant API as AI 后端 (Python API)
    participant Contract as 智能合约 (FocusProtocol)
    
    Note over User, Contract: 阶段 1: 创建任务
    User->>Contract: createTask(description, eth_amount)
    Contract-->>User: TaskCreated Event (ID: 1)
    
    Note over User, API: 阶段 2: 验证任务 (链下)
    User->>API: POST /verify (text/image)
    API-->>User: { verified: true/false, signature: N/A }
    Note right of User: 前端收到 JSON 结果
    
    Note over User, Contract: 阶段 3: 提交结果 (链上)
    alt 前端判断 AI 返回了 true
        User->>Contract: submitProof(taskId, true)
        Note right of Contract: ⚠️ 严重风险: 合约未检查 msg.sender\n任何人(包括用户)都可以调用此函数
        Contract->>Contract: TaskStatus -> Verified
    else 前端判断 AI 返回了 false
        User->>Contract: submitProof(taskId, false)
        Contract->>Contract: TaskStatus -> Failed
    end
    
    Note over User, Contract: 阶段 4: 如果成功则退款
    User->>Contract: claimRefund(taskId)
    Contract-->>User: Transfer ETH
```

## 2. 全系统分层架构图 (实际现状)

```mermaid
graph TD
    subgraph "Local Execution (User Device)"
        FE[React Native App]
        Wallet[Wallet (Signer)]
    end

    subgraph "Backend Services (Off-chain)"
        API[Python API (FastAPI)]
        LLM[(LLM Engine)]
    end

    subgraph "Blockchain (Testnet/Local)"
        Contract[Task Manager Contract]
    end

    %% 真实的数据流向
    FE -->|"1. User Clicks"| API
    API -->|"2. Return Result"| FE
    FE -->|"3. User Signs Tx"| Wallet
    Wallet -->|"4. Call Contract"| Contract
    
    %% 关键差异标注
    style FE fill:#ffccbc,stroke:#bf360c,stroke-width:2px;
    style API fill:#e1bee7,stroke:#4a148c,stroke-dasharray: 5 5;
    style Contract fill:#c8e6c9,stroke:#1b5e20,stroke-width:2px;

    Note1[🔍 偏差: Agent 并不直接连接合约<br/>前端 App 充当了中继器]:::note
    Note1 -.-> FE
    
    classDef note fill:#fff9c4,stroke:#fbc02d,stroke-width:1px;
```
