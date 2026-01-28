/**
 * AchievementModal - 成就徽章展示弹窗
 * 
 * 显示三种徽章的获取状态/进度/赋能说明
 */
import React from 'react';
import {
    View,
    Text,
    Modal,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
} from 'react-native';
import { X, Award, Lock, Check, Zap, Vote, Percent } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useI18n } from '../context/I18nContext';
import { spacing, typography, borderRadius } from '../styles/tokens';
import { useAchievementNFT, BADGES, BadgeType, BadgeInfo } from '../hooks/useAchievementNFT';

interface AchievementModalProps {
    visible: boolean;
    onClose: () => void;
    contractAddress?: string;
}

// 单个徽章卡片
const BadgeCard = ({
    badge,
    hasBadge,
    canClaim,
    progress,
    onClaim,
    loading,
}: {
    badge: BadgeInfo;
    hasBadge: boolean;
    canClaim: boolean;
    progress: number;
    onClaim: () => void;
    loading: boolean;
}) => {
    const { colors } = useTheme();

    const isUnlocked = hasBadge || canClaim;
    const progressPercent = Math.min(100, (progress / badge.threshold) * 100);

    return (
        <View style={[
            styles.badgeCard,
            {
                backgroundColor: colors.glass.backgroundLight,
                borderColor: hasBadge ? badge.color : colors.border.subtle,
                opacity: isUnlocked ? 1 : 0.6,
            }
        ]}>
            {/* 徽章图标 */}
            <View style={[
                styles.badgeIcon,
                { backgroundColor: hasBadge ? badge.color : colors.background.tertiary }
            ]}>
                {hasBadge ? (
                    <Award size={32} color="#FFF" />
                ) : (
                    <Lock size={24} color={colors.text.muted} />
                )}
            </View>

            {/* 徽章信息 */}
            <View style={styles.badgeInfo}>
                <Text style={[styles.badgeName, { color: colors.text.primary }]}>
                    {badge.nameZh}
                </Text>
                <Text style={[styles.badgeNameEn, { color: colors.text.muted }]}>
                    {badge.name}
                </Text>

                {/* 进度条 */}
                <View style={styles.progressContainer}>
                    <View style={[styles.progressBar, { backgroundColor: colors.background.tertiary }]}>
                        <View style={[
                            styles.progressFill,
                            { width: `${progressPercent}%`, backgroundColor: badge.color }
                        ]} />
                    </View>
                    <Text style={[styles.progressText, { color: colors.text.secondary }]}>
                        {progress}/{badge.threshold}
                    </Text>
                </View>

                {/* 赋能说明 */}
                <View style={styles.perks}>
                    <View style={styles.perkItem}>
                        <Percent size={12} color={colors.text.muted} />
                        <Text style={[styles.perkText, { color: colors.text.secondary }]}>
                            {badge.discount}% 折扣
                        </Text>
                    </View>
                    {badge.type >= BadgeType.Master && (
                        <View style={styles.perkItem}>
                            <Zap size={12} color={colors.text.muted} />
                            <Text style={[styles.perkText, { color: colors.text.secondary }]}>
                                5x/10x 解锁
                            </Text>
                        </View>
                    )}
                    <View style={styles.perkItem}>
                        <Vote size={12} color={colors.text.muted} />
                        <Text style={[styles.perkText, { color: colors.text.secondary }]}>
                            {badge.votingPower} 票
                        </Text>
                    </View>
                </View>
            </View>

            {/* 操作按钮 */}
            <View style={styles.badgeAction}>
                {hasBadge ? (
                    <View style={[styles.claimedBadge, { backgroundColor: badge.color }]}>
                        <Check size={16} color="#FFF" />
                    </View>
                ) : canClaim ? (
                    <TouchableOpacity
                        style={[styles.claimButton, { backgroundColor: badge.color }]}
                        onPress={onClaim}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator size="small" color="#FFF" />
                        ) : (
                            <Text style={styles.claimButtonText}>领取</Text>
                        )}
                    </TouchableOpacity>
                ) : (
                    <View style={[styles.lockedBadge, { backgroundColor: colors.background.tertiary }]}>
                        <Lock size={16} color={colors.text.muted} />
                    </View>
                )}
            </View>
        </View>
    );
};

