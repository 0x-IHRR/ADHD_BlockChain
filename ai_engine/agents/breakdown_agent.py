"""
BreakdownAgent - 任务拆解 Agent
使用智谱 AI GLM-4.7 将大任务拆解为可执行的小步骤
"""
import json
import os
import httpx
from typing import List, Optional
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()


class Subtask(BaseModel):
    """子任务结构"""
    title: str
    estimated_minutes: int
    priority: int  # 1-5, 1 为最高


class BreakdownResult(BaseModel):
    """拆解结果"""
    original_task: str
    subtasks: List[Subtask]
    total_estimated_minutes: int


# Agent 系统提示
BREAKDOWN_SYSTEM_PROMPT = """你是一位专业的任务拆解专家，专门帮助 ADHD 患者和拖延症患者将大任务分解为易于执行的小步骤。

输入: 用户将提供一个任务描述
输出: 你需要返回一个 JSON 格式的拆解结果

拆解原则:
1. 每个子任务应该在 5-25 分钟内可完成
2. 子任务应该具体、可操作
3. 按执行顺序排列
4. 优先级 1-5 (1 最高)

输出格式 (严格 JSON):
{
  "subtasks": [
    {"title": "子任务1", "estimated_minutes": 15, "priority": 1},
    {"title": "子任务2", "estimated_minutes": 20, "priority": 2}
  ]
}

只返回 JSON，不要任何其他文字。
"""


class BreakdownAgent:
    """任务拆解 Agent - 使用智谱 Anthropic 兼容 API"""
    
    def __init__(self):
        self.api_key = os.getenv("OPENAI_API_KEY") or os.getenv("ANTHROPIC_API_KEY")
        self.base_url = os.getenv("BASE_URL", "https://open.bigmodel.cn/api/anthropic")
        self.model = os.getenv("LLM_MODEL", "glm-4.7")
        
        if not self.api_key:
            raise ValueError("API Key 未配置，请在 .env 中设置 OPENAI_API_KEY 或 ANTHROPIC_API_KEY")
    
    async def _call_api(self, messages: List[dict]) -> str:
        """直接调用智谱 Anthropic 兼容 API"""
        url = f"{self.base_url}/v1/messages"
        
        headers = {
            "x-api-key": self.api_key,
            "anthropic-version": "2023-06-01",
            "Content-Type": "application/json"
        }
        
        # 分离 system 和 user 消息
        system_msg = None
        user_messages = []
        for msg in messages:
            if msg["role"] == "system":
                system_msg = msg["content"]
            else:
                user_messages.append(msg)
        
        payload = {
            "model": self.model,
            "max_tokens": 2000,
            "messages": user_messages
        }
        if system_msg:
            payload["system"] = system_msg
        
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(url, headers=headers, json=payload)
            response.raise_for_status()
            data = response.json()
            
            # 提取文本内容
            if "content" in data and len(data["content"]) > 0:
                return data["content"][0].get("text", "")
            return ""
    
    async def breakdown(self, task_description: str) -> BreakdownResult:
        """
        将任务拆解为子任务列表
        
        Args:
            task_description: 任务描述
            
        Returns:
            BreakdownResult: 拆解结果
        """
        messages = [
            {"role": "system", "content": BREAKDOWN_SYSTEM_PROMPT},
            {"role": "user", "content": task_description}
        ]
        
        response = await self._call_api(messages)
        
        # 清理可能的 markdown 代码块包裹
        clean_response = response.strip()
        if clean_response.startswith("```json"):
            clean_response = clean_response[7:]
        if clean_response.startswith("```"):
            clean_response = clean_response[3:]
        if clean_response.endswith("```"):
            clean_response = clean_response[:-3]
        clean_response = clean_response.strip()
        
        # 解析 JSON 响应
        try:
            result_json = json.loads(clean_response)
            subtasks = [
                Subtask(
                    title=s["title"],
                    estimated_minutes=s["estimated_minutes"],
                    priority=s.get("priority", 3)
                )
                for s in result_json["subtasks"]
            ]
            
            total_minutes = sum(s.estimated_minutes for s in subtasks)
            
            return BreakdownResult(
                original_task=task_description,
                subtasks=subtasks,
                total_estimated_minutes=total_minutes
            )
        except (json.JSONDecodeError, KeyError) as e:
            # 如果解析失败，返回默认拆解
            return BreakdownResult(
                original_task=task_description,
                subtasks=[
                    Subtask(title="完成任务第一步", estimated_minutes=15, priority=1),
                    Subtask(title="完成任务第二步", estimated_minutes=15, priority=2),
                ],
                total_estimated_minutes=30
            )


# 测试入口
async def main():
    agent = BreakdownAgent()
    result = await agent.breakdown("准备 Python 后端面试")
    print(f"原任务: {result.original_task}")
    print(f"预计总时长: {result.total_estimated_minutes} 分钟")
    print("子任务:")
    for i, task in enumerate(result.subtasks, 1):
        print(f"  {i}. [{task.priority}] {task.title} ({task.estimated_minutes}min)")


if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
