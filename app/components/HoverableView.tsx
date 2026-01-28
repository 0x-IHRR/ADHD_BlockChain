/**
 * HoverableView - 支持悬停效果的视图组件
 * 
 * 提供跨平台的悬停/按压交互反馈
 * - Web: hover 时的样式变化
 * - Mobile: 按压时的样式变化
 */
import React, { useState, useCallback, ReactNode } from 'react';
import {
    Pressable,
    StyleSheet,
    ViewStyle,
    Platform,
} from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
} from 'react-native-reanimated';

interface HoverableViewProps {
    children: ReactNode;
    style?: ViewStyle;
    onPress?: () => void;
    disabled?: boolean;
    // 悬停效果类型
    effect?: 'scale' | 'lift' | 'glow' | 'none';
    // 缩放比例 (effect='scale' 时生效)
    scaleAmount?: number;
    // 上移距离 (effect='lift' 时生效)
    liftAmount?: number;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function HoverableView({
    children,
    style,
    onPress,
    disabled = false,
    effect = 'scale',
    scaleAmount = 1.03,
    liftAmount = -3,
}: HoverableViewProps) {
    const [isHovered, setIsHovered] = useState(false);
    const scale = useSharedValue(1);
    const translateY = useSharedValue(0);
    const opacity = useSharedValue(1);

    const handleHoverIn = useCallback(() => {
        setIsHovered(true);
        switch (effect) {
            case 'scale':
                scale.value = withSpring(scaleAmount, { damping: 15, stiffness: 200 });
                break;
            case 'lift':
                translateY.value = withSpring(liftAmount, { damping: 15, stiffness: 200 });
                break;
            case 'glow':
                opacity.value = withTiming(0.8, { duration: 150 });
                break;
        }
    }, [effect, scale, translateY, opacity, scaleAmount, liftAmount]);

    const handleHoverOut = useCallback(() => {
        setIsHovered(false);
        scale.value = withSpring(1, { damping: 15, stiffness: 200 });
        translateY.value = withSpring(0, { damping: 15, stiffness: 200 });
        opacity.value = withTiming(1, { duration: 150 });
    }, [scale, translateY, opacity]);

    const handlePressIn = useCallback(() => {
        scale.value = withSpring(0.97, { damping: 15, stiffness: 300 });
    }, [scale]);

    const handlePressOut = useCallback(() => {
        if (isHovered && effect === 'scale') {
            scale.value = withSpring(scaleAmount, { damping: 15, stiffness: 200 });
        } else {
            scale.value = withSpring(1, { damping: 15, stiffness: 200 });
        }
    }, [isHovered, effect, scale, scaleAmount]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [
            { scale: scale.value },
            { translateY: translateY.value },
        ],
        opacity: opacity.value,
    }));

    // Web 平台支持悬停事件
    const hoverProps = Platform.OS === 'web' ? {
        onMouseEnter: handleHoverIn,
        onMouseLeave: handleHoverOut,
    } : {};

    return (
        <AnimatedPressable
            style={[styles.container, style, animatedStyle]}
            onPress={onPress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            disabled={disabled}
            {...hoverProps}
        >
            {children}
        </AnimatedPressable>
    );
}

const styles = StyleSheet.create({
    container: {
        // 默认无样式，继承外部样式
    },
});
