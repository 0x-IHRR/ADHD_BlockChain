/**
 * ActivityHeatmap - 年度任务完成热力图 (GitHub 风格横向布局)
 * 
 * 显示过去一年的任务完成情况，类似 GitHub 贡献图
 */
import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useI18n } from '../context/I18nContext';
import { spacing, typography, borderRadius } from '../styles/tokens';

interface DayData {
    date: Date;
    count: number;
    intensity: 0 | 1 | 2 | 3 | 4;
}

interface ActivityHeatmapProps {
    data?: DayData[];
    weeks?: number; // 显示多少周，默认 26 周 (半年)
}

// 生成 Mock 数据 (过去 N 周)
const generateMockData = (weeks: number): DayData[] => {
    const data: DayData[] = [];
    const today = new Date();
    const totalDays = weeks * 7;

    for (let i = totalDays - 1; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);

        // 工作日更有可能完成任务
        const isWeekday = date.getDay() !== 0 && date.getDay() !== 6;
        const baseProb = isWeekday ? 0.65 : 0.35;

        // 随机生成任务数
        let count = 0;
        if (Math.random() < baseProb) {
            count = Math.floor(Math.random() * 6) + 1;
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

// 短月份名称
const MONTH_NAMES_ZH = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
const MONTH_NAMES_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// 星期标签 (只显示一三五)
const WEEKDAY_LABELS_ZH = ['', '一', '', '三', '', '五', ''];
const WEEKDAY_LABELS_EN = ['', 'Mon', '', 'Wed', '', 'Fri', ''];

export default function ActivityHeatmap({ data, weeks = 26 }: ActivityHeatmapProps) {
    const { colors } = useTheme();
    const { language } = useI18n();

    const isZh = language === 'zh';
    const monthNames = isZh ? MONTH_NAMES_ZH : MONTH_NAMES_EN;
    const weekdayLabels = isZh ? WEEKDAY_LABELS_ZH : WEEKDAY_LABELS_EN;

    // 使用传入数据或生成 Mock 数据
    const activityData = useMemo(() => data || generateMockData(weeks), [data, weeks]);

    // 计算总任务数
    const totalTasks = useMemo(() =>
        activityData.reduce((sum, d) => sum + d.count, 0),
        [activityData]
    );

    // 将数据按周分组 (GitHub 风格: 每列是一周，每行是星期几)
    const weekColumns = useMemo(() => {
        const columns: DayData[][] = [];

        // 找到第一天是星期几，用于对齐
        const firstDayOfWeek = activityData[0]?.date.getDay() || 0;

        // 添加空占位符到第一周
        const paddedData: (DayData | null)[] = [];
        for (let i = 0; i < firstDayOfWeek; i++) {
            paddedData.push(null);
        }
        paddedData.push(...activityData);

        // 分割成周
        for (let i = 0; i < paddedData.length; i += 7) {
            const week = paddedData.slice(i, i + 7);
            // 补齐不足 7 天的周
            while (week.length < 7) {
                week.push(null);
            }
            columns.push(week as DayData[]);
        }

        return columns;
    }, [activityData]);

    // 获取月份标签位置
    const monthLabels = useMemo(() => {
        const labels: { month: string; position: number }[] = [];
        let lastMonth = -1;

        weekColumns.forEach((week, colIndex) => {
            const validDay = week.find(d => d !== null);
            if (validDay) {
                const month = validDay.date.getMonth();
                if (month !== lastMonth) {
                    labels.push({
                        month: monthNames[month],
                        position: colIndex
                    });
                    lastMonth = month;
                }
            }
        });

        return labels;
    }, [weekColumns, monthNames]);

    // 根据 intensity 获取颜色
    const getColor = (intensity: number | null): string => {
        if (intensity === null) return 'transparent';
        switch (intensity) {
            case 0: return colors.background.tertiary;
            case 1: return colors.primary[200] || `${colors.primary[500]}40`;
            case 2: return colors.primary[300] || `${colors.primary[500]}60`;
            case 3: return colors.primary[500];
            case 4: return colors.primary[600] || colors.primary[500];
            default: return colors.background.tertiary;
        }
    };

    return (
        <View style={styles.container}>
            {/* 标题栏 */}
            <View style={styles.header}>
                <Text style={[styles.title, { color: colors.text.primary }]}>
                    {isZh ? `${totalTasks} 个任务完成记录` : `${totalTasks} tasks completed`}
                </Text>
            </View>

            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                <View style={styles.gridWrapper}>
                    {/* 月份标签行 */}
                    <View style={styles.monthRow}>
                        <View style={styles.weekdayLabelSpace} />
                        {weekColumns.map((_, colIndex) => {
                            const label = monthLabels.find(l => l.position === colIndex);
                            return (
                                <View key={colIndex} style={styles.monthCell}>
                                    {label && (
                                        <Text style={[styles.monthLabel, { color: colors.text.muted }]}>
                                            {label.month}
                                        </Text>
                                    )}
                                </View>
                            );
                        })}
                    </View>

                    {/* 热力图主体 */}
                    <View style={styles.gridBody}>
                        {/* 星期标签列 */}
                        <View style={styles.weekdayColumn}>
                            {weekdayLabels.map((label, i) => (
                                <View key={i} style={styles.weekdayCell}>
                                    <Text style={[styles.weekdayLabel, { color: colors.text.muted }]}>
                                        {label}
                                    </Text>
                                </View>
                            ))}
                        </View>

                        {/* 日期格子 */}
                        <View style={styles.grid}>
                            {weekColumns.map((week, colIndex) => (
                                <View key={colIndex} style={styles.weekColumn}>
                                    {[0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => {
                                        const day = week[dayOfWeek];
                                        return (
                                            <View
                                                key={dayOfWeek}
                                                style={[
                                                    styles.cell,
                                                    {
                                                        backgroundColor: day ? getColor(day.intensity) : 'transparent',
                                                        borderColor: day ? colors.border.subtle : 'transparent',
                                                    }
                                                ]}
                                            />
                                        );
                                    })}
                                </View>
                            ))}
                        </View>
                    </View>
                </View>
            </ScrollView>

            {/* 图例 */}
            <View style={styles.legend}>
                <Text style={[styles.legendText, { color: colors.text.muted }]}>
                    {isZh ? '少' : 'Less'}
                </Text>
                {[0, 1, 2, 3, 4].map((level) => (
                    <View
                        key={level}
                        style={[styles.legendCell, { backgroundColor: getColor(level) }]}
                    />
                ))}
                <Text style={[styles.legendText, { color: colors.text.muted }]}>
                    {isZh ? '多' : 'More'}
                </Text>
            </View>
        </View>
    );
}

const CELL_SIZE = 11;
const CELL_GAP = 3;

const styles = StyleSheet.create({
    container: {
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.sm,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.md,
        paddingHorizontal: spacing.xs,
    },
    title: {
        fontSize: typography.fontSize.sm,
        fontWeight: '600',
    },
    scrollContent: {
        paddingRight: spacing.md,
    },
    gridWrapper: {
        flexDirection: 'column',
    },
    monthRow: {
        flexDirection: 'row',
        marginBottom: spacing.xs,
    },
    weekdayLabelSpace: {
        width: 28,
    },
    monthCell: {
        width: CELL_SIZE + CELL_GAP,
        alignItems: 'flex-start',
    },
    monthLabel: {
        fontSize: 10,
        fontWeight: '500',
    },
    gridBody: {
        flexDirection: 'row',
    },
    weekdayColumn: {
        marginRight: spacing.xs,
    },
    weekdayCell: {
        height: CELL_SIZE + CELL_GAP,
        justifyContent: 'center',
    },
    weekdayLabel: {
        fontSize: 9,
        fontWeight: '500',
        width: 24,
    },
    grid: {
        flexDirection: 'row',
    },
    weekColumn: {
        flexDirection: 'column',
    },
    cell: {
        width: CELL_SIZE,
        height: CELL_SIZE,
        borderRadius: 2,
        marginRight: CELL_GAP,
        marginBottom: CELL_GAP,
    },
    legend: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        marginTop: spacing.md,
        paddingRight: spacing.xs,
    },
    legendText: {
        fontSize: 10,
        marginHorizontal: spacing.xs,
    },
    legendCell: {
        width: CELL_SIZE,
        height: CELL_SIZE,
        borderRadius: 2,
        marginHorizontal: 1,
    },
});
