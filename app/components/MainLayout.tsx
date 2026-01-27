/**
 * MainLayout - PC 双栏布局组件
 * 
 * 布局结构:
 * ┌─────────────────────────────────────────────────────────┐
 * │  [Logo] [辅助验证] [积分] [奖池: xxx ETH] [余额] [钱包]   │
 * ├───────────────────────────┬─────────────────────────────┤
 * │                           │                             │
 * │       任务栏 (左侧)        │    Agent 工作流 (右侧)       │
 * │                           │                             │
 * └───────────────────────────┴─────────────────────────────┘
 */
import React, { ReactNode } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Platform,
    useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Zap, Trophy, Wallet, Globe, Palette } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useWallet } from '../context/WalletContext';
import { useI18n } from '../context/I18nContext';
import { spacing, typography, borderRadius } from '../styles/tokens';

// 响应式断点
const BREAKPOINT_TABLET = 768;
const BREAKPOINT_DESKTOP = 1024;

interface MainLayoutProps {
    children: ReactNode;
    rightPanel?: ReactNode;
    jackpotAmount?: string;
    onJackpotPress?: () => void;
}

export default function MainLayout({
    children,
    rightPanel,
    jackpotAmount = '0.00',
    onJackpotPress
}: MainLayoutProps) {
    const { width } = useWindowDimensions();
    const { colors, toggleTheme } = useTheme();
    const { connect, disconnect, isConnected, shortAddress, balance } = useWallet();
    const { language, toggleLanguage, t } = useI18n();

    // 响应式布局判断
    const isDesktop = width >= BREAKPOINT_DESKTOP;
    const isTablet = width >= BREAKPOINT_TABLET && width < BREAKPOINT_DESKTOP;
    const isMobile = width < BREAKPOINT_TABLET;

    // 是否显示右侧面板
    const showRightPanel = isDesktop && rightPanel;

    return (
        <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
            <SafeAreaView style={styles.safeArea}>
                {/* Top Navigation Bar */}
                <View style={[styles.navbar, {
                    backgroundColor: colors.background.secondary,
                    borderBottomColor: colors.border.subtle
                }]}>
                    {/* Left: Logo */}
                    <View style={styles.navLeft}>
                        <View style={[styles.logoContainer, { backgroundColor: colors.glass.backgroundLight }]}>
                            <Zap size={20} color={colors.primary[500]} fill={colors.primary[500]} />
                        </View>
                        <Text style={[styles.brandName, { color: colors.text.primary }]}>
                            FocusFlow
                        </Text>
                    </View>

                    {/* Center: Jackpot & Stats (Desktop only) */}
                    {!isMobile && (
                        <View style={styles.navCenter}>
                            <TouchableOpacity
                                style={[styles.jackpotChip, {
                                    backgroundColor: colors.glass.background,
                                    borderColor: colors.primary[500] + '40'
                                }]}
                                onPress={onJackpotPress}
                                activeOpacity={0.7}
                            >
                                <Trophy size={16} color={colors.primary[400]} />
                                <Text style={[styles.jackpotLabel, { color: colors.text.muted }]}>
                                    {t('common.jackpot')}
                                </Text>
                                <Text style={[styles.jackpotValue, { color: colors.primary[400] }]}>
                                    {jackpotAmount} ETH
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Right: Controls */}
                    <View style={styles.navRight}>
                        {/* Theme Toggle */}
                        <TouchableOpacity
                            style={styles.iconButton}
                            onPress={toggleTheme}
                        >
                            <Palette size={18} color={colors.text.muted} />
                        </TouchableOpacity>

                        {/* Language Toggle */}
                        <TouchableOpacity
                            style={styles.iconButton}
                            onPress={toggleLanguage}
                        >
                            <Globe size={18} color={colors.text.muted} />
                            <Text style={[styles.langText, { color: colors.text.muted }]}>
                                {language === 'en' ? 'EN' : '中'}
                            </Text>
                        </TouchableOpacity>

                        {/* Balance (when connected) */}
                        {isConnected && !isMobile && (
                            <View style={[styles.balanceChip, { backgroundColor: colors.glass.backgroundLight }]}>
                                <Wallet size={14} color={colors.text.secondary} />
                                <Text style={[styles.balanceText, { color: colors.text.secondary }]}>
                                    {balance} ETH
                                </Text>
                            </View>
                        )}

                        {/* Wallet Button */}
                        <TouchableOpacity
                            style={[
                                styles.walletButton,
                                {
                                    backgroundColor: isConnected ? colors.glass.background : colors.primary[500],
                                    borderColor: isConnected ? colors.primary[500] : 'transparent'
                                }
                            ]}
                            onPress={isConnected ? disconnect : connect}
                        >
                            {isConnected && (
                                <View style={[styles.walletDot, { backgroundColor: colors.semantic.success }]} />
                            )}
                            <Text style={[
                                styles.walletText,
                                { color: isConnected ? colors.primary[500] : '#000' }
                            ]}>
                                {isConnected ? shortAddress : t('common.connect')}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Main Content Area */}
                <View style={styles.mainContent}>
                    {/* Left Panel: Main Content */}
                    <View style={[
                        styles.leftPanel,
                        showRightPanel ? styles.leftPanelWithRight : undefined
                    ]}>
                        {children}
                    </View>

                    {/* Right Panel: Agent Workflow (Desktop only) */}
                    {showRightPanel && (
                        <View style={[styles.rightPanel, {
                            backgroundColor: colors.background.secondary,
                            borderLeftColor: colors.border.subtle
                        }]}>
                            {rightPanel}
                        </View>
                    )}
                </View>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
    },

    // Navbar
    navbar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.md,
        borderBottomWidth: 1,
    },
    navLeft: {
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
        fontSize: typography.fontSize.lg,
        fontWeight: typography.fontWeight.bold,
        letterSpacing: typography.letterSpacing.tight,
    },
    navCenter: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
    },
    navRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },

    // Jackpot Chip
    jackpotChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.full,
        borderWidth: 1,
    },
    jackpotLabel: {
        fontSize: typography.fontSize.xs,
        fontWeight: typography.fontWeight.medium,
    },
    jackpotValue: {
        fontSize: typography.fontSize.sm,
        fontWeight: typography.fontWeight.bold,
    },

    // Icon Buttons
    iconButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        padding: spacing.sm,
    },
    langText: {
        fontSize: typography.fontSize.xs,
        fontWeight: typography.fontWeight.medium,
    },

    // Balance Chip
    balanceChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.full,
    },
    balanceText: {
        fontSize: typography.fontSize.sm,
        fontWeight: typography.fontWeight.medium,
    },

    // Wallet Button
    walletButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.full,
        borderWidth: 1,
    },
    walletDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    walletText: {
        fontSize: typography.fontSize.sm,
        fontWeight: typography.fontWeight.semibold,
    },

    // Main Content
    mainContent: {
        flex: 1,
        flexDirection: 'row',
    },
    leftPanel: {
        flex: 1,
    },
    leftPanelWithRight: {
        flex: 3, // 左侧占 60%
    },
    rightPanel: {
        flex: 2, // 右侧占 40%
        borderLeftWidth: 1,
    },
});
