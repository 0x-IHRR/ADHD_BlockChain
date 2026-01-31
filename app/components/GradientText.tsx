import React from 'react';
import { Text, TextProps, Platform, View } from 'react-native';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';

interface GradientTextProps extends TextProps {
    colors: readonly [string, string, ...string[]];
    start?: { x: number; y: number };
    end?: { x: number; y: number };
}

export const GradientText = ({
    colors,
    style,
    start = { x: 0, y: 0 },
    end = { x: 1, y: 0 },
    ...props
}: GradientTextProps) => {
    // Web fallback (until expo-linear-gradient works perfectly with text on web or masked-view supports it better)
    // On Web, we can use background-clip: text if supported, but simpler to just adjust for now or using standard method.
    // For simplicity, if MaskedView is tricky on Web, careful. MaskedView usually needs specific height.

    return (
        <MaskedView
            maskElement={
                <Text style={[style, { backgroundColor: 'transparent' }]} {...props} />
            }
        >
            <LinearGradient
                colors={colors}
                start={start}
                end={end}
            >
                <Text style={[style, { opacity: 0 }]} {...props} />
            </LinearGradient>
        </MaskedView>
    );
};
