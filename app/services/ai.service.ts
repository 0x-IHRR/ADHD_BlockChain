/**
 * AI Service - 与 Time Gamble AI Engine 交互
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
export async function breakdownTask(taskDescription: string, customPrompt?: string): Promise<BreakdownResult> {
    const response = await fetch(`${AI_ENGINE_BASE_URL}/breakdown`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            task: taskDescription,
            custom_prompt: customPrompt,
        }),
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
    let response;

    if (imageUrl) {
        // 如果有图片，使用 multipart/form-data 上传到 /verify-with-image
        const formData = new FormData();
        formData.append('task_id', taskId.toString());
        formData.append('task_description', taskDescription);
        formData.append('proof', proof);

        // Fetch image blob
        const imgResponse = await fetch(imageUrl);
        const blob = await imgResponse.blob();

        // Append file
        // 注意: React Native 和 Web 处理 FormData 文件略有不同
        // 但 fetch blob 并在 web 上 appending 通常可以工作
        // 在 React Native 上可能需要 { uri, name, type } 对象
        if ((blob as any).data) { // React Native specific check? Not standard Blob
            // Fallback for RN if needed, usually just append blob works on modern RN?
            // Actually, for RN usually we append object: { uri, type: 'image/jpeg', name: 'upload.jpg' }
            formData.append('image', {
                uri: imageUrl,
                name: 'upload.jpg',
                type: 'image/jpeg'
            } as any);
        } else {
            // Web
            formData.append('image', blob, 'upload.jpg');
        }

        response = await fetch(`${AI_ENGINE_BASE_URL}/verify-with-image`, {
            method: 'POST',
            body: formData,
            // Header Content-Type auto set by browser/fetch for FormData
        });

    } else {
        // 无图片，使用 JSON
        response = await fetch(`${AI_ENGINE_BASE_URL}/verify-and-submit`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                task_id: taskId,
                task_description: taskDescription,
                proof,
            }),
        });
    }

    if (!response.ok) {
        throw new Error(`Oracle verification failed: ${response.statusText}`);
    }

    return response.json();
}

/**
 * Quiz Types
 */
export interface QuizQuestion {
    id: number;
    question: string;
    options: string[];
}

export interface QuizGenerateResponse {
    questions: QuizQuestion[];
}

export interface QuizGradeResponse {
    score: number;
    passed: boolean;
    feedback: string;
}

/**
 * 生成任务相关的 Quiz
 */
export async function generateQuiz(taskDescription: string): Promise<QuizGenerateResponse> {
    const response = await fetch(`${AI_ENGINE_BASE_URL}/quiz/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task_description: taskDescription }),
    });

    if (!response.ok) {
        throw new Error(`Quiz generation failed: ${response.statusText}`);
    }

    return response.json();
}

/**
 * 提交 Quiz 答案并评分
 */
export async function gradeQuiz(
    quizData: QuizQuestion[],
    userAnswers: Record<string, string>
): Promise<QuizGradeResponse> {
    const response = await fetch(`${AI_ENGINE_BASE_URL}/quiz/grade`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            quiz_data: quizData,
            user_answers: userAnswers,
        }),
    });

    if (!response.ok) {
        throw new Error(`Quiz grading failed: ${response.statusText}`);
    }

    return response.json();
}
