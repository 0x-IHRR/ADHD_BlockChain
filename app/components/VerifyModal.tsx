/**
 * VerifyModal - 任务验证提交模态框
 * 
 * 允许用户输入证明文本，调用 AI 验证并提交到链上
 */
import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    Modal,
    TouchableOpacity,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { X, Send, CheckCircle, XCircle, ExternalLink } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useI18n } from '../context/I18nContext';
import { spacing, typography, borderRadius } from '../styles/tokens';
import { verifyAndSubmit, VerifyAndSubmitResult } from '../services/ai.service';
import Spoons from './Spoons';

interface VerifyModalProps {
    visible: boolean;
    onClose: () => void;
    taskId: number;
    taskDescription: string;
    onVerificationComplete: (result: VerifyAndSubmitResult) => void;
}

type ModalState = 'input' | 'verifying' | 'success' | 'failed';

export default function VerifyModal({
    visible,
    onClose,
    taskId,
    taskDescription,
    onVerificationComplete,
}: VerifyModalProps) {
    const { colors } = useTheme();
    const { t } = useI18n();

    const [proof, setProof] = useState('');
    const [state, setState] = useState<ModalState>('input');
    const [result, setResult] = useState<VerifyAndSubmitResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async () => {
        if (!proof.trim()) return;

        setState('verifying');
        setError(null);

        try {
            const verifyResult = await verifyAndSubmit(
                taskId,
                taskDescription,
                proof.trim()
            );

            setResult(verifyResult);
            setState(verifyResult.verified ? 'success' : 'failed');

            // 通知父组件验证完成
            setTimeout(() => {
                onVerificationComplete(verifyResult);
            }, 2000);
        } catch (err: any) {
            setError(err.message || 'Verification failed');
            setState('failed');
        }
    };

    const handleClose = () => {
        // 重置状态
        setProof('');
        setState('input');
        setResult(null);
        setError(null);
        onClose();
    };

    const getSpoonsState = () => {
        switch (state) {
            case 'verifying': return 'thinking';
            case 'success': return 'happy';
            case 'failed': return 'shaking';
            default: return 'neutral';
        }
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={handleClose}
        >
            <KeyboardAvoidingView
                style={styles.overlay}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <View style={[styles.container, {
                    backgroundColor: colors.background.primary,
                    borderColor: colors.border.subtle
                }]}>
                    {/* Header */}
                    <View style={[styles.header, { borderBottomColor: colors.border.subtle }]}>
                        <Text style={[styles.title, { color: colors.text.primary }]}>
                            {t('taskDetail.verifyButton')}
                        </Text>
                        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                            <X size={20} color={colors.text.secondary} />
                        </TouchableOpacity>
                    </View>

                    {/* Content */}
                    <View style={styles.content}>
                        {/* Spoons 状态显示 */}
                        <View style={styles.spoonsContainer}>
                            <Spoons mood={getSpoonsState()} size={100} />
                        </View>

                        {/* 输入状态 */}
                        {state === 'input' && (
                            <>
                                <Text style={[styles.label, { color: colors.text.muted }]}>
                                    {t('taskDetail.proof')}
                                </Text>
                                <TextInput
                                    style={[styles.input, {
                                        backgroundColor: colors.background.secondary,
                                        borderColor: colors.border.default,
                                        color: colors.text.primary
                                    }]}
                                    placeholder="Describe how you completed the task, paste Tx hash, or provide other proof..."
                                    placeholderTextColor={colors.text.muted}
                                    multiline
                                    numberOfLines={4}
                                    value={proof}
                                    onChangeText={setProof}
                                    textAlignVertical="top"
                                />

                                <TouchableOpacity
                                    style={[styles.submitButton, { backgroundColor: colors.primary[500] }]}
                                    onPress={handleSubmit}
                                    disabled={!proof.trim()}
                                >
                                    <Send size={18} color="#000" />
                                    <Text style={styles.submitButtonText}>
                                        Submit for Verification
                                    </Text>
                                </TouchableOpacity>
                            </>
                        )}

                        {/* 验证中 */}
                        {state === 'verifying' && (
                            <View style={styles.statusContainer}>
                                <ActivityIndicator size="large" color={colors.primary[500]} />
                                <Text style={[styles.statusText, { color: colors.text.secondary }]}>
                                    AI Agent is verifying your proof...
                                </Text>
                            </View>
                        )}

                        {/* 成功 */}
                        {state === 'success' && result && (
                            <View style={styles.statusContainer}>
                                <CheckCircle size={48} color={colors.semantic.success} />
                                <Text style={[styles.statusTitle, { color: colors.semantic.success }]}>
                                    {t('agent.verified')}
                                </Text>
                                <Text style={[styles.statusText, { color: colors.text.secondary }]}>
                                    {result.reason}
                                </Text>
                                {result.tx_hash && (
                                    <View style={[styles.txBox, { backgroundColor: colors.glass.backgroundLight }]}>
                                        <Text style={[styles.txLabel, { color: colors.text.muted }]}>
                                            Tx Hash:
                                        </Text>
                                        <Text style={[styles.txHash, { color: colors.primary[500] }]}>
                                            {result.tx_hash.slice(0, 10)}...{result.tx_hash.slice(-8)}
                                        </Text>
                                        <ExternalLink size={14} color={colors.primary[500]} />
                                    </View>
                                )}
                            </View>
                        )}

                        {/* 失败 */}
                        {state === 'failed' && (
                            <View style={styles.statusContainer}>
                                <XCircle size={48} color={colors.semantic.error} />
                                <Text style={[styles.statusTitle, { color: colors.semantic.error }]}>
                                    {t('agent.failed')}
                                </Text>
                                <Text style={[styles.statusText, { color: colors.text.secondary }]}>
                                    {result?.reason || error || 'Verification failed'}
                                </Text>
                                <TouchableOpacity
                                    style={[styles.retryButton, { borderColor: colors.semantic.error }]}
                                    onPress={() => setState('input')}
                                >
                                    <Text style={[styles.retryButtonText, { color: colors.semantic.error }]}>
                                        Try Again
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    container: {
        width: '90%',
        maxWidth: 420,
        borderRadius: borderRadius.xl,
        borderWidth: 1,
        overflow: 'hidden',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: spacing.lg,
        borderBottomWidth: 1,
    },
    title: {
        fontSize: typography.fontSize.lg,
        fontWeight: typography.fontWeight.bold,
    },
    closeButton: {
        padding: spacing.xs,
    },
    content: {
        padding: spacing.xl,
    },
    spoonsContainer: {
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    label: {
        fontSize: typography.fontSize.sm,
        marginBottom: spacing.sm,
    },
    input: {
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        padding: spacing.lg,
        minHeight: 120,
        fontSize: typography.fontSize.base,
        marginBottom: spacing.lg,
    },
    submitButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
        padding: spacing.lg,
        borderRadius: borderRadius.xl,
    },
    submitButtonText: {
        color: '#000',
        fontSize: typography.fontSize.base,
        fontWeight: typography.fontWeight.bold,
    },
    statusContainer: {
        alignItems: 'center',
        paddingVertical: spacing.xl,
    },
    statusTitle: {
        fontSize: typography.fontSize.xl,
        fontWeight: typography.fontWeight.bold,
        marginTop: spacing.lg,
        marginBottom: spacing.sm,
    },
    statusText: {
        fontSize: typography.fontSize.sm,
        textAlign: 'center',
        lineHeight: 20,
    },
    txBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        padding: spacing.md,
        borderRadius: borderRadius.lg,
        marginTop: spacing.lg,
    },
    txLabel: {
        fontSize: typography.fontSize.xs,
    },
    txHash: {
        fontSize: typography.fontSize.sm,
        fontFamily: 'monospace',
    },
    retryButton: {
        marginTop: spacing.xl,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.xl,
        borderRadius: borderRadius.full,
        borderWidth: 1,
    },
    retryButtonText: {
        fontSize: typography.fontSize.sm,
        fontWeight: typography.fontWeight.medium,
    },
});
