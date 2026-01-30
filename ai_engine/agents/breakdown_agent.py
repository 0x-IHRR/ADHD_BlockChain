"""
BreakdownAgent - 任务拆解 Agent (Spoon-Core Edition)
使用 Spoon-Core 框架 (ChatBot) 进行任务拆解。
"""
import os
import json
from typing import List, Optional
from dotenv import load_dotenv

# Spoon-Core
from spoon_ai.chat import ChatBot
from spoon_ai.schema import Message
from pydantic import BaseModel
import requests  # Added for direct raw request fallback

# ... imports ...

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
    """任务拆解 Agent - 基于 Spoon-Core"""
    
    def __init__(self):
        # Configure ChatBot (stateless)
        self.bot = ChatBot(
            llm_provider=os.getenv("LLM_PROVIDER", "anthropic"), # Updated to load from env
            base_url=os.getenv("BASE_URL", "https://open.bigmodel.cn/api/anthropic"),
            model_name=os.getenv("LLM_MODEL", "glm-4.7"),
            api_key=os.getenv("OPENAI_API_KEY") or os.getenv("ANTHROPIC_API_KEY"),
            enable_short_term_memory=False,
            enable_long_term_memory=False
        )
        print(f"[BreakdownAgent] Initialized Spoon ChatBot with model: {self.bot.model_name}")
    
    async def breakdown(self, task_description: str) -> BreakdownResult:
        """
        将任务拆解为子任务列表
        """
        messages = [
            Message(role="system", content=BREAKDOWN_SYSTEM_PROMPT),
            Message(role="user", content=task_description)
        ]
        
        try:
            print(f"[BreakdownAgent] Sending request to Spoon ChatBot...")
            
            # Special handling for Zhipu via Anthropic endpoint (Raw Request bypass)
            if "bigmodel.cn" in (os.getenv("BASE_URL") or "") and "anthropic" in (os.getenv("BASE_URL") or ""):
                print(f"[BreakdownAgent] Detecting Zhipu Anthropic Endpoint. Using Raw Request...")
                api_key = os.getenv("ANTHROPIC_API_KEY") or os.getenv("OPENAI_API_KEY")
                url = "https://open.bigmodel.cn/api/anthropic/v1/messages"
                headers = {
                    "x-api-key": api_key,
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json"
                }
                # extract system prompt for Anthropic API
                system_prompt = None
                filtered_messages = []
                for m in messages:
                    if m.role == "system":
                        system_prompt = m.content
                    else:
                        filtered_messages.append({"role": m.role, "content": m.content})

                payload = {
                    "model": os.getenv("LLM_MODEL", "glm-4.7"),
                    "max_tokens": 2048,
                    "messages": filtered_messages
                }
                if system_prompt:
                    payload["system"] = system_prompt
                
                # Use sync requests for simplicity in this patch (blocking but verified working)
                raw_res = requests.post(url, headers=headers, json=payload)
                if raw_res.status_code == 200:
                    response_text = raw_res.json()["content"][0]["text"]
                else:
                    print(f"Raw request failed: {raw_res.status_code} {raw_res.text}")
                    # Fallback to standard SDK if raw fails or 429
                    response_text = await self.bot.ask(messages)
            else:
                response_text = await self.bot.ask(messages)
            
            # 清理可能的 markdown 代码块包裹
            clean_response = response_text.strip()
            if clean_response.startswith("```json"):
                clean_response = clean_response[7:]
            if clean_response.startswith("```"):
                clean_response = clean_response[3:]
            if clean_response.endswith("```"):
                clean_response = clean_response[:-3]
            clean_response = clean_response.strip()
            
            # 解析 JSON 响应
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
            
        except Exception as e:
            print(f"Spoon breakdown error: {e}")
            # Fallback
            return BreakdownResult(
                original_task=task_description,
                subtasks=[
                    Subtask(title="初步准备", estimated_minutes=15, priority=1),
                    Subtask(title="执行核心步骤", estimated_minutes=30, priority=2),
                ],
                total_estimated_minutes=45
            )

# Global instance for api.py
breakdown_agent = BreakdownAgent()
