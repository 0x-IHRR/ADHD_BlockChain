import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Theme, themes, ThemeColors } from '../styles/themes';
import { componentStyles } from '../styles/tokens';

interface ThemeContextType {
    theme: Theme;
    colors: ThemeColors;
    componentStyles: typeof componentStyles; // 这里其实也应该动态化，但暂时保持静态引用或基于 colors 动态计算
    setTheme: (themeId: string) => void;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
    const [themeId, setThemeId] = useState<string>('pendle');

    const theme = themes[themeId as keyof typeof themes] || themes.pendle;

    // 切换下一个主题
    const toggleTheme = () => {
        const themeKeys = Object.keys(themes);
        const currentIndex = themeKeys.indexOf(themeId);
        const nextIndex = (currentIndex + 1) % themeKeys.length;
        setThemeId(themeKeys[nextIndex]);
    };

    return (
        <ThemeContext.Provider value={{
            theme,
            colors: theme.colors,
            componentStyles, // ⚠️ 注意：componentStyles 目前是静态的，引用了静态 colors。如果需要深度主题化，需要重构 componentStyles 为函数
            setTheme: setThemeId,
            toggleTheme,
        }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
