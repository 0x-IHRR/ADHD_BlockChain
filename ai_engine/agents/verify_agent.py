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
import requests # Added for raw request


load_dotenv()

# System Prompt
# System Prompt
VERIFY_SYSTEM_PROMPT = """你是一位**专业且友善的 ADHD 学习教练** (Professional ADHD Learning Coach)。
  你的目标是验证用户是否真正完成了任务，同时保持鼓励和支持的态度。

  请根据用户提交的任务描述和证明材料（文字/图片），进行如下判断：

  **验证原则：证据导向 + 温和严格**

  1. **要求实质证据 (Evidence Required)**:
     - 用户必须提供**具体的完成证据**，而不是空洞的声明
     - ❌ 拒绝：单纯的"我完成了"、"做完了"、"已完成"等无实质内容的声明
     - ✅ 接受：包含具体内容的证明，例如：
       * 学习类任务：总结的知识点、学习笔记、理解心得
       * 编码类任务：代码片段、实现思路、遇到的问题
       * 文档类任务：文档截图、修改内容说明、关键要点
       * 实践类任务：操作步骤、结果描述、经验总结

  2. **相关性检查 (Relevance Check)**:
     - 证明内容必须与任务描述**直接相关**
     - 如果内容完全无关（如任务是学习 Python，证明是"买了酱油"），必须拒绝
     - 如果内容模糊但有一定相关性，可以通过但给予较低分数（60-70分）

  3. **图片优先原则 (Image Priority)**:
     - 如果用户上传了图片，优先分析图片内容
     - 图片必须清晰展示与任务相关的内容（代码截图、笔记照片、文档界面等）
     - 如果图片与任务无关或无法识别，应拒绝

  4. **质量分层 (Quality Tiers)**:
     - **优秀 (85-100分)**: 提供详细、具体的完成证据，展示深入理解
     - **良好 (70-84分)**: 提供基本完成证据，内容相关但不够深入
     - **及格 (60-69分)**: 提供最低限度的证据，勉强能证明完成了部分任务
     - **不及格 (0分)**: 无实质证据、内容无关、或明显敷衍

  5. **鼓励性反馈 (Encouraging Feedback)**:
     - 通过时：给予具体的肯定和鼓励，指出做得好的地方
     - 拒绝时：温和地说明原因，并给出改进建议（例如："请提供具体的学习笔记或知识点总结"）
     - 保持友善和支持的语气，避免冷酷或打击性的表达

  **特别注意**:
  - 不要被"我完成了"、"已经做完"等空洞声明欺骗
  - 要求用户展示"做了什么"而不是"声称做了"
  - 即使拒绝，也要保持温暖和建设性的态度

  **输出 JSON 格式 (必须严格遵守)**:
  {
    "verified": true/false,
    "reason": "简短的反馈（50字以内）。通过时给予肯定和鼓励；拒绝时温和说明原因并给出建议。",
    "score": 0-100
  }

  **示例**:
  - 任务："学习 Python 基本语法"
    * ❌ 证明："我完成了" → {"verified": false, "reason": "请提供具体的学习内容，比如你学到的知识点或代码示例哦！", "score": 0}
    * ❌ 证明："刚刚我买了一瓶酱油" → {"verified": false, "reason": "这个内容和学习 Python 没有关系呢，请提交与任务相关的学习证明～", "score": 0}
    * ✅ 证明："学习了变量、循环和函数，写了一个计算斐波那契数列的程序" → {"verified": true, "reason": "很棒！掌握了核心概念并实践了，继续保持！",
  "score": 85}
    * ✅ 证明："看了教程，了解了 Python 的基本数据类型" → {"verified": true, "reason": "不错的开始！建议多写点代码练习会更好～", "score": 65}
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


# Quiz Prompts
QUIZ_GEN_PROMPT = """你是一位**专业的 AI 考官**。请根据用户的任务描述，生成 3 道相关的选择题 (Multiple Choice Questions) 来测试用户是否真的完成了任务或掌握了相关知识。

