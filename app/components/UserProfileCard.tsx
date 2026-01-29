/**
 * UserProfileCard - AI 用户画像卡片
 * 
 * 显示 AI 分析的用户习惯、优缺点和建议
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Brain, TrendingUp, AlertTriangle, Target, Zap, Award } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useI18n } from '../context/I18nContext';
import { spacing, typography, borderRadius } from '../styles/tokens';
import { MOCK_CONFIG } from '../config/demo';

// Mock 用户画像数据
const MOCK_PROFILE = {
    focusScore: 78,
    streak: 5,
    strengths: [
        { key: 'efficient', icon: 'zap' },
        { key: 'punctual', icon: 'award' },
    ],
    improvements: [
        { key: 'weekendSlump', priority: 'medium' },
    ],
    weeklyGoal: {
        target: 10,
        completed: 7,
    },
};

interface UserProfileCardProps {
    compact?: boolean;
}

export default function UserProfileCard({ compact = false }: UserProfileCardProps) {
    const { colors } = useTheme();
    const { language } = useI18n();

    const isZh = language === 'zh';

    // Mock 数据 (后续可接入真实 AI 分析)
    const profile = MOCK_PROFILE;
    const progress = Math.round((profile.weeklyGoal.completed / profile.weeklyGoal.target) * 100);

    // 文案
    const texts = {
        title: isZh ? '✨ AI 分析' : '✨ AI Insights',
        focusScore: isZh ? '专注力' : 'Focus',
        streak: isZh ? '连续天数' : 'Streak',
        strengths: isZh ? '你的优势' : 'Strengths',
        improvements: isZh ? '改进建议' : 'To Improve',
        weeklyGoal: isZh ? '本周目标' : 'Weekly Goal',
        efficient: isZh ? '高效完成者' : 'Fast Finisher',
        punctual: isZh ? '准时达人' : 'On-Time Pro',
        weekendSlump: isZh ? '周末完成率偏低' : 'Weekend slump',
    };

    // 根据分数获取颜色
    const getScoreColor = (score: number) => {
        if (score >= 80) return colors.semantic.success;
        if (score >= 60) return colors.semantic.warning;
        return colors.semantic.error;
    };

    return (
        <View style={[styles.container, {
            backgroundColor: colors.glass.background,
            borderColor: colors.glass.border,
        }]}>
            {/* 标题行 */}
            <View style={styles.header}>
                <View style={styles.titleRow}>
                    <Brain size={16} color={colors.primary[400]} />
                    <Text style={[styles.title, { color: colors.text.primary }]}>
                        {texts.title}
                    </Text>
                </View>
            </View>

            {/* 核心指标 */}
            <View style={styles.metricsRow}>
                {/* Focus Score */}
                <View style={styles.metricItem}>
                    <View style={[styles.scoreCircle, { borderColor: getScoreColor(profile.focusScore) }]}>
                        <Text style={[styles.scoreValue, { color: getScoreColor(profile.focusScore) }]}>
                            {profile.focusScore}
                        </Text>
                    </View>
                    <Text style={[styles.metricLabel, { color: colors.text.muted }]}>
                        {texts.focusScore}
                    </Text>
                </View>

                {/* Streak */}
                <View style={styles.metricItem}>
                    <View style={[styles.streakBadge, { backgroundColor: colors.semantic.warning + '20' }]}>
                        <Text style={[styles.streakValue, { color: colors.semantic.warning }]}>
                            🔥 {profile.streak}
                        </Text>
                    </View>
                    <Text style={[styles.metricLabel, { color: colors.text.muted }]}>
                        {texts.streak}
                    </Text>
                </View>

                {/* Weekly Progress */}
                <View style={styles.metricItem}>
                    <View style={styles.progressContainer}>
                        <View style={[styles.progressBg, { backgroundColor: colors.background.tertiary }]}>
                            <View
                                style={[
                                    styles.progressFill,
                                    {
                                        backgroundColor: colors.primary[500],
                                        width: `${Math.min(progress, 100)}%`
                                    }
                                ]}
                            />
                        </View>
                        <Text style={[styles.progressText, { color: colors.text.secondary }]}>
                            {profile.weeklyGoal.completed}/{profile.weeklyGoal.target}
                        </Text>
                    </View>
                    <Text style={[styles.metricLabel, { color: colors.text.muted }]}>
                        {texts.weeklyGoal}
                    </Text>
                </View>
            </View>

            {/* 优势标签 */}
            {!compact && (
                <View style={styles.tagsSection}>
                    <Text style={[styles.sectionLabel, { color: colors.text.muted }]}>
                        {texts.strengths}
                    </Text>
                    <View style={styles.tagsRow}>
                        {profile.strengths.map((s, i) => (
                            <View
                                key={i}
                                style={[styles.tag, { backgroundColor: colors.semantic.success + '20' }]}
                            >
                                {s.icon === 'zap' ? (
                                    <Zap size={12} color={colors.semantic.success} />
                                ) : (
                                    <Award size={12} color={colors.semantic.success} />
                                )}
                                <Text style={[styles.tagText, { color: colors.semantic.success }]}>
                                    {texts[s.key as keyof typeof texts] || s.key}
                                </Text>
                            </View>
                        ))}
                    </View>
                </View>
            )}

            {/* 改进建议 */}
            {!compact && profile.improvements.length > 0 && (
                <View style={styles.improvementSection}>
                    <View style={[styles.improvementCard, { backgroundColor: colors.semantic.warning + '10' }]}>
                        <AlertTriangle size={14} color={colors.semantic.warning} />
                        <Text style={[styles.improvementText, { color: colors.text.secondary }]}>
                            {texts[profile.improvements[0].key as keyof typeof texts] || profile.improvements[0].key}
                        </Text>
                    </View>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        padding: spacing.md,
        marginBottom: spacing.md,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
    },
    title: {
        fontSize: typography.fontSize.sm,
        fontWeight: '600',
    },
    metricsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: spacing.md,
    },
    metricItem: {
        alignItems: 'center',
        flex: 1,
    },
    scoreCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        borderWidth: 3,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.xs,
    },
    scoreValue: {
        fontSize: typography.fontSize.lg,
        fontWeight: '700',
    },
    streakBadge: {
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.md,
        marginBottom: spacing.xs,
    },
    streakValue: {
        fontSize: typography.fontSize.base,
        fontWeight: '600',
    },
    metricLabel: {
        fontSize: typography.fontSize.xs,
    },
    progressContainer: {
        width: '100%',
        alignItems: 'center',
        marginBottom: spacing.xs,
    },
    progressBg: {
        width: '80%',
        height: 8,
        borderRadius: 4,
        overflow: 'hidden',
        marginBottom: 4,
    },
    progressFill: {
        height: '100%',
        borderRadius: 4,
    },
    progressText: {
        fontSize: typography.fontSize.xs,
        fontWeight: '500',
    },
    tagsSection: {
        marginBottom: spacing.sm,
    },
    sectionLabel: {
        fontSize: typography.fontSize.xs,
        marginBottom: spacing.xs,
    },
    tagsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.xs,
    },
    tag: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.full,
    },
    tagText: {
        fontSize: typography.fontSize.xs,
        fontWeight: '500',
    },
    improvementSection: {
        marginTop: spacing.xs,
    },
    improvementCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        padding: spacing.sm,
        borderRadius: borderRadius.md,
    },
    improvementText: {
        fontSize: typography.fontSize.xs,
        flex: 1,
    },
});
