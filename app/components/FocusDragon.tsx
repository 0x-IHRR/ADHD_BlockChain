/**
 * FocusDragon - Time Gamble 吉祥物组件 (SVG 版本)
 * 
 * 一个可爱的专注小龙拿着勺子，用于可视化 AI Agent 状态
 * 灵感来自 Spoon Theory (慢性疲劳理论)
 * 使用 SVG 绘制，与项目风格融为一体
 */
import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import Svg, {
    Ellipse,
    Path,
    Circle,
    G,
    Defs,
    LinearGradient,
    Stop,
    RadialGradient,
    Rect,
} from 'react-native-svg';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    withSequence,
    withSpring,
    Easing,
} from 'react-native-reanimated';

// 状态类型
export type FocusDragonMood = 'neutral' | 'thinking' | 'happy' | 'working' | 'tired' | 'shaking' | 'dying' | 'dead';

interface FocusDragonProps {
    mood?: FocusDragonMood;
    size?: number;
}

const AnimatedView = Animated.createAnimatedComponent(View);

export default function FocusDragon({ mood = 'neutral', size = 120 }: FocusDragonProps) {
    const { colors: themeColors } = useTheme();

    // 动画值
    const rotation = useSharedValue(0);
    const bounce = useSharedValue(0);
    const shake = useSharedValue(0);
    const eyeBlink = useSharedValue(1);
    const glowOpacity = useSharedValue(0);
    const scale = useSharedValue(1);

    // 眨眼动画 (所有状态)
    useEffect(() => {
        const blinkInterval = setInterval(() => {
            eyeBlink.value = withSequence(
                withTiming(0.1, { duration: 80 }),
                withTiming(1, { duration: 80 })
            );
        }, 3000 + Math.random() * 2000);
        return () => clearInterval(blinkInterval);
    }, [eyeBlink]);

    // 根据 mood 启动不同动画
    useEffect(() => {
        // 重置
        rotation.value = 0;
        bounce.value = 0;
        shake.value = 0;
        glowOpacity.value = 0;
        scale.value = 1;

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
                scale.value = withRepeat(
                    withSequence(
                        withSpring(1.1, { damping: 3 }),
                        withSpring(1, { damping: 3 })
                    ),
                    -1,
                    true
                );
                break;

            case 'working':
                // 专注脉动
                scale.value = withRepeat(
                    withSequence(
                        withTiming(1.05, { duration: 800, easing: Easing.inOut(Easing.ease) }),
                        withTiming(0.95, { duration: 800, easing: Easing.inOut(Easing.ease) })
                    ),
                    -1,
                    true
                );
                break;

            case 'tired':
                // 疲惫
                bounce.value = withTiming(5, { duration: 500 });
                rotation.value = withTiming(5, { duration: 500 });
                scale.value = withTiming(0.95, { duration: 500 });
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

            case 'dying':
                // 虚弱喘息
                scale.value = withRepeat(
                    withSequence(
                        withTiming(0.98, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
                        withTiming(0.95, { duration: 1500, easing: Easing.inOut(Easing.ease) })
                    ),
                    -1,
                    true
                );
                rotation.value = withTiming(10, { duration: 1000 });
                break;

            case 'dead':
                // 倒下
                rotation.value = withTiming(90, { duration: 500, easing: Easing.bounce });
                scale.value = withTiming(0.8, { duration: 500 });
                eyeBlink.value = 0; // 停止眨眼
                break;

            default:
                // 中性 - 轻微呼吸
                scale.value = withRepeat(
                    withSequence(
                        withTiming(1.02, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
                        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) })
                    ),
                    -1,
                    true
                );
        }
    }, [mood, rotation, bounce, shake, glowOpacity, scale]);

    // 组合动画样式
    const animatedStyle = useAnimatedStyle(() => ({
        transform: [
            { translateY: bounce.value },
            { translateX: shake.value },
            { rotate: `${rotation.value}deg` },
            { scale: scale.value },
        ],
    }));

    // 根据 mood 和主题决定颜色
    const getColors = () => {
        // 使用主题色作为默认颜色（与用户选择的主题同步）
        // 直接使用 primary[500]，这是所有主题都保证存在的颜色
        const primaryBody = themeColors.primary[500];
        const primaryAccent = themeColors.primary[700] || themeColors.primary[500];
        const primaryGlow = themeColors.primary[500];

        switch (mood) {
            case 'thinking':
                return { body: '#7AB7FF', accent: '#5A97DD', glow: '#7AB7FF' }; // 蓝色思考
            case 'happy':
                return { body: primaryBody, accent: primaryAccent, glow: primaryGlow }; // 使用主题色
            case 'working':
                return { body: primaryBody, accent: primaryAccent, glow: primaryGlow }; // 使用主题色
            case 'tired':
                return { body: '#A0A0A0', accent: '#808080', glow: '#808080' }; // 疲惫灰
            case 'shaking':
                return { body: themeColors.semantic.error, accent: '#CC3945', glow: themeColors.semantic.error }; // 失败红
            case 'dying':
                return { body: '#FFA502', accent: '#FF7F50', glow: '#FFA502' }; // 橙色虚弱
            case 'dead':
                return { body: '#747D8C', accent: '#2F3542', glow: '#000000' }; // 灰色死亡
            default:
                // 默认状态使用主题色
                return { body: primaryBody, accent: primaryAccent, glow: primaryGlow };
        }
    };

    const colors = getColors();

    return (
        <AnimatedView style={[styles.container, { width: size, height: size * 1.2 }, animatedStyle]}>
            <Svg width={size} height={size * 1.2} viewBox="0 0 100 120">
                <Defs>
                    {/* 龙身体渐变 - 使用主题色 */}
                    <LinearGradient id="bodyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <Stop offset="0%" stopColor={colors.body} stopOpacity="0.9" />
                        <Stop offset="50%" stopColor={colors.body} />
                        <Stop offset="100%" stopColor={colors.accent} />
                    </LinearGradient>

                    {/* 腹部渐变 */}
                    <LinearGradient id="bellyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <Stop offset="0%" stopColor="#FFF5E1" />
                        <Stop offset="100%" stopColor="#FFE4B5" />
                    </LinearGradient>

                    {/* 勺子金属渐变 */}
                    <LinearGradient id="spoonGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <Stop offset="0%" stopColor="#FFD700" />
                        <Stop offset="50%" stopColor="#FFC107" />
                        <Stop offset="100%" stopColor="#B8860B" />
                    </LinearGradient>

                    {/* 发光效果 */}
                    <RadialGradient id="glowGradient" cx="50%" cy="50%" r="50%">
                        <Stop offset="0%" stopColor={colors.glow} stopOpacity="0.6" />
                        <Stop offset="100%" stopColor={colors.glow} stopOpacity="0" />
                    </RadialGradient>
                </Defs>

                {/* 发光圈 (动态) */}
                {(mood === 'happy' || mood === 'shaking') && (
                    <Circle
                        cx="50"
                        cy="50"
                        r="48"
                        fill="url(#glowGradient)"
                        opacity={0.5}
                    />
                )}

                {/* 尾巴 */}
                <Path
                    d="M 25 75 Q 10 85 15 70 Q 20 60 25 65"
                    fill="url(#bodyGradient)"
                    stroke={colors.accent}
                    strokeWidth="0.5"
                />

                {/* 小翅膀 - 左 */}
                <Path
                    d="M 25 45 Q 15 35 18 50 Q 20 55 28 52"
                    fill="url(#bodyGradient)"
                    stroke={colors.accent}
                    strokeWidth="0.5"
                />

                {/* 小翅膀 - 右 */}
                <Path
                    d="M 75 45 Q 85 35 82 50 Q 80 55 72 52"
                    fill="url(#bodyGradient)"
                    stroke={colors.accent}
                    strokeWidth="0.5"
                />

                {/* 身体 - 圆润的龙身 */}
                <Ellipse
                    cx="50"
                    cy="55"
                    rx="30"
                    ry="28"
                    fill="url(#bodyGradient)"
                    stroke={colors.accent}
                    strokeWidth="0.5"
                />

                {/* 腹部 */}
                <Ellipse
                    cx="50"
                    cy="60"
                    rx="18"
                    ry="16"
                    fill="url(#bellyGradient)"
                />

                {/* 头部 */}
                <Circle
                    cx="50"
                    cy="35"
                    r="22"
                    fill="url(#bodyGradient)"
                    stroke={colors.accent}
                    strokeWidth="0.5"
                />

                {/* 头顶小角 - 左 */}
                <Path
                    d="M 38 18 Q 35 8 40 15 Q 42 20 42 22"
                    fill="url(#bodyGradient)"
                    stroke={colors.accent}
                    strokeWidth="0.5"
                />

                {/* 头顶小角 - 右 */}
                <Path
                    d="M 62 18 Q 65 8 60 15 Q 58 20 58 22"
                    fill="url(#bodyGradient)"
                    stroke={colors.accent}
                    strokeWidth="0.5"
                />

                {/* 耳朵/鳍 - 左 */}
                <Path
                    d="M 30 28 Q 22 22 26 32 Q 28 36 32 34"
                    fill="url(#bodyGradient)"
                    stroke={colors.accent}
                    strokeWidth="0.5"
                />

                {/* 耳朵/鳍 - 右 */}
                <Path
                    d="M 70 28 Q 78 22 74 32 Q 72 36 68 34"
                    fill="url(#bodyGradient)"
                    stroke={colors.accent}
                    strokeWidth="0.5"
                />

                {/* 腮红 - 左 */}
                <Circle cx="32" cy="40" r="4" fill="#FFAAAA" opacity="0.6" />

                {/* 腮红 - 右 */}
                <Circle cx="68" cy="40" r="4" fill="#FFAAAA" opacity="0.6" />

                {/* 眼睛 - 左 */}
                <G>
                    {mood === 'dead' ? (
                        // X 眼睛 - 左
                        <G>
                            <Path d="M 37 29 L 43 35" stroke="#1A1A22" strokeWidth="1.5" />
                            <Path d="M 43 29 L 37 35" stroke="#1A1A22" strokeWidth="1.5" />
                        </G>
                    ) : (
                        <G>
                            <Circle cx="40" cy="32" r="6" fill="#FFFFFF" />
                            <Circle cx="41" cy="32" r="4" fill="#1A1A22" />
                            <Circle cx="39" cy="30" r="1.5" fill="#FFFFFF" />
                        </G>
                    )}
                </G>

                {/* 眼睛 - 右 */}
                <G>
                    {mood === 'dead' ? (
                        // X 眼睛 - 右
                        <G>
                            <Path d="M 57 29 L 63 35" stroke="#1A1A22" strokeWidth="1.5" />
                            <Path d="M 63 29 L 57 35" stroke="#1A1A22" strokeWidth="1.5" />
                        </G>
                    ) : (
                        <G>
                            <Circle cx="60" cy="32" r="6" fill="#FFFFFF" />
                            <Circle cx="61" cy="32" r="4" fill="#1A1A22" />
                            <Circle cx="59" cy="30" r="1.5" fill="#FFFFFF" />
                        </G>
                    )}
                </G>

                {/* 嘴巴 - 根据 mood 变化 */}
                {mood === 'happy' ? (
                    // 大笑
                    <Path
                        d="M 44 42 Q 50 50 56 42"
                        fill="none"
                        stroke="#1A1A22"
                        strokeWidth="2"
                        strokeLinecap="round"
                    />
                ) : mood === 'shaking' ? (
                    // 惊恐 O 嘴
                    <Ellipse cx="50" cy="44" rx="4" ry="5" fill="#1A1A22" />
                ) : mood === 'thinking' ? (
                    // 思考 ~ 嘴
                    <Path
                        d="M 45 43 Q 48 45 50 43 Q 52 41 55 43"
                        fill="none"
                        stroke="#1A1A22"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                    />
                ) : mood === 'tired' ? (
                    // 疲惫下垂嘴
                    <Path
                        d="M 45 44 Q 50 42 55 44"
                        fill="none"
                        stroke="#1A1A22"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                    />
                ) : (
                    // 中立微笑
                    <Path
                        d="M 45 42 Q 50 46 55 42"
                        fill="none"
                        stroke="#1A1A22"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                    />
                )}

                {/* 小手 - 左 (握着勺子) */}
                <Ellipse cx="30" cy="65" rx="5" ry="6" fill="url(#bodyGradient)" />

                {/* 小手 - 右 */}
                <Ellipse cx="70" cy="65" rx="5" ry="6" fill="url(#bodyGradient)" />

                {/* 勺子 */}
                <G>
                    {/* 勺子柄 */}
                    <Rect
                        x="48"
                        y="70"
                        width="4"
                        height="25"
                        rx="2"
                        fill="url(#spoonGradient)"
                        stroke="#B8860B"
                        strokeWidth="0.5"
                    />
                    {/* 勺子头 */}
                    <Ellipse
                        cx="50"
                        cy="100"
                        rx="10"
                        ry="8"
                        fill="url(#spoonGradient)"
                        stroke="#B8860B"
                        strokeWidth="0.5"
                    />
                    {/* 勺子凹陷 */}
                    <Ellipse
                        cx="50"
                        cy="99"
                        rx="6"
                        ry="4"
                        fill="#FFF8DC"
                        opacity="0.5"
                    />
                </G>

                {/* 小脚 - 左 */}
                <Ellipse cx="38" cy="82" rx="6" ry="4" fill="url(#bodyGradient)" />

                {/* 小脚 - 右 */}
                <Ellipse cx="62" cy="82" rx="6" ry="4" fill="url(#bodyGradient)" />
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
