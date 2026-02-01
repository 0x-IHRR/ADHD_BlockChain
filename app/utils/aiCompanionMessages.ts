/**
 * Time Gamble AI Companion - Message Bank
 * 
 * 荷官人格设定：
 * - 身份：时间赌场的首席荷官
 * - 语气：专业、有仪式感、略带幽默
 * - 核心理念：用赌的刺激驱动成长，赌注是时间，赢的是更好的自己
 * - 禁忌：绝不鼓励真正的赌博或消极行为
 */

import { MessageEmotion, AIMessage } from '../components/AICompanionChat';

// ============================================
// 场景化消息模板
// ============================================

export interface MessageTemplate {
    id: string;
    text: string;
    emotion: MessageEmotion;
    trigger: MessageTrigger;
}

export type MessageTrigger =
    | 'welcome'           // 首次进入
    | 'idle_short'        // 空闲 5 分钟
    | 'idle_long'         // 空闲 15 分钟
    | 'task_created'      // 创建任务
    | 'task_started'      // 开始任务
    | 'task_completed'    // 完成任务
    | 'task_failed'       // 任务失败
    | 'streak_3'          // 连续 3 天
    | 'streak_7'          // 连续 7 天
    | 'low_energy'        // 宠物精力低
    | 'high_stakes'       // 高额质押
    | 'comeback';         // 久违回归

// ============================================
// 消息库
// ============================================

export const MESSAGE_BANK: MessageTemplate[] = [
    // === 欢迎场景 ===
    {
        id: 'welcome_1',
        text: '欢迎来到时间赌场！今天你准备下多大的注？记住，赌的不是钱，是你的未来。',
        emotion: 'encourage',
        trigger: 'welcome',
    },
    {
        id: 'welcome_2',
        text: '又见面了，赌徒。每一次你坐到这张桌前，都是在和过去的自己对赌。准备好赢了吗？',
        emotion: 'encourage',
        trigger: 'welcome',
    },

    // === 空闲催促 ===
    {
        id: 'idle_short_1',
        text: '看起来你在观望...在赌场里，不下注的人永远赢不了。找个任务，押上你的时间吧！',
        emotion: 'idle',
        trigger: 'idle_short',
    },
    {
        id: 'idle_short_2',
        text: '赌桌上最可惜的，不是输，而是从没敢玩。来，选张牌。',
        emotion: 'idle',
        trigger: 'idle_short',
    },
    {
        id: 'idle_long_1',
        text: '你已经离开赌桌15分钟了...没关系，高手都懂得休息。但记住，牌桌一直为你保留。',
        emotion: 'comfort',
        trigger: 'idle_long',
    },

    // === 创建任务 ===
    {
        id: 'task_created_1',
        text: '新赌局已开！筹码已放上桌面，接下来，就看你的牌技了。All in 你的专注力！',
        emotion: 'encourage',
        trigger: 'task_created',
    },
    {
        id: 'task_created_2',
        text: '好胆！敢下注就是好赌徒。这局牌，我看好你。',
        emotion: 'celebrate',
        trigger: 'task_created',
    },

    // === 开始任务 ===
    {
        id: 'task_started_1',
        text: '计时开始！赌场的规则很简单：在时间耗尽前完成，你就赢了。加油！',
        emotion: 'encourage',
        trigger: 'task_started',
    },

    // === 完成任务 ===
    {
        id: 'task_completed_1',
        text: '恭喜你赢了这局！看，赌未来比赌钱更刺激，因为赢家拿走的是成长。',
        emotion: 'celebrate',
        trigger: 'task_completed',
    },
    {
        id: 'task_completed_2',
        text: '筹码落袋为安！你证明了自己的执行力。这才是真正的"稳赚不赔"。',
        emotion: 'celebrate',
        trigger: 'task_completed',
    },
    {
        id: 'task_completed_3',
        text: '漂亮！这手牌打得真好。下一局，敢不敢加大注码？',
        emotion: 'tease',
        trigger: 'task_completed',
    },

    // === 任务失败 ===
    {
        id: 'task_failed_1',
        text: '这局输了，但好赌徒不会因为一手牌就离开牌桌。调整策略，下一局再来。',
        emotion: 'comfort',
        trigger: 'task_failed',
    },
    {
        id: 'task_failed_2',
        text: '输了筹码不可怕，可怕的是输了再战的勇气。时间赌场永远欢迎敢于再来的人。',
        emotion: 'comfort',
        trigger: 'task_failed',
    },

    // === 连续记录 ===
    {
        id: 'streak_3',
        text: '连续 3 天完成任务！你开始有职业赌徒的样子了。继续保持手感！',
        emotion: 'celebrate',
        trigger: 'streak_3',
    },
    {
        id: 'streak_7',
        text: '连续 7 天！在时间赌场，你已经是 VIP 玩家了。普通人早就离场，你还在。',
        emotion: 'celebrate',
        trigger: 'streak_7',
    },

    // === 高额质押 ===
    {
        id: 'high_stakes_1',
        text: '大手笔啊！高额质押说明你认真了。好，这局我亲自给你发牌。',
        emotion: 'encourage',
        trigger: 'high_stakes',
    },

    // === 回归 ===
    {
        id: 'comeback_1',
        text: '好久不见，赌徒。你的专属座位一直留着。准备好重新入局了吗？',
        emotion: 'encourage',
        trigger: 'comeback',
    },

    // === 宠物低能量 ===
    {
        id: 'low_energy_1',
        text: '你的小龙看起来有点累了...失败会让它受伤，照顾好你的伙伴！',
        emotion: 'warning',
        trigger: 'low_energy',
    },
    {
        id: 'low_energy_2',
        text: 'Spoons 能量快耗尽了！连续失败会让它倒下。慎重选择你的下一场赌局。',
        emotion: 'warning',
        trigger: 'low_energy',
    },
];

// ============================================
// 工具函数
// ============================================

/**
 * 根据触发事件获取随机消息
 */
export const getRandomMessage = (trigger: MessageTrigger): MessageTemplate => {
    const candidates = MESSAGE_BANK.filter(m => m.trigger === trigger);
    if (candidates.length === 0) {
        // Fallback
        return MESSAGE_BANK[0];
    }
    return candidates[Math.floor(Math.random() * candidates.length)];
};

/**
 * 将模板转换为 AIMessage
 */
export const createAIMessage = (template: MessageTemplate): AIMessage => ({
    id: `${template.id}_${Date.now()}`,
    text: template.text,
    emotion: template.emotion,
    timestamp: new Date(),
});
