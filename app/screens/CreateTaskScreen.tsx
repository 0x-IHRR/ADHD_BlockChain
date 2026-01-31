import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TextInput, Image, KeyboardAvoidingView, Platform, Alert, ScrollView, Animated, TouchableOpacity, Modal, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, Sparkles, AlertCircle, Clock, Zap, Lock, Timer, BarChart2, Target, CheckCircle2 } from 'lucide-react-native';
import { useTasks } from '../context/AppContext';
import { useWallet } from '../context/WalletContext';
import { useI18n } from '../context/I18nContext';
import { useTheme } from '../context/ThemeContext';
import { breakdownTask } from '../services/ai.service';
import { useAchievementNFT } from '../hooks/useAchievementNFT';
import { createTaskOnChain } from '../services/contract.service';
import { spacing, typography, borderRadius, shadows } from '../styles/tokens';
import { ThemeColors } from '../styles/themes';
import { FadeInView, PulseGlow } from '../styles/animations';

const MAX_WIDTH = 480;

const DEADLINE_OPTIONS = [
    { label: '30m', hours: 0.5 },
    { label: '1h', hours: 1 },
    { label: '6h', hours: 6 },
    { label: '24h', hours: 24 },
    { label: '3d', hours: 72 },
    { label: 'Custom', hours: 0 }, // 自定义
];

