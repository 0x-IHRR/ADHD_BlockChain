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
