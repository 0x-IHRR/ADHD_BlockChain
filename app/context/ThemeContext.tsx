import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Theme, themes, ThemeColors } from '../styles/themes';
import { componentStyles } from '../styles/tokens';

interface ThemeContextType {
    theme: Theme;
    colors: ThemeColors;
    componentStyles: typeof componentStyles;
    setTheme: (themeId: string) => void;
    toggleTheme: () => void;
    isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
    const [themeId, setThemeId] = useState<string>('pendle');

    const theme = themes[themeId as keyof typeof themes] || themes.pendle;
    const isDark = themeId === 'pendle' || themeId === 'dark'; // 假设 pendle 也是深色

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
            componentStyles,
            setTheme: setThemeId,
            toggleTheme,
            isDark,
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
