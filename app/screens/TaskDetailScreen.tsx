import React, { useMemo, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { ArrowLeft, CheckCircle, Clock, AlertCircle, Share2, ExternalLink, ShieldCheck } from 'lucide-react-native';
import { useTasks, TaskStatus } from '../context/AppContext';
import { useWallet } from '../context/WalletContext';
import { useI18n } from '../context/I18nContext';
import { useTheme } from '../context/ThemeContext';
import { spacing, typography, borderRadius, shadows } from '../styles/tokens';
import { ThemeColors } from '../styles/themes';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { FadeInView, PulseGlow } from '../styles/animations';
import { VerifyModal } from '../components';

const MAX_WIDTH = 480;

type DetailsScreenRouteProp = RouteProp<RootStackParamList, 'TaskDetail'>;

export default function TaskDetailScreen() {
    const navigation = useNavigation();
    const route = useRoute<DetailsScreenRouteProp>();
    const { tasks, updateTaskStatus } = useTasks();
    const { address } = useWallet();
    const { t } = useI18n();
    const { colors } = useTheme();
    const task = tasks.find(t => t.id === route.params.taskId);

    // VerifyModal 状态
    const [verifyModalVisible, setVerifyModalVisible] = useState(false);

    const styles = useMemo(() => getStyles(colors), [colors]);

    if (!task) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
                <SafeAreaView>
                    <Text style={{ color: colors.text.primary, textAlign: 'center', marginTop: 20 }}>
                        {t('common.error')}
                    </Text>
                </SafeAreaView>
            </View>
        );
    }

    const handleVerify = () => {
        // 打开验证模态框
        setVerifyModalVisible(true);
    };

    const handleVerificationComplete = (result: any) => {
        // 更新任务状态
        updateTaskStatus(task.id, result.verified ? 'verified' : 'failed');
        setVerifyModalVisible(false);
    };

    // 进度条组件
    const ProgressBar = ({ progress, color }: { progress: number; color: string }) => {
        return (
            <View style={[styles.progressContainer, { backgroundColor: colors.border.default }]}>
                <View style={[styles.progressBar, { width: `${progress * 100}%`, backgroundColor: color }]} />
            </View>
        );
    };

    // 状态卡片组件
    const StatusCard = ({ status, color, icon: Icon, label }: any) => {
        return (
            <View style={[styles.statusCard, { backgroundColor: colors.background.tertiary, borderColor: colors.border.subtle }]}>
                <View style={[styles.statusIconContainer, { backgroundColor: colors.glass.backgroundLight }]}>
                    <Icon size={24} color={color} />
                </View>
                <View style={styles.statusContent}>
                    <Text style={[styles.statusLabel, { color: colors.text.muted }]}>{label}</Text>
                    <Text style={[styles.statusValue, { color }]}>{status}</Text>
                </View>
            </View>
        );
    };

    const statusConfig = {
        pending: { label: t('status.active'), color: colors.semantic.warning, icon: Clock, progress: 0.3 },
        verified: { label: t('status.done'), color: colors.semantic.success, icon: CheckCircle, progress: 0.8 },
        failed: { label: t('status.failed'), color: colors.semantic.error, icon: AlertCircle, progress: 1.0 },
        settled: { label: t('status.settled'), color: colors.primary[500], icon: CheckCircle, progress: 1.0 },
    };

    const currentStatus = statusConfig[task.status];

    return (
        <View style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.centeredWrapper}>
                    {/* Header */}
                    <FadeInView delay={0}>
                        <View style={styles.header}>
                            <TouchableOpacity
                                onPress={() => navigation.goBack()}
                                style={styles.backButton}
                            >
                                <ArrowLeft size={20} color={colors.text.primary} />
                            </TouchableOpacity>
                            <Text style={styles.headerTitle}>{t('taskDetail.title')}</Text>
                            <TouchableOpacity style={styles.shareButton}>
                                <Share2 size={20} color={colors.text.primary} />
                            </TouchableOpacity>
                        </View>
                    </FadeInView>

                    <ScrollView contentContainerStyle={styles.scrollContent}>
                        {/* Status Section */}
                        <FadeInView delay={50}>
                            <StatusCard
                                status={currentStatus.label}
                                label={t('taskDetail.currentStatus')}
                                color={currentStatus.color}
                                icon={currentStatus.icon}
                            />
                        </FadeInView>

                        {/* Progress */}
                        <FadeInView delay={100}>
                            <View style={styles.progressSection}>
                                <View style={styles.progressLabelRow}>
                                    <Text style={styles.progressLabel}>{t('taskDetail.progress')}</Text>
                                    <Text style={[styles.progressValue, { color: currentStatus.color }]}>
                                        {Math.round(currentStatus.progress * 100)}%
                                    </Text>
                                </View>
                                <ProgressBar progress={currentStatus.progress} color={currentStatus.color} />
                            </View>
                        </FadeInView>

                        {/* Agent Verification Card */}
                        <FadeInView delay={150}>
                            <View style={styles.agentCard}>
                                <View style={styles.agentHeader}>
                                    <ShieldCheck size={20} color={colors.primary[500]} />
                                    <Text style={styles.agentTitle}>{t('taskDetail.agentVerification')}</Text>
                                </View>
                                <View style={styles.divider} />
                                <View style={styles.verificationRow}>
                                    <Text style={styles.verificationLabel}>{t('taskDetail.method')}</Text>
                                    <Text style={styles.verificationValue}>AI Agent (Gemini)</Text>
                                </View>
                                <View style={styles.verificationRow}>
                                    <Text style={styles.verificationLabel}>{t('taskDetail.proof')}</Text>
                                    <View style={styles.linkContainer}>
                                        <Text style={styles.linkText}>On-Chain Proof</Text>
                                        <ExternalLink size={12} color={colors.primary[500]} />
                                    </View>
                                </View>
                            </View>
                        </FadeInView>

                        {/* Task Details */}
                        <FadeInView delay={200}>
                            <View style={styles.detailCard}>
                                <Text style={styles.detailLabel}>{t('createTask.goalLabel')}</Text>
                                <Text style={styles.detailText}>{task.description}</Text>

                                <View style={styles.divider} />

                                <View style={styles.gridRow}>
                                    <View style={styles.gridItem}>
                                        <Text style={styles.gridLabel}>{t('createTask.stakeLabel')}</Text>
                                        <Text style={styles.gridValue}>{task.stakeAmount}</Text>
                                    </View>
                                    <View style={styles.gridItem}>
                                        <Text style={styles.gridLabel}>{t('createTask.platformLabel')}</Text>
                                        <Text style={styles.gridValue}>{task.platform}</Text>
                                    </View>
                                </View>

                                <View style={styles.gridRow}>
                                    <View style={styles.gridItem}>
                                        <Text style={styles.gridLabel}>{t('createTask.deadlineLabel')}</Text>
                                        <Text style={styles.gridValue}>
                                            {task.deadline.toLocaleDateString()}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        </FadeInView>
                    </ScrollView>

                    {/* Action Button */}
                    {task.status === 'pending' && (
                        <FadeInView delay={250}>
                            <View style={styles.footer}>
                                <PulseGlow color={colors.primary[500]}>
                                    <TouchableOpacity
                                        style={styles.actionButton}
                                        onPress={handleVerify}
                                    >
                                        <CheckCircle size={20} color="#000" />
                                        <Text style={styles.actionButtonText}>
                                            {t('taskDetail.verifyButton')}
                                        </Text>
                                    </TouchableOpacity>
                                </PulseGlow>
                            </View>
                        </FadeInView>
                    )}
                </View>
            </SafeAreaView>

            {/* 验证模态框 */}
            <VerifyModal
                visible={verifyModalVisible}
                onClose={() => setVerifyModalVisible(false)}
                localTaskId={task.id}
                chainTaskId={task.chainTaskId}
                taskDescription={task.description}
                onVerificationComplete={handleVerificationComplete}
            />
        </View>
    );
}

