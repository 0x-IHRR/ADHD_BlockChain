"""
VerifyAgent - 任务验证 Agent
使用智谱 AI GLM-4.7 判断用户提交的证明是否表明任务已完成
"""
import json
import os
import httpx
import base64
import mimetypes
from typing import Optional
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()


class VerifyResult(BaseModel):
    """验证结果"""
    verified: bool
    confidence: float  # 0-1
    reason: str


# Agent 系统提示
VERIFY_SYSTEM_PROMPT = """你是一位严格但公正的任务验证裁判。你的职责是判断用户提交的证明是否表明他们已完成任务。

输入格式:
- task_description: 原任务描述
- proof: 用户提交的完成证明 (文字描述或图片描述)

验证标准:
1. 证明必须与任务直接相关
2. 证明应该表明任务已实质性完成 (>=80%)
3. 模糊或不完整的证明应判定为未完成
4. 对可疑证明保持谨慎

输出格式 (严格 JSON):
{
  "verified": true/false,
  "confidence": 0.0-1.0,
  "reason": "判定理由"
}

只返回 JSON，不要任何其他文字。
"""


class VerifyAgent:
    """任务验证 Agent - 使用智谱 Anthropic 兼容 API"""
    
    def __init__(self):
        self.api_key = os.getenv("OPENAI_API_KEY") or os.getenv("ANTHROPIC_API_KEY")
        self.base_url = os.getenv("BASE_URL", "https://open.bigmodel.cn/api/anthropic")
        self.model = os.getenv("LLM_MODEL", "glm-4.7")
        
        if not self.api_key:
            raise ValueError("API Key 未配置，请在 .env 中设置 OPENAI_API_KEY 或 ANTHROPIC_API_KEY")
    
    async def _call_api(self, messages: list) -> str:
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
            "max_tokens": 1000,
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
                # content 可能是一个列表，包含 text 或 image
                content = data["content"]
                if isinstance(content, list):
                    text_parts = [item.get("text", "") for item in content if item.get("type") == "text"]
                    return "".join(text_parts)
                return str(content)
            return ""
    
    def _encode_image(self, image_path: str) -> tuple[str, str]:
        """读取并 Base64 编码图片"""
        if image_path.startswith("file://"):
            image_path = image_path[7:]
            
        if not os.path.exists(image_path):
            raise FileNotFoundError(f"Image not found: {image_path}")
            
        mime_type, _ = mimetypes.guess_type(image_path)
        if not mime_type:
            mime_type = "image/jpeg"
            
        with open(image_path, "rb") as image_file:
            return mime_type, base64.b64encode(image_file.read()).decode('utf-8')

    async def verify(
        self,
        task_description: str,
        proof: str,
        image_url: Optional[str] = None
    ) -> VerifyResult:
        """
        验证任务完成状态
        """
        content_block = []
        
        # 1. 添加任务文本信息
        text_prompt = f"""请验证以下任务完成情况:

任务描述: {task_description}

用户提交的证明: {proof}
"""
        content_block.append({
            "type": "text", 
            "text": text_prompt
        })
        
        # 2. 如果有图片，处理图片
        if image_url:
            try:
                # 处理本地文件 file://
                if image_url.startswith("file://") or os.path.exists(image_url):
                    mime_type, base64_data = self._encode_image(image_url)
                    content_block.append({
                        "type": "text", 
                        "text": "\n[用户提交了以下图片证明]:"
                    })
                    content_block.append({
                        "type": "image",
                        "source": {
                            "type": "base64",
                            "media_type": mime_type,
                            "data": base64_data
                        }
                    })
                # 处理网络 URL (如果模型支持)
                elif image_url.startswith("http"):
                    content_block.append({
                        "type": "text",
                        "text": f"\n[用户图片 URL: {image_url}]"
                    })
            except Exception as e:
                print(f"Error processing image: {e}")
                content_block.append({
                    "type": "text", 
                    "text": f"\n[图片处理失败: {str(e)}]"
                })
        
        messages = [
            {"role": "system", "content": VERIFY_SYSTEM_PROMPT},
            {"role": "user", "content": content_block}
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
        
        # confidence 阈值 - 低于此值自动判定为未通过
        CONFIDENCE_THRESHOLD = 0.7
        
        # 解析 JSON 响应
        try:
            result_json = json.loads(clean_response)
            verified = result_json.get("verified", False)
            confidence = result_json.get("confidence", 0.5)
            reason = result_json.get("reason", "无法解析验证理由")
            
            # 如果 confidence 低于阈值，强制判定为未通过
            if confidence < CONFIDENCE_THRESHOLD and verified:
                verified = False
                reason = f"置信度 ({confidence:.2f}) 低于阈值 ({CONFIDENCE_THRESHOLD})，判定为未完成。原因: {reason}"
            
            return VerifyResult(
                verified=verified,
                confidence=confidence,
                reason=reason
            )
        except (json.JSONDecodeError, KeyError):
            # 解析失败，默认不通过
            return VerifyResult(
                verified=False,
                confidence=0.0,
                reason="验证服务响应解析失败，请重试"
            )
    
    async def verify_and_submit(
        self,
        task_id: int,
        task_description: str,
        proof: str,
        image_url: Optional[str] = None
    ) -> dict:
        """
        验证任务并自动提交结果到链上
        
        这是完整的 Oracle 验证流程:
        1. AI 分析用户提交的证明
        2. 根据验证结果，以 Oracle 身份调用合约 submitProof
        
        Args:
            task_id: 链上任务 ID
            task_description: 原任务描述
            proof: 用户提交的证明
            image_url: 可选的图片证明 URL
            
        Returns:
            dict: 包含验证结果和交易哈希
        """
        # 1. AI 验证
        result = await self.verify(task_description, proof, image_url)
        
        # 2. 调用合约提交结果
        try:
            from ..oracle_signer import OracleSigner
            signer = OracleSigner()
            tx_hash = signer.submit_verification(task_id, result.verified)
        except Exception as e:
            return {
                "verified": result.verified,
                "confidence": result.confidence,
                "reason": result.reason,
                "submitted_to_chain": False,
                "error": str(e)
            }
        
        return {
            "verified": result.verified,
            "confidence": result.confidence,
            "reason": result.reason,
            "submitted_to_chain": True,
            "tx_hash": tx_hash
        }


# 测试入口
async def main():
    agent = VerifyAgent()
    
    # 测试用例 1: 应该通过
    result = await agent.verify(
        task_description="完成 Python 基础教程第一章",
        proof="我已经完成了第一章的所有练习题，包括变量定义、数据类型和基本运算符的练习。"
    )
    print(f"测试1 - 已验证: {result.verified}, 置信度: {result.confidence}")
    print(f"理由: {result.reason}\n")
    
    # 测试用例 2: 应该不通过
    result = await agent.verify(
        task_description="跑步 5 公里",
        proof="我打算明天去跑步"
    )
    print(f"测试2 - 已验证: {result.verified}, 置信度: {result.confidence}")
    print(f"理由: {result.reason}")


if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