export default function AchievementModal({ visible, onClose, contractAddress }: AchievementModalProps) {
    const { colors } = useTheme();
    const { t } = useI18n();
    const { loading, state, claimBadge } = useAchievementNFT(contractAddress);

    const handleClaim = async (badgeType: BadgeType) => {
        try {
            await claimBadge(badgeType);
        } catch (e) {
            console.error('Claim failed:', e);
        }
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.headerLeft}>
                            <Award size={24} color={colors.primary[500]} />
                            <Text style={[styles.title, { color: colors.text.primary }]}>
                                成就徽章
                            </Text>
                        </View>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <X size={24} color={colors.text.secondary} />
                        </TouchableOpacity>
                    </View>

                    {/* 用户统计 */}
                    {state && (
                        <View style={[styles.statsBar, { backgroundColor: colors.glass.backgroundLight }]}>
                            <View style={styles.statItem}>
                                <Text style={[styles.statValue, { color: colors.primary[500] }]}>
                                    {state.completedCount}
                                </Text>
                                <Text style={[styles.statLabel, { color: colors.text.muted }]}>
                                    已完成任务
                                </Text>
                            </View>
                            <View style={styles.statDivider} />
                            <View style={styles.statItem}>
                                <Text style={[styles.statValue, { color: colors.semantic.success }]}>
                                    {state.discount}%
                                </Text>
                                <Text style={[styles.statLabel, { color: colors.text.muted }]}>
                                    当前折扣
                                </Text>
                            </View>
                            <View style={styles.statDivider} />
                            <View style={styles.statItem}>
                                <Text style={[styles.statValue, { color: colors.primary[400] }]}>
                                    {state.votingPower}
                                </Text>
                                <Text style={[styles.statLabel, { color: colors.text.muted }]}>
                                    投票权
                                </Text>
                            </View>
                        </View>
                    )}

                    {/* 徽章列表 */}
                    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                        {loading && !state ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="large" color={colors.primary[500]} />
                            </View>
                        ) : (
                            BADGES.map((badge, index) => (
                                <BadgeCard
                                    key={badge.type}
                                    badge={badge}
                                    hasBadge={state?.hasBadges[index] ?? false}
                                    canClaim={state?.canClaimBadges[index] ?? false}
                                    progress={state?.completedCount ?? 0}
                                    onClaim={() => handleClaim(badge.type)}
                                    loading={loading}
                                />
                            ))
                        )}

                        {/* 高倍率解锁提示 */}
                        {state && !state.canUseHighMultiplier && (
                            <View style={[styles.tipBox, { backgroundColor: colors.glass.backgroundLight }]}>
                                <Zap size={16} color={colors.primary[400]} />
                                <Text style={[styles.tipText, { color: colors.text.secondary }]}>
                                    获得 Master 徽章后可解锁 5x/10x 高倍率质押
                                </Text>
                            </View>
                        )}
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    container: {
        borderTopLeftRadius: borderRadius.xl,
        borderTopRightRadius: borderRadius.xl,
        maxHeight: '85%',
        paddingBottom: spacing.xl,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    title: {
        fontSize: typography.fontSize.xl,
        fontWeight: typography.fontWeight.bold,
    },
    closeButton: {
        padding: spacing.xs,
    },
    statsBar: {
        flexDirection: 'row',
        margin: spacing.lg,
        marginBottom: 0,
        padding: spacing.md,
        borderRadius: borderRadius.lg,
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statValue: {
        fontSize: typography.fontSize.xl,
        fontWeight: typography.fontWeight.bold,
    },
    statLabel: {
        fontSize: typography.fontSize.xs,
        marginTop: spacing.xs,
    },
    statDivider: {
        width: 1,
        backgroundColor: 'rgba(255,255,255,0.1)',
        marginVertical: spacing.xs,
    },
    content: {
        padding: spacing.lg,
    },
    loadingContainer: {
        padding: spacing['2xl'],
        alignItems: 'center',
    },
    badgeCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        borderRadius: borderRadius.lg,
        borderWidth: 2,
        marginBottom: spacing.md,
    },
    badgeIcon: {
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
    },
    badgeInfo: {
        flex: 1,
        marginLeft: spacing.md,
    },
    badgeName: {
        fontSize: typography.fontSize.base,
        fontWeight: typography.fontWeight.semibold,
    },
    badgeNameEn: {
        fontSize: typography.fontSize.xs,
        marginTop: 2,
    },
    progressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: spacing.sm,
        gap: spacing.sm,
    },
    progressBar: {
        flex: 1,
        height: 6,
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 3,
    },
    progressText: {
        fontSize: typography.fontSize.xs,
        minWidth: 40,
        textAlign: 'right',
    },
    perks: {
        flexDirection: 'row',
        marginTop: spacing.sm,
        gap: spacing.md,
    },
    perkItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    perkText: {
        fontSize: typography.fontSize.xs,
    },
    badgeAction: {
        marginLeft: spacing.sm,
    },
    claimButton: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.md,
    },
    claimButtonText: {
        color: '#FFF',
        fontSize: typography.fontSize.sm,
        fontWeight: typography.fontWeight.bold,
    },
    claimedBadge: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    lockedBadge: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    tipBox: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        borderRadius: borderRadius.md,
        gap: spacing.sm,
        marginTop: spacing.md,
    },
    tipText: {
        flex: 1,
        fontSize: typography.fontSize.sm,
    },
});
