/**
 * Spoons - FocusFlow 吉祥物组件
 * 
 * 一个拟人化的金属勺子角色，用于可视化 AI Agent 状态
 * 灵感来自 Spoon Theory (慢性疲劳理论)
 */
import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, {
    Ellipse,
    Path,
    Circle,
    G,
    Defs,
    LinearGradient,
    Stop,
    RadialGradient
} from 'react-native-svg';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    withSequence,
    withSpring,
    Easing,
    interpolate,
    useDerivedValue,
} from 'react-native-reanimated';

// 状态类型
export type SpoonsMood = 'neutral' | 'thinking' | 'happy' | 'shaking';

interface SpoonsProps {
    mood?: SpoonsMood;
    size?: number;
}

const AnimatedView = Animated.createAnimatedComponent(View);

export default function Spoons({ mood = 'neutral', size = 120 }: SpoonsProps) {
    // 动画值
    const rotation = useSharedValue(0);
    const bounce = useSharedValue(0);
    const shake = useSharedValue(0);
    const eyeBlink = useSharedValue(1);
    const glowOpacity = useSharedValue(0);

    // 眨眼动画 (所有状态)
    useEffect(() => {
        const blinkInterval = setInterval(() => {
            eyeBlink.value = withSequence(
                withTiming(0.1, { duration: 80 }),
                withTiming(1, { duration: 80 })
            );
        }, 3000 + Math.random() * 2000);
        return () => clearInterval(blinkInterval);
    }, []);

    // 根据 mood 启动不同动画
    useEffect(() => {
        // 重置
        rotation.value = 0;
        bounce.value = 0;
        shake.value = 0;
        glowOpacity.value = 0;

        switch (mood) {
            case 'thinking':
                // 左右轻微摇摆
                rotation.value = withRepeat(
                    withSequence(
                        withTiming(-8, { duration: 400, easing: Easing.inOut(Easing.ease) }),
                        withTiming(8, { duration: 400, easing: Easing.inOut(Easing.ease) })
                    ),
                    -1,
                    true
                );
                break;

            case 'happy':
                // 跳跃 + 发光
                bounce.value = withRepeat(
                    withSequence(
                        withSpring(-15, { damping: 8, stiffness: 200 }),
                        withSpring(0, { damping: 8, stiffness: 200 })
                    ),
                    3,
                    false
                );
                glowOpacity.value = withRepeat(
                    withSequence(
                        withTiming(0.8, { duration: 300 }),
                        withTiming(0.3, { duration: 300 })
                    ),
                    3,
                    true
                );
                break;

            case 'shaking':
                // 剧烈抖动
                shake.value = withRepeat(
                    withSequence(
                        withTiming(-5, { duration: 30 }),
                        withTiming(5, { duration: 30 }),
                        withTiming(-3, { duration: 30 }),
                        withTiming(3, { duration: 30 })
                    ),
                    -1,
                    true
                );
                glowOpacity.value = withTiming(0.6, { duration: 200 });
                break;
        }
    }, [mood]);

    // 组合动画样式
    const animatedStyle = useAnimatedStyle(() => ({
        transform: [
            { translateY: bounce.value },
            { translateX: shake.value },
            { rotate: `${rotation.value}deg` },
        ],
    }));

    // 根据 mood 决定颜色
    const getColors = () => {
        switch (mood) {
            case 'thinking':
                return { body: '#7AB7FF', glow: '#7AB7FF' }; // 蓝色思考
            case 'happy':
                return { body: '#1BE3C2', glow: '#1BE3C2' }; // 成功绿
            case 'shaking':
                return { body: '#FF4757', glow: '#FF4757' }; // 失败红
            default:
                return { body: '#C0C0C0', glow: '#FFFFFF' }; // 银色中立
        }
    };

    const colors = getColors();

    return (
        <AnimatedView style={[styles.container, { width: size, height: size * 1.5 }, animatedStyle]}>
            <Svg width={size} height={size * 1.5} viewBox="0 0 100 150">
                <Defs>
                    {/* 金属渐变 */}
                    <LinearGradient id="metalGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <Stop offset="0%" stopColor="#F0F0F0" />
                        <Stop offset="30%" stopColor={colors.body} />
                        <Stop offset="70%" stopColor="#A0A0A0" />
                        <Stop offset="100%" stopColor="#808080" />
                    </LinearGradient>

                    {/* 发光效果 */}
                    <RadialGradient id="glowGradient" cx="50%" cy="50%" r="50%">
                        <Stop offset="0%" stopColor={colors.glow} stopOpacity="0.6" />
                        <Stop offset="100%" stopColor={colors.glow} stopOpacity="0" />
                    </RadialGradient>
                </Defs>

                {/* 发光圈 (动态) */}
                {(mood === 'happy' || mood === 'shaking') && (
                    <Ellipse
                        cx="50"
                        cy="40"
                        rx="45"
                        ry="45"
                        fill="url(#glowGradient)"
                        opacity={0.5}
                    />
                )}

                {/* 勺子头部 (椭圆形) */}
                <Ellipse
                    cx="50"
                    cy="40"
                    rx="35"
                    ry="38"
                    fill="url(#metalGradient)"
                    stroke="#606060"
                    strokeWidth="1"
                />

                {/* 勺子凹陷 (内部阴影) */}
                <Ellipse
                    cx="50"
                    cy="38"
                    rx="25"
                    ry="28"
                    fill="#E8E8E8"
                    opacity="0.3"
                />

                {/* 眼睛 - 左 */}
                <G>
                    <Circle cx="38" cy="35" r="6" fill="#FFFFFF" />
                    <Circle cx="38" cy="35" r="4" fill="#1A1A22" />
                    <Circle cx="36" cy="33" r="1.5" fill="#FFFFFF" />
                </G>

                {/* 眼睛 - 右 */}
                <G>
                    <Circle cx="62" cy="35" r="6" fill="#FFFFFF" />
                    <Circle cx="62" cy="35" r="4" fill="#1A1A22" />
                    <Circle cx="60" cy="33" r="1.5" fill="#FFFFFF" />
                </G>

                {/* 嘴巴 - 根据 mood 变化 */}
                {mood === 'happy' ? (
                    // 大笑
                    <Path
                        d="M 40 50 Q 50 62 60 50"
                        fill="none"
                        stroke="#1A1A22"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                    />
                ) : mood === 'shaking' ? (
                    // 惊恐 O 嘴
                    <Ellipse cx="50" cy="52" rx="6" ry="8" fill="#1A1A22" />
                ) : mood === 'thinking' ? (
                    // 思考 ~ 嘴
                    <Path
                        d="M 42 50 Q 46 53 50 50 Q 54 47 58 50"
                        fill="none"
                        stroke="#1A1A22"
                        strokeWidth="2"
                        strokeLinecap="round"
                    />
                ) : (
                    // 中立微笑
                    <Path
                        d="M 42 50 Q 50 55 58 50"
                        fill="none"
                        stroke="#1A1A22"
                        strokeWidth="2"
                        strokeLinecap="round"
                    />
                )}

                {/* 勺子柄 */}
                <Path
                    d="M 45 75 Q 48 90 50 120 Q 52 90 55 75"
                    fill="url(#metalGradient)"
                    stroke="#606060"
                    strokeWidth="1"
                />

                {/* 柄末端圆球 */}
                <Ellipse
                    cx="50"
                    cy="125"
                    rx="8"
                    ry="10"
                    fill="url(#metalGradient)"
                    stroke="#606060"
                    strokeWidth="1"
                />
            </Svg>
        </AnimatedView>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
    },
});
