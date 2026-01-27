import React, { useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, CheckCircle, Clock, AlertCircle, Zap, TrendingUp, Globe, Palette } from 'lucide-react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { useTasks, Task, TaskStatus } from '../context/AppContext';
import { useWallet } from '../context/WalletContext';
import { useI18n } from '../context/I18nContext';
import { useTheme } from '../context/ThemeContext';
import { spacing, typography, borderRadius, shadows } from '../styles/tokens';
import { ThemeColors } from '../styles/themes';
import { FadeInView, PulseGlow } from '../styles/animations';

const MAX_WIDTH = 480;

// 语言切换按钮组件
const LanguageToggle = () => {
    const { language, toggleLanguage } = useI18n();
    const { colors } = useTheme();

    // 动态样式
    const buttonStyle = {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.full,
        backgroundColor: 'transparent',
    };

    return (
        <TouchableOpacity
            style={buttonStyle}
            onPress={toggleLanguage}
            activeOpacity={0.7}
        >
            <Globe size={14} color={colors.text.muted} />
            <Text style={[styles.langText, { color: colors.text.muted, marginLeft: 4 }]}>
                {language === 'en' ? 'EN' : '中'}
            </Text>
        </TouchableOpacity>
    );
};

// 主题切换按钮组件
const ThemeToggle = () => {
    const { toggleTheme, colors } = useTheme();

    return (
        <TouchableOpacity
            style={[styles.langButton, { backgroundColor: 'transparent', gap: 4 }]}
            onPress={toggleTheme}
            activeOpacity={0.7}
        >
            <Palette size={14} color={colors.text.muted} />
        </TouchableOpacity>
    );
};

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

const TaskCard = ({ task, onPress, index }: { task: Task; onPress: () => void; index: number }) => {
    const { t } = useI18n();
    const { colors } = useTheme();
    const timeLeft = task.deadline.getTime() - Date.now();
    const hoursLeft = Math.max(0, Math.floor(timeLeft / 3600000));
    const isUrgent = hoursLeft < 6 && task.status === 'pending';

    // 动态样式
    const cardStyle = {
        backgroundColor: colors.background.tertiary,
        borderColor: colors.border.subtle,
    };
    const chipStyle = {
        backgroundColor: colors.glass.backgroundLight,
    };

    return (
        <FadeInView delay={150 + index * 80}>
            <TouchableOpacity
                style={[styles.taskCard, cardStyle]}
                onPress={onPress}
                activeOpacity={0.7}
            >
                <View style={styles.taskRow}>
                    <View style={styles.taskInfo}>
                        <StatusBadge status={task.status} />
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
            </TouchableOpacity>
        </FadeInView>
    );
};

const StatCard = ({ value, label, color }: { value: number; label: string; color: string }) => (
    <View style={styles.statCard}>
        <Text style={[styles.statValue, { color }]}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
    </View>
);

type HomeScreenProps = {
    navigation: NativeStackNavigationProp<RootStackParamList, 'Home'>;
};

export default function HomeScreen({ navigation }: HomeScreenProps) {
    const { tasks } = useTasks();
    const { t } = useI18n();
    const { connect, disconnect, isConnected, shortAddress } = useWallet();
    const { colors } = useTheme();

    const activeCount = tasks.filter(t => t.status === 'pending').length;
    const completedCount = tasks.filter(t => t.status === 'verified' || t.status === 'settled').length;

    // 动态生成样式
    const dynamicStyles = useMemo(() => getDynamicStyles(colors), [colors]);

    return (
        <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.centeredWrapper}>
                    {/* Header */}
                    <FadeInView delay={0}>
                        <View style={styles.header}>
                            <View style={styles.brand}>
                                <View style={[styles.logoContainer, { backgroundColor: colors.glass.backgroundLight }]}>
                                    <Zap size={20} color={colors.primary[500]} fill={colors.primary[500]} />
                                </View>
                                <Text style={[styles.brandName, { color: colors.text.primary }]}>{t('brand.name')}</Text>
                            </View>
                            <View style={styles.headerRight}>
                                <ThemeToggle />
                                <LanguageToggle />
                                <TouchableOpacity
                                    style={[dynamicStyles.walletButton, isConnected && dynamicStyles.walletButtonConnected]}
                                    onPress={isConnected ? disconnect : connect}
                                    activeOpacity={0.7}
                                >
                                    {isConnected && <View style={[styles.walletIndicator, { backgroundColor: colors.primary[500] }]} />}
                                    <Text style={[dynamicStyles.walletText, isConnected && { color: colors.primary[500] }]}>
                                        {isConnected ? shortAddress : t('common.connect')}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </FadeInView>

                    {/* Stats Row */}
                    <FadeInView delay={50}>
                        <View style={styles.statsContainer}>
                            <View style={[styles.statsRow, {
                                backgroundColor: colors.glass.background,
                                borderColor: colors.glass.border
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
                                    <TouchableOpacity
                                        style={[styles.emptyButton, { backgroundColor: colors.primary[500] }]}
                                        onPress={() => navigation.navigate('CreateTask')}
                                        activeOpacity={0.85}
                                    >
                                        <Plus size={18} color="#000" />
                                        <Text style={styles.emptyButtonText}>{t('home.createTask')}</Text>
                                    </TouchableOpacity>
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
            </SafeAreaView>
        </View>
    );
}

// 动态样式生成器 (用于依赖颜色的复杂样式)
const getDynamicStyles = (colors: ThemeColors) => StyleSheet.create({
    walletButton: {
        backgroundColor: colors.glass.backgroundLight,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.full,
        borderWidth: 1,
        borderColor: colors.border.default,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
    },
    walletButtonConnected: {
        backgroundColor: colors.glass.background,
        borderColor: colors.primary[500],
    },
    walletText: {
        color: colors.text.secondary,
        fontSize: typography.fontSize.sm,
        fontWeight: typography.fontWeight.medium,
    },
});

// 静态样式 (结构布局)
const styles = StyleSheet.create({
    container: {
        flex: 1,
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
    brand: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    logoContainer: {
        width: 36,
        height: 36,
        borderRadius: borderRadius.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    brandName: {
        fontSize: typography.fontSize.xl,
        fontWeight: typography.fontWeight.bold,
        letterSpacing: typography.letterSpacing.tight,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    langButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.full,
    },
    langText: {
        fontSize: typography.fontSize.xs,
        fontWeight: typography.fontWeight.medium,
    },
    walletIndicator: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },

    // Stats
    statsContainer: {
        paddingHorizontal: spacing.xl,
        marginBottom: spacing.xl,
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: borderRadius.xl,
        paddingVertical: spacing.lg,
        paddingHorizontal: spacing.xl,
        borderWidth: 1,
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
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.full,
        gap: spacing.xs,
        marginBottom: spacing.sm,
    },
    statusLabel: {
        fontSize: typography.fontSize.xs,
        fontWeight: typography.fontWeight.semibold,
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
