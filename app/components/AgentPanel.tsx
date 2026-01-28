/**
 * AgentPanel - AI 工作流面板组件
 * 
 * 显示 Agent 验证过程的实时状态
 */
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Animated,
    TouchableOpacity,
} from 'react-native';
import {
    Brain,
    CheckCircle,
    XCircle,
    Loader,
    Sparkles,
    ArrowRight,
    Zap
} from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useI18n } from '../context/I18nContext';
import { spacing, typography, borderRadius } from '../styles/tokens';
import FocusDragon, { FocusDragonMood } from './FocusDragon';
import { usePet } from '../context/PetContext';
import { useWallet } from '../context/WalletContext';

export type AgentStep = {
    id: string;
    label: string;
    status: 'pending' | 'running' | 'success' | 'failed';
    detail?: string;
};

export type AgentState = {
    isActive: boolean;
    currentTask?: string;
    steps: AgentStep[];
    result?: {
        verified: boolean;
        confidence: number;
        reason: string;
    };
};

interface AgentPanelProps {
    state: AgentState;
}

// 步骤图标
const StepIcon = ({ status }: { status: AgentStep['status'] }) => {
    const { colors } = useTheme();

    switch (status) {
        case 'running':
            return <Loader size={16} color={colors.primary[400]} />;
        case 'success':
            return <CheckCircle size={16} color={colors.semantic.success} />;
        case 'failed':
            return <XCircle size={16} color={colors.semantic.error} />;
        default:
            return <View style={[styles.pendingDot, { backgroundColor: colors.text.muted }]} />;
    }
};

// 单个步骤
const WorkflowStep = ({ step, isLast }: { step: AgentStep; isLast: boolean }) => {
    const { colors } = useTheme();
    const isActive = step.status === 'running';

    return (
        <View style={styles.stepRow}>
            <View style={styles.stepIconCol}>
                <StepIcon status={step.status} />
                {!isLast && (
                    <View style={[styles.stepLine, {
                        backgroundColor: step.status === 'success'
                            ? colors.semantic.success
                            : colors.border.subtle
                    }]} />
                )}
            </View>
            <View style={[styles.stepContent, isActive && styles.stepContentActive]}>
                <Text style={[
                    styles.stepLabel,
                    { color: isActive ? colors.text.primary : colors.text.secondary }
                ]}>
                    {step.label}
                </Text>
                {step.detail && (
                    <Text style={[styles.stepDetail, { color: colors.text.muted }]}>
                        {step.detail}
                    </Text>
                )}
            </View>
        </View>
    );
};

