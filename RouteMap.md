# 🗺️ FocusFlow V2 - 业务闭环测试路线图

这份文档记录了刚刚完成的端到端 (E2E) 业务测试流程。我们通过模拟真实用户操作，验证了从 **任务创建** 到 **AI 验证** 再到 **结果反馈** 的完整闭环。

> **测试视频**: ![E2E Test Recording](file:///Users/ihrr/.gemini/antigravity/brain/92513c8a-cd01-460e-8c00-e7dd60f9e761/focus_flow_e2e_test_1769587343634.webp)

---

## 🟢 流程一：成功完成任务 (Success Flow)

在这个流程中，我们模拟了一个认真完成任务的场景。

### 1. 创建任务
用户设置了一个简单的编程任务，并选择了 **1x 标准倍率** (低风险)。

> 📸 **关键动作**: 点击 "Confirm & Stake" 确认上链。
> ![Create Task](file:///Users/ihrr/.gemini/antigravity/brain/92513c8a-cd01-460e-8c00-e7dd60f9e761/.system_generated/click_feedback/click_feedback_1769587398385.png)

### 2. 提交证明
用户输入了真实代码 `function add(a, b)...` 作为证明。

> 📸 **关键动作**: 在 Verify Modal 中输入证明并提交。
> ![Submit Proof](file:///Users/ihrr/.gemini/antigravity/brain/92513c8a-cd01-460e-8c00-e7dd60f9e761/.system_generated/click_feedback/click_feedback_1769587604422.png)

### 3. AI 验证结果 (🟢 通过)
AI Agent 分析代码认为任务已完成。
- **状态**: `Pending` -> `Verified` (绿色勋章)
- **Spoons 反应**: 变绿，开心跳跃 (Happy Mood)

> 📸 **关键动作**: 验证成功后返回主屏幕，看到任务已标记为完成。
> ![Success Result](file:///Users/ihrr/.gemini/antigravity/brain/92513c8a-cd01-460e-8c00-e7dd60f9e761/.system_generated/click_feedback/click_feedback_1769587653941.png)

---

## 🔴 流程二：任务失败与惩罚 (Failure Flow)

在这个流程中，我们模拟了一个高风险任务失败的场景，触发了惩罚机制。

### 1. 创建高倍率任务
用户创建了一个任务，选择了 **3x 高倍率** (高风险，失败扣 30 HP)。

> 📸 **关键动作**: 选择 3x 倍率并确立任务。
> ![Create Risky Task](file:///Users/ihrr/.gemini/antigravity/brain/92513c8a-cd01-460e-8c00-e7dd60f9e761/.system_generated/click_feedback/click_feedback_1769587489866.png)

### 2. 提交无效证明
用户直接承认："I failed to do the task."

> 📸 **关键动作**: 诚实提交失败证明。
> ![Submit Failure](file:///Users/ihrr/.gemini/antigravity/brain/92513c8a-cd01-460e-8c00-e7dd60f9e761/.system_generated/click_feedback/click_feedback_1769587511735.png)

### 3. AI 验证结果 (🔴 失败)
AI Agent 准确识别用户未完成任务。
- **状态**: `Pending` -> `Failed` (红色勋章)
- **Spoons 反应**: 变红，剧烈颤抖 (Shaking Mood)
- **惩罚**: 宠物 HP 扣减 (Mock 数据若为 Dead 则显示灰色)

> 📸 **关键动作**: 验证失败后，任务列表显示红色失败状态。
> ![Fail Result](file:///Users/ihrr/.gemini/antigravity/brain/92513c8a-cd01-460e-8c00-e7dd60f9e761/.system_generated/click_feedback/click_feedback_1769587551754.png)

---

## 🛡️ 异常处理验证 (Gap Analysis)

在测试前我们发现了 **Revive UI (复活按钮)** 缺失的问题。
**现已修复**: 
在 `AgentPanel.tsx` 中增加了复活逻辑。当宠物 HP 归零进入 `dead` 状态时，界面会显示：
- 灰色的 Spoons (Dead Mood)
- "Spoons has fainted!" 提示
- **"Revive Spoons (Cost: 0.01 ETH)" 按钮**

此逻辑确保了业务闭环：**生 -> 死 -> 复活** 的循环现在是完整的。
