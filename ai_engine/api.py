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


# ============ 图片上传验证 (法官模式) ============

from fastapi import File, UploadFile, Form
import os
import uuid
import base64

# 临时图片存储目录
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)


@app.post("/verify-with-image", response_model=VerifyAndSubmitResponse)
async def verify_with_image(
    task_id: str = Form(...),
    task_description: str = Form(...),
    proof: str = Form(...),
    image: Optional[UploadFile] = File(None)
):
    """
    验证任务 (支持图片上传) - 法官模式
    """
    print(f"[DEBUG] verify_with_image called: id={task_id}, desc={task_description[:20]}, has_image={image is not None}")
    if image:
        print(f"[DEBUG] Image: filename={image.filename}, content_type={image.content_type}")

    # Convert task_id back to int
    try:
        task_id_int = int(task_id)
    except ValueError:
        raise HTTPException(status_code=422, detail="task_id must be an integer")

    """
    验证任务 (支持图片上传) - 法官模式
    
    接受 multipart/form-data 格式，支持上传截图/照片作为证明
    
    - **task_id**: 链上任务 ID
    - **task_description**: 原任务描述  
    - **proof**: 用户提交的文字证明
    - **image**: (可选) 图片文件 (jpg/png/webp)
    """
    image_url = None
    
    try:
        # 如果有图片，保存并生成 URL
        if image and image.filename:
            # 验证文件类型
            allowed_types = ["image/jpeg", "image/png", "image/webp", "image/gif"]
            if image.content_type not in allowed_types:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Invalid image type: {image.content_type}. Allowed: {allowed_types}"
                )
            
            # 生成唯一文件名
            ext = image.filename.split(".")[-1] if "." in image.filename else "jpg"
            filename = f"{uuid.uuid4()}.{ext}"
            filepath = os.path.join(UPLOAD_DIR, filename)
            
            # 保存文件
            content = await image.read()
            with open(filepath, "wb") as f:
                f.write(content)
            
            # 生成本地 URL (也可换成云存储 URL)
            image_url = f"file://{filepath}"
            
            # 可选：生成 base64 data URL 供 AI 分析
            # image_data = base64.b64encode(content).decode("utf-8")
            # image_url = f"data:{image.content_type};base64,{image_data}"
        
        # 调用验证 Agent
        result = await verify_agent.verify_and_submit(
            task_id=task_id_int,
            task_description=task_description,
            proof=proof,
            image_url=image_url
        )
        
        return VerifyAndSubmitResponse(**result)
        
    except HTTPException:
        raise
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

