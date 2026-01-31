import React, { useState, useEffect, useRef } from 'react';
import { Text, TextStyle, View, StyleSheet } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    Easing
} from 'react-native-reanimated';

interface TypewriterTextProps {
    text: string;
    speed?: number; // ms per character
    style?: TextStyle;
    onComplete?: () => void;
    showCursor?: boolean;
    cursorChar?: string;
}

/**
 * TypewriterText - 打字机效果文字组件
 * 逐字显示文本，模拟 AI 正在输入的效果
 */
export const TypewriterText: React.FC<TypewriterTextProps> = ({
    text,
    speed = 40,
    style,
    onComplete,
    showCursor = true,
    cursorChar = '▍'
}) => {
    const [displayedText, setDisplayedText] = useState('');
    const [isComplete, setIsComplete] = useState(false);
    const indexRef = useRef(0);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Cursor blink animation
    const cursorOpacity = useSharedValue(1);

    useEffect(() => {
        cursorOpacity.value = withRepeat(
            withTiming(0, { duration: 500, easing: Easing.inOut(Easing.ease) }),
            -1,
            true
        );
    }, []);

    const cursorStyle = useAnimatedStyle(() => ({
        opacity: cursorOpacity.value,
    }));

    // Typing effect
    useEffect(() => {
        // Reset when text changes
        setDisplayedText('');
        setIsComplete(false);
        indexRef.current = 0;

        if (!text) return;

        const typeNextChar = () => {
            if (indexRef.current < text.length) {
                // Handle emoji and special characters (they can be multi-byte)
                const char = text[indexRef.current];
                setDisplayedText(prev => prev + char);
                indexRef.current++;

                // Variable speed for natural feel
                const nextDelay = char === ' ' ? speed * 0.5 :
                    char === '.' || char === '!' || char === '?' ? speed * 3 :
                        char === ',' ? speed * 2 :
                            speed;

                timeoutRef.current = setTimeout(typeNextChar, nextDelay);
            } else {
                setIsComplete(true);
                onComplete?.();
            }
        };

        // Start typing with a small delay
        timeoutRef.current = setTimeout(typeNextChar, 200);

        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [text, speed, onComplete]);

    return (
        <View style={styles.container}>
            <Text style={style}>
                {displayedText}
                {showCursor && !isComplete && (
                    <Animated.Text style={[styles.cursor, style, cursorStyle]}>
                        {cursorChar}
                    </Animated.Text>
                )}
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    cursor: {
        fontWeight: '100',
    },
});

export default TypewriterText;
