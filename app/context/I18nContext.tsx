/**
 * FocusFlow 国际化 (i18n) 系统
 * 支持中英文切换
 */

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

// ============ 类型定义 ============

export type Language = 'en' | 'zh';

interface I18nContextType {
    language: Language;
    t: (key: string) => string;
    toggleLanguage: () => void;
    setLanguage: (lang: Language) => void;
}

// ============ 翻译内容 ============

const translations: Record<Language, Record<string, string>> = {
    en: {
        // Brand
        'brand.name': 'FocusFlow',

        // Common
        'common.connect': 'Connect',
        'common.back': 'Back',
        'common.cancel': 'Cancel',
        'common.confirm': 'Confirm',
        'common.error': 'Error',
        'common.done': 'Done',
        'common.jackpot': 'Jackpot',

        // Agent Panel
        'agent.title': 'AI Workflow',
        'agent.idle': 'Waiting for task',
        'agent.idleHint': 'Submit proof to start verification',
        'agent.working': 'Working',
        'agent.verifying': 'Verifying task:',
        'agent.verified': 'Verified \u2713',
        'agent.failed': 'Failed \u2717',
        'agent.confidence': 'Confidence:',

        // Leaderboard
        'leaderboard.title': 'Hall of Focus',
        'leaderboard.topPlayers': 'Top Players',
        'leaderboard.recentWinners': 'Recent Winners',

        // Home
        'home.active': 'Active',
        'home.done': 'Done',
        'home.total': 'Total',
        'home.yourTasks': 'Your Tasks',
        'home.newTask': 'New Task',
        'home.noTasks': 'No tasks yet',
        'home.noTasksSubtitle': 'Stake crypto to stay focused',
        'home.createTask': 'Create Task',
        'home.due': 'Due',

        // Create Task
        'createTask.title': 'New Task',
        'createTask.goalLabel': "What's your goal?",
        'createTask.goalPlaceholder': 'e.g., Complete Python course chapter 3',
        'createTask.errorDescription': 'Please enter a goal.',
        'createTask.aiButton': 'Generate AI Plan',
        'createTask.aiSuggestionTitle': 'AI Suggestion',
        'createTask.aiSuggestionText': 'Break down this task into 3 steps: 1. Review concepts, 2. Write code, 3. Test edge cases.',
        'createTask.platformLabel': 'Platform',
        'createTask.platformSubtext': 'Where you verify',
        'createTask.stakeLabel': 'Stake Amount',
        'createTask.stakeSubtext': 'Commitment pledge',
        'createTask.multiplierLabel': 'Risk Level',
        'createTask.multiplierSubtext': 'Boost stakes & rewards',
        'createTask.deadlineLabel': 'Deadline',
        'createTask.deadlineSubtext': 'Time to complete',
        'createTask.warning': 'Stake will be forfeited if not verified by deadline.',
        'createTask.confirmButton': 'Confirm & Stake',
        'createTask.disclaimer': 'Returned on completion',

        // Task Detail
        'taskDetail.title': 'Task Details',
        'taskDetail.currentStatus': 'Current Status',
        'taskDetail.progress': 'Progress',
        'taskDetail.agentVerification': 'Agent Verification',
        'taskDetail.method': 'Method',
        'taskDetail.proof': 'Proof',
        'taskDetail.verifyButton': 'Verify Task',
        'taskDetail.left': 'left',
        'taskDetail.dueNow': 'Due now',

        // Status
        'status.active': 'Active',
        'status.done': 'Done',
        'status.failed': 'Failed',
        'status.settled': 'Settled',

        // Wallet
        'wallet.selectWallet': 'Select Wallet',
        'wallet.noWalletDetected': 'No wallet detected',
        'wallet.installWalletHint': 'Please install a Web3 wallet extension',
        'wallet.multiWalletHint': 'Supports MetaMask, OKX, Rabby and more',
        'wallet.disconnect': 'Disconnect',
        'wallet.connected': 'Connected',
    },
    zh: {
        // Brand
        'brand.name': 'FocusFlow',

        // Common
        'common.connect': '连接钱包',
        'common.back': '返回',
        'common.cancel': '取消',
        'common.confirm': '确认',
        'common.error': '错误',
        'common.done': '完成',
        'common.jackpot': '奖金池',

        // Agent Panel
        'agent.title': 'AI 工作流',
        'agent.idle': '等待任务',
        'agent.idleHint': '提交证明后开始验证',
        'agent.working': '工作中',
        'agent.verifying': '正在验证任务:',
        'agent.verified': '验证通过 \u2713',
        'agent.failed': '验证失败 \u2717',
        'agent.confidence': '置信度:',

        // Leaderboard
        'leaderboard.title': '专注名人堂',
        'leaderboard.topPlayers': '硬核玩家榜',
        'leaderboard.recentWinners': '最近中奖者',

        // Home
        'home.active': '进行中',
        'home.done': '已完成',
        'home.total': '总计',
        'home.yourTasks': '我的任务',
        'home.newTask': '新任务',
        'home.noTasks': '暂无任务',
        'home.noTasksSubtitle': '质押加密货币，保持专注',
        'home.createTask': '创建任务',
        'home.due': '截止',

        // Create Task
        'createTask.title': '新建任务',
        'createTask.goalLabel': '你的目标是什么？',
        'createTask.goalPlaceholder': '例如：完成 Python 课程第3章',
        'createTask.errorDescription': '请输入任务目标。',
        'createTask.aiButton': '生成 AI 计划',
        'createTask.aiSuggestionTitle': 'AI 建议',
        'createTask.aiSuggestionText': '建议将任务拆解为3步：1.复习概念，2.编写代码，3.测试边界情况。',
        'createTask.platformLabel': '验证平台',
        'createTask.platformSubtext': '验证来源',
        'createTask.stakeLabel': '质押金额',
        'createTask.stakeSubtext': '承诺质押金',
        'createTask.multiplierLabel': '风险等级',
        'createTask.multiplierSubtext': '提高质押和奖励',
        'createTask.deadlineLabel': '截止时间',
        'createTask.deadlineSubtext': '完成时限',
        'createTask.warning': '若未在截止时间前通过验证，质押金将被没收。',
        'createTask.confirmButton': '确认并质押',
        'createTask.disclaimer': '完成任务后退还',

        // Task Detail
        'taskDetail.title': '任务详情',
        'taskDetail.currentStatus': '当前状态',
        'taskDetail.progress': '进度',
        'taskDetail.agentVerification': '智能体验证',
        'taskDetail.method': '验证方式',
        'taskDetail.proof': '链上证明',
        'taskDetail.verifyButton': '验证任务',
        'taskDetail.left': '剩余',
        'taskDetail.dueNow': '即将截止',

        // Status
        'status.active': '进行中',
        'status.done': '已完成',
        'status.failed': '失败',
        'status.settled': '已结算',

        // Wallet
        'wallet.selectWallet': '选择钱包',
        'wallet.noWalletDetected': '未检测到钱包',
        'wallet.installWalletHint': '请安装 Web3 钱包扩展',
        'wallet.multiWalletHint': '支持 MetaMask、OKX、Rabby 等钱包',
        'wallet.disconnect': '断开连接',
        'wallet.connected': '已连接',
    },
};

