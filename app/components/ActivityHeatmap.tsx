/**
 * ActivityHeatmap - 月度任务完成热力图
 * 
 * 类似 GitHub 贡献图，展示每日任务完成情况
 */
import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { spacing, typography, borderRadius } from '../styles/tokens';

interface DayData {
    date: Date;
    count: number;
    intensity: 0 | 1 | 2 | 3 | 4;
}

interface ActivityHeatmapProps {
    data?: DayData[];
    showHeader?: boolean;
}

// 生成 Mock 数据 (过去 60 天)
const generateMockData = (): DayData[] => {
    const data: DayData[] = [];
    const today = new Date();

    for (let i = 59; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);

        // 工作日更有可能完成任务
        const isWeekday = date.getDay() !== 0 && date.getDay() !== 6;
        const baseProb = isWeekday ? 0.7 : 0.4;

        // 随机生成任务数
        let count = 0;
        if (Math.random() < baseProb) {
            count = Math.floor(Math.random() * 6) + 1; // 1-6 个任务
        }

        // 计算强度
        let intensity: 0 | 1 | 2 | 3 | 4 = 0;
        if (count >= 5) intensity = 4;
        else if (count >= 4) intensity = 3;
        else if (count >= 2) intensity = 2;
        else if (count >= 1) intensity = 1;

        data.push({ date, count, intensity });
    }

    return data;
};

// 获取月份名称
const getMonthName = (date: Date): string => {
    const months = ['一月', '二月', '三月', '四月', '五月', '六月',
        '七月', '八月', '九月', '十月', '十一月', '十二月'];
    return months[date.getMonth()];
};

// 星期标签
const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];

export default function ActivityHeatmap({ data, showHeader = true }: ActivityHeatmapProps) {
    const { colors } = useTheme();

    // 使用传入数据或生成 Mock 数据
    const activityData = useMemo(() => data || generateMockData(), [data]);

    // 计算总任务数
    const totalTasks = useMemo(() =>
        activityData.reduce((sum, d) => sum + d.count, 0),
        [activityData]
    );

    // 获取当前月份
    const currentMonth = getMonthName(new Date());
    const currentYear = new Date().getFullYear();

    // 将数据按周分组 (7天一行)
    const weeks = useMemo(() => {
        const result: DayData[][] = [];
        for (let i = 0; i < activityData.length; i += 7) {
            result.push(activityData.slice(i, i + 7));
        }
        return result;
    }, [activityData]);

    // 根据 intensity 获取颜色
    const getColor = (intensity: number): string => {
        switch (intensity) {
            case 0: return colors.background.tertiary;
            case 1: return colors.primary[200] || `${colors.primary[500]}30`;
            case 2: return colors.primary[300] || `${colors.primary[500]}50`;
            case 3: return colors.primary[500] || `${colors.primary[500]}80`;
            case 4: return colors.primary[600] || colors.primary[500];
            default: return colors.background.tertiary;
        }
    };

    return (
        <View style={styles.container}>
            {showHeader && (
                <View style={styles.header}>
                    <Text style={[styles.title, { color: colors.text.secondary }]}>
                        📅 {currentMonth} {currentYear}
                    </Text>
                    <Text style={[styles.stats, { color: colors.text.muted }]}>
                        近 60 天: {totalTasks} 个任务
                    </Text>
                </View>
            )}

            {/* 星期标签 */}
            <View style={styles.weekdayRow}>
                {WEEKDAYS.map((day, i) => (
                    <Text key={i} style={[styles.weekdayLabel, { color: colors.text.muted }]}>
                        {day}
                    </Text>
                ))}
            </View>

            {/* 热力图网格 */}
            <View style={styles.grid}>
                {weeks.map((week, weekIndex) => (
                    <View key={weekIndex} style={styles.weekRow}>
                        {week.map((day, dayIndex) => (
                            <View
                                key={dayIndex}
                                style={[
                                    styles.cell,
                                    { backgroundColor: getColor(day.intensity) }
                                ]}
                            />
                        ))}
                        {/* 补齐不足 7 天的周 */}
                        {week.length < 7 && Array(7 - week.length).fill(null).map((_, i) => (
                            <View key={`empty-${i}`} style={styles.emptyCell} />
                        ))}
                    </View>
                ))}
            </View>

            {/* 图例 */}
            <View style={styles.legend}>
                <Text style={[styles.legendText, { color: colors.text.muted }]}>少</Text>
                {[0, 1, 2, 3, 4].map((level) => (
                    <View
                        key={level}
                        style={[styles.legendCell, { backgroundColor: getColor(level) }]}
                    />
                ))}
                <Text style={[styles.legendText, { color: colors.text.muted }]}>多</Text>
            </View>
        </View>
    );
}

const CELL_SIZE = 12;
const CELL_GAP = 3;

const styles = StyleSheet.create({
    container: {
        padding: spacing.md,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    title: {
        fontSize: typography.fontSize.sm,
        fontWeight: '600',
    },
    stats: {
        fontSize: typography.fontSize.xs,
    },
    weekdayRow: {
        flexDirection: 'row',
        marginBottom: spacing.xs,
    },
    weekdayLabel: {
        width: CELL_SIZE,
        marginRight: CELL_GAP,
        fontSize: 8,
        textAlign: 'center',
    },
    grid: {
        flexDirection: 'column',
    },
    weekRow: {
        flexDirection: 'row',
        marginBottom: CELL_GAP,
    },
    cell: {
        width: CELL_SIZE,
        height: CELL_SIZE,
        borderRadius: 2,
        marginRight: CELL_GAP,
    },
    emptyCell: {
        width: CELL_SIZE,
        height: CELL_SIZE,
        marginRight: CELL_GAP,
    },
    legend: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        marginTop: spacing.sm,
    },
    legendText: {
        fontSize: 10,
        marginHorizontal: spacing.xs,
    },
    legendCell: {
        width: 10,
        height: 10,
        borderRadius: 2,
        marginHorizontal: 1,
    },
});
