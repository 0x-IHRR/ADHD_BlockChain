/**
 * HomeScreen - 主页面（使用新的双栏布局）
 */
import React, { useMemo, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
} from 'react-native';
import { Plus, CheckCircle, Clock, AlertCircle, Zap, TrendingUp } from 'lucide-react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { useTasks, Task, TaskStatus } from '../context/AppContext';
import { useI18n } from '../context/I18nContext';
import { useTheme } from '../context/ThemeContext';
import { spacing, typography, borderRadius } from '../styles/tokens';
import { FadeInView, PulseGlow } from '../styles/animations';
import { MainLayout, AgentPanel, AgentState, LeaderboardModal, HoverableView } from '../components';
import { MeshGradientBackground } from '../components/MeshGradientBackground';
import { getAchievementNFTAddress } from '../services/contract.service';

// 状态标签
const StatusBadge = ({ status }: { status: TaskStatus }) => {
    const { t } = useI18n();
    const { colors } = useTheme();

    const config = {
        pending: { icon: Clock, color: colors.semantic.warning, bg: colors.semantic.warningLight, key: 'status.active' },
        verified: { icon: CheckCircle, color: colors.semantic.success, bg: colors.semantic.successLight, key: 'status.done' },
        failed: { icon: AlertCircle, color: colors.semantic.error, bg: colors.semantic.errorLight, key: 'status.failed' },
        settled: { icon: CheckCircle, color: colors.primary[500], bg: colors.semantic.successLight, key: 'status.settled' },
    };
    const { icon: Icon, color, bg, key } = config[status] || config.pending;

    return (
        <View style={[styles.statusBadge, { backgroundColor: bg }]}>
            <Icon size={12} color={color} />
            <Text style={[styles.statusLabel, { color }]}>{t(key)}</Text>
        </View>
    );
};

// 倍率标签
const MultiplierBadge = ({ multiplier }: { multiplier?: number }) => {
    const { colors } = useTheme();
    if (!multiplier || multiplier === 1) return null;

    const bgColor = multiplier === 3 ? colors.semantic.error : colors.semantic.warning;

    return (
        <View style={[styles.multiplierBadge, { backgroundColor: bgColor }]}>
            <Text style={styles.multiplierText}>{multiplier}x</Text>
        </View>
    );
};

const TaskCard = ({ task, onPress, index }: { task: Task; onPress: () => void; index: number }) => {
    const { t } = useI18n();
    const { colors } = useTheme();
    const timeLeft = task.deadline.getTime() - Date.now();
    const hoursLeft = Math.max(0, Math.floor(timeLeft / 3600000));
    const isUrgent = hoursLeft < 6 && task.status === 'pending';

    const cardStyle = {
        backgroundColor: colors.background.tertiary,
        borderColor: colors.border.subtle,
    };
    const chipStyle = {
        backgroundColor: colors.glass.backgroundLight,
    };

    return (
        <FadeInView delay={150 + index * 80}>
            <HoverableView
                style={[styles.taskCard, cardStyle]}
                onPress={onPress}
                effect="scale"
                scaleAmount={1.02}
            >
                <View style={styles.taskRow}>
                    <View style={styles.taskInfo}>
                        <View style={styles.badgeRow}>
                            <StatusBadge status={task.status} />
                            <MultiplierBadge multiplier={(task as any).multiplier} />
                        </View>
                        <Text style={[styles.taskDescription, { color: colors.text.primary }]} numberOfLines={2}>
                            {task.description}
                        </Text>
                    </View>
                    <View style={styles.taskMeta}>
                        <View style={[styles.stakeChip, chipStyle]}>
                            <Zap size={12} color={colors.primary[400]} />
                            <Text style={[styles.stakeText, { color: colors.primary[400] }]}>{task.stakeAmount}</Text>
                        </View>
                        <Text style={[
                            styles.timeText,
                            { color: isUrgent ? colors.semantic.error : colors.text.muted }
                        ]}>
                            {hoursLeft > 0 ? `${hoursLeft}h` : t('home.due')}
                        </Text>
                    </View>
                </View>
            </HoverableView>
        </FadeInView>
    );
};

const StatCard = ({ value, label, color }: { value: number; label: string; color: string }) => (
    <HoverableView style={styles.statCard} effect="lift" liftAmount={-2}>
        <Text style={[styles.statValue, { color }]}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
    </HoverableView>
);

