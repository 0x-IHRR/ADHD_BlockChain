---
description: 启动本地开发环境的完整流程
---

# FocusFlow 本地开发启动指南

本项目需要启动 **3 个服务**，建议在不同的终端窗口中运行。

## 服务概览

| 服务 | 端口 | 用途 |
|------|------|------|
| Anvil | 8545 | 本地区块链 |
| AI Engine | 8000 | AI 拆解 & 验证 API |
| Expo Web | 8081 | 前端 Web 应用 |

---

## 启动步骤

### 1️⃣ 启动本地区块链 (Anvil)

```bash
# 终端 1
cd /Users/ihrr/Code/Python/MVP/ADHD_APP/contracts
anvil
```

**成功标志**: 看到 `Listening on 127.0.0.1:8545`

---

### 2️⃣ 启动 AI 后端

```bash
# 终端 2
cd /Users/ihrr/Code/Python/MVP/ADHD_APP/ai_engine
source .venv/bin/activate
python api.py
```

**成功标志**: 看到 `Uvicorn running on http://0.0.0.0:8000`

---

### 3️⃣ 启动前端 (Expo Web)

```bash
# 终端 3 - 注意要进入 app/ 目录
cd /Users/ihrr/Code/Python/MVP/ADHD_APP/app
npx expo start --web
```

**成功标志**: 看到 `Web is waiting on http://localhost:8081`

然后按 `w` 或直接访问 http://localhost:8081

---

## 一键启动脚本 (可选)

// turbo-all

```bash
# 在项目根目录运行
cd /Users/ihrr/Code/Python/MVP/ADHD_APP

# 后台启动 Anvil
(cd contracts && anvil) &

# 后台启动 AI Engine
(cd ai_engine && source .venv/bin/activate && python api.py) &

# 前台启动 Expo (注意要进入 app/ 目录)
cd app && npx expo start --web
```

---

## 停止服务

- 按 `Ctrl+C` 停止当前终端的服务
- 或使用 `pkill -f anvil` / `pkill -f uvicorn` 停止后台服务

---

## 验证服务状态

```bash
# 检查端口占用
lsof -i :8545   # Anvil
lsof -i :8000   # AI Engine  
lsof -i :8081   # Expo Web
```