// ============ Context ============

const I18nContext = createContext<I18nContextType | undefined>(undefined);

// ============ Provider ============

interface I18nProviderProps {
    children: ReactNode;
    defaultLanguage?: Language;
}

export const I18nProvider: React.FC<I18nProviderProps> = ({
    children,
    defaultLanguage = 'en'
}) => {
    const [language, setLanguage] = useState<Language>(defaultLanguage);

    const t = useCallback((key: string): string => {
        return translations[language][key] || key;
    }, [language]);

    const toggleLanguage = useCallback(() => {
        setLanguage(prev => prev === 'en' ? 'zh' : 'en');
    }, []);

    return (
        <I18nContext.Provider value={{ language, t, toggleLanguage, setLanguage }}>
            {children}
        </I18nContext.Provider>
    );
};

// ============ Hook ============

export const useI18n = (): I18nContextType => {
    const context = useContext(I18nContext);
    if (!context) {
        throw new Error('useI18n must be used within I18nProvider');
    }
    return context;
};

// ============ Helper ============

/**
 * 替换翻译中的占位符
 * t('create.stakeButton').replace('{amount}', '0.1') 
 */
export const formatT = (text: string, params: Record<string, string | number>): string => {
    let result = text;
    Object.entries(params).forEach(([key, value]) => {
        result = result.replace(`{${key}}`, String(value));
    });
    return result;
};

export default {
    I18nProvider,
    useI18n,
    formatT,
};
