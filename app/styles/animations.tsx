/**
 * Time Gamble Animation & Layout Components
 * 提供淡入动画和居中容器
 */

import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Dimensions, ViewStyle, Easing } from 'react-native';
import { colors, spacing, borderRadius } from './tokens';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MAX_CONTENT_WIDTH = 480; // 最大内容宽度

// ============ 居中容器 ============

interface CenteredContainerProps {
    children: React.ReactNode;
    style?: ViewStyle;
    paddingHorizontal?: number;
}

/**
 * 居中容器 - 限制最大宽度，自动居中
 */
export const CenteredContainer: React.FC<CenteredContainerProps> = ({
    children,
    style,
    paddingHorizontal = spacing.screen,
}) => {
    return (
        <View style={[styles.centeredContainer, { paddingHorizontal }, style]}>
            <View style={styles.centeredContent}>
                {children}
            </View>
        </View>
    );
};

// ============ 淡入动画 ============

interface FadeInViewProps {
    children: React.ReactNode;
    delay?: number;
    duration?: number;
    style?: ViewStyle;
    slideUp?: boolean;
}

/**
 * 淡入动画组件
 */
export const FadeInView: React.FC<FadeInViewProps> = ({
    children,
    delay = 0,
    duration = 400,
    style,
    slideUp = true,
}) => {
    const opacity = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(slideUp ? 20 : 0)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(opacity, {
                toValue: 1,
                duration,
                delay,
                useNativeDriver: true,
                easing: Easing.out(Easing.cubic),
            }),
            Animated.timing(translateY, {
                toValue: 0,
                duration,
                delay,
                useNativeDriver: true,
                easing: Easing.out(Easing.cubic),
            }),
        ]).start();
    }, []);

    return (
        <Animated.View
            style={[
                style,
                {
                    opacity,
                    transform: [{ translateY }],
                },
            ]}
        >
            {children}
        </Animated.View>
    );
};

// ============ Staggered 动画列表 ============

interface StaggeredListProps {
    children: React.ReactNode[];
    baseDelay?: number;
    staggerDelay?: number;
}

/**
 * 交错动画列表
 */
export const StaggeredList: React.FC<StaggeredListProps> = ({
    children,
    baseDelay = 100,
    staggerDelay = 80,
}) => {
    return (
        <>
            {React.Children.map(children, (child, index) => (
                <FadeInView delay={baseDelay + index * staggerDelay} key={index}>
                    {child}
                </FadeInView>
            ))}
        </>
    );
};

// ============ 按压缩放动画 ============

interface ScalePressableProps {
    children: React.ReactNode;
    onPress: () => void;
    style?: ViewStyle;
    scale?: number;
    disabled?: boolean;
}

/**
 * 按压缩放按钮
 */
export const ScalePressable: React.FC<ScalePressableProps> = ({
    children,
    onPress,
    style,
    scale = 0.97,
    disabled = false,
}) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
        Animated.spring(scaleAnim, {
            toValue: scale,
            useNativeDriver: true,
            friction: 5,
            tension: 100,
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: true,
            friction: 5,
            tension: 100,
        }).start();
    };

    return (
        <Animated.View
            style={[style, { transform: [{ scale: scaleAnim }] }]}
        >
            <View
                style={{ width: '100%' }}
                onTouchStart={disabled ? undefined : handlePressIn}
                onTouchEnd={disabled ? undefined : handlePressOut}
                onTouchCancel={disabled ? undefined : handlePressOut}
            >
                {children}
            </View>
        </Animated.View>
    );
};

// ============ 脉冲发光动画 ============

interface PulseGlowProps {
    children: React.ReactNode;
    color?: string;
    style?: ViewStyle;
}

/**
 * 脉冲发光效果
 */
export const PulseGlow: React.FC<PulseGlowProps> = ({
    children,
    color = colors.primary[500],
    style,
}) => {
    const glowAnim = useRef(new Animated.Value(0.3)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(glowAnim, {
                    toValue: 0.6,
                    duration: 1500,
                    useNativeDriver: true,
                    easing: Easing.inOut(Easing.ease),
                }),
                Animated.timing(glowAnim, {
                    toValue: 0.3,
                    duration: 1500,
                    useNativeDriver: true,
                    easing: Easing.inOut(Easing.ease),
                }),
            ])
        ).start();
    }, []);

    return (
        <Animated.View
            style={[
                style,
                {
                    shadowColor: color,
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: glowAnim,
                    shadowRadius: 20,
                    elevation: 10,
                },
            ]}
        >
            {children}
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    centeredContainer: {
        width: '100%',
        alignItems: 'center',
    },
    centeredContent: {
        width: '100%',
        maxWidth: MAX_CONTENT_WIDTH,
    },
});

export default {
    CenteredContainer,
    FadeInView,
    StaggeredList,
    ScalePressable,
    PulseGlow,
    MAX_CONTENT_WIDTH,
};
