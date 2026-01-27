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
import { spacing, typography, borderRadius, shadows } from '../styles/tokens';
import { ThemeColors } from '../styles/themes';
import { FadeInView, PulseGlow } from '../styles/animations';

const MAX_WIDTH = 480;

export default function CreateTaskScreen() {
    const navigation = useNavigation();
    const { addTask } = useTasks();
    const { t } = useI18n();
    const { colors } = useTheme();
    const [description, setDescription] = useState('');
    const [platform, setPlatform] = useState('X (Twitter)');
    const [stakeAmount, setStakeAmount] = useState('0.01');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);

    // Mock AI Analysis
    const handleAIAnalyze = () => {
        if (!description.trim()) {
            Alert.alert(t('common.error'), t('createTask.errorDescription'));
            return;
        }

        setIsAnalyzing(true);
        // Simulate AI delay
        setTimeout(() => {
            setIsAnalyzing(false);
            setAiSuggestion(t('createTask.aiSuggestionText'));
        }, 1500);
    };

    const handleCreateTask = async () => {
        if (!description.trim()) {
            Alert.alert(t('common.error'), t('createTask.errorDescription'));
            return;
        }

        const newTask = {
            id: Date.now(),
            description,
            platform,
            createdAt: new Date(),
            deadline: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h later
            status: 'pending' as const,
            stakeAmount: `${stakeAmount} ETH`,
            verificationMethod: 'ai_agent' as const,
            subtasks: [], // Initialize empty subtasks
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
                                    <View style={styles.settingRow}>
                                        <View style={styles.settingInfo}>
                                            <Text style={styles.settingLabel}>{t('createTask.platformLabel')}</Text>
                                            <Text style={styles.settingSubtext}>{t('createTask.platformSubtext')}</Text>
                                        </View>
                                        <View style={styles.platformBadge}>
                                            <Text style={styles.platformText}>X</Text>
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

                                    <View style={styles.settingRow}>
                                        <View style={styles.settingInfo}>
                                            <Text style={styles.settingLabel}>{t('createTask.deadlineLabel')}</Text>
                                            <Text style={styles.settingSubtext}>{t('createTask.deadlineSubtext')}</Text>
                                        </View>
                                        <View style={styles.deadlineBadge}>
                                            <Clock size={14} color={colors.text.secondary} />
                                            <Text style={styles.deadlineText}>24h</Text>
                                        </View>
                                    </View>
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
