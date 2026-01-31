/**
 * SpoonOSBranding - 赞助商竖排 Logo 组件
 * 
 * 使用科技感字体和渐变效果展示 "SpoonOS" 品牌
 * 从上到下垂直排列，营造赛博朋克科技感
 */
import React from 'react';
import { View, Text, StyleSheet, Linking, TouchableOpacity, Platform } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { spacing, typography, borderRadius } from '../styles/tokens';
import { FadeInView } from '../styles/animations';

interface SpoonOSBrandingProps {
    onPress?: () => void;
}

export default function SpoonOSBranding({ onPress }: SpoonOSBrandingProps) {
    const { colors } = useTheme();

    const handlePress = () => {
        if (onPress) {
            onPress();
        } else {
            // 默认跳转到 SpoonOS 官网
            Linking.openURL('https://spoonos.io');
        }
    };

    // 竖排字母
    const letters = ['S', 'P', 'O', 'O', 'N', 'O', 'S'];

    return (
        <FadeInView delay={200}>
            <TouchableOpacity
                onPress={handlePress}
                activeOpacity={0.8}
                style={styles.container}
            >
                {/* 主标题：竖排大字 */}
                <View style={styles.verticalText}>
                    {letters.map((letter, index) => (
                        <Text
                            key={index}
                            style={[
                                styles.letter,
                                {
                                    color: colors.primary[500],
                                    // 交替透明度营造层次感
                                    opacity: index === 0 || index === letters.length - 1 ? 1 : 0.7 + (index * 0.05),
                                }
                            ]}
                        >
                            {letter}
                        </Text>
                    ))}
                </View>

                {/* 底部标签 */}
                <View style={[styles.badge, { borderColor: colors.primary[500] + '40' }]}>
                    <Text style={[styles.badgeText, { color: colors.text.muted }]}>
                        SPONSOR
                    </Text>
                </View>
            </TouchableOpacity>
        </FadeInView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'space-between', // 拉开上下间距
        paddingTop: spacing['4xl'], // 往下移一点
        paddingBottom: spacing['2xl'],
    },
    verticalText: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing['2xl'], // 字母之间的间距 (更大)
    },
    letter: {
        fontSize: 48, // 更大的字体
        fontWeight: '900', // 最粗
        fontFamily: Platform.OS === 'web' ? 'Inter, system-ui, sans-serif' : undefined,
        letterSpacing: -2,
        textTransform: 'uppercase',
        lineHeight: 48, // 匹配字体大小
        // 科技感文字阴影
        textShadowColor: 'rgba(0, 0, 0, 0.5)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    badge: {
        marginTop: spacing['2xl'],
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.sm,
        borderWidth: 1,
    },
    badgeText: {
        fontSize: typography.fontSize.xs,
        fontWeight: typography.fontWeight.medium,
        letterSpacing: 3,
    },
});