任务描述: {task_description}

要求：
1. 题目难度适中，针对任务核心内容。
2. 每题提供 4 个选项 (A, B, C, D)。
3. **请全程使用中文 (Please use Chinese)**。
4. **输出 JSON 格式 (Do NOT use markdown code blocks. Just return the raw JSON string)**:
{{
  "questions": [
    {{
      "id": 1,
      "question": "问题内容...",
      "options": ["A. 选项1", "B. 选项2", "C. 选项3", "D. 选项4"],
      "correct_answer": "A" (仅用于后台，前端不显示)
    }},
    ...
  ]
}}
"""

QUIZ_GRADE_PROMPT = """你是一位**公正的 AI 阅卷老师**。请根据用户的回答和标准答案，判断用户是否通过测试。

题目与标准答案:
{quiz_data}

用户回答:
{user_answers} (例如: {{"1": "A", "2": "C", "3": "D"}})

评分标准：
1. 每题 1 分，共 3 分。
2. **通过标准**: 得分 >= 2 分。

**输出 JSON 格式 (Do NOT use markdown code blocks. Just return the raw JSON string)**:
{{
  "score": 2,
  "passed": true,
  "feedback": "简短评价，例如：'答对 2 题，掌握了基础概念！' 或 '很遗憾，只答对 1 题，建议复习后再试。'"
}}
"""

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
            llm_provider=os.getenv("LLM_PROVIDER", "anthropic"),
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
            
            # Special handling for Zhipu via Anthropic endpoint (Raw Request bypass)
            if "bigmodel.cn" in (os.getenv("BASE_URL") or "") and "anthropic" in (os.getenv("BASE_URL") or ""):
                # Note: Zhipu Anthropic compatibility layer handling
                print(f"[VerifyAgent] Detecting Zhipu Anthropic Endpoint. Using Raw Request...")
                api_key = os.getenv("ANTHROPIC_API_KEY") or os.getenv("OPENAI_API_KEY")
                url = "https://open.bigmodel.cn/api/anthropic/v1/messages"
                headers = {
                    "x-api-key": api_key,
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json"
                }
                
                # Extract System Prompt
                system_pos = next((i for i, m in enumerate(messages) if m.role == "system"), None)
                system_prompt = messages[system_pos].content if system_pos is not None else VERIFY_SYSTEM_PROMPT
                
                # Construct User Message Content for Raw API
                last_msg = messages[-1]
                user_content_obj = last_msg.content
                
                final_content = []
                
                if isinstance(user_content_obj, list):
                    # It's already a list of blocks (Text/Image) from self.verify()
                    # We need to ensure it matches what Zhipu/Anthropic expects in JSON
                    for block in user_content_obj:
                        if block["type"] == "text":
                             final_content.append({"type": "text", "text": block["text"]})
                        elif block["type"] == "image":
                             # Anthropic format: source: { type: base64, media_type, data }
                             final_content.append({
                                 "type": "image",
                                 "source": block["source"]
                             })
                else:
                    # String content
                    final_content = str(user_content_obj)

                payload = {
                    "model": os.getenv("LLM_MODEL", "glm-4.7"),
                    "max_tokens": 2048,
                    "messages": [{"role": "user", "content": final_content}],
                    "system": str(system_prompt)
                }

                # Use sync requests for simplicity in this patch
                raw_res = requests.post(url, headers=headers, json=payload)
                if raw_res.status_code == 200:
                    response_text = raw_res.json()["content"][0]["text"]
                else:
                     print(f"Raw request verify failed: {raw_res.status_code} {raw_res.text}")
                     response_text = await self.bot.ask(messages)

            else:
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
            
        except json.JSONDecodeError as e:
            print(f"[VerifyAgent] JSON Decode Error: {e} - Response: {clean_response[:100]}")
            return VerifyResult(
                verified=False, 
                reason="AI 返回格式错误，请重试", 
                score=0
            )
        except Exception as e:
            import traceback
            print(f"[VerifyAgent] CRITICAL ERROR inside verify: {e}")
            traceback.print_exc()
            return VerifyResult(verified=False, reason=f"验证服务异常: {str(e)}", score=0)

    async def verify_and_submit(self, task_id: int, task_description: str, proof: str, image_url: Optional[str] = None) -> dict:
        """
        API 调用的入口方法
        """
        verify_result = await self.verify(task_description, proof, image_url)
        
        # Simulate blockchain tx for now
        return {
            "verified": verify_result.verified,
            "reason": verify_result.reason,
            "score": verify_result.score,
            "submitted_to_chain": verify_result.verified,
            "tx_hash": None  # Client will handle on-chain submission
        }

    async def generate_quiz(self, task_description: str) -> dict:
        """生成任务相关的 Quiz"""
        prompt = QUIZ_GEN_PROMPT.format(task_description=task_description)
        try:
            # Special handling for Zhipu via Anthropic endpoint (Raw Request bypass) to match BreakdownAgent
            if "bigmodel.cn" in (os.getenv("BASE_URL") or "") and "anthropic" in (os.getenv("BASE_URL") or ""):
                print(f"[VerifyAgent] Quiz Gen: Detecting Zhipu Anthropic Endpoint. Using Raw Request...")
                api_key = os.getenv("ANTHROPIC_API_KEY") or os.getenv("OPENAI_API_KEY")
                url = "https://open.bigmodel.cn/api/anthropic/v1/messages"
                headers = {
                    "x-api-key": api_key,
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json"
                }
                
                # Extract messages for raw payload
                filtered_messages = [{"role": "user", "content": prompt}]
                
                payload = {
                    "model": os.getenv("LLM_MODEL", "glm-4.7"),
                    "max_tokens": 2048,
                    "messages": filtered_messages
                }
                
                try:
                    raw_res = requests.post(url, headers=headers, json=payload, timeout=30)
                    if raw_res.status_code == 200:
                        response = raw_res.json()["content"][0]["text"]
                        clean_response = response # It's already string
                    else:
                        print(f"[VerifyAgent] Quiz Gen Raw request failed: {raw_res.status_code} {raw_res.text}")
                        # Fallback to SDK
                        response = await self.bot.ask(messages)
                        if hasattr(response, 'content'):
                            clean_response = response.content
                        else:
                            clean_response = str(response)
                except Exception as raw_e:
                     print(f"[VerifyAgent] Quiz Gen Raw Request Error: {raw_e}")
                     # Fallback to SDK
                     response = await self.bot.ask(messages) 
                     if hasattr(response, 'content'):
                        clean_response = response.content
                     else:
                        clean_response = str(response)

            else:
                # Standard SDK usage for non-Zhipu
                response = await self.bot.ask(messages) 
                if hasattr(response, 'content'):
                    clean_response = response.content
                else:
                    clean_response = str(response)

            # Helper to clean JSON
            clean_response = clean_response.strip()
            if clean_response.startswith("```json"):
                clean_response = clean_response[7:]
            if clean_response.startswith("```"):
                clean_response = clean_response[3:]
            if clean_response.endswith("```"):
                clean_response = clean_response[:-3]
            
            data = json.loads(clean_response)
            
            # Basic Validation
            if "questions" not in data or not isinstance(data["questions"], list):
                print(f"[VerifyAgent] Invalid Quiz Format (structure): {data}")
                raise ValueError("Invalid quiz format: 'questions' list missing or not a list")

            # Deep Validation
            for q in data["questions"]:
                if not all(key in q for key in ["id", "question", "options", "correct_answer"]):
                    print(f"[VerifyAgent] Invalid Quiz Question (missing keys): {q}")
                    raise ValueError(f"Invalid question format: {q}")
                if not isinstance(q["options"], list) or len(q["options"]) < 2:
                    print(f"[VerifyAgent] Invalid Quiz Options: {q}")
                    raise ValueError(f"Invalid options: {q}")
            
            return data
            
        except Exception as e:
            print(f"[VerifyAgent] Quiz Gen Error: {e}")
            # Fallback mock quiz
            return {
                "questions": [
                    {
                        "id": 1,
                        "question": "你的任务主要目标是什么？",
                        "options": ["A. 睡觉", "B. 专注完成任务", "C. 吃饭", "D. 玩游戏"],
                        "correct_answer": "B"
                    },
                    {
                        "id": 2,
                        "question": "面对困难时，哪一步最重要？",
                        "options": ["A. 开始第一步", "B. 放弃", "C. 拖延", "D. 无视它"],
                        "correct_answer": "A"
                    },
                    {
                        "id": 3,
                        "question": "完成任务后的感受应该是？",
                        "options": ["A. 糟糕", "B. 自豪与成就感", "C. 疲惫不堪", "D. 无感"],
                        "correct_answer": "B"
                    }
                ]
            }

    async def grade_quiz(self, quiz_data: list, user_answers: dict) -> dict:
        """评分"""
        prompt = QUIZ_GRADE_PROMPT.format(
            quiz_data=json.dumps(quiz_data, ensure_ascii=False),
            user_answers=json.dumps(user_answers, ensure_ascii=False)
        )
        try:
            # Construct messages list for Spoon ChatBot
            messages = [
                Message(role="user", content=prompt)
            ]

            # Special handling for Zhipu via Anthropic endpoint (Raw Request bypass) matching BreakdownAgent
            if "bigmodel.cn" in (os.getenv("BASE_URL") or "") and "anthropic" in (os.getenv("BASE_URL") or ""):
                print(f"[VerifyAgent] Quiz Grade: Detecting Zhipu Anthropic Endpoint. Using Raw Request...")
                api_key = os.getenv("ANTHROPIC_API_KEY") or os.getenv("OPENAI_API_KEY")
                url = "https://open.bigmodel.cn/api/anthropic/v1/messages"
                headers = {
                    "x-api-key": api_key,
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json"
                }
                
                # Extract messages for raw payload
                filtered_messages = [{"role": "user", "content": prompt}]
                
                payload = {
                    "model": os.getenv("LLM_MODEL", "glm-4.7"),
                    "max_tokens": 2048,
                    "messages": filtered_messages
                }
                
                try:
                    raw_res = requests.post(url, headers=headers, json=payload, timeout=30)
                    if raw_res.status_code == 200:
                        response = raw_res.json()["content"][0]["text"]
                        clean_response = response # It's already string
                    else:
                        print(f"[VerifyAgent] Quiz Grade Raw request failed: {raw_res.status_code} {raw_res.text}")
                        # Fallback to SDK
                        response = await self.bot.ask(messages)
                        if hasattr(response, 'content'):
                            clean_response = response.content
                        else:
                            clean_response = str(response)
                except Exception as raw_e:
                     print(f"[VerifyAgent] Quiz Grade Raw Request Error: {raw_e}")
                     # Fallback to SDK
                     response = await self.bot.ask(messages) 
                     if hasattr(response, 'content'):
                        clean_response = response.content
                     else:
                        clean_response = str(response)
            else:
                 # Standard SDK usage for non-Zhipu
                response = await self.bot.ask(messages) 
                if hasattr(response, 'content'):
                    clean_response = response.content
                else:
                    clean_response = str(response)
             
            # Helper to clean JSON
            clean_response = clean_response.strip()
            if clean_response.startswith("```json"):
                clean_response = clean_response[7:]
            if clean_response.startswith("```"):
                clean_response = clean_response[3:]
            if clean_response.endswith("```"):
                clean_response = clean_response[:-3]
                
            return json.loads(clean_response)
        except Exception as e:
            print(f"[VerifyAgent] Quiz Grade Error: {e}")
            return {"score": 0, "passed": False, "feedback": "评分服务暂时不可用"}

# Global instance
verify_agent = VerifyAgent()
