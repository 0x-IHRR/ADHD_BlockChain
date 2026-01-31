/**
 * VerifyModal - 任务验证提交模态框
 * 
 * 允许用户输入证明文本，调用 AI 验证并提交到链上
 * 支持图片上传 (法官模式) 和 AI 问答验证 (Quiz Mode)
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
    Image,
    Alert,
} from 'react-native';
import { X, Send, CheckCircle, XCircle, Camera, ImagePlus, Trash2, Copy } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Clipboard from 'expo-clipboard';
import { useTheme } from '../context/ThemeContext';
import { useI18n } from '../context/I18nContext';
import { usePet } from '../context/PetContext';
import { spacing, typography, borderRadius } from '../styles/tokens';
import { verifyAndSubmit, VerifyAndSubmitResult, generateQuiz, gradeQuiz } from '../services/ai.service';
import { submitProofOnChain } from '../services/contract.service';
import Spoons from './Spoons';

interface VerifyModalProps {
    visible: boolean;
    onClose: () => void;
    localTaskId: number;        // 本地任务 ID (用于日志和 UI)
    chainTaskId?: number;       // 链上任务 ID (用于合约交互)
    taskDescription: string;
    onVerificationComplete: (result: VerifyAndSubmitResult) => void;
}

type ModalState = 'input' | 'quiz_loading' | 'quiz_active' | 'verifying' | 'submitting' | 'success' | 'failed';

export default function VerifyModal({
    visible,
    onClose,
    localTaskId,
    chainTaskId,
    taskDescription,
    onVerificationComplete,
}: VerifyModalProps) {
    const { colors } = useTheme();
    const { refreshPet } = usePet();
    const { t } = useI18n();

    // Mode: 'proof' | 'quiz'
    const [verificationMethod, setVerificationMethod] = useState<'proof' | 'quiz'>('proof');

    // Proof Mode State
    const [proof, setProof] = useState('');
    const [imageUri, setImageUri] = useState<string | null>(null);

    // Quiz Mode State
    const [quizQuestions, setQuizQuestions] = useState<any[]>([]);
    const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

    // Common State
    const [state, setState] = useState<ModalState>('input');
    const [result, setResult] = useState<VerifyAndSubmitResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    // 每次打开模态框时重置状态
    React.useEffect(() => {
        if (visible) {
            setProof('');
            setImageUri(null);
            setState('input');
            setResult(null);
            setError(null);
            setVerificationMethod('proof'); // Default to proof
            setQuizQuestions([]);
            setUserAnswers({});
            setCurrentQuestionIndex(0);
        }
    }, [visible]);

    // 监听 Web 粘贴事件
    React.useEffect(() => {
        if (Platform.OS === 'web' && visible && state === 'input' && verificationMethod === 'proof') {
            const handlePaste = (e: any) => {
                const items = e.clipboardData?.items;
                if (!items) return;

                for (let i = 0; i < items.length; i++) {
                    if (items[i].type.indexOf('image') !== -1) {
                        const blob = items[i].getAsFile();
                        const reader = new FileReader();
                        reader.onload = (event) => {
                            if (event.target?.result) {
                                setImageUri(event.target.result as string);
                            }
                        };
                        reader.readAsDataURL(blob);
                        e.preventDefault();
                        break;
                    }
                }
            };

            window.addEventListener('paste', handlePaste);
            return () => window.removeEventListener('paste', handlePaste);
        }
    }, [visible, state, verificationMethod]);

    // 图片选择 - 相册
    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert(t('verify.permissionRequired'), t('verify.photoPermission'));
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.8,
            allowsEditing: true,
        });

        if (!result.canceled && result.assets[0]) {
            setImageUri(result.assets[0].uri);
        }
    };

    // 拍照
    const takePhoto = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert(t('verify.permissionRequired'), t('verify.cameraPermission'));
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            quality: 0.8,
            allowsEditing: true,
        });

        if (!result.canceled && result.assets[0]) {
            setImageUri(result.assets[0].uri);
        }
    };

    // --- Quiz Logic ---
    const startQuiz = async () => {
        setState('quiz_loading');
        setError(null);
        try {
            const data = await generateQuiz(taskDescription);
            setQuizQuestions(data.questions);
            setUserAnswers({});
            setCurrentQuestionIndex(0);
            setState('quiz_active');
        } catch (err: any) {
            setError(err.message || 'Failed to generate quiz');
            setState('failed');
        }
    };

    const handleQuizAnswer = (option: string) => {
        const question = quizQuestions[currentQuestionIndex];
        setUserAnswers(prev => ({ ...prev, [question.id]: option }));
    };

    const nextQuestion = () => {
        if (currentQuestionIndex < quizQuestions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        } else {
            submitQuiz();
        }
    };

    const submitQuiz = async () => {
        setState('verifying'); // Re-use verifying state for grading
        try {
            const gradeResult = await gradeQuiz(quizQuestions, userAnswers);

            if (gradeResult.passed) {
                // Quiz Passed -> Submit to Chain
                await submitToChain({
                    verified: true,
                    confidence: 100,
                    reason: gradeResult.feedback,
                    submitted_to_chain: false // Will be set in submitToChain
                });
            } else {
                // Quiz Failed
                setResult({
                    verified: false,
                    confidence: 0,
                    reason: gradeResult.feedback,
                    submitted_to_chain: false
                });
                setState('failed');
            }
        } catch (err: any) {
            setError(err.message || 'Grading failed');
            setState('failed');
        }
    };

    // --- Common Submission Logic ---
    const submitToChain = async (aiResult: VerifyAndSubmitResult) => {
        setState('submitting');
        try {
            // 使用 undefined 检查而不是 falsy 检查，因为 chainTaskId 可能是 0
            const hasChainTaskId = chainTaskId !== undefined && chainTaskId !== null;
            if (!hasChainTaskId) console.warn('Using local ID, chain interaction might fail if not synced.');

            let realTxHash = null;
            if (hasChainTaskId) {
                try {
                    realTxHash = await submitProofOnChain(chainTaskId, true);
                    console.log('Proof submitted on chain:', realTxHash);
                } catch (chainError: any) {
                    console.error('Chain submission failed:', chainError);
                    throw new Error('Verification Passed, but Chain Transaction Failed: ' + (chainError.reason || chainError.message));
                }
            }

            const finalResult = {
                ...aiResult,
                tx_hash: realTxHash || aiResult.tx_hash,
                submitted_to_chain: !!realTxHash
            };

            setResult(finalResult);
            setState('success');

            // 刷新宠物状态 (BUG-002 fix)
            try {
                await refreshPet();
            } catch (petError) {
                console.warn('Pet refresh failed:', petError);
            }

            setTimeout(() => {
                onVerificationComplete(finalResult);
            }, 3000);

        } catch (err: any) {
            setError(err.message || 'Chain submission failed');
            setState('failed');
        }
    };

    const handleSubmitProof = async () => {
        if (!proof.trim() && !imageUri) return;
        setState('verifying');
        setError(null);

        try {
            const taskIdForChain = chainTaskId ?? localTaskId;
            const verifyResult = await verifyAndSubmit(
                taskIdForChain,
                taskDescription,
                proof.trim(),
                imageUri || undefined
            );

            if (!verifyResult.verified) {
                setResult(verifyResult);
                setState('failed');
                return;
            }

            await submitToChain(verifyResult);

        } catch (err: any) {
            setError(err.message || 'Verification failed');
            setState('failed');
        }
    };

    const handleClose = () => {
        // 重置状态
        setProof('');
        setImageUri(null);
        setState('input');
        setResult(null);
        setError(null);
        onClose();
    };

    const getSpoonsState = () => {
        switch (state) {
            case 'quiz_loading': return 'thinking';
            case 'quiz_active': return 'neutral';
            case 'verifying': return 'thinking';
            case 'submitting': return 'muscle'; // Use muscle/flex for working hard
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
                        {/* Spoons */}
                        <View style={styles.spoonsContainer}>
                            <Spoons mood={getSpoonsState()} size={100} />
                        </View>

                        {/* Mode Selection (Only in 'input' state) */}
                        {state === 'input' && (
                            <View style={{ flexDirection: 'row', marginBottom: 20, backgroundColor: colors.background.secondary, borderRadius: 12, padding: 4 }}>
                                <TouchableOpacity
                                    style={{ flex: 1, padding: 10, alignItems: 'center', borderRadius: 10, backgroundColor: verificationMethod === 'proof' ? colors.background.primary : 'transparent' }}
                                    onPress={() => setVerificationMethod('proof')}
                                >
                                    <Text style={{ color: verificationMethod === 'proof' ? colors.primary[500] : colors.text.muted, fontWeight: 'bold' }}>Proof</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={{ flex: 1, padding: 10, alignItems: 'center', borderRadius: 10, backgroundColor: verificationMethod === 'quiz' ? colors.background.primary : 'transparent' }}
                                    onPress={() => setVerificationMethod('quiz')}
                                >
                                    <Text style={{ color: verificationMethod === 'quiz' ? colors.primary[500] : colors.text.muted, fontWeight: 'bold' }}>Quiz</Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        {/* Logic Switch */}
                        {state === 'input' && verificationMethod === 'proof' && (
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
                                    placeholder={t('verify.placeholder')}
                                    placeholderTextColor={colors.text.muted}
                                    multiline
                                    numberOfLines={4}
                                    value={proof}
                                    onChangeText={setProof}
                                    textAlignVertical="top"
                                />

                                <View style={styles.imageSection}>
                                    <Text style={[styles.label, { color: colors.text.muted }]}>
                                        {t('verify.addScreenshot')}
                                    </Text>

                                    {imageUri ? (
                                        <View style={styles.imagePreviewContainer}>
                                            <Image
                                                source={{ uri: imageUri }}
                                                style={styles.imagePreview}
                                                resizeMode="cover"
                                            />
                                            <TouchableOpacity
                                                style={[styles.removeImageButton, { backgroundColor: colors.semantic.error }]}
                                                onPress={() => setImageUri(null)}
                                            >
                                                <Trash2 size={16} color="#fff" />
                                            </TouchableOpacity>
                                        </View>
                                    ) : (
                                        <View style={styles.imagePickerRow}>
                                            <TouchableOpacity
                                                style={[styles.imagePickerButton, { borderColor: colors.border.default }]}
                                                onPress={pickImage}
                                            >
                                                <ImagePlus size={20} color={colors.text.secondary} />
                                                <Text style={[styles.imagePickerText, { color: colors.text.secondary }]}>
                                                    {t('verify.gallery')}
                                                </Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={[styles.imagePickerButton, { borderColor: colors.border.default }]}
                                                onPress={takePhoto}
                                            >
                                                <Camera size={20} color={colors.text.secondary} />
                                                <Text style={[styles.imagePickerText, { color: colors.text.secondary }]}>
                                                    {t('verify.camera')}
                                                </Text>
                                            </TouchableOpacity>
                                        </View>
                                    )}
                                </View>

                                <TouchableOpacity
                                    style={[styles.submitButton, { backgroundColor: colors.primary[500] }]}
                                    onPress={handleSubmitProof}
                                    disabled={!proof.trim() && !imageUri}
                                >
                                    <Send size={18} color="#000" />
                                    <Text style={styles.submitButtonText}>
                                        {t('verify.submit')}
                                    </Text>
                                </TouchableOpacity>
                            </>
                        )}

                        {state === 'input' && verificationMethod === 'quiz' && (
                            <View style={{ alignItems: 'center', padding: 20 }}>
                                <Text style={{ color: colors.text.primary, fontSize: 16, textAlign: 'center', marginBottom: 20 }}>
                                    {t('quiz.intro')}
                                </Text>
                                <TouchableOpacity
                                    style={[styles.submitButton, { backgroundColor: colors.primary[500], width: '100%' }]}
                                    onPress={startQuiz}
                                >
                                    <Text style={styles.submitButtonText}>{t('quiz.start')}</Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        {/* Quiz Active State */}
                        {state === 'quiz_active' && quizQuestions.length > 0 && (
                            <View>
                                <Text style={{ color: colors.text.muted, marginBottom: 10 }}>
                                    {t('quiz.questionProgress').replace('{current}', String(currentQuestionIndex + 1)).replace('{total}', String(quizQuestions.length))}
                                </Text>
                                <Text style={{ color: colors.text.primary, fontSize: 18, fontWeight: 'bold', marginBottom: 20 }}>
                                    {quizQuestions[currentQuestionIndex].question}
                                </Text>
                                {quizQuestions[currentQuestionIndex].options.map((opt: string, idx: number) => (
                                    <TouchableOpacity
                                        key={idx}
                                        style={{
                                            padding: 16,
                                            borderRadius: 12,
                                            backgroundColor: userAnswers[quizQuestions[currentQuestionIndex].id] === opt[0] ? colors.primary[500] + '20' : colors.background.secondary,
                                            borderColor: userAnswers[quizQuestions[currentQuestionIndex].id] === opt[0] ? colors.primary[500] : colors.border.default,
                                            borderWidth: 1,
                                            marginBottom: 10,
                                        }}
                                        onPress={() => handleQuizAnswer(opt[0])}
                                    >
                                        <Text style={{ color: colors.text.primary }}>{opt}</Text>
                                    </TouchableOpacity>
                                ))}
                                <TouchableOpacity
                                    style={[styles.submitButton, { backgroundColor: colors.primary[500], marginTop: 20 }]}
                                    onPress={nextQuestion}
                                    disabled={!userAnswers[quizQuestions[currentQuestionIndex].id]}
                                >
                                    <Text style={styles.submitButtonText}>
                                        {currentQuestionIndex === quizQuestions.length - 1 ? t('quiz.submit') : t('quiz.next')}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        {/* Loading States */}
                        {state === 'quiz_loading' && (
                            <View style={styles.statusContainer}>
                                <ActivityIndicator size="large" color={colors.primary[500]} />
                                <Text style={[styles.statusText, { color: colors.text.secondary }]}>{t('quiz.generating')}</Text>
                            </View>
                        )}

                        {/* Verifying */}
                        {state === 'verifying' && (
                            <View style={styles.statusContainer}>
                                <ActivityIndicator size="large" color={colors.primary[500]} />
                                <Text style={[styles.statusText, { color: colors.text.secondary }]}>
                                    {verificationMethod === 'quiz' ? t('quiz.grading') : t('verify.verifying')}
                                </Text>
                            </View>
                        )}

                        {/* Submitting */}
                        {state === 'submitting' && (
                            <View style={styles.statusContainer}>
                                <ActivityIndicator size="large" color={colors.semantic.warning} />
                                <Text style={[styles.statusText, { color: colors.text.secondary, marginTop: 16 }]}>
                                    {t('createTask.tx.mining')}
                                </Text>
                                <Text style={{ color: colors.text.muted, fontSize: 12, marginTop: 8 }}>
                                    {t('verify.writingToChain')}
                                </Text>
                            </View>
                        )}

                        {/* Success */}
                        {state === 'success' && result && (
                            <View style={styles.statusContainer}>
                                <CheckCircle size={48} color={colors.semantic.success} />
                                <Text style={[styles.statusTitle, { color: colors.semantic.success }]}>
                                    {t('agent.verified')}
                                </Text>
                                <Text style={[styles.statusText, { color: colors.text.secondary }]}>
                                    {result.reason}
                                </Text>
                                <View style={[styles.txBox, { backgroundColor: colors.glass.backgroundLight }]}>
                                    <TouchableOpacity
                                        style={[styles.txRow, { padding: 10 }]} // Increase hit area
                                        onPress={async () => {
                                            try {
                                                if (result.tx_hash) {
                                                    await Clipboard.setStringAsync(result.tx_hash);
                                                    Alert.alert(t('common.copied'), t('verify.txHashCopied'));
                                                }
                                            } catch (e) {
                                                console.error('Copy failed', e);
                                                Alert.alert('Error', 'Failed to copy to clipboard');
                                            }
                                        }}
                                    >
                                        <Text style={[styles.txLabel, { color: colors.text.muted }]}>
                                            Tx:
                                        </Text>
                                        <Text style={[styles.txHash, { color: colors.primary[500] }]}>
                                            {result.tx_hash ? `${result.tx_hash.slice(0, 6)}...${result.tx_hash.slice(-4)}` : ''}
                                        </Text>
                                        <Copy size={16} color={colors.primary[500]} />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}

                        {/* Failed */}
                        {state === 'failed' && (
                            <View style={styles.statusContainer}>
                                <XCircle size={48} color={colors.semantic.error} />
                                <Text style={[styles.statusTitle, { color: colors.semantic.error }]}>
                                    {t('agent.failed')}
                                </Text>
                                <Text style={[styles.statusText, { color: colors.text.secondary }]}>
                                    {(() => {
                                        const errorMsg = result?.reason || error || 'Verification failed';
                                        if (errorMsg.includes('Unprocessable Content')) return t('verify.error.uploadFailed');
                                        if (errorMsg.includes('Network request failed')) return t('verify.error.network');
                                        if (errorMsg.includes('timeout')) return t('verify.error.timeout');
                                        return errorMsg;
                                    })()}
                                </Text>
                                <TouchableOpacity
                                    style={[styles.retryButton, { borderColor: colors.semantic.error }]}
                                    onPress={() => setState('input')}
                                >
                                    <Text style={[styles.retryButtonText, { color: colors.semantic.error }]}>
                                        {t('verify.tryAgain')}
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
    // 图片上传样式
    imageSection: {
        marginBottom: spacing.lg,
    },
    imagePickerRow: {
        flexDirection: 'row',
        gap: spacing.md,
    },
    imagePickerButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
        padding: spacing.lg,
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        borderStyle: 'dashed',
    },
    imagePickerText: {
        fontSize: typography.fontSize.sm,
    },
    imagePreviewContainer: {
        position: 'relative',
    },
    imagePreview: {
        width: '100%',
        height: 150,
        borderRadius: borderRadius.lg,
    },
    removeImageButton: {
        position: 'absolute',
        top: spacing.sm,
        right: spacing.sm,
        borderRadius: borderRadius.full,
        padding: spacing.sm,
    },
    txRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        flex: 1,
    },
});
