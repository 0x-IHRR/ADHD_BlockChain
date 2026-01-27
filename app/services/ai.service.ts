/**
 * AI Service - 与 FocusFlow AI Engine 交互
 */

const AI_ENGINE_BASE_URL = process.env.EXPO_PUBLIC_AI_ENGINE_URL || 'http://localhost:8000';

export interface Subtask {
    title: string;
    estimated_minutes: number;
    priority: number;
}

export interface BreakdownResult {
    original_task: string;
    subtasks: Subtask[];
    total_estimated_minutes: number;
}

export interface VerifyResult {
    verified: boolean;
    confidence: number;
    reason: string;
}

/**
 * 调用 AI 任务拆解服务
 */
export async function breakdownTask(taskDescription: string): Promise<BreakdownResult> {
    const response = await fetch(`${AI_ENGINE_BASE_URL}/breakdown`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ task: taskDescription }),
    });

    if (!response.ok) {
        throw new Error(`AI breakdown failed: ${response.statusText}`);
    }

    return response.json();
}

/**
 * 调用 AI 验证服务
 */
export async function verifyTask(
    taskDescription: string,
    proof: string,
    imageUrl?: string
): Promise<VerifyResult> {
    const response = await fetch(`${AI_ENGINE_BASE_URL}/verify`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            task_description: taskDescription,
            proof,
            image_url: imageUrl,
        }),
    });

    if (!response.ok) {
        throw new Error(`AI verification failed: ${response.statusText}`);
    }

    return response.json();
}

/**
 * Oracle 验证结果接口
 */
export interface VerifyAndSubmitResult {
    verified: boolean;
    confidence: number;
    reason: string;
    submitted_to_chain: boolean;
    tx_hash?: string;
    error?: string;
}

/**
 * 调用 AI 验证并提交到链上 (Oracle 模式)
 * 
 * 完整流程:
 * 1. AI 分析用户提交的证明
 * 2. 以 Oracle 身份调用合约 submitProof
 * 
 * @param taskId - 链上任务 ID
 * @param taskDescription - 任务描述
 * @param proof - 用户提交的完成证明
 * @param imageUrl - 可选的图片证明
 */
export async function verifyAndSubmit(
    taskId: number,
    taskDescription: string,
    proof: string,
    imageUrl?: string
): Promise<VerifyAndSubmitResult> {
    const response = await fetch(`${AI_ENGINE_BASE_URL}/verify-and-submit`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            task_id: taskId,
            task_description: taskDescription,
            proof,
            image_url: imageUrl,
        }),
    });

    if (!response.ok) {
        throw new Error(`Oracle verification failed: ${response.statusText}`);
    }

    return response.json();
}
