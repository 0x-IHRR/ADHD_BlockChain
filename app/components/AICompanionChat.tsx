import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Animated as RNAnimated } from 'react-native';
import { TypewriterText } from './TypewriterText';
import { useTheme } from '../context/ThemeContext';
import { useI18n } from '../context/I18nContext';
import { spacing, borderRadius, typography } from '../styles/tokens';
import { MessageCircle, Sparkles, Heart, Coffee, Moon, Zap } from 'lucide-react-native';

export type MessageEmotion = 'encourage' | 'tease' | 'comfort' | 'celebrate' | 'idle' | 'warning';

export interface AIMessage {
    id: string;
    text: string;
    emotion: MessageEmotion;
    timestamp: Date;
}

interface AICompanionChatProps {
    messages: AIMessage[];
    isTyping?: boolean;
    maxVisibleMessages?: number;
}

// Emotion to icon mapping
const emotionIcons: Record<MessageEmotion, React.FC<any>> = {
    encourage: Zap,
    tease: Coffee,
    comfort: Heart,
    celebrate: Sparkles,
    idle: MessageCircle,
    warning: Moon,
};

// Emotion to color mapping
const getEmotionColor = (emotion: MessageEmotion, colors: any) => {
    switch (emotion) {
        case 'encourage': return colors.primary[500];
        case 'tease': return colors.accent.purple;
        case 'comfort': return colors.semantic.warning;
        case 'celebrate': return colors.primary[400];
        case 'idle': return colors.text.muted;
        case 'warning': return colors.semantic.error;
        default: return colors.text.muted;
    }
};

/**
 * AICompanionChat - AI 伙伴聊天容器
 * 显示 AI 朋友的消息，带打字机效果
 */
export const AICompanionChat: React.FC<AICompanionChatProps> = ({
    messages,
    isTyping = false,
    maxVisibleMessages = 5
}) => {
    const { colors } = useTheme();
    const { t } = useI18n();
    const scrollViewRef = useRef<ScrollView>(null);
    const [currentTypingIndex, setCurrentTypingIndex] = useState(-1);
    const [typedMessages, setTypedMessages] = useState<Set<string>>(new Set());

    // Track which message is currently being typed
    useEffect(() => {
        if (messages.length > 0) {
            const latestMessage = messages[messages.length - 1];
            if (!typedMessages.has(latestMessage.id)) {
                setCurrentTypingIndex(messages.length - 1);
            }
        }
    }, [messages]);

    // Scroll to bottom when new message arrives
    useEffect(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
    }, [messages.length]);

    const handleTypingComplete = (messageId: string) => {
        setTypedMessages(prev => new Set(prev).add(messageId));
        setCurrentTypingIndex(-1);
    };

    const visibleMessages = messages.slice(-maxVisibleMessages);

    const formatTime = (date: Date) => {
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) return '刚刚';
        if (diffMins < 60) return `${diffMins} 分钟前`;
        if (diffMins < 1440) return `${Math.floor(diffMins / 60)} 小时前`;
        return date.toLocaleDateString('zh-CN');
    };

    return (
        <View style={styles.container}>
            {/* Messages - Clean, no header */}
            <ScrollView
                ref={scrollViewRef}
                style={styles.messagesContainer}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.messagesContent}
            >
                {visibleMessages.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text style={[styles.emptyText, { color: colors.text.tertiary }]}>
                            {isTyping ? t('ai.typing') : t('ai.empty')}
                        </Text>
                    </View>
                ) : (
                    visibleMessages.map((message, index) => {
                        const Icon = emotionIcons[message.emotion];
                        const emotionColor = getEmotionColor(message.emotion, colors);
                        const isCurrentlyTyping = messages.indexOf(message) === currentTypingIndex;
                        const isAlreadyTyped = typedMessages.has(message.id);

                        return (
                            <View key={message.id} style={styles.messageWrapper}>
                                {/* Message content - 无背景，文字从虚空浮现 */}
                                <View style={styles.messageBubble}>
                                    {isCurrentlyTyping && !isAlreadyTyped ? (
                                        <TypewriterText
                                            text={message.text}
                                            speed={35}
                                            style={{ ...styles.messageText, color: colors.text.secondary }}
                                            onComplete={() => handleTypingComplete(message.id)}
                                        />
                                    ) : (
                                        <Text style={[styles.messageText, { color: colors.text.secondary }]}>
                                            {message.text}
                                        </Text>
                                    )}
                                </View>
                            </View>
                        );
                    })
                )}
            </ScrollView>

            {/* Typing indicator */}
            {isTyping && currentTypingIndex === -1 && (
                <View style={styles.typingIndicator}>
                    <TypingDots color={colors.primary[500]} />
                    <Text style={[styles.typingText, { color: colors.text.muted }]}>
                        Dragon 正在输入...
                    </Text>
                </View>
            )}
        </View>
    );
};

// Typing dots animation
const TypingDots: React.FC<{ color: string }> = ({ color }) => {
    const dot1 = useRef(new RNAnimated.Value(0)).current;
    const dot2 = useRef(new RNAnimated.Value(0)).current;
    const dot3 = useRef(new RNAnimated.Value(0)).current;

    useEffect(() => {
        const animateDot = (dot: RNAnimated.Value, delay: number) => {
            RNAnimated.loop(
                RNAnimated.sequence([
                    RNAnimated.delay(delay),
                    RNAnimated.timing(dot, { toValue: 1, duration: 300, useNativeDriver: true }),
                    RNAnimated.timing(dot, { toValue: 0, duration: 300, useNativeDriver: true }),
                ])
            ).start();
        };

        animateDot(dot1, 0);
        animateDot(dot2, 150);
        animateDot(dot3, 300);
    }, []);

    return (
        <View style={typingDotsStyles.container}>
            {[dot1, dot2, dot3].map((dot, i) => (
                <RNAnimated.View
                    key={i}
                    style={[
                        typingDotsStyles.dot,
                        { backgroundColor: color },
                        {
                            transform: [{
                                translateY: dot.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [0, -4]
                                })
                            }]
                        }
                    ]}
                />
            ))}
        </View>
    );
};

const typingDotsStyles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        marginRight: spacing.sm,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
});

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        marginBottom: spacing.md,
    },
    headerText: {
        fontSize: typography.fontSize.xs,
        fontWeight: typography.fontWeight.medium,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    messagesContainer: {
        flex: 1,
    },
    messagesContent: {
        gap: spacing.md,
        paddingBottom: spacing.md,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: spacing['4xl'],
    },
    emptyText: {
        fontSize: typography.fontSize.sm,
        fontStyle: 'italic',
    },
    messageWrapper: {
        gap: spacing.xs,
    },
    emotionBadge: {
        alignSelf: 'flex-start',
        padding: spacing.xs,
        borderRadius: borderRadius.full,
        marginBottom: spacing.xs,
    },
    messageBubble: {
        paddingVertical: spacing.xs,
        paddingHorizontal: spacing.sm,
        // 无背景、无边框，文字从背景虚空浮现
    },
    messageText: {
        fontSize: typography.fontSize.sm,
        lineHeight: typography.fontSize.sm * 1.5,
    },
    timestamp: {
        fontSize: typography.fontSize.xs,
        marginLeft: spacing.xs,
    },
    typingIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: spacing.sm,
    },
    typingText: {
        fontSize: typography.fontSize.xs,
    },
});

export default AICompanionChat;
