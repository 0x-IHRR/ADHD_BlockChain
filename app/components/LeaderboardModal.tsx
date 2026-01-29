/**
 * LeaderboardModal - 排行榜与奖金池详情
 * 
 * 显示顶部硬核玩家、最近中奖者和奖金池统计
 */
import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    ScrollView,
    Image,
} from 'react-native';
import { X, Trophy, Flame, Crown, Zap } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useI18n } from '../context/I18nContext';
import { spacing, typography, borderRadius } from '../styles/tokens';
import { getAllTasksFromChain, OnChainTask, TaskStatus, formatEth } from '../services/contract.service';
import { useWallet } from '../context/WalletContext';
import { USE_MOCK_DATA, MOCK_CONFIG } from '../config/demo';
import { MOCK_PLAYERS, MOCK_WINNERS, MOCK_JACKPOT } from '../mocks/leaderboard';

interface LeaderboardModalProps {
    visible: boolean;
    onClose: () => void;
    jackpotAmount: string;
}

interface Player {
    id: string;
    name: string;
    score: number;
    streak: number;
    multiplier: number;
}

interface Winner {
    id: string;
    name: string;
    amount: string;
    task: string;
}

export default function LeaderboardModal({ visible, onClose, jackpotAmount }: LeaderboardModalProps) {
    const { colors, isDark } = useTheme();
    const { t } = useI18n();
    const { shortAddress } = useWallet();

    const [loading, setLoading] = React.useState(false);
    const [players, setPlayers] = React.useState<Player[]>([]);
    const [winners, setWinners] = React.useState<Winner[]>([]);

    // 加载数据
    React.useEffect(() => {
        if (visible) {
            loadLeaderboardData();
        }
    }, [visible]);

    const loadLeaderboardData = async () => {
        setLoading(true);
        try {
            // 如果启用 Mock 数据，直接使用预设数据
            if (USE_MOCK_DATA && MOCK_CONFIG.leaderboard) {
                setPlayers(MOCK_PLAYERS);
                setWinners(MOCK_WINNERS);
                setLoading(false);
                return;
            }

            // 否则从链上获取真实数据
            const allTasks = await getAllTasksFromChain();

            // 1. 计算排行榜 (Top Players)
            const userStats = new Map<string, { score: number, verifiedCount: number, maxMultiplier: number }>();

            allTasks.forEach(task => {
                // 只统计已验证或已结算的任务
                if (task.status === TaskStatus.Verified || task.status === TaskStatus.Settled) {
                    const stats = userStats.get(task.owner) || { score: 0, verifiedCount: 0, maxMultiplier: 1 };

                    // 分数计算: 基础分10 * 倍率
                    const taskScore = 10 * (task.multiplier || 1);
                    stats.score += taskScore;
                    stats.verifiedCount += 1;
                    stats.maxMultiplier = Math.max(stats.maxMultiplier, task.multiplier || 1);

                    userStats.set(task.owner, stats);
                }
            });

            const sortedPlayers: Player[] = Array.from(userStats.entries())
                .map(([owner, stats]) => ({
                    id: owner,
                    name: `${owner.slice(0, 6)}...${owner.slice(-4)}`,
                    score: stats.score,
                    streak: stats.verifiedCount, // 简化: 用总验证数代替连胜
                    multiplier: stats.maxMultiplier
                }))
                .sort((a, b) => b.score - a.score)
                .slice(0, 10); // Top 10

            setPlayers(sortedPlayers);

            // 2. 获取最近中奖者 (Recent Winners)
            // 过滤出 Verified 的任务
            const recentVerified = allTasks
                .filter(t => t.status === TaskStatus.Verified || t.status === TaskStatus.Settled)
                .sort((a, b) => Number(b.createdAt - a.createdAt))
                .slice(0, 5);

            const recentWinnersFormatted: Winner[] = recentVerified.map(t => ({
                id: t.id.toString(),
                name: `${t.owner.slice(0, 6)}...${t.owner.slice(-4)}`,
                amount: formatEth(t.stakeAmount), // 显示质押金额作为赢得的基数
                task: t.description
            }));

            setWinners(recentWinnersFormatted);

        } catch (error) {
            console.error('Failed to load leaderboard:', error);
        } finally {
            setLoading(false);
        }
    };

    // 动态样式
    const modalBg = isDark ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.8)';

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={[styles.overlay, { backgroundColor: modalBg }]}>
                {/* 
                  TODO: 如果 Expo 环境支持 BlurView，可以替换 View 实现毛玻璃效果 
                  目前使用半透明背景作为兼容方案
                */}
                <View style={[styles.container, {
                    backgroundColor: colors.background.primary,
                    borderColor: colors.border.subtle
                }]}>
                    {/* Header */}
                    <View style={[styles.header, { borderBottomColor: colors.border.subtle }]}>
                        <View style={styles.headerTitleRow}>
                            <Trophy size={20} color={colors.primary[500]} />
                            <Text style={[styles.title, { color: colors.text.primary }]}>
                                {t('leaderboard.title')}
                            </Text>
                        </View>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <X size={20} color={colors.text.secondary} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                        {/* Jackpot Banner */}
                        <View style={[styles.jackpotBanner, { backgroundColor: colors.glass.backgroundLight }]}>
                            <Text style={[styles.jackpotLabel, { color: colors.text.muted }]}>
                                {t('common.jackpot')}
                            </Text>
                            <Text style={[styles.jackpotValue, { color: colors.primary[500] }]}>
                                {USE_MOCK_DATA && MOCK_CONFIG.jackpot ? MOCK_JACKPOT.current : jackpotAmount} ETH
                            </Text>
                            <View style={styles.jackpotStats}>
                                <Text style={[styles.statText, { color: colors.text.tertiary }]}>
                                    Total Distributed: {USE_MOCK_DATA && MOCK_CONFIG.jackpot ? MOCK_JACKPOT.totalDistributed : '0'} ETH
                                </Text>
                            </View>
                        </View>

                        {/* Top Players */}
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <Crown size={18} color={colors.semantic.warning} />
                                <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
                                    {t('leaderboard.topPlayers')}
                                </Text>
                            </View>

                            {players.length === 0 ? (
                                <Text style={{ padding: 20, textAlign: 'center', color: colors.text.muted }}>
                                    {loading ? 'Loading...' : 'No players yet. Be the first!'}
                                </Text>
                            ) : (
                                players.map((player, index) => {
                                    // 前三名边框颜色: 金、银、铜
                                    const getRankBorderColor = (rank: number) => {
                                        if (rank === 0) return '#FFD700'; // 金色
                                        if (rank === 1) return '#C0C0C0'; // 银色
                                        if (rank === 2) return '#CD7F32'; // 铜色
                                        return 'transparent';
                                    };
                                    const getRankTextColor = (rank: number) => {
                                        if (rank === 0) return '#FFD700';
                                        if (rank === 1) return '#C0C0C0';
                                        if (rank === 2) return '#CD7F32';
                                        return colors.text.muted;
                                    };
                                    return (
                                        <View key={player.id} style={[styles.playerRow, {
                                            backgroundColor: colors.background.secondary,
                                            borderColor: getRankBorderColor(index),
                                            borderWidth: index < 3 ? 1.5 : 0
                                        }]}>
                                            <View style={styles.rankCol}>
                                                <Text style={[styles.rankText, {
                                                    color: getRankTextColor(index),
                                                    fontWeight: index < 3 ? 'bold' : 'normal'
                                                }]}>#{index + 1}</Text>
                                            </View>
                                            <View style={styles.playerInfo}>
                                                <Text style={[styles.playerName, { color: colors.text.primary }]}>{player.name}</Text>
                                                <View style={styles.badgeRow}>
                                                    {player.multiplier > 1 && (
                                                        <View style={[styles.multiplierBadge, { backgroundColor: colors.semantic.error }]}>
                                                            <Text style={styles.multiplierText}>{player.multiplier}x</Text>
                                                        </View>
                                                    )}
                                                    <Text style={{ fontSize: 10, color: colors.text.tertiary, marginLeft: 4 }}>
                                                        {player.streak} wins
                                                    </Text>
                                                </View>
                                            </View>
                                            <View style={styles.scoreCol}>
                                                <Flame size={14} color={colors.primary[400]} />
                                                <Text style={[styles.scoreText, { color: colors.text.primary }]}>{player.score}</Text>
                                            </View>
                                        </View>
                                    );
                                })
                            )}
                        </View>

                        {/* Recent Winners */}
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <Zap size={18} color={colors.semantic.success} />
                                <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
                                    {t('leaderboard.recentWinners')}
                                </Text>
                            </View>

                            {winners.length === 0 ? (
                                <Text style={{ padding: 20, textAlign: 'center', color: colors.text.muted }}>
                                    {loading ? 'Loading...' : 'No winners yet.'}
                                </Text>
                            ) : (
                                winners.map((winner) => (
                                    <View key={winner.id} style={[styles.winnerCard, { backgroundColor: colors.background.tertiary }]}>
                                        <View style={styles.winnerHeader}>
                                            <Text style={[styles.winnerName, { color: colors.text.secondary }]}>{winner.name}</Text>
                                            <Text style={[styles.winAmount, { color: colors.semantic.success }]}>+{winner.amount}</Text>
                                        </View>
                                        <Text style={[styles.winTask, { color: colors.text.muted }]} numberOfLines={1}>
                                            {winner.task}
                                        </Text>
                                    </View>
                                ))
                            )}
                        </View>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    container: {
        width: '90%',
        maxWidth: 480,
        height: '80%',
        maxHeight: 700,
        borderRadius: borderRadius.xl,
        borderWidth: 1,
        overflow: 'hidden',
        // Shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.3,
        shadowRadius: 40,
        elevation: 10,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: spacing.lg,
        borderBottomWidth: 1,
    },
    headerTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    title: {
        fontSize: typography.fontSize.lg,
        fontWeight: typography.fontWeight.bold,
    },
    closeButton: {
        padding: spacing.xs,
    },
    content: {
        padding: spacing.lg,
    },

    // Jackpot Banner
    jackpotBanner: {
        alignItems: 'center',
        padding: spacing.xl,
        borderRadius: borderRadius.lg,
        marginBottom: spacing.xl,
    },
    jackpotLabel: {
        fontSize: typography.fontSize.sm,
        fontWeight: typography.fontWeight.medium,
        marginBottom: spacing.xs,
    },
    jackpotValue: {
        fontSize: typography.fontSize['3xl'],
        fontWeight: typography.fontWeight.bold,
        marginBottom: spacing.sm,
    },
    jackpotStats: {
        flexDirection: 'row',
        gap: spacing.md,
    },
    statText: {
        fontSize: typography.fontSize.xs,
    },

    // Sections
    section: {
        marginBottom: spacing.xl,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        marginBottom: spacing.md,
    },
    sectionTitle: {
        fontSize: typography.fontSize.base,
        fontWeight: typography.fontWeight.bold,
    },

    // Player Row
    playerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        borderRadius: borderRadius.lg,
        marginBottom: spacing.sm,
    },
    rankCol: {
        width: 32,
        alignItems: 'center',
    },
    rankText: {
        fontSize: typography.fontSize.sm,
    },
    playerInfo: {
        flex: 1,
        marginLeft: spacing.sm,
    },
    playerName: {
        fontSize: typography.fontSize.sm,
        fontWeight: typography.fontWeight.medium,
    },
    badgeRow: {
        flexDirection: 'row',
        marginTop: 2,
    },
    multiplierBadge: {
        paddingHorizontal: 4,
        paddingVertical: 2,
        borderRadius: 4,
    },
    multiplierText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    },
    scoreCol: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    scoreText: {
        fontSize: typography.fontSize.sm,
        fontWeight: typography.fontWeight.bold,
    },

    // Recent Winners
    winnerCard: {
        padding: spacing.md,
        borderRadius: borderRadius.lg,
        marginBottom: spacing.sm,
    },
    winnerHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    winnerName: {
        fontSize: typography.fontSize.xs,
        fontWeight: typography.fontWeight.medium,
    },
    winAmount: {
        fontSize: typography.fontSize.xs,
        fontWeight: typography.fontWeight.bold,
    },
    winTask: {
        fontSize: typography.fontSize.sm,
    },
});
