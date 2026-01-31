import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

interface MeshGradientBackgroundProps {
    primaryColor: string;
    secondaryColor: string;
    opacity?: number;
}

export const MeshGradientBackground = ({
    primaryColor,
    secondaryColor,
    opacity = 1
}: MeshGradientBackgroundProps) => {
    return (
        <View style={[StyleSheet.absoluteFill, { opacity }]}>
            <Svg height="100%" width="100%">
                <Defs>
                    <RadialGradient id="grad1" cx="20%" cy="0%" rx="70%" ry="50%" fx="20%" fy="0%" gradientUnits="userSpaceOnUse">
                        <Stop offset="0%" stopColor={primaryColor} stopOpacity="0.15" />
                        <Stop offset="100%" stopColor="transparent" stopOpacity="0" />
                    </RadialGradient>
                    <RadialGradient id="grad2" cx="80%" cy="30%" rx="50%" ry="50%" fx="80%" fy="30%" gradientUnits="userSpaceOnUse">
                        <Stop offset="0%" stopColor={secondaryColor} stopOpacity="0.12" />
                        <Stop offset="100%" stopColor="transparent" stopOpacity="0" />
                    </RadialGradient>
                </Defs>
                <Rect x="0" y="0" width="100%" height="100%" fill="url(#grad1)" />
                <Rect x="0" y="0" width="100%" height="100%" fill="url(#grad2)" />
            </Svg>
        </View>
    );
};
