/**
 * FocusDragon - FocusFlow 吉祥物组件
 * 
 * 一个可爱的专注小龙拿着勺子，用于可视化 AI Agent 状态
 * 灵感来自 Spoon Theory (慢性疲劳理论)
 */
import React, { useEffect } from 'react';
import {
    View,
    Image,
    StyleSheet,
} from 'react-native';
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
export type FocusDragonMood = 'neutral' | 'thinking' | 'happy' | 'working' | 'tired' | 'shaking';

interface FocusDragonProps {
    mood?: FocusDragonMood;
    size?: number;
}

const AnimatedView = Animated.createAnimatedComponent(View);

export default function FocusDragon({ mood = 'neutral', size = 120 }: FocusDragonProps) {
    // 动画值
    const bounce = useSharedValue(0);
    const rotate = useSharedValue(0);
    const scale = useSharedValue(1);

    // 根据 mood 设置动画
    useEffect(() => {
        switch (mood) {
            case 'thinking':
                // 轻微摇晃
                rotate.value = withRepeat(
                    withSequence(
                        withTiming(-5, { duration: 400, easing: Easing.inOut(Easing.ease) }),
                        withTiming(5, { duration: 400, easing: Easing.inOut(Easing.ease) })
                    ),
                    -1,
                    true
                );
                bounce.value = 0;
                scale.value = withTiming(1, { duration: 200 });
                break;
            case 'happy':
                // 开心跳跃
                bounce.value = withRepeat(
                    withSequence(
                        withSpring(-10, { damping: 3, stiffness: 200 }),
                        withSpring(0, { damping: 5, stiffness: 200 })
                    ),
                    -1,
                    false
                );
                rotate.value = withTiming(0, { duration: 200 });
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
                bounce.value = 0;
                rotate.value = withTiming(0, { duration: 200 });
                break;
            case 'tired':
                // 疲惫下垂
                bounce.value = withTiming(5, { duration: 500 });
                rotate.value = withTiming(3, { duration: 500 });
                scale.value = withTiming(0.95, { duration: 500 });
                break;
            case 'shaking':
                // 摇晃 - 表示失败或错误
                rotate.value = withRepeat(
                    withSequence(
                        withTiming(-8, { duration: 50, easing: Easing.linear }),
                        withTiming(8, { duration: 100, easing: Easing.linear }),
                        withTiming(-8, { duration: 100, easing: Easing.linear }),
                        withTiming(0, { duration: 50, easing: Easing.linear })
                    ),
                    3,
                    false
                );
                scale.value = withTiming(0.9, { duration: 200 });
                bounce.value = 0;
                break;
            default:
                // 中性状态 - 轻微呼吸动画
                bounce.value = 0;
                rotate.value = 0;
                scale.value = withRepeat(
                    withSequence(
                        withTiming(1.02, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
                        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) })
                    ),
                    -1,
                    true
                );
        }
    }, [mood, bounce, rotate, scale]);

    // 动画样式
    const animatedStyle = useAnimatedStyle(() => ({
        transform: [
            { translateY: bounce.value },
            { rotate: `${rotate.value}deg` },
            { scale: scale.value },
        ],
    }));

    return (
        <View style={[styles.container, { width: size, height: size }]}>
            <AnimatedView style={animatedStyle}>
                <Image
                    source={require('../assets/images/focus_dragon.png')}
                    style={{ width: size, height: size }}
                    resizeMode="contain"
                />
            </AnimatedView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
    },
});
