/**
 * Time Gamble Design Tokens v2
 * 参考 UniSwap / Pendle 风格
 * 特点: 居中布局、毛玻璃、紧凑按钮、大圆角
 */

// ============ 配色系统 ============

export const colors = {
    // UniSwap/Pendle 风格深色背景
    background: {
        primary: '#0D0D0F',      // 纯黑偏蓝
        secondary: '#131318',    // 深灰
        tertiary: '#1A1A22',     // 卡片背景
        elevated: '#222230',     // 悬浮元素
        surface: '#16161D',      // 表面
    },

    // 主色调 - Pendle 风格青绿
    primary: {
        50: '#E6FFF9',
        100: '#B3FFE6',
        200: '#80FFD4',
        300: '#4DFFC1',
        400: '#26FFAF',
        500: '#1BE3C2',          // Pendle PT Green
        600: '#15B89D',
        700: '#0F8C78',
        800: '#0A6053',
        900: '#05342E',
    },

    // 次要色调 - UniSwap 粉紫
    accent: {
        pink: '#FF007A',         // UniSwap 粉
        purple: '#8878C3',
        blue: '#7AB7FF',         // Pendle YT Blue
        cyan: '#06B6D4',
        pendleBlue: '#6079FF',   // Pendle Blue
    },

    // 语义色
    semantic: {
        success: '#1BE3C2',      // Pendle 风格绿
        successLight: 'rgba(27, 227, 194, 0.1)',
        successBorder: 'rgba(27, 227, 194, 0.3)',

        warning: '#FFB800',
        warningLight: 'rgba(255, 184, 0, 0.1)',
        warningBorder: 'rgba(255, 184, 0, 0.3)',

        error: '#FF4757',
        errorLight: 'rgba(255, 71, 87, 0.1)',
        errorBorder: 'rgba(255, 71, 87, 0.3)',

        info: '#7AB7FF',
        infoLight: 'rgba(122, 183, 255, 0.1)',
    },

    // 文字色
    text: {
        primary: '#FFFFFF',
        secondary: '#E0E0E6',
        tertiary: '#A1A1AA',
        muted: '#71717A',
        disabled: '#52525B',
    },

    // 边框 - Raycast 风格极简
    border: {
        subtle: 'rgba(255, 255, 255, 0.02)',   // 几乎不可见
        default: 'rgba(255, 255, 255, 0.04)',  // 微妙
        strong: 'rgba(255, 255, 255, 0.08)',   // 轻微可见
    },

    // 毛玻璃效果 - 更透明的 Raycast 风格
    glass: {
        background: 'rgba(26, 26, 34, 0.6)',       // 更透明
        backgroundLight: 'rgba(255, 255, 255, 0.03)', // 更淡
        border: 'rgba(255, 255, 255, 0.04)',        // 几乎不可见
        highlight: 'rgba(255, 255, 255, 0.05)',
    },

    // 渐变
    gradient: {
        primary: ['#1BE3C2', '#7AB7FF'],
        accent: ['#FF007A', '#8878C3'],
        surface: ['rgba(26,26,34,0.9)', 'rgba(13,13,15,0.95)'],
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

// ============ 阴影系统 - Raycast 风格柔和发光 ============

export const shadows = {
    sm: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,        // 更轻
        shadowRadius: 8,            // 更柔和
        elevation: 2,
    },
    md: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 16,           // 更大的模糊
        elevation: 4,
    },
    lg: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.16,
        shadowRadius: 32,           // 超柔和
        elevation: 8,
    },
    // 发光效果 - 更柔和
    glow: (color: string, intensity: number = 0.3) => ({
        shadowColor: color,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: intensity,
        shadowRadius: 24,           // 柔和发光
        elevation: 10,
    }),
    // 内发光模拟 - 更隐蔽
    innerGlow: {
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.03)',
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

