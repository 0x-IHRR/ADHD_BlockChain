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
import HoverableView from './HoverableView';

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
        <View style={styles.container}>
            {/* Focus Score - 大圆圈 (直接从这里开始，无标题) */}
            <HoverableView style={[styles.scoreSection, { backgroundColor: colors.glass.backgroundLight }]} effect="scale" scaleAmount={1.05}>
                <View style={[styles.scoreCircle, { borderColor: getScoreColor(profile.focusScore) }]}>
                    <Text style={[styles.scoreValue, { color: getScoreColor(profile.focusScore) }]}>
                        {profile.focusScore}
                    </Text>
                </View>
                <Text style={[styles.metricLabel, { color: colors.text.muted }]}>
                    {texts.focusScore}
                </Text>
            </HoverableView>

            {/* Streak 连续天数 */}
            <HoverableView style={[styles.metricCard, { backgroundColor: colors.glass.backgroundLight }]} effect="lift" liftAmount={-3}>
                <Text style={[styles.streakValue, { color: colors.semantic.warning }]}>
                    🔥 {profile.streak}
                </Text>
                <Text style={[styles.metricLabel, { color: colors.text.muted }]}>
                    {texts.streak}
                </Text>
            </HoverableView>

            {/* Weekly Goal 本周目标 */}
            <HoverableView style={[styles.metricCard, { backgroundColor: colors.glass.backgroundLight }]} effect="lift" liftAmount={-3}>
                <Text style={[styles.metricCardLabel, { color: colors.text.muted }]}>
                    {texts.weeklyGoal}
                </Text>
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
            </HoverableView>

            {/* 优势标签 */}
            <View style={styles.tagsSection}>
                <Text style={[styles.sectionLabel, { color: colors.text.muted }]}>
                    {texts.strengths}
                </Text>
                <View style={styles.tagsColumn}>
                    {profile.strengths.map((s, i) => (
                        <HoverableView
                            key={i}
                            style={[styles.tag, { backgroundColor: colors.semantic.success + '20' }]}
                            effect="scale"
                            scaleAmount={1.05}
                        >
                            {s.icon === 'zap' ? (
                                <Zap size={14} color={colors.semantic.success} />
                            ) : (
                                <Award size={14} color={colors.semantic.success} />
                            )}
                            <Text style={[styles.tagText, { color: colors.semantic.success }]}>
                                {texts[s.key as keyof typeof texts] || s.key}
                            </Text>
                        </HoverableView>
                    ))}
                </View>
            </View>

            {/* 改进建议 */}
            {profile.improvements.length > 0 && (
                <View style={styles.improvementSection}>
                    <HoverableView style={[styles.improvementCard, { backgroundColor: colors.semantic.warning + '15' }]} effect="scale" scaleAmount={1.03}>
                        <AlertTriangle size={16} color={colors.semantic.warning} />
                        <Text style={[styles.improvementText, { color: colors.text.secondary }]}>
                            {texts[profile.improvements[0].key as keyof typeof texts] || profile.improvements[0].key}
                        </Text>
                    </HoverableView>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        // 不设背景，由 sidePanel 容器处理
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
    },
    title: {
        fontSize: typography.fontSize.base,
        fontWeight: '600',
    },
    scoreSection: {
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        marginBottom: spacing.md,
        alignItems: 'center',
    },
    scoreCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        borderWidth: 4,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    scoreValue: {
        fontSize: typography.fontSize.xl,
        fontWeight: '700',
    },
    metricCard: {
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        marginBottom: spacing.md,
        alignItems: 'center',
    },
    metricCardLabel: {
        fontSize: typography.fontSize.xs,
        marginBottom: spacing.sm,
    },
    metricLabel: {
        fontSize: typography.fontSize.sm,
    },
    streakValue: {
        fontSize: typography.fontSize.lg,
        fontWeight: '700',
    },
    progressBg: {
        width: '100%',
        height: 10,
        borderRadius: 5,
        overflow: 'hidden',
        marginBottom: spacing.xs,
    },
    progressFill: {
        height: '100%',
        borderRadius: 5,
    },
    progressText: {
        fontSize: typography.fontSize.sm,
        fontWeight: '600',
    },
    tagsSection: {
        marginBottom: spacing.lg,
    },
    sectionLabel: {
        fontSize: typography.fontSize.xs,
        marginBottom: spacing.sm,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    tagsColumn: {
        flexDirection: 'column',
        gap: spacing.sm,
    },
    tag: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.lg,
    },
    tagText: {
        fontSize: typography.fontSize.sm,
        fontWeight: '500',
    },
    improvementSection: {
        marginTop: spacing.sm,
    },
    improvementCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        padding: spacing.md,
        borderRadius: borderRadius.lg,
    },
    improvementText: {
        fontSize: typography.fontSize.sm,
        flex: 1,
    },
});