type HomeScreenProps = {
    navigation: NativeStackNavigationProp<RootStackParamList, 'Home'>;
};

export default function HomeScreen({ navigation }: HomeScreenProps) {
    const { tasks, jackpotAmount } = useTasks();
    const { t } = useI18n();
    const { colors } = useTheme();

    const activeCount = tasks.filter(t => t.status === 'pending').length;
    const completedCount = tasks.filter(t => t.status === 'verified' || t.status === 'settled').length;

    // Mock Agent State (后续会连接真实 API)
    const [agentState] = useState<AgentState>({
        isActive: false,
        steps: [],
    });

    // Mock Jackpot (后续从合约读取)
    // const jackpotAmount = '12.45'; (已替换为真实数据)
    const [isLeaderboardVisible, setLeaderboardVisible] = useState(false);

    // 左侧面板：不显示内容，但保留占位，以保持中间内容居中
    const leftPanel = <View style={{ flex: 1 }} />;

    // 右侧 Agent 面板 (隐藏热力图，因为已移至左侧)
    const rightPanel = <AgentPanel state={agentState} showHeatmap={false} />;

    return (
        <MainLayout
            leftPanel={leftPanel}
            rightPanel={rightPanel}
            jackpotAmount={jackpotAmount}
            onJackpotPress={() => setLeaderboardVisible(true)}
            achievementNFTAddress={getAchievementNFTAddress()}
        >
            <LeaderboardModal
                visible={isLeaderboardVisible}
                onClose={() => setLeaderboardVisible(false)}
                jackpotAmount={jackpotAmount}
            />

            <View style={[styles.content, {
                marginTop: spacing.xl,
                overflow: 'hidden',
                borderRadius: borderRadius['2xl'],
                backgroundColor: colors.background.secondary, // Directly use the lighter board color
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.08)',
            }]}>
                {/* Glass Tint Overlay - Critical for brightness match */}
                <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(255, 255, 255, 0.02)' }]} />

                {/* Background Layer: Subtle Focus Gradient */}
                <MeshGradientBackground
                    primaryColor={colors.primary[500]}
                    secondaryColor={colors.accent.purple} // Use Purple for better visibility and Focus theme
                    opacity={1}
                />
                {/* Header */}

                {/* Stats Row */}
                <FadeInView delay={50}>
                    <View style={styles.statsContainer}>
                        <View style={[styles.statsRow, {
                            backgroundColor: 'rgba(255,255,255,0.03)', // Light tint instead of dark glass
                            borderColor: 'rgba(255,255,255,0.08)'
                        }]}>
                            <StatCard value={activeCount} label={t('home.active')} color={colors.semantic.warning} />
                            <View style={[styles.statsDivider, { backgroundColor: colors.border.default }]} />
                            <StatCard value={completedCount} label={t('home.done')} color={colors.semantic.success} />
                            <View style={[styles.statsDivider, { backgroundColor: colors.border.default }]} />
                            <StatCard value={tasks.length} label={t('home.total')} color={colors.text.tertiary} />
                        </View>
                    </View>
                </FadeInView>

                {/* Section Header */}
                <FadeInView delay={100}>
                    <View style={styles.sectionHeader}>
                        <View style={styles.sectionTitleRow}>
                            <TrendingUp size={16} color={colors.text.muted} />
                            <Text style={[styles.sectionTitle, { color: colors.text.muted }]}>{t('home.yourTasks')}</Text>
                        </View>
                        {activeCount > 0 && (
                            <View style={[styles.countBadge, { backgroundColor: colors.primary[500] }]}>
                                <Text style={styles.countText}>{activeCount}</Text>
                            </View>
                        )}
                    </View>
                </FadeInView>

                {/* Task List */}
                <FlatList
                    data={tasks}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={({ item, index }) => (
                        <TaskCard
                            task={item}
                            index={index}
                            onPress={() => navigation.navigate('TaskDetail', { taskId: item.id })}
                        />
                    )}
                    contentContainerStyle={styles.taskList}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <FadeInView delay={200}>
                            <View style={styles.emptyState}>
                                <View style={[styles.emptyIcon, { backgroundColor: colors.glass.backgroundLight }]}>
                                    <Zap size={32} color={colors.primary[500]} />
                                </View>
                                <Text style={[styles.emptyTitle, { color: colors.text.primary }]}>{t('home.noTasks')}</Text>
                                <Text style={[styles.emptySubtitle, { color: colors.text.muted }]}>
                                    {t('home.noTasksSubtitle')}
                                </Text>
                            </View>
                        </FadeInView>
                    }
                />
            </View>

            {/* FAB */}
            <FadeInView delay={300} style={styles.fabContainer}>
                <PulseGlow color={colors.primary[500]}>
                    <TouchableOpacity
                        style={[styles.fab, { backgroundColor: colors.primary[500] }]}
                        onPress={() => navigation.navigate('CreateTask')}
                        activeOpacity={0.85}
                    >
                        <Plus size={20} color="#000" strokeWidth={2.5} />
                        <Text style={styles.fabText}>{t('home.newTask')}</Text>
                    </TouchableOpacity>
                </PulseGlow>
            </FadeInView>
        </MainLayout>
    );
}

