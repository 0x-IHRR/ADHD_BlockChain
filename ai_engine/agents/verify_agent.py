"""
VerifyAgent - 任务验证 Agent (Spoon-Core Edition)
使用 Spoon-Core 框架 (ChatBot) 进行任务验证，支持多模态输入。
"""
import os
import base64
import mimetypes
import json
from typing import Optional, List, Union, Any
from dotenv import load_dotenv

# Spoon-Core imports
from spoon_ai.chat import ChatBot
from spoon_ai.schema import Message
from pydantic import Field, BaseModel

load_dotenv()

# System Prompt
VERIFY_SYSTEM_PROMPT = """你是一位严格、公正且极具观察力的"任务完成验证官" (Task Verification Oracle)。
你的职责是根据用户提供的任务描述和证明材料（文字或图片），判断用户是否真实、高质量地完成了任务。

你需要遵循以下原则：
1. **严格验证**: 只有当证明材料充分且与任务描述高度匹配时，才判定通过。
2. **多模态分析**: 如果提供了图片，请仔细观察图片细节（如屏幕截图中的时间、内容、代码运行结果、环境照片等）来辅助判断。
3. **鼓励但不放水**: 即使未通过，也要给出具体的改进建议和鼓励，但决不能在结果上妥协。
4. **输出JSON**: 必须严格返回如下JSON格式结果，不要包含 markdown 代码块或其他文字。

输出 JSON 格式:
{
  "verified": true/false,
  "reason": "简短的一句话原因 (50字以内)，说明通过或不通过的理由。",
  "score": 0-100 (完成质量评分)
}
"""

# Custom Message class to allow list content for multimodal inputs
class MultimodalMessage(Message):
    content: Union[str, List[Any]] = Field(default=None)

class VerifyResult(BaseModel):
    """验证结果结构"""
    verified: bool
    reason: str
    score: int
    tx_hash: Optional[str] = None

class VerifyAgent:
    """任务验证 Agent - 基于 Spoon-Core"""
    
    def __init__(self):
        # Initialize Spoon ChatBot
        # Environment variables (OPENAI_API_KEY, ANTHROPIC_API_KEY, BASE_URL) will be picked up automatically
        # or we explicitly pass them if needed. 
        # Typically Spoon loads from env, but we are explicit here for robustness.
        
        provider = "anthropic" # Defaulting to anthropic as used before
        if os.getenv("OPENAI_API_KEY") and "bigmodel.cn" in (os.getenv("BASE_URL") or ""):
             # GLM usually uses openai compatible
             provider = "openai" # Or use custom config logic
        
        # However, api.py used explicit requests. Let's use ChatBot with defaults
        # and let it discover keys. 
        # But previous code used specific BASE_URL for GLM.
        # We should configure ChatBot to use that.
        
        self.bot = ChatBot(
            llm_provider=provider,
            base_url=os.getenv("BASE_URL", "https://open.bigmodel.cn/api/anthropic"), # Default from old code
            model_name=os.getenv("LLM_MODEL", "glm-4.7"),
            api_key=os.getenv("OPENAI_API_KEY") or os.getenv("ANTHROPIC_API_KEY"),
            # Disable memory for stateless verification
            enable_short_term_memory=False, 
            enable_long_term_memory=False
        )
        print(f"[VerifyAgent] Initialized Spoon ChatBot with model: {self.bot.model_name}")

    def _encode_image(self, image_path: str) -> tuple[str, str]:
        """(Legacy helper) 编码图片为 Base64，Spoon 0.3.6 可能需要手动构造 Payload"""
        if image_path.startswith("file://"):
            image_path = image_path[7:]
            
        if not os.path.exists(image_path):
            raise FileNotFoundError(f"Image not found: {image_path}")
            
        mime_type, _ = mimetypes.guess_type(image_path)
        if not mime_type:
            mime_type = "image/jpeg"
            
        with open(image_path, "rb") as image_file:
            base64_data = base64.b64encode(image_file.read()).decode('utf-8')
            
        return mime_type, base64_data

    async def verify(self, task_description: str, proof: str, image_url: Optional[str] = None) -> VerifyResult:
        """
        验证任务
        """
        content_block = []
        
        # 1. Add Text
        text_prompt = f"任务描述: {task_description}\n用户提交的证明: {proof}"
        content_block.append({
            "type": "text", 
            "text": text_prompt
        })
        
        # 2. Add Image if present
        if image_url:
            try:
                # Handle local file
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
        
        # Construct Multimodal Message
        # Spoon ChatBot takes list of Messages
        # We use our custom class to bypass 'content: str' constraint
        messages = [
            Message(role="system", content=VERIFY_SYSTEM_PROMPT),
            MultimodalMessage(role="user", content=content_block)
        ]
        
        try:
            # Call Spoon ChatBot
            # .ask() returns string content directly
            print(f"[VerifyAgent] Sending request to Spoon ChatBot... (Image: {bool(image_url)})")
            response_text = await self.bot.ask(messages)
            
            # Parse Response
            # Clean markdown if present
            clean_response = response_text.strip()
            if clean_response.startswith("```json"):
                clean_response = clean_response[7:]
            if clean_response.startswith("```"):
                clean_response = clean_response[3:]
            if clean_response.endswith("```"):
                clean_response = clean_response[:-3]
            clean_response = clean_response.strip()
            
            data = json.loads(clean_response)
            return VerifyResult(
                verified=data.get("verified", False),
                reason=data.get("reason", "No reason provided"),
                score=data.get("score", 0)
            )
            
        except json.JSONDecodeError:
            return VerifyResult(
                verified=False, 
                reason="AI 返回格式错误，请重试", 
                score=0
            )
        except Exception as e:
            print(f"Spoon verification error: {e}")
            return VerifyResult(verified=False, reason=f"验证服务异常: {str(e)}", score=0)

    async def verify_and_submit(self, task_id: int, task_description: str, proof: str, image_url: Optional[str] = None) -> dict:
        """
        API 调用的入口方法
        """
        verify_result = await self.verify(task_description, proof, image_url)
        
        # Simulate blockchain tx for now (or integrate actual contract call here if Python Web3 is efficient, 
        # but currently frontend handles tx, backend just validates)
        # Assuming backend is an ORACLE that signs the result, but simplified for MVP:
        
        return {
            "verified": verify_result.verified,
            "reason": verify_result.reason,
            "score": verify_result.score,
            "tx_hash": "0x(simulated_oracle_signature)" if verify_result.verified else None
        }

# Global instance
verify_agent = VerifyAgent()