export default function CreateTaskScreen() {
    const navigation = useNavigation();
    const { addTask, removeTask, updateTaskChainId, fetchTasksFromChain } = useTasks();
    const { isConnected, signer, address, setShowWalletSelector } = useWallet();
    const { t } = useI18n();
    const { colors } = useTheme();
    const [description, setDescription] = useState('');
    const [stakeAmount, setStakeAmount] = useState('0.01');
    const [multiplier, setMultiplier] = useState<1 | 2 | 3 | 5 | 10>(1);
    const { state: achievementState } = useAchievementNFT(); // NFT 成就状态
    const [selectedDeadline, setSelectedDeadline] = useState('24h'); // 默认 24h
    const [customHours, setCustomHours] = useState(''); // 自定义时间输入
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isCreating, setIsCreating] = useState(false); // 创建任务加载状态
    // Transaction Progress State
    const [txStage, setTxStage] = useState<'idle' | 'signing' | 'broadcasting' | 'mining' | 'syncing'>('idle');
    const [showSuccessModal, setShowSuccessModal] = useState(false); // 成功弹窗状态
    const [createdTxHash, setCreatedTxHash] = useState<string | null>(null);
    const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);

    // 新增: 自定义 Prompt 和 AI 思考过程
    const [customPrompt, setCustomPrompt] = useState('');
    const [aiThinkingSteps, setAiThinkingSteps] = useState<string[]>([]);


    // AI Analysis with thinking process
    const handleAIAnalyze = async () => {
        if (!description.trim()) {
            Alert.alert(t('common.error'), t('createTask.errorDescription'));
            return;
        }

        setIsAnalyzing(true);
        setAiThinkingSteps([]);

        // 模拟思考过程步骤 (极简风格，无 emoji)
        const thinkingSteps = [
            '分析任务描述...',
            '理解任务目标...',
            customPrompt ? `应用自定义策略: "${customPrompt}"` : '选择最佳拆解策略...',
            '拆分为可执行步骤...',
            '估算每步时间...',
            '生成最终方案...',
        ];

        // 逐步展示思考过程
        for (let i = 0; i < thinkingSteps.length; i++) {
            await new Promise(resolve => setTimeout(resolve, 300));
            setAiThinkingSteps(prev => [...prev, thinkingSteps[i]]);
        }

        try {
            // Try to call real AI engine
            const result = await breakdownTask(description, customPrompt || undefined);
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

        // 检查钱包连接
        if (!isConnected || !signer) {
            Alert.alert(
                '请先连接钱包',
                '质押需要钱包签名确认，请先连接您的钱包。',
                [
                    { text: '取消', style: 'cancel' },
                    { text: '连接钱包', onPress: () => setShowWalletSelector(true) }
                ]
            );
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


        setIsCreating(true);

        try {
            // 0. 网络检查 (关键修复)
            if (signer?.provider) {
                const network = await signer.provider.getNetwork();
                const chainId = BigInt(network.chainId);
                // 允许 1337 (Anvil default) 或 31337 (Hardhat default)
                if (chainId !== 1337n && chainId !== 31337n) {
                    setIsCreating(false);
                    Alert.alert(
                        'Wrong Network / 网络错误',
                        `请切换到 Localhost:8545 (Chain ID: 1337)。\n当前连接: Chain ID ${chainId}`,
                        [{ text: 'OK' }]
                    );
                    return;
                }
            }
            const newTask = addTask({
                description,
                deadline: new Date(Date.now() + deadlineHours * 60 * 60 * 1000),
                status: 'pending' as const,
                stakeAmount: `${stakeAmount} ETH`,
                multiplier,
                subtasks: [],
            });



            // 2. 调用链上创建任务
            try {
                setTxStage('signing'); // Step 1: Wallet Signature

                const { taskId: chainTaskId, txHash } = await createTaskOnChain(
                    description,
                    deadlineHours,
                    stakeAmount,
                    multiplier,
                    signer ?? undefined
                );

                setTxStage('mining'); // Step 2: Mining (createTaskOnChain waits for receipts, so this actually happens inside mostly, but we set it for clarity)

                // 3. 同步链上 ID 到本地任务
                updateTaskChainId(newTask.id, chainTaskId, txHash);
                setCreatedTxHash(txHash); // Store for modal
                console.log('任务创建成功:', { localId: newTask.id, chainTaskId, txHash });

                // 4. 强制同步
                setTxStage('syncing');
                await fetchTasksFromChain();

                // 5. 完成
                setTxStage('idle');
                setIsCreating(false);
                setShowSuccessModal(true);
            } catch (chainError: any) {
                setTxStage('idle');
                setIsCreating(false);
                // ... (error handling)
                console.warn('链上创建失败，回滚本地任务:', chainError);
                removeTask(newTask.id);

                let errorMsg = '质押交易失败或已取消，任务未创建。';
                if (chainError?.reason) errorMsg += `\n原因: ${chainError.reason}`;
                else if (chainError?.message) errorMsg += `\n详细: ${chainError.message.slice(0, 100)}...`;

                Alert.alert(
                    t('common.error') || '错误',
                    errorMsg
                );
                return;
            }
        } catch (error) {
            setTxStage('idle');
            setIsCreating(false);
            console.error('任务创建失败:', error);
            Alert.alert(t('common.error'), '创建任务失败，请重试');
        }
    };

    const styles = useMemo(() => getStyles(colors), [colors]);

    return (
        <View style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.keyboardView}
                >
                    {/* Transaction Progress Modal */}
                    <Modal
                        visible={isCreating && txStage !== 'idle'}
                        transparent={true}
                        animationType="fade"
                    >
                        <View style={styles.modalOverlay}>
                            <View style={[styles.successModal, { backgroundColor: colors.background.surface, borderColor: colors.primary[500], padding: 32 }]}>
                                <ActivityIndicator size="large" color={colors.primary[500]} />
                                <Text style={[styles.successTitle, { color: colors.text.primary, marginTop: 16, fontSize: 20 }]}>
                                    {txStage === 'signing' && t('createTask.tx.signing')}
                                    {txStage === 'broadcasting' && t('createTask.tx.broadcasting')}
                                    {txStage === 'mining' && t('createTask.tx.mining')}
                                    {txStage === 'syncing' && t('createTask.tx.syncing')}
                                </Text>
                                <Text style={[styles.successDesc, { color: colors.text.secondary, marginTop: 8 }]}>
                                    {txStage === 'signing' && t('createTask.tx.signing')}
                                    {txStage === 'mining' && t('createTask.tx.mining')}
                                    {txStage === 'syncing' && t('createTask.tx.syncing')}
                                </Text>
                            </View>
                        </View>
                    </Modal>

                    {/* Success Modal */}
                    <Modal
                        visible={showSuccessModal}
                        transparent={true}
                        animationType="fade"
                        onRequestClose={() => navigation.goBack()}
                    >
                        <View style={styles.modalOverlay}>
                            <View style={[styles.successModal, { backgroundColor: colors.background.surface, borderColor: colors.semantic.success }]}>
                                <View style={styles.successIconBubble}>
                                    <CheckCircle2 size={48} color={colors.semantic.success} />
                                </View>
                                <Text style={[styles.successTitle, { color: colors.text.primary }]}>
                                    {t('createTask.successTitle')}
                                </Text>
                                <Text style={[styles.successDesc, { color: colors.text.secondary }]}>
                                    {t('createTask.successDesc')}
                                </Text>
                                {createdTxHash && (
                                    <View style={{ marginTop: 12, padding: 8, backgroundColor: colors.background.surface, borderRadius: 8 }}>
                                        <Text style={{ color: colors.text.secondary, fontSize: 12, fontFamily: typography.fontFamily.mono }}>
                                            TX: {createdTxHash.slice(0, 10)}...{createdTxHash.slice(-8)}
                                        </Text>
                                    </View>
                                )}
                                <View style={styles.successStats}>
                                    <Text style={[styles.successStatText, { color: colors.text.secondary }]}>
                                        Staked: <Text style={{ color: colors.primary[500], fontWeight: 'bold' }}>{stakeAmount} ETH</Text>
                                    </Text>
                                </View>
                                <TouchableOpacity
                                    style={[styles.successButton, { backgroundColor: colors.semantic.success }]}
                                    onPress={() => {
                                        setShowSuccessModal(false);
                                        navigation.goBack();
                                    }}
                                >
                                    <Text style={styles.successButtonText}>Let's Go</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </Modal>
                    {/* Three Column Layout */}
                    <View style={styles.threeColumnLayout}>
                        {/* Left Panel: Custom Prompt - Aligned with center card */}
                        <View style={styles.sidePanel}>
                            {/* Prompt area aligned with center card (sidePanel paddingTop handles alignment) */}
                            <View style={styles.promptArea}>
                                {/* Input with centered placeholder */}
                                <TextInput
                                    style={[styles.promptInputLarge, {
                                        backgroundColor: 'transparent',
                                        borderColor: customPrompt ? colors.primary[500] : colors.border.subtle,
                                        color: colors.text.primary,
                                        textAlign: 'center',
                                    }]}
                                    placeholder={t('createTask.promptPlaceholder')}
                                    placeholderTextColor={colors.text.muted}
                                    value={customPrompt}
                                    onChangeText={setCustomPrompt}
                                    multiline
                                    textAlignVertical="center"
                                />

                                {/* Icon-based template buttons */}
                                <View style={styles.templateButtonsRow}>
                                    <TouchableOpacity
                                        style={[styles.iconTemplateButton, { backgroundColor: colors.glass.backgroundLight }]}
                                        onPress={() => setCustomPrompt(prev => prev ? `${prev}, ${t('createTask.templatePomodoro')}` : t('createTask.templatePomodoro'))}
                                    >
                                        <Timer size={16} color={colors.primary[500]} />
                                        <Text style={[styles.iconTemplateText, { color: colors.text.secondary }]}>
                                            {t('createTask.templatePomodoro')}
                                        </Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={[styles.iconTemplateButton, { backgroundColor: colors.glass.backgroundLight }]}
                                        onPress={() => setCustomPrompt(prev => prev ? `${prev}, ${t('createTask.template15min')}` : t('createTask.template15min'))}
                                    >
                                        <Clock size={16} color={colors.primary[500]} />
                                        <Text style={[styles.iconTemplateText, { color: colors.text.secondary }]}>
                                            {t('createTask.template15min')}
                                        </Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={[styles.iconTemplateButton, { backgroundColor: colors.glass.backgroundLight }]}
                                        onPress={() => setCustomPrompt(prev => prev ? `${prev}, ${t('createTask.templatePriority')}` : t('createTask.templatePriority'))}
                                    >
                                        <BarChart2 size={16} color={colors.primary[500]} />
                                        <Text style={[styles.iconTemplateText, { color: colors.text.secondary }]}>
                                            {t('createTask.templatePriority')}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>

                        {/* Center Panel: Original Form */}
                        <View style={styles.centerPanel}>
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

                                        {/* AI 建议已移至右侧面板 */}
                                    </View>
                                </FadeInView>

                                {/* Settings Card */}
                                <FadeInView delay={100}>
                                    <View style={styles.card}>
                                        {/* 质押金额 */}
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
                                                {/* 5x/10x 高倍率 - 需要 Flow Keeper 徽章 */}
                                                {([5, 10] as const).map((m) => {
                                                    const isLocked = !achievementState?.canUseHighMultiplier;
                                                    return (
                                                        <TouchableOpacity
                                                            key={m}
                                                            style={[
                                                                styles.multiplierButton,
                                                                styles.multiplierButtonPremium,
                                                                multiplier === m && styles.multiplierButtonPremiumActive,
                                                                isLocked && styles.multiplierButtonLocked
                                                            ]}
                                                            onPress={() => !isLocked && setMultiplier(m)}
                                                            disabled={isLocked}
                                                        >
                                                            <View style={styles.multiplierButtonContent}>
                                                                {isLocked && <Lock size={12} color="#888" style={{ marginRight: 4 }} />}
                                                                <Text style={[
                                                                    styles.multiplierButtonText,
                                                                    multiplier === m && styles.multiplierButtonTextPremium,
                                                                    isLocked && styles.multiplierButtonTextLocked
                                                                ]}>{m}x</Text>
                                                            </View>
                                                        </TouchableOpacity>
                                                    );
                                                })}
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
                            </ScrollView>
                        </View>

                        {/* Right Panel: AI Thinking Process - Transparent, No Title */}
                        <View style={styles.sidePanel}>
                            {/* 思考步骤展示 */}
                            <View style={styles.thinkingSteps}>
                                {aiThinkingSteps.length === 0 ? (
                                    <View style={styles.emptyThinking}>
                                        <Sparkles size={24} color={colors.text.muted} style={{ opacity: 0.5 }} />
                                        <Text style={[styles.emptyThinkingText, { color: colors.text.muted }]}>
                                            {t('createTask.thinkingEmpty')}
                                        </Text>
                                    </View>
                                ) : (
                                    aiThinkingSteps.map((step, index) => (
                                        <FadeInView key={index} delay={0}>
                                            <View style={styles.thinkingStep}>
                                                <Text style={[styles.thinkingStepText, { color: colors.text.secondary }]}>
                                                    {step}
                                                </Text>
                                            </View>
                                        </FadeInView>
                                    ))
                                )}

                                {isAnalyzing && (
                                    <View style={styles.thinkingLoader}>
                                        <ActivityIndicator size="small" color={colors.primary[500]} />
                                    </View>
                                )}
                            </View>

                            {/* AI 结果摘要 + AI 建议 */}
                            {aiSuggestion && (
                                <FadeInView delay={0}>
                                    <View style={styles.resultSummary}>
                                        <Text style={[styles.resultSummaryTitle, { color: colors.semantic.success }]}>
                                            {t('createTask.analysisComplete')}
                                        </Text>
                                        <Text style={[styles.resultSummaryText, { color: colors.text.secondary }]}>
                                            {t('createTask.stepsGenerated').replace('{count}', String(aiSuggestion.split('\n').length))}
                                        </Text>
                                    </View>
                                    {/* AI 建议内容 */}
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
                    </View>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </View >
    );
}

const getStyles = (colors: ThemeColors) => StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    successModal: {
        width: 320,
        borderRadius: borderRadius['2xl'],
        padding: spacing.xl,
        alignItems: 'center',
        borderWidth: 1,
    },
    successIconBubble: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    successTitle: {
        fontSize: typography.fontSize.xl,
        fontWeight: typography.fontWeight.bold,
        marginBottom: spacing.sm,
    },
    successDesc: {
        fontSize: typography.fontSize.sm,
        textAlign: 'center',
        marginBottom: spacing.lg,
        lineHeight: 20,
    },
    successStats: {
        marginBottom: spacing.xl,
        padding: spacing.md,
        borderRadius: borderRadius.md,
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    successStatText: {
        fontSize: typography.fontSize.base,
    },
    successButton: {
        paddingVertical: spacing.md,
        paddingHorizontal: spacing['2xl'],
        borderRadius: borderRadius.full,
        width: '100%',
        alignItems: 'center',
    },
    successButtonText: {
        color: '#FFFFFF',
        fontWeight: typography.fontWeight.bold,
        fontSize: typography.fontSize.base,
    },

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

    // Three Column Layout
    threeColumnLayout: {
        flex: 1,
        flexDirection: 'row',
        gap: spacing.lg, // Gap between panels
    },
    sidePanel: {
        flex: 1,
        minWidth: 180,
        // No background or border - transparent
        paddingTop: 68,  // Align with center card "What's your goal?"
        paddingBottom: spacing.md,
        paddingHorizontal: spacing.sm,
        justifyContent: 'flex-start',
    },
    // Left panel prompt area - top aligned with center panel
    promptArea: {
        flex: 1,
        justifyContent: 'flex-start',  // Align to top
        alignItems: 'stretch',  // Full width
    },
    emptyPromptHint: {
        alignItems: 'center',
        marginBottom: spacing.lg,
        opacity: 0.7,
    },
    emptyPromptText: {
        fontSize: typography.fontSize.sm,
        textAlign: 'center',
        marginTop: spacing.sm,
        maxWidth: 200,
        lineHeight: 20,
    },
    promptInputLarge: {
        width: '100%',
        borderWidth: 1,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        fontSize: typography.fontSize.sm,
        minHeight: 180,  // Match center card height approximately
    },
    templateButtonsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.sm,
        marginTop: spacing.lg,
        justifyContent: 'center',
    },
    iconTemplateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        borderRadius: borderRadius.full,
    },
    iconTemplateText: {
        fontSize: typography.fontSize.xs,
    },
    sidePanelHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        marginBottom: spacing.xs,
    },
    sidePanelTitle: {
        fontSize: typography.fontSize.base,
        fontWeight: '600',
    },
    sidePanelSubtext: {
        fontSize: typography.fontSize.xs,
        marginBottom: spacing.md,
    },
    promptInput: {
        borderWidth: 1,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        fontSize: typography.fontSize.sm,
        minHeight: 100,
        textAlignVertical: 'top',
        marginBottom: spacing.md,
    },
    templateLabel: {
        fontSize: typography.fontSize.xs,
        marginBottom: spacing.xs,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    templateButtons: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.xs,
    },
    templateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        paddingVertical: spacing.xs,
        paddingHorizontal: spacing.sm,
        borderRadius: borderRadius.md,
    },
    templateEmoji: {
        fontSize: 16,
    },
    templateText: {
        fontSize: typography.fontSize.sm,
    },
    centerPanel: {
        flex: 2,
        minWidth: 380,
        maxWidth: 520,
    },

    // AI Thinking styles
    thinkingSteps: {
        // No flex: 1 - only take up needed space
        marginTop: spacing.sm,
    },
    emptyThinking: {
        flex: 1,
        padding: spacing.md,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyThinkingText: {
        fontSize: typography.fontSize.sm,
        textAlign: 'center',
    },
    thinkingStep: {
        padding: spacing.md,
        marginBottom: spacing.sm,  // 增加步骤间距
        borderRadius: borderRadius.md,
    },
    thinkingStepText: {
        fontSize: typography.fontSize.sm,
    },
    thinkingLoader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        padding: spacing.sm,
    },
    thinkingLoaderText: {
        fontSize: typography.fontSize.sm,
    },
    resultSummary: {
        padding: spacing.lg,
        borderRadius: borderRadius.lg,
        marginTop: spacing.lg,  // 增加与上方内容的间距
        marginBottom: spacing.md,
    },
    resultSummaryTitle: {
        fontSize: typography.fontSize.sm,
        fontWeight: '600',
        marginBottom: spacing.xs,
    },
    resultSummaryText: {
        fontSize: typography.fontSize.xs,
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

    // Suggestion - transparent background for ethereal effect
    suggestionBox: {
        marginTop: spacing.lg,
        // No background - text floats on void
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
        lineHeight: typography.fontSize.sm * 2.2,  // 增加行高，减少密集感
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
    multiplierButtonPremium: {
        borderColor: colors.primary[400],
        borderStyle: 'dashed',
    },
    multiplierButtonPremiumActive: {
        backgroundColor: colors.primary[400],
        borderColor: colors.primary[400],
        borderStyle: 'solid',
    },
    multiplierButtonLocked: {
        opacity: 0.5,
        borderColor: colors.border.subtle,
        borderStyle: 'dashed',
    },
    multiplierButtonContent: {
        flexDirection: 'row',
        alignItems: 'center',
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
    multiplierButtonTextPremium: {
        color: '#000',
    },
    multiplierButtonTextLocked: {
        color: colors.text.muted,
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