export default function AgentPanel({ state }: AgentPanelProps) {
    const { colors } = useTheme();
    const { t } = useI18n();
    const { isDead, revivePet, loading: petLoading } = usePet();
    const { isConnected: walletActive } = useWallet();

    const handleRevive = async () => {
        try {
            await revivePet();
        } catch (e) {
            console.error(e);
        }
    };

    // 根据 Agent 状态计算 Spoons mood
    const getFocusDragonMood = (): FocusDragonMood => {
        if (state.result) {
            return state.result.verified ? 'happy' : 'shaking';
        }
        if (state.isActive) {
            return 'thinking';
        }
        return 'neutral';
    };

    // 空闲状态
    if (!state.isActive && !state.result) {
        // 如果宠物死亡，显示复活界面
        if (isDead) {
            return (
                <View style={styles.container}>
                    <View style={styles.header}>
                        <Brain size={20} color={colors.text.muted} />
                        <Text style={[styles.headerTitle, { color: colors.text.muted }]}>
                            {t('agent.title')}
                        </Text>
                    </View>
                    <View style={styles.idleState}>
                        <FocusDragon mood="dead" size={100} />
                        <Text style={[styles.idleText, { color: colors.semantic.error }]}>
                            Spoons has fainted!
                        </Text>
                        <Text style={[styles.idleHint, { color: colors.text.secondary }]}>
                            Revive Spoons to continue completing tasks.
                        </Text>

                        <View style={styles.reviveContainer}>
                            <View style={styles.costTag}>
                                <Text style={styles.costText}>Cost: 0.01 ETH</Text>
                            </View>
                            <TouchableOpacity
                                style={[styles.reviveButton, { backgroundColor: colors.primary[500], opacity: petLoading ? 0.7 : 1 }]}
                                onPress={handleRevive}
                                disabled={petLoading}
                            >
                                {petLoading ? <Loader size={18} color="#000" /> : <Zap size={18} color="#000" />}
                                <Text style={styles.reviveButtonText}>Revive Spoons</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            );
        }

        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <Brain size={20} color={colors.text.muted} />
                    <Text style={[styles.headerTitle, { color: colors.text.muted }]}>
                        {t('agent.title')}
                    </Text>
                </View>

                <View style={styles.idleState}>
                    {/* Focus Dragon 吉祥物 */}
                    <FocusDragon mood="neutral" size={100} />
                    <Text style={[styles.idleText, { color: colors.text.muted }]}>
                        {t('agent.idle')}
                    </Text>
                    <Text style={[styles.idleHint, { color: colors.text.tertiary }]}>
                        {t('agent.idleHint')}
                    </Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Focus Dragon 吉祥物 - 工作状态 */}
            <View style={styles.spoonsContainer}>
                <FocusDragon mood={getFocusDragonMood()} size={80} />
            </View>

            {/* Header */}
            <View style={styles.header}>
                <Brain size={20} color={colors.primary[400]} />
                <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
                    {t('agent.title')}
                </Text>
                {state.isActive && (
                    <View style={[styles.activeBadge, { backgroundColor: colors.primary[500] }]}>
                        <Text style={styles.activeBadgeText}>{t('agent.working')}</Text>
                    </View>
                )}
            </View>

            {/* Current Task */}
            {state.currentTask && (
                <View style={[styles.taskBox, {
                    backgroundColor: colors.glass.backgroundLight,
                    borderColor: colors.border.subtle
                }]}>
                    <Text style={[styles.taskLabel, { color: colors.text.muted }]}>
                        {t('agent.verifying')}
                    </Text>
                    <Text style={[styles.taskText, { color: colors.text.primary }]} numberOfLines={2}>
                        {state.currentTask}
                    </Text>
                </View>
            )}

            {/* Workflow Steps */}
            <ScrollView style={styles.stepsContainer} showsVerticalScrollIndicator={false}>
                {state.steps.map((step, index) => (
                    <WorkflowStep
                        key={step.id}
                        step={step}
                        isLast={index === state.steps.length - 1}
                    />
                ))}
            </ScrollView>

            {/* Result */}
            {state.result && (
                <View style={[
                    styles.resultBox,
                    {
                        backgroundColor: state.result.verified
                            ? colors.semantic.successLight
                            : colors.semantic.errorLight,
                        borderColor: state.result.verified
                            ? colors.semantic.success
                            : colors.semantic.error
                    }
                ]}>
                    <View style={styles.resultHeader}>
                        {state.result.verified ? (
                            <CheckCircle size={24} color={colors.semantic.success} />
                        ) : (
                            <XCircle size={24} color={colors.semantic.error} />
                        )}
                        <Text style={[
                            styles.resultTitle,
                            { color: state.result.verified ? colors.semantic.success : colors.semantic.error }
                        ]}>
                            {state.result.verified ? t('agent.verified') : t('agent.failed')}
                        </Text>
                    </View>
                    <Text style={[styles.resultReason, { color: colors.text.secondary }]}>
                        {state.result.reason}
                    </Text>
                    <View style={styles.confidenceRow}>
                        <Text style={[styles.confidenceLabel, { color: colors.text.muted }]}>
                            {t('agent.confidence')}
                        </Text>
                        <Text style={[styles.confidenceValue, { color: colors.text.primary }]}>
                            {Math.round(state.result.confidence * 100)}%
                        </Text>
                    </View>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: spacing.xl,
    },
    // 复活样式
    reviveContainer: {
        marginTop: spacing.xl,
        alignItems: 'center',
        gap: spacing.md,
        width: '100%',
    },
    costTag: {
        backgroundColor: 'rgba(0,0,0,0.05)',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.full,
    },
    costText: {
        fontSize: typography.fontSize.xs,
        fontWeight: typography.fontWeight.medium,
        color: '#666',
    },
    reviveButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.xl,
        borderRadius: borderRadius.lg,
        width: '100%',
        maxWidth: 200,
    },
    reviveButtonText: {
        color: '#000',
        fontWeight: typography.fontWeight.bold,
        fontSize: typography.fontSize.sm,
    },
    spoonsContainer: {
        alignItems: 'center',
        marginBottom: spacing.md,
    },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        marginBottom: spacing.xl,
    },
    headerTitle: {
        fontSize: typography.fontSize.lg,
        fontWeight: typography.fontWeight.semibold,
        flex: 1,
    },
    activeBadge: {
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.full,
    },
    activeBadgeText: {
        color: '#000',
        fontSize: typography.fontSize.xs,
        fontWeight: typography.fontWeight.bold,
    },

    // Idle State
    idleState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    idleIcon: {
        width: 80,
        height: 80,
        borderRadius: borderRadius.full,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.xl,
    },
    idleText: {
        fontSize: typography.fontSize.base,
        fontWeight: typography.fontWeight.medium,
        marginBottom: spacing.sm,
    },
    idleHint: {
        fontSize: typography.fontSize.sm,
        textAlign: 'center',
    },

    // Task Box
    taskBox: {
        padding: spacing.md,
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        marginBottom: spacing.xl,
    },
    taskLabel: {
        fontSize: typography.fontSize.xs,
        fontWeight: typography.fontWeight.medium,
        marginBottom: spacing.xs,
    },
    taskText: {
        fontSize: typography.fontSize.sm,
        fontWeight: typography.fontWeight.medium,
    },

    // Steps
    stepsContainer: {
        flex: 1,
    },
    stepRow: {
        flexDirection: 'row',
        marginBottom: spacing.md,
    },
    stepIconCol: {
        alignItems: 'center',
        marginRight: spacing.md,
    },
    stepLine: {
        width: 2,
        flex: 1,
        marginTop: spacing.xs,
    },
    pendingDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    stepContent: {
        flex: 1,
        paddingBottom: spacing.md,
    },
    stepContentActive: {
        opacity: 1,
    },
    stepLabel: {
        fontSize: typography.fontSize.sm,
        fontWeight: typography.fontWeight.medium,
    },
    stepDetail: {
        fontSize: typography.fontSize.xs,
        marginTop: spacing.xs,
    },

    // Result
    resultBox: {
        padding: spacing.lg,
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        marginTop: spacing.xl,
    },
    resultHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        marginBottom: spacing.md,
    },
    resultTitle: {
        fontSize: typography.fontSize.lg,
        fontWeight: typography.fontWeight.bold,
    },
    resultReason: {
        fontSize: typography.fontSize.sm,
        lineHeight: typography.fontSize.sm * typography.lineHeight.relaxed,
        marginBottom: spacing.md,
    },
    confidenceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    confidenceLabel: {
        fontSize: typography.fontSize.xs,
    },
    confidenceValue: {
        fontSize: typography.fontSize.sm,
        fontWeight: typography.fontWeight.bold,
    },
});
