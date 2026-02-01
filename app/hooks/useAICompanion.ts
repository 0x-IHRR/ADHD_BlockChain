/**
 * useAICompanion - AI 荷官动态消息管理 Hook
 * 
 * 功能：
 * - 监听应用状态变化（任务、宠物、空闲时间等）
 * - 根据事件触发从消息库选取随机消息
 * - 管理消息队列，避免刷屏
 * - 支持打字机效果的消息输出
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { AIMessage, MessageEmotion } from '../components/AICompanionChat';
import {
    MessageTrigger,
    getRandomMessage,
    createAIMessage,
    MESSAGE_BANK
} from '../utils/aiCompanionMessages';
import { Task, TaskStatus } from '../context/AppContext';

// ============================================
// 配置常量
// ============================================
const CONFIG = {
    IDLE_SHORT_TIMEOUT: 5 * 60 * 1000,    // 5 分钟
    IDLE_LONG_TIMEOUT: 15 * 60 * 1000,    // 15 分钟
    MESSAGE_COOLDOWN: 30 * 1000,          // 消息冷却时间 (防刷屏)
    MAX_MESSAGES: 10,                      // 最大消息历史数
    HIGH_STAKE_THRESHOLD: 0.1,            // 高额质押阈值 (ETH)
};

// ============================================
// 类型定义
// ============================================
export interface AICompanionState {
    messages: AIMessage[];
    isTyping: boolean;
    lastTrigger: MessageTrigger | null;
    lastTriggerTime: number;
}

interface AICompanionActions {
    triggerMessage: (trigger: MessageTrigger) => void;
    clearMessages: () => void;
}

interface UseAICompanionProps {
    tasks?: Task[];
    petHP?: number;
    isActive?: boolean;
    stakeAmount?: number;
}

// ============================================
// 初始消息 (欢迎 + 观望)
// ============================================
const INITIAL_MESSAGES: AIMessage[] = [
    {
        id: 'init_welcome',
        text: '欢迎来到时间赌场。今天你准备下多大的注?',
        emotion: 'encourage' as MessageEmotion,
        timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30分钟前
    },
    {
        id: 'init_idle',
        text: '你在观望...在赌场里，不下注的人永远赢不了。',
        emotion: 'idle' as MessageEmotion,
        timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5分钟前
    },
];

// ============================================
// Hook 实现
// ============================================
export function useAICompanion({
    tasks = [],
    petHP = 100,
    isActive = false,
    stakeAmount = 0,
}: UseAICompanionProps = {}): AICompanionState & AICompanionActions {
    // 初始化时就包含两条消息
    const [messages, setMessages] = useState<AIMessage[]>(INITIAL_MESSAGES);
    const [isTyping, setIsTyping] = useState(false);
    const [lastTrigger, setLastTrigger] = useState<MessageTrigger | null>(null);
    const [lastTriggerTime, setLastTriggerTime] = useState(0);

    // Refs 用于跟踪状态变化
    const prevTaskCountRef = useRef(tasks.length);
    const prevCompletedCountRef = useRef(0);
    const prevFailedCountRef = useRef(0);
    const lastActivityRef = useRef(Date.now());
    const idleTimerRef = useRef<NodeJS.Timeout | null>(null);

    // ========================================
    // 触发消息 (追加到现有消息下方)
    // ========================================
    const triggerMessage = useCallback((trigger: MessageTrigger) => {
        const now = Date.now();

        // 冷却时间检查 (防止刷屏)
        if (now - lastTriggerTime < CONFIG.MESSAGE_COOLDOWN) {
            console.log('[AICompanion] 消息冷却中，跳过:', trigger);
            return;
        }

        // 获取随机消息
        const template = getRandomMessage(trigger);
        const newMessage = createAIMessage(template);

        console.log('[AICompanion] 触发消息:', trigger, newMessage.text.substring(0, 20) + '...');

        // 追加到消息列表末尾 (新消息在下方)
        setMessages(prev => {
            const updated = [...prev, newMessage];
            // 限制消息历史数量，超过后最旧的消失
            if (updated.length > CONFIG.MAX_MESSAGES) {
                return updated.slice(-CONFIG.MAX_MESSAGES);
            }
            return updated;
        });

        setLastTrigger(trigger);
        setLastTriggerTime(now);
        setIsTyping(true);

        // 模拟打字完成
        setTimeout(() => setIsTyping(false), 2000);
    }, [lastTriggerTime]);

    // ========================================
    // 清空消息
    // ========================================
    const clearMessages = useCallback(() => {
        setMessages([]);
    }, []);

    // 注意：移除了欢迎消息触发，因为初始消息已包含欢迎语

    // ========================================
    // 监听任务创建
    // ========================================
    useEffect(() => {
        const currentCount = tasks.length;
        const prevCount = prevTaskCountRef.current;

        if (currentCount > prevCount) {
            console.log('[AICompanion] 检测到新任务创建');

            // 检查是否是高额质押
            if (stakeAmount >= CONFIG.HIGH_STAKE_THRESHOLD) {
                triggerMessage('high_stakes');
            } else {
                triggerMessage('task_created');
            }
        }

        prevTaskCountRef.current = currentCount;
    }, [tasks.length, stakeAmount, triggerMessage]);

    // ========================================
    // 监听任务完成/失败
    // ========================================
    useEffect(() => {
        const completedCount = tasks.filter(t => t.status === 'verified' || t.status === 'settled').length;
        const failedCount = tasks.filter(t => t.status === 'failed').length;

        // 检测新完成的任务
        if (completedCount > prevCompletedCountRef.current) {
            console.log('[AICompanion] 检测到任务完成');
            triggerMessage('task_completed');
        }

        // 检测新失败的任务
        if (failedCount > prevFailedCountRef.current) {
            console.log('[AICompanion] 检测到任务失败');
            triggerMessage('task_failed');
        }

        prevCompletedCountRef.current = completedCount;
        prevFailedCountRef.current = failedCount;
    }, [tasks, triggerMessage]);

    // ========================================
    // 监听宠物状态 (低能量警告)
    // ========================================
    useEffect(() => {
        if (petHP > 0 && petHP <= 30) {
            console.log('[AICompanion] 检测到低能量:', petHP);
            triggerMessage('low_energy');
        }
    }, [petHP, triggerMessage]);

    // ========================================
    // 空闲检测
    // ========================================
    useEffect(() => {
        // 有活动时重置计时器
        if (isActive) {
            lastActivityRef.current = Date.now();
        }

        // 清除旧的计时器
        if (idleTimerRef.current) {
            clearTimeout(idleTimerRef.current);
        }

        // 设置空闲检测
        const checkIdle = () => {
            const idleTime = Date.now() - lastActivityRef.current;

            if (idleTime >= CONFIG.IDLE_LONG_TIMEOUT) {
                triggerMessage('idle_long');
            } else if (idleTime >= CONFIG.IDLE_SHORT_TIMEOUT) {
                triggerMessage('idle_short');
            }
        };

        // 每分钟检查一次
        idleTimerRef.current = setInterval(checkIdle, 60 * 1000);

        return () => {
            if (idleTimerRef.current) {
                clearInterval(idleTimerRef.current);
            }
        };
    }, [isActive, triggerMessage]);

    // ========================================
    // 用户活动追踪
    // ========================================
    useEffect(() => {
        const handleActivity = () => {
            lastActivityRef.current = Date.now();
        };

        // 监听用户活动 (仅 Web)
        if (typeof window !== 'undefined') {
            window.addEventListener('click', handleActivity);
            window.addEventListener('keydown', handleActivity);
            window.addEventListener('touchstart', handleActivity);
        }

        return () => {
            if (typeof window !== 'undefined') {
                window.removeEventListener('click', handleActivity);
                window.removeEventListener('keydown', handleActivity);
                window.removeEventListener('touchstart', handleActivity);
            }
        };
    }, []);

    return {
        messages,
        isTyping,
        lastTrigger,
        lastTriggerTime,
        triggerMessage,
        clearMessages,
    };
}

export default useAICompanion;
