import React, { useState, useMemo } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, Sparkles, AlertCircle, Clock, Zap } from 'lucide-react-native';
import { useTasks } from '../context/AppContext';
import { useI18n } from '../context/I18nContext';
import { useTheme } from '../context/ThemeContext';
import { breakdownTask } from '../services/ai.service';
import { spacing, typography, borderRadius, shadows } from '../styles/tokens';
import { ThemeColors } from '../styles/themes';
import { FadeInView, PulseGlow } from '../styles/animations';

const MAX_WIDTH = 480;

// 时间选项常量
const DEADLINE_OPTIONS = [
    { label: '30m', hours: 0.5 },
    { label: '1h', hours: 1 },
    { label: '6h', hours: 6 },
    { label: '24h', hours: 24 },
    { label: '3d', hours: 72 },
    { label: 'Custom', hours: 0 }, // 自定义
];

// 验证渠道选项
const PLATFORM_OPTIONS = [
    { id: 'x', label: 'X', icon: '𝕏' },
    { id: 'github', label: 'GitHub', icon: '⌨' },
    { id: 'other', label: 'Other', icon: '📝' },
];

export default function CreateTaskScreen() {
    const navigation = useNavigation();
    const { addTask } = useTasks();
    const { t } = useI18n();
    const { colors } = useTheme();
    const [description, setDescription] = useState('');
    const [selectedPlatform, setSelectedPlatform] = useState('x');
    const [stakeAmount, setStakeAmount] = useState('0.01');
    const [multiplier, setMultiplier] = useState<1 | 2 | 3>(1);
    const [selectedDeadline, setSelectedDeadline] = useState('24h'); // 默认 24h
    const [customHours, setCustomHours] = useState(''); // 自定义时间输入
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);

    // AI Analysis
    const handleAIAnalyze = async () => {
        if (!description.trim()) {
            Alert.alert(t('common.error'), t('createTask.errorDescription'));
            return;
        }

        setIsAnalyzing(true);
        try {
            // Try to call real AI engine
            const result = await breakdownTask(description);
            const formattedSuggestion = result.subtasks
                .map((step, index) => `${index + 1}. ${step.title} (${step.estimated_minutes}m)`)
                .join('\n');
            setAiSuggestion(formattedSuggestion);
        } catch (error) {
            console.log('AI Engine offline, using fallback:', error);
            // Fallback to mock if API fails (e.g. backend not running)
            setAiSuggestion(t('createTask.aiSuggestionText'));
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleCreateTask = async () => {
        if (!description.trim()) {
            Alert.alert(t('common.error'), t('createTask.errorDescription'));
            return;
        }

        // 计算 deadline
        let deadlineHours = 24; // 默认 24h
        if (selectedDeadline === 'Custom') {
            deadlineHours = parseFloat(customHours) || 24;
        } else {
            const option = DEADLINE_OPTIONS.find(o => o.label === selectedDeadline);
            deadlineHours = option?.hours || 24;
        }

        const platformLabel = PLATFORM_OPTIONS.find(p => p.id === selectedPlatform)?.label || 'X';

        const newTask = {
            id: Date.now(),
            description,
            platform: platformLabel,
            createdAt: new Date(),
            deadline: new Date(Date.now() + deadlineHours * 60 * 60 * 1000),
            status: 'pending' as const,
            stakeAmount: `${stakeAmount} ETH`,
            verificationMethod: 'ai_agent' as const,
            subtasks: [],
        };

        addTask(newTask);
        navigation.goBack();
    };

    const styles = useMemo(() => getStyles(colors), [colors]);

    return (
        <View style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.keyboardView}
                >
                    <View style={styles.centeredWrapper}>
                        {/* Header */}
                        <FadeInView delay={0}>
                            <View style={styles.header}>
                                <TouchableOpacity
                                    onPress={() => navigation.goBack()}
                                    style={styles.backButton}
                                    activeOpacity={0.7}
                                >
                                    <ArrowLeft size={20} color={colors.text.primary} />
                                </TouchableOpacity>
                                <Text style={styles.headerTitle}>{t('createTask.title')}</Text>
                                <View style={{ width: 40 }} />
                            </View>
                        </FadeInView>

                        <ScrollView
                            contentContainerStyle={styles.scrollContent}
                            showsVerticalScrollIndicator={false}
                        >
                            {/* Main Input Card */}
                            <FadeInView delay={50}>
                                <View style={styles.card}>
                                    <Text style={styles.label}>{t('createTask.goalLabel')}</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder={t('createTask.goalPlaceholder')}
                                        placeholderTextColor={colors.text.muted}
                                        value={description}
                                        onChangeText={setDescription}
                                        multiline
                                        numberOfLines={3}
                                    />

                                    <TouchableOpacity
                                        style={styles.aiButton}
                                        onPress={handleAIAnalyze}
                                        disabled={isAnalyzing}
                                        activeOpacity={0.7}
                                    >
                                        {isAnalyzing ? (
                                            <ActivityIndicator size="small" color={colors.primary[500]} />
                                        ) : (
                                            <>
                                                <Sparkles size={16} color={colors.primary[500]} />
                                                <Text style={styles.aiButtonText}>{t('createTask.aiButton')}</Text>
                                            </>
                                        )}
                                    </TouchableOpacity>

                                    {aiSuggestion && (
                                        <FadeInView delay={0}>
                                            <View style={styles.suggestionBox}>
                                                <View style={styles.suggestionHeader}>
                                                    <Sparkles size={14} color={colors.primary[500]} />
                                                    <Text style={styles.suggestionTitle}>{t('createTask.aiSuggestionTitle')}</Text>
                                                </View>
                                                <Text style={styles.suggestionText}>{aiSuggestion}</Text>
                                            </View>
                                        </FadeInView>
                                    )}
                                </View>
                            </FadeInView>

                            {/* Settings Card */}
                            <FadeInView delay={100}>
                                <View style={styles.card}>
                                    {/* 验证渠道选择 */}
                                    <View style={styles.settingRow}>
                                        <View style={styles.settingInfo}>
                                            <Text style={styles.settingLabel}>{t('createTask.platformLabel')}</Text>
                                            <Text style={styles.settingSubtext}>{t('createTask.platformSubtext')}</Text>
                                        </View>
                                        <View style={styles.platformRow}>
                                            {PLATFORM_OPTIONS.map((p) => (
                                                <TouchableOpacity
                                                    key={p.id}
                                                    style={[
                                                        styles.platformButton,
                                                        selectedPlatform === p.id && styles.platformButtonActive
                                                    ]}
                                                    onPress={() => setSelectedPlatform(p.id)}
                                                >
                                                    <Text style={[
                                                        styles.platformButtonText,
                                                        selectedPlatform === p.id && styles.platformButtonTextActive
                                                    ]}>{p.icon}</Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    </View>

                                    <View style={styles.divider} />

                                    <View style={styles.settingRow}>
                                        <View style={styles.settingInfo}>
                                            <Text style={styles.settingLabel}>{t('createTask.stakeLabel')}</Text>
                                            <Text style={styles.settingSubtext}>{t('createTask.stakeSubtext')}</Text>
                                        </View>
                                        <View style={styles.stakeInputContainer}>
                                            <TextInput
                                                style={styles.stakeInput}
                                                value={stakeAmount}
                                                onChangeText={setStakeAmount}
                                                keyboardType="numeric"
                                            />
                                            <Text style={styles.currencyText}>ETH</Text>
                                        </View>
                                    </View>

                                    <View style={styles.divider} />

                                    {/* Multiplier Selector */}
                                    <View style={styles.settingRow}>
                                        <View style={styles.settingInfo}>
                                            <Text style={styles.settingLabel}>{t('createTask.multiplierLabel')}</Text>
                                            <Text style={styles.settingSubtext}>{t('createTask.multiplierSubtext')}</Text>
                                        </View>
                                        <View style={styles.multiplierRow}>
                                            {([1, 2, 3] as const).map((m) => (
                                                <TouchableOpacity
                                                    key={m}
                                                    style={[
                                                        styles.multiplierButton,
                                                        multiplier === m && styles.multiplierButtonActive,
                                                        m === 3 && styles.multiplierButtonDanger,
                                                        m === 3 && multiplier === m && styles.multiplierButtonDangerActive
                                                    ]}
                                                    onPress={() => setMultiplier(m)}
                                                >
                                                    <Text style={[
                                                        styles.multiplierButtonText,
                                                        multiplier === m && styles.multiplierButtonTextActive,
                                                        m === 3 && multiplier === m && styles.multiplierButtonTextDanger
                                                    ]}>{m}x</Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    </View>

                                    <View style={styles.divider} />

                                    {/* Deadline 时间选择 */}
                                    <View style={styles.settingRow}>
                                        <View style={styles.settingInfo}>
                                            <Text style={styles.settingLabel}>{t('createTask.deadlineLabel')}</Text>
                                            <Text style={styles.settingSubtext}>{t('createTask.deadlineSubtext')}</Text>
                                        </View>
                                    </View>
                                    <View style={styles.deadlineRow}>
                                        {DEADLINE_OPTIONS.map((option) => (
                                            <TouchableOpacity
                                                key={option.label}
                                                style={[
                                                    styles.deadlineButton,
                                                    selectedDeadline === option.label && styles.deadlineButtonActive
                                                ]}
                                                onPress={() => setSelectedDeadline(option.label)}
                                            >
                                                <Text style={[
                                                    styles.deadlineButtonText,
                                                    selectedDeadline === option.label && styles.deadlineButtonTextActive
                                                ]}>{option.label}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                    {selectedDeadline === 'Custom' && (
                                        <View style={styles.customTimeRow}>
                                            <TextInput
                                                style={styles.customTimeInput}
                                                value={customHours}
                                                onChangeText={setCustomHours}
                                                keyboardType="numeric"
                                                placeholder="12"
                                                placeholderTextColor={colors.text.muted}
                                            />
                                            <Text style={styles.customTimeLabel}>hours</Text>
                                        </View>
                                    )}
                                </View>
                            </FadeInView>

                            {/* Warning */}
                            <FadeInView delay={150}>
                                <View style={styles.warningContainer}>
                                    <AlertCircle size={16} color={colors.semantic.warning} />
                                    <Text style={styles.warningText}>
                                        {t('createTask.warning')}
                                    </Text>
                                </View>
                            </FadeInView>
                        </ScrollView>

                        {/* Footer */}
                        <FadeInView delay={200}>
                            <View style={styles.footer}>
                                <PulseGlow color={colors.primary[500]}>
                                    <TouchableOpacity
                                        style={styles.createButton}
                                        onPress={handleCreateTask}
                                        activeOpacity={0.8}
                                    >
                                        <Zap size={18} color="#000" fill="#000" />
                                        <Text style={styles.createButtonText}>{t('createTask.confirmButton')}</Text>
                                    </TouchableOpacity>
                                </PulseGlow>
                                <Text style={styles.disclaimerText}>{t('createTask.disclaimer')}</Text>
                            </View>
                        </FadeInView>
                    </View>
                </KeyboardAvoidingView>
            </SafeAreaView>
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
    keyboardView: {
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

    scrollContent: {
        paddingHorizontal: spacing.xl,
        paddingBottom: 100,
    },

    // Card
    card: {
        backgroundColor: colors.background.tertiary,
        borderRadius: borderRadius.xl,
        padding: spacing.xl,
        borderWidth: 1,
        borderColor: colors.border.subtle,
        marginBottom: spacing.lg,
    },
    label: {
        fontSize: typography.fontSize.sm,
        color: colors.text.secondary,
        fontWeight: typography.fontWeight.medium,
        marginBottom: spacing.md,
    },
    input: {
        backgroundColor: colors.background.surface,
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        borderColor: colors.border.default,
        padding: spacing.lg,
        color: colors.text.primary,
        fontSize: typography.fontSize.base,
        minHeight: 100,
        textAlignVertical: 'top',
        marginBottom: spacing.lg,
    },
    aiButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing.md,
        borderRadius: borderRadius.lg,
        backgroundColor: colors.glass.backgroundLight,
        borderWidth: 1,
        borderColor: colors.primary[500], // 使用主色描边
        borderStyle: 'dashed',
        gap: spacing.sm,
    },
    aiButtonText: {
        color: colors.primary[500],
        fontSize: typography.fontSize.sm,
        fontWeight: typography.fontWeight.medium,
    },

    // Suggestion
    suggestionBox: {
        marginTop: spacing.lg,
        backgroundColor: colors.glass.backgroundLight,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
    },
    suggestionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        marginBottom: spacing.xs,
    },
    suggestionTitle: {
        color: colors.primary[500],
        fontSize: typography.fontSize.xs,
        fontWeight: typography.fontWeight.bold,
    },
    suggestionText: {
        color: colors.text.secondary,
        fontSize: typography.fontSize.sm,
        lineHeight: typography.fontSize.sm * 1.5,
    },

    // Settings
    settingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: spacing.sm,
    },
    settingInfo: {
        flex: 1,
    },
    settingLabel: {
        fontSize: typography.fontSize.base,
        color: colors.text.primary,
        fontWeight: typography.fontWeight.medium,
        marginBottom: 2,
    },
    settingSubtext: {
        fontSize: typography.fontSize.xs,
        color: colors.text.muted,
    },
    divider: {
        height: 1,
        backgroundColor: colors.border.subtle,
        marginVertical: spacing.md,
    },

    // Badges/Inputs
    platformBadge: {
        backgroundColor: colors.background.surface,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.md,
        borderWidth: 1,
        borderColor: colors.border.default,
    },
    platformText: {
        color: colors.text.primary,
        fontSize: typography.fontSize.sm,
        fontWeight: typography.fontWeight.medium,
    },
    stakeInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.background.surface,
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        borderColor: colors.border.default,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
    },
    stakeInput: {
        color: colors.text.primary,
        fontSize: typography.fontSize.base,
        fontWeight: typography.fontWeight.bold,
        width: 60,
        textAlign: 'right',
        marginRight: spacing.xs,
    },
    currencyText: {
        color: colors.text.muted,
        fontSize: typography.fontSize.sm,
    },
    deadlineBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.background.surface,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.full,
        borderWidth: 1,
        borderColor: colors.border.default,
        gap: 4,
    },
    deadlineText: {
        color: colors.text.secondary,
        fontSize: typography.fontSize.sm,
    },

    // Multiplier Selector
    multiplierRow: {
        flexDirection: 'row',
        gap: spacing.sm,
    },
    multiplierButton: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.md,
        backgroundColor: colors.glass.backgroundLight,
        borderWidth: 1,
        borderColor: colors.border.default,
    },
    multiplierButtonActive: {
        backgroundColor: colors.primary[500],
        borderColor: colors.primary[500],
    },
    multiplierButtonDanger: {
        borderColor: colors.semantic.errorLight,
    },
    multiplierButtonDangerActive: {
        backgroundColor: colors.semantic.error,
        borderColor: colors.semantic.error,
    },
    multiplierButtonText: {
        fontSize: typography.fontSize.sm,
        fontWeight: typography.fontWeight.bold,
        color: colors.text.secondary,
    },
    multiplierButtonTextActive: {
        color: '#000',
    },
    multiplierButtonTextDanger: {
        color: '#fff',
    },

    // Platform selector
    platformRow: {
        flexDirection: 'row',
        gap: spacing.sm,
    },
    platformButton: {
        width: 44,
        height: 44,
        borderRadius: borderRadius.md,
        borderWidth: 1,
        borderColor: colors.border.default,
        backgroundColor: colors.background.surface,
        alignItems: 'center',
        justifyContent: 'center',
    },
    platformButtonActive: {
        borderColor: colors.primary[500],
        backgroundColor: colors.primary[500] + '20',
    },
    platformButtonText: {
        fontSize: 18,
        color: colors.text.secondary,
    },
    platformButtonTextActive: {
        color: colors.primary[500],
    },

    // Deadline selector
    deadlineRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.sm,
        marginTop: spacing.sm,
        marginBottom: spacing.sm,
    },
    deadlineButton: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.md,
        borderWidth: 1,
        borderColor: colors.border.default,
        backgroundColor: colors.background.surface,
    },
    deadlineButtonActive: {
        borderColor: colors.primary[500],
        backgroundColor: colors.primary[500],
    },
    deadlineButtonText: {
        fontSize: typography.fontSize.sm,
        fontWeight: typography.fontWeight.medium,
        color: colors.text.secondary,
    },
    deadlineButtonTextActive: {
        color: '#000',
    },
    customTimeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        marginTop: spacing.xs,
    },
    customTimeInput: {
        backgroundColor: colors.background.surface,
        borderRadius: borderRadius.md,
        borderWidth: 1,
        borderColor: colors.border.default,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        color: colors.text.primary,
        fontSize: typography.fontSize.base,
        width: 80,
        textAlign: 'center',
    },
    customTimeLabel: {
        color: colors.text.secondary,
        fontSize: typography.fontSize.sm,
    },

    // Warning
    warningContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.xl,
        gap: spacing.sm,
    },
    warningText: {
        color: colors.text.muted,
        fontSize: typography.fontSize.xs,
        flex: 1,
    },

    // Footer
    footer: {
        padding: spacing.xl,
        backgroundColor: colors.background.primary,
        borderTopWidth: 1,
        borderTopColor: colors.border.subtle,
        alignItems: 'center', // Center content
    },
    createButton: {
        backgroundColor: colors.primary[500],
        borderRadius: borderRadius.xl,
        paddingVertical: spacing.md, // Reduced from lg
        paddingHorizontal: spacing.xl, // Ensure horizontal padding
        width: '100%', // Full width
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
    },
    createButtonText: {
        color: '#000',
        fontSize: typography.fontSize.base, // Slightly smaller text if needed
        fontWeight: typography.fontWeight.bold,
    },
    disclaimerText: {
        marginTop: spacing.sm,
        fontSize: typography.fontSize.xs,
        color: colors.text.muted,
        textAlign: 'center',
    },
});
