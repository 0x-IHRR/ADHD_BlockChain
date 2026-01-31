import { colors as baseColors } from './tokens';

export type ThemeColors = typeof baseColors;

export interface Theme {
    id: string;
    name: string;
    colors: ThemeColors;
}

// 基础颜色 (深色背景通用)
const sharedColors = {
    background: baseColors.background,
    text: baseColors.text,
    border: baseColors.border,
    glass: baseColors.glass,
    semantic: baseColors.semantic,
    gradient: baseColors.gradient, // 会被覆盖
};

// 1. Pendle 风格 (默认) - 青绿色 #1BE3C2
export const pendleTheme: Theme = {
    id: 'pendle',
    name: 'Pendle',
    colors: {
        ...baseColors,
        primary: {
            ...baseColors.primary,
            500: '#1BE3C2', // Default
        },
        gradient: {
            ...baseColors.gradient,
            primary: ['#1BE3C2', '#7AB7FF'],
        }
    },
};

// 2. UniSwap 风格 - 粉红色 #FF007A
export const uniswapTheme: Theme = {
    id: 'uniswap',
    name: 'UniSwap',
    colors: {
        ...baseColors,
        primary: {
            ...baseColors.primary,
            50: '#FFE5F1',
            100: '#FFB3D4',
            200: '#FF80B8',
            300: '#FF4D9B',
            400: '#FF2686',
            500: '#FF007A', // Pink
            600: '#CC0062',
            700: '#990049',
            800: '#660031',
            900: '#330018',
        },
        semantic: {
            ...baseColors.semantic,
            success: '#FF007A', // Uniswap 往往用粉色作为品牌色，但成功色通常还是绿。这里为了风格化，我们可以微调
            // 保持语义色标准以免混淆
        },
        glass: {
            ...baseColors.glass,
            background: 'rgba(26, 15, 20, 0.6)', // 更透明
        },
        gradient: {
            ...baseColors.gradient,
            primary: ['#FF007A', '#FF9F0A'], // 粉红到橙
        }
    },
};

// 3. Aave 风格 - 紫色 #B6509E (Ghost) / #2EBAC6 (Aqua)
export const aaveTheme: Theme = {
    id: 'aave',
    name: 'Aave',
    colors: {
        ...baseColors,
        primary: {
            ...baseColors.primary,
            500: '#8878C3', // Purple
        },
        glass: {
            ...baseColors.glass,
            background: 'rgba(20, 20, 30, 0.6)', // 更透明
        },
        gradient: {
            ...baseColors.gradient,
            primary: ['#8878C3', '#B6509E'],
        }
    },
};

// 4. Ocean 风格 - 深蓝 #7AB7FF
export const oceanTheme: Theme = {
    id: 'ocean',
    name: 'Ocean',
    colors: {
        ...baseColors,
        primary: {
            ...baseColors.primary,
            500: '#7AB7FF', // Blue
        },
        gradient: {
            ...baseColors.gradient,
            primary: ['#7AB7FF', '#00D4FF'],
        }
    },
};

export const themes = {
    pendle: pendleTheme,
    uniswap: uniswapTheme,
    aave: aaveTheme,
    ocean: oceanTheme,
};
