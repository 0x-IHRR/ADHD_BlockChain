/**
 * SponsorLogos - 赞助商 Logo 展示组件
 * 
 * 显示三个赞助商的 Logo + 名字（SpoonOS, ETHPanda, LXDAO）
 * 用于 CreateTaskScreen 左侧面板底部
 */
import React from 'react';
import { View, Image, StyleSheet, TouchableOpacity, Linking, Text } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { spacing, typography } from '../styles/tokens';
import { FadeInView } from '../styles/animations';

// 赞助商数据（顺序：ETHPanda → LXDAO → SpoonOS）
const SPONSORS = [
    {
        id: 'ethpanda',
        name: 'ETHPanda',
        logo: require('../assets/sponsors/ethpanda.png'),
        url: 'https://ethpanda.org',
    },
    {
        id: 'lxdao',
        name: 'LXDAO',
        logo: require('../assets/sponsors/lxdao.png'),
        url: 'https://lxdao.io',
    },
    {
        id: 'spoonos',
        name: 'SpoonOS',
        logo: require('../assets/sponsors/spoonos.png'),
        url: 'https://spoonos.io',
    },
];

interface SponsorLogosProps {
    size?: number; // Logo 尺寸
}

export default function SponsorLogos({ size = 80 }: SponsorLogosProps) {
    const { colors } = useTheme();

    const handlePress = (url: string) => {
        Linking.openURL(url);
    };

    return (
        <FadeInView delay={300}>
            <View style={styles.container}>
                {SPONSORS.map((sponsor) => (
                    <TouchableOpacity
                        key={sponsor.id}
                        onPress={() => handlePress(sponsor.url)}
                        activeOpacity={0.7}
                        style={styles.sponsorItem}
                    >
                        <Image
                            source={sponsor.logo}
                            style={[styles.logo, { width: size, height: size }]}
                            resizeMode="contain"
                        />
                        <Text style={[styles.sponsorName, { color: colors.primary[500] }]}>
                            {sponsor.name}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        </FadeInView>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'column',
        alignItems: 'flex-start', // 左对齐，保证 Logo 垂直对齐
        justifyContent: 'center',
        gap: spacing['3xl'], // Logo 之间的间距，更大
        paddingVertical: spacing.xl,
        marginTop: spacing['6xl'], // 整体再下移
        paddingLeft: 140, // 左侧内边距，整体右移 (约等于 14xl)
    },
    sponsorItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.lg, // 图标和文字之间的间距，更大
        opacity: 0.9,
    },
    logo: {
        // 尺寸由 props 控制
    },
    sponsorName: {
        fontSize: typography.fontSize.xl, // 更大的字体
        fontWeight: '700', // 更粗的字体
        letterSpacing: 1.5, // 更大的字间距，更酷
        // 保持原始品牌名称大小写
    },
});