const styles = StyleSheet.create({
    content: {
        flex: 1,
        // No paddingTop - align with side panels
    },

    // Stats
    statsContainer: {
        paddingHorizontal: spacing.md,  // Match sidePanel padding
        paddingTop: spacing.md,  // Same as sidePanel
        marginBottom: spacing.xl,
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: borderRadius.xl,
        paddingVertical: spacing.lg,
        paddingHorizontal: spacing.xl,
        // borderWidth: 1, // Raycast 风格：移除边框
    },
    statCard: {
        flex: 1,
        alignItems: 'center',
    },
    statValue: {
        fontSize: typography.fontSize['2xl'],
        fontWeight: typography.fontWeight.bold,
    },
    statLabel: {
        fontSize: typography.fontSize.xs,
        marginTop: spacing.xs,
    },
    statsDivider: {
        width: 1,
        height: 32,
    },

    // Section Header
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.xl,
        marginBottom: spacing.md,
    },
    sectionTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    sectionTitle: {
        fontSize: typography.fontSize.sm,
        fontWeight: typography.fontWeight.medium,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    countBadge: {
        width: 20,
        height: 20,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    countText: {
        color: '#000',
        fontSize: typography.fontSize.xs,
        fontWeight: typography.fontWeight.bold,
    },

    // Task List
    taskList: {
        paddingHorizontal: spacing.xl,
        paddingBottom: 120,
    },
    taskCard: {
        borderRadius: borderRadius.xl,
        padding: spacing.lg,
        marginBottom: spacing.md,
        borderWidth: 1,
    },
    taskRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    taskInfo: {
        flex: 1,
        marginRight: spacing.md,
    },
    badgeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        marginBottom: spacing.sm,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.full,
        gap: spacing.xs,
    },
    statusLabel: {
        fontSize: typography.fontSize.xs,
        fontWeight: typography.fontWeight.semibold,
    },
    multiplierBadge: {
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.full,
    },
    multiplierText: {
        color: '#fff',
        fontSize: typography.fontSize.xs,
        fontWeight: typography.fontWeight.bold,
    },
    taskDescription: {
        fontSize: typography.fontSize.base,
        fontWeight: typography.fontWeight.medium,
        lineHeight: typography.fontSize.base * typography.lineHeight.normal,
    },
    taskMeta: {
        alignItems: 'flex-end',
        gap: spacing.sm,
    },
    stakeChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.full,
        gap: 4,
    },
    stakeText: {
        fontSize: typography.fontSize.xs,
        fontWeight: typography.fontWeight.semibold,
    },
    timeText: {
        fontSize: typography.fontSize.xs,
    },

    // Empty State
    emptyState: {
        alignItems: 'center',
        paddingVertical: spacing['4xl'],
    },
    emptyIcon: {
        width: 72,
        height: 72,
        borderRadius: borderRadius.full,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.xl,
    },
    emptyTitle: {
        fontSize: typography.fontSize.xl,
        fontWeight: typography.fontWeight.semibold,
        marginBottom: spacing.sm,
    },
    emptySubtitle: {
        fontSize: typography.fontSize.sm,
        marginBottom: spacing['2xl'],
    },
    emptyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.full,
        gap: spacing.sm,
    },
    emptyButtonText: {
        color: '#000',
        fontSize: typography.fontSize.sm,
        fontWeight: typography.fontWeight.semibold,
    },

    // FAB
    fabContainer: {
        position: 'absolute',
        bottom: spacing['3xl'],
        alignSelf: 'center',
    },
    fab: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.full,
        gap: spacing.sm,
    },
    fabText: {
        color: '#000',
        fontSize: typography.fontSize.sm,
        fontWeight: typography.fontWeight.bold,
    },
});
