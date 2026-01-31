/**
 * Time Gamble Design Tokens v3
 * 参考 Raycast 风格
 * 特点: 纯黑背景、暖红点缀、极简边框、柔和阴影
 */

// ============ 配色系统 ============

export const colors = {
    // Raycast 风格纯黑背景
    background: {
        primary: '#0A0A0B',      // 纯黑
        secondary: '#111113',    // 深灰
        tertiary: '#18181B',     // 卡片背景
        elevated: '#1F1F23',     // 悬浮元素
        surface: '#141416',      // 表面
    },

    // 主色调 - Raycast 暖红
    primary: {
        50: '#FFF1F1',
        100: '#FFE1E1',
        200: '#FFC7C7',
        300: '#FFA3A3',
        400: '#FF6B6B',
        500: '#FF6363',          // Raycast Red
        600: '#E85555',
        700: '#C94747',
        800: '#A53939',
        900: '#7A2B2B',
    },

    // 次要色调
    accent: {
        pink: '#FF6B9D',
        purple: '#A78BFA',
        blue: '#60A5FA',
        cyan: '#22D3EE',
        orange: '#FB923C',
    },

    // 语义色
    semantic: {
        success: '#4ADE80',      // 柔和绿
        successLight: 'rgba(74, 222, 128, 0.1)',
        successBorder: 'rgba(74, 222, 128, 0.2)',

        warning: '#FBBF24',
        warningLight: 'rgba(251, 191, 36, 0.1)',
        warningBorder: 'rgba(251, 191, 36, 0.2)',

        error: '#F87171',
        errorLight: 'rgba(248, 113, 113, 0.1)',
        errorBorder: 'rgba(248, 113, 113, 0.2)',

        info: '#60A5FA',
        infoLight: 'rgba(96, 165, 250, 0.1)',
    },

    // 文字色
    text: {
        primary: '#FAFAFA',      // 更亮的白
        secondary: '#D4D4D8',
        tertiary: '#A1A1AA',
        muted: '#71717A',
        disabled: '#52525B',
    },

    // 边框 - 更隐蔽
    border: {
        subtle: 'rgba(255, 255, 255, 0.03)',
        default: 'rgba(255, 255, 255, 0.06)',
        strong: 'rgba(255, 255, 255, 0.10)',
    },

    // 毛玻璃效果 - 更透明
    glass: {
        background: 'rgba(24, 24, 27, 0.85)',
        backgroundLight: 'rgba(255, 255, 255, 0.04)',
        border: 'rgba(255, 255, 255, 0.05)',
        highlight: 'rgba(255, 255, 255, 0.06)',
    },

    // 渐变
    gradient: {
        primary: ['#FF6363', '#FB923C'],
        accent: ['#A78BFA', '#60A5FA'],
        surface: ['rgba(24,24,27,0.95)', 'rgba(10,10,11,0.98)'],
    },
};


// ============ 间距系统 (更大边距) ============

export const spacing = {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    '2xl': 24,
    '3xl': 32,
    '4xl': 40,
    '5xl': 48,
    '6xl': 64,       // 大边距
    screen: 24,      // 屏幕水平边距
} as const;

// ============ 字体系统 ============

export const typography = {
    fontFamily: {
        display: 'System',
        body: 'System',
        mono: 'System',
    },

    fontSize: {
        xs: 11,
        sm: 13,
        base: 15,
        lg: 17,
        xl: 20,
        '2xl': 24,
        '3xl': 28,
        '4xl': 34,
        '5xl': 40,
        '6xl': 48,
    },

    fontWeight: {
        normal: '400' as const,
        medium: '500' as const,
        semibold: '600' as const,
        bold: '700' as const,
    },

    lineHeight: {
        tight: 1.2,
        normal: 1.4,
        relaxed: 1.6,
    },

    letterSpacing: {
        tight: -0.5,
        normal: 0,
        wide: 0.5,
    },
};

// ============ 圆角系统 (UniSwap 大圆角) ============