const getStyles = (colors: ThemeColors) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background.primary,
    },
    safeArea: {
        flex: 1,
    },
    centeredWrapper: {
        flex: 1,
        width: '100%',
        maxWidth: MAX_WIDTH,
        alignSelf: 'center',
    },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.lg,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: borderRadius.full,
        backgroundColor: colors.glass.backgroundLight,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: typography.fontSize.lg,
        fontWeight: typography.fontWeight.bold,
        color: colors.text.primary,
    },
    shareButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },

    scrollContent: {
        paddingHorizontal: spacing.xl,
        paddingBottom: 100,
    },

    // Status Card
    statusCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.background.tertiary,
        borderRadius: borderRadius.xl,
        padding: spacing.lg,
        borderWidth: 1,
        borderColor: colors.border.subtle,
        marginBottom: spacing.xl,
    },
    statusIconContainer: {
        width: 48,
        height: 48,
        borderRadius: borderRadius.full,
        backgroundColor: colors.glass.backgroundLight,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.lg,
    },
    statusContent: {
        flex: 1,
    },
    statusLabel: {
        fontSize: typography.fontSize.xs,
        color: colors.text.muted,
        marginBottom: 4,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    statusValue: {
        fontSize: typography.fontSize['2xl'],
        fontWeight: typography.fontWeight.bold,
    },

    // Progress
    progressSection: {
        marginBottom: spacing.xl,
    },
    progressLabelRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: spacing.sm,
    },
    progressLabel: {
        color: colors.text.secondary,
        fontSize: typography.fontSize.sm,
    },
    progressValue: {
        fontSize: typography.fontSize.sm,
        fontWeight: typography.fontWeight.bold,
    },
    progressContainer: {
        height: 8,
        backgroundColor: colors.border.default,
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressBar: {
        height: '100%',
        borderRadius: 4,
    },

    // Agent Card
    agentCard: {
        backgroundColor: colors.glass.background,
        borderRadius: borderRadius.xl,
        padding: spacing.lg,
        borderWidth: 1,
        borderColor: colors.primary[500],
        marginBottom: spacing.xl,
        borderStyle: 'dashed',
    },
    agentHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        marginBottom: spacing.md,
    },
    agentTitle: {
        fontSize: typography.fontSize.base,
        fontWeight: typography.fontWeight.bold,
        color: colors.text.primary,
        flex: 1,
    },
    divider: {
        height: 1,
        backgroundColor: colors.border.subtle,
        marginVertical: spacing.md,
    },
    verificationRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    verificationLabel: {
        fontSize: typography.fontSize.sm,
        color: colors.text.muted,
    },
    verificationValue: {
        fontSize: typography.fontSize.sm,
        color: colors.text.primary,
        fontWeight: typography.fontWeight.medium,
    },
    linkContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    linkText: {
        fontSize: typography.fontSize.sm,
        color: colors.primary[500],
        textDecorationLine: 'underline',
    },

    // Details Grid
    detailCard: {
        backgroundColor: colors.background.tertiary,
        borderRadius: borderRadius.xl,
        padding: spacing.xl,
        borderWidth: 1,
        borderColor: colors.border.subtle,
        marginBottom: spacing.lg,
    },
    detailLabel: {
        fontSize: typography.fontSize.sm,
        color: colors.text.muted,
        marginBottom: spacing.sm,
    },
    detailText: {
        fontSize: typography.fontSize.lg,
        color: colors.text.primary,
        lineHeight: 24,
    },
    gridRow: {
        flexDirection: 'row',
        gap: spacing.xl,
        marginBottom: spacing.md,
    },
    gridItem: {
        flex: 1,
    },
    gridLabel: {
        fontSize: typography.fontSize.xs,
        color: colors.text.muted,
        marginBottom: 4,
    },
    gridValue: {
        fontSize: typography.fontSize.base,
        color: colors.text.primary,
        fontWeight: typography.fontWeight.medium,
    },

    // Footer
    footer: {
        padding: spacing.xl,
        backgroundColor: colors.background.primary,
        borderTopWidth: 1,
        borderTopColor: colors.border.subtle,
    },
    actionButton: {
        backgroundColor: colors.primary[500],
        borderRadius: borderRadius.xl,
        paddingVertical: spacing.lg,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
    },
    actionButtonText: {
        color: '#000',
        fontSize: typography.fontSize.lg,
        fontWeight: typography.fontWeight.bold,
    },
});

// Static styles helper (unused here but good for type checking)
const styles = StyleSheet.create({});
