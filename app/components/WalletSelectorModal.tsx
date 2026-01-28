/**
 * WalletSelectorModal - 钱包选择器弹窗
 * 显示所有可用的钱包扩展供用户选择
 */

import React from 'react';
import {
    View,
    Text,
    Modal,
    TouchableOpacity,
    StyleSheet,
    Image,
    ScrollView,
} from 'react-native';
import { X, Wallet, AlertCircle } from 'lucide-react-native';
import { useWallet } from '../context/WalletContext';
import { useTheme } from '../context/ThemeContext';
import { useI18n } from '../context/I18nContext';
import { spacing, typography, borderRadius, shadows } from '../styles/tokens';
import { ThemeColors } from '../styles/themes';

interface WalletSelectorModalProps {
    visible: boolean;
    onClose: () => void;
}

export default function WalletSelectorModal({ visible, onClose }: WalletSelectorModalProps) {
    const { availableWallets, connect, isConnecting } = useWallet();
    const { colors } = useTheme();
    const { t } = useI18n();

    const handleSelectWallet = async (provider: any) => {
        await connect(provider);
        onClose();
    };

    const styles = getStyles(colors);

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.container}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.title}>{t('wallet.selectWallet')}</Text>
                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={onClose}
                        >
                            <X size={20} color={colors.text.muted} />
                        </TouchableOpacity>
                    </View>

                    {/* Wallet List */}
                    <ScrollView style={styles.walletList}>
                        {availableWallets.length > 0 ? (
                            availableWallets.map((wallet) => (
                                <TouchableOpacity
                                    key={wallet.info.uuid}
                                    style={styles.walletItem}
                                    onPress={() => handleSelectWallet(wallet.provider)}
                                    disabled={isConnecting}
                                    activeOpacity={0.7}
                                >
                                    {wallet.info.icon ? (
                                        <Image
                                            source={{ uri: wallet.info.icon }}
                                            style={styles.walletIcon}
                                        />
                                    ) : (
                                        <View style={[styles.walletIconPlaceholder, { backgroundColor: colors.primary[500] + '20' }]}>
                                            <Wallet size={24} color={colors.primary[500]} />
                                        </View>
                                    )}
                                    <Text style={styles.walletName}>{wallet.info.name}</Text>
                                </TouchableOpacity>
                            ))
                        ) : (
                            <View style={styles.noWalletContainer}>
                                <AlertCircle size={32} color={colors.text.muted} />
                                <Text style={styles.noWalletText}>
                                    {t('wallet.noWalletDetected')}
                                </Text>
                                <Text style={styles.noWalletSubtext}>
                                    {t('wallet.installWalletHint')}
                                </Text>
                            </View>
                        )}
                    </ScrollView>

                    {/* Footer */}
                    <View style={styles.footer}>
                        <Text style={styles.footerText}>
                            {t('wallet.multiWalletHint')}
                        </Text>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const getStyles = (colors: ThemeColors) => StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xl,
    },
    container: {
        width: '100%',
        maxWidth: 400,
        backgroundColor: colors.background.secondary,
        borderRadius: borderRadius.xl,
        ...shadows.lg,
        overflow: 'hidden',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: colors.border.subtle,
    },
    title: {
        fontSize: typography.fontSize.lg,
        fontWeight: typography.fontWeight.bold,
        color: colors.text.primary,
    },
    closeButton: {
        padding: spacing.xs,
    },
    walletList: {
        maxHeight: 300,
        padding: spacing.md,
    },
    walletItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        backgroundColor: colors.background.surface,
        borderRadius: borderRadius.lg,
        marginBottom: spacing.sm,
        borderWidth: 1,
        borderColor: colors.border.default,
    },
    walletIcon: {
        width: 40,
        height: 40,
        borderRadius: borderRadius.md,
        marginRight: spacing.md,
    },
    walletIconPlaceholder: {
        width: 40,
        height: 40,
        borderRadius: borderRadius.md,
        marginRight: spacing.md,
        justifyContent: 'center',
        alignItems: 'center',
    },
    walletName: {
        fontSize: typography.fontSize.base,
        fontWeight: typography.fontWeight.medium,
        color: colors.text.primary,
    },
    noWalletContainer: {
        alignItems: 'center',
        padding: spacing.xl,
    },
    noWalletText: {
        fontSize: typography.fontSize.base,
        color: colors.text.primary,
        marginTop: spacing.md,
        textAlign: 'center',
    },
    noWalletSubtext: {
        fontSize: typography.fontSize.sm,
        color: colors.text.muted,
        marginTop: spacing.xs,
        textAlign: 'center',
    },
    footer: {
        padding: spacing.md,
        borderTopWidth: 1,
        borderTopColor: colors.border.subtle,
        alignItems: 'center',
    },
    footerText: {
        fontSize: typography.fontSize.xs,
        color: colors.text.muted,
        textAlign: 'center',
    },
});
