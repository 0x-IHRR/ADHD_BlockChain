/**
 * SponsorLogos - 赞助商 Logo 展示组件
 * 
 * 显示三个赞助商的 Logo（SpoonOS, ETHPanda, LXDAO）
 * 用于 CreateTaskScreen 左侧面板底部
 */
import React from 'react';
import { View, Image, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { spacing } from '../styles/tokens';
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
                {SPONSORS.map((sponsor, index) => (
                    <TouchableOpacity
                        key={sponsor.id}
                        onPress={() => handlePress(sponsor.url)}
                        activeOpacity={0.7}
                        style={styles.logoWrapper}
                    >
                        <Image
                            source={sponsor.logo}
                            style={[styles.logo, { width: size, height: size }]}
                            resizeMode="contain"
                        />
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
        gap: spacing.xl,
        paddingVertical: spacing.xl,
    },
    logoWrapper: {
        opacity: 0.8,
    },
    logo: {
        // 尺寸由 props 控制
    },
});
