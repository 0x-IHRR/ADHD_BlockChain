"""
FocusFlow AI Engine - HTTP API
提供 /breakdown 和 /verify 两个 RESTful 接口供前端调用
"""
from typing import Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

from agents import BreakdownAgent, VerifyAgent

# 初始化 FastAPI 应用
app = FastAPI(
    title="FocusFlow AI Engine",
    description="AI-powered task breakdown and verification for ADHD productivity",
    version="0.1.0"
)

# 配置 CORS (允许前端跨域访问)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 生产环境应限制具体域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 初始化 Agents
breakdown_agent = BreakdownAgent()
verify_agent = VerifyAgent()


# ============ 请求/响应模型 ============

class BreakdownRequest(BaseModel):
    task: str
    

class SubtaskResponse(BaseModel):
    title: str
    estimated_minutes: int
    priority: int


class BreakdownResponse(BaseModel):
    original_task: str
    subtasks: list[SubtaskResponse]
    total_estimated_minutes: int


class VerifyRequest(BaseModel):
    task_description: str
    proof: str
    image_url: Optional[str] = None


class VerifyResponse(BaseModel):
    verified: bool
    confidence: float
    reason: str


# ============ API 端点 ============

@app.get("/")
async def root():
    """健康检查"""
    return {"status": "ok", "service": "FocusFlow AI Engine"}


@app.post("/breakdown", response_model=BreakdownResponse)
async def breakdown_task(request: BreakdownRequest):
    """
    将大任务拆解为小步骤
    
    - **task**: 任务描述
    """
    try:
        result = await breakdown_agent.breakdown(request.task)
        return BreakdownResponse(
            original_task=result.original_task,
            subtasks=[
                SubtaskResponse(
                    title=s.title,
                    estimated_minutes=s.estimated_minutes,
                    priority=s.priority
                )
                for s in result.subtasks
            ],
            total_estimated_minutes=result.total_estimated_minutes
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/verify", response_model=VerifyResponse)
async def verify_task(request: VerifyRequest):
    """
    验证任务完成状态
    
    - **task_description**: 原任务描述
    - **proof**: 用户提交的完成证明
    - **image_url**: (可选) 图片证明 URL
    """
    try:
        result = await verify_agent.verify(
            task_description=request.task_description,
            proof=request.proof,
            image_url=request.image_url
        )
        return VerifyResponse(
            verified=result.verified,
            confidence=result.confidence,
            reason=result.reason
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class VerifyAndSubmitRequest(BaseModel):
    task_id: int
    task_description: str
    proof: str
    image_url: Optional[str] = None


class VerifyAndSubmitResponse(BaseModel):
    verified: bool
    confidence: float
    reason: str
    submitted_to_chain: bool
    tx_hash: Optional[str] = None
    error: Optional[str] = None


@app.post("/verify-and-submit", response_model=VerifyAndSubmitResponse)
async def verify_and_submit_task(request: VerifyAndSubmitRequest):
    """
    验证任务并自动提交结果到链上 (Oracle 模式)
    
    这是完整的验证流程:
    1. AI 分析用户提交的证明
    2. 以 Oracle 身份调用合约 submitProof
    
    - **task_id**: 链上任务 ID
    - **task_description**: 原任务描述
    - **proof**: 用户提交的完成证明
    - **image_url**: (可选) 图片证明 URL
    """
    try:
        result = await verify_agent.verify_and_submit(
            task_id=request.task_id,
            task_description=request.task_description,
            proof=request.proof,
            image_url=request.image_url
        )
        return VerifyAndSubmitResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============ 启动入口 ============

if __name__ == "__main__":
    uvicorn.run(
        "api:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