export const borderRadius = {
    none: 0,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,          // UniSwap 卡片圆角
    '2xl': 24,
    '3xl': 28,
    full: 9999,      // 药丸形按钮
} as const;

// ============ 阴影系统 (更柔和) ============

export const shadows = {
    sm: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 2,
    },
    md: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 4,
    },
    lg: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 24,
        elevation: 8,
    },
    // 发光效果
    glow: (color: string, intensity: number = 0.4) => ({
        shadowColor: color,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: intensity,
        shadowRadius: 20,
        elevation: 10,
    }),
    // 内发光模拟
    innerGlow: {
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.06)',
    },
};

// ============ 动画 ============

export const animation = {
    duration: {
        fast: 150,
        normal: 250,
        slow: 400,
        slower: 600,
    },
    spring: {
        damping: 15,
        stiffness: 150,
        mass: 1,
    },
};

// ============ 组件预设样式 ============

// ============ 组件预设样式 (动态生成) ============

export const getComponentStyles = (currentColors: typeof colors) => ({
    // 毛玻璃卡片 - Pendle 风格
    card: {
        glass: {
            backgroundColor: currentColors.glass.background,
            borderRadius: borderRadius.xl,
            borderWidth: 1,
            borderColor: currentColors.glass.border,
            overflow: 'hidden' as const,
        },
        solid: {
            backgroundColor: currentColors.background.tertiary,
            borderRadius: borderRadius.xl,
            borderWidth: 1,
            borderColor: currentColors.border.subtle,
        },
    },

    // 紧凑型按钮 - UniSwap 风格
    button: {
        primary: {
            backgroundColor: currentColors.primary[500],
            borderRadius: borderRadius.full,        // 药丸形
            paddingVertical: spacing.md,
            paddingHorizontal: spacing['2xl'],
            alignSelf: 'center' as const,           // 居中，不撑满
        },
        secondary: {
            backgroundColor: currentColors.glass.backgroundLight,
            borderRadius: borderRadius.full,
            borderWidth: 1,
            borderColor: currentColors.border.default,
            paddingVertical: spacing.md,
            paddingHorizontal: spacing['2xl'],
            alignSelf: 'center' as const,
        },
        // 全宽按钮 (仅 CTA)
        fullWidth: {
            backgroundColor: currentColors.primary[500],
            borderRadius: borderRadius.xl,
            paddingVertical: spacing.lg,
            paddingHorizontal: spacing.xl,
        },
    },

    // 输入框
    input: {
        default: {
            backgroundColor: currentColors.background.surface,
            borderRadius: borderRadius.xl,
            borderWidth: 1,
            borderColor: currentColors.border.default,
            paddingHorizontal: spacing.xl,
            paddingVertical: spacing.lg,
            color: currentColors.text.primary,
            fontSize: typography.fontSize.lg,
        },
    },

    // 徽章/标签
    badge: {
        default: {
            backgroundColor: currentColors.glass.backgroundLight,
            borderRadius: borderRadius.full,
            paddingVertical: spacing.xs,
            paddingHorizontal: spacing.md,
        },
        success: {
            backgroundColor: currentColors.semantic.successLight,
            borderRadius: borderRadius.full,
            paddingVertical: spacing.xs,
            paddingHorizontal: spacing.md,
        },
        warning: {
            backgroundColor: currentColors.semantic.warningLight,
            borderRadius: borderRadius.full,
            paddingVertical: spacing.xs,
            paddingHorizontal: spacing.md,
        },
    },

    // 居中容器
    container: {
        centered: {
            paddingHorizontal: spacing.screen,
            maxWidth: 500,
            alignSelf: 'center' as const,
            width: '100%' as const,
        },
    },
});

// 默认静态导出 (向后兼容)
export const componentStyles = getComponentStyles(colors);

export default {
    colors,
    spacing,
    typography,
    borderRadius,
    shadows,
    animation,
    getComponentStyles,
    componentStyles,
};

