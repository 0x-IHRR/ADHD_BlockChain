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

// 赞助商数据
const SPONSORS = [
    {
        id: 'spoonos',
        name: 'SpoonOS',
        logo: require('../assets/sponsors/spoonos.png'),
        url: 'https://spoonos.io',
    },
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
];

interface SponsorLogosProps {
    size?: number; // Logo 尺寸
}

export default function SponsorLogos({ size = 48 }: SponsorLogosProps) {
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
                        <Text style={[styles.sponsorName, { color: colors.text.secondary }]}>
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
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.lg,
        paddingVertical: spacing.xl,
    },
    sponsorItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        opacity: 0.85,
    },
    logo: {
        // 尺寸由 props 控制
    },
    sponsorName: {
        fontSize: typography.fontSize.sm,
        fontWeight: '500',
        letterSpacing: 0.5,
    },
});
