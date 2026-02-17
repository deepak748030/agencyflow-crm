import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';

const THEME_KEY = '@app_theme';

export interface ThemeColors {
    id: string;
    headerBg: string;
    bgCream: string;
    accent: string;
    cardBorder: string;
    primary: string;
}

export const THEME_OPTIONS: ThemeColors[] = [
    { id: 'yellow', headerBg: '#FFEB3B', bgCream: '#FFFDE7', accent: '#B8860B', cardBorder: '#FFD54F', primary: '#D4A017' },
    { id: 'saffron', headerBg: '#FF9800', bgCream: '#FFF3E0', accent: '#E65100', cardBorder: '#FFB74D', primary: '#FF9800' },
    { id: 'lotus', headerBg: '#F48FB1', bgCream: '#FCE4EC', accent: '#C2185B', cardBorder: '#F48FB1', primary: '#E91E63' },
    { id: 'peacock', headerBg: '#4FC3F7', bgCream: '#E1F5FE', accent: '#0277BD', cardBorder: '#4FC3F7', primary: '#0288D1' },
    { id: 'tulsi', headerBg: '#81C784', bgCream: '#E8F5E9', accent: '#2E7D32', cardBorder: '#81C784', primary: '#388E3C' },
    { id: 'sandal', headerBg: '#D7CCC8', bgCream: '#EFEBE9', accent: '#5D4037', cardBorder: '#BCAAA4', primary: '#795548' },
];

interface ThemeContextType {
    theme: ThemeColors;
    themeId: string;
    setThemeId: (id: string) => Promise<void>;
    loading: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
    theme: THEME_OPTIONS[0],
    themeId: 'yellow',
    setThemeId: async () => { },
    loading: true,
});

export function AppThemeProvider({ children }: { children: React.ReactNode }) {
    const [themeId, setThemeIdState] = useState('yellow');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        AsyncStorage.getItem(THEME_KEY)
            .then((saved) => {
                if (saved) setThemeIdState(saved);
            })
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    const setThemeId = async (id: string) => {
        await AsyncStorage.setItem(THEME_KEY, id);
        setThemeIdState(id);
    };

    const theme = THEME_OPTIONS.find((t) => t.id === themeId) || THEME_OPTIONS[0];

    return (
        <ThemeContext.Provider value={{ theme, themeId, setThemeId, loading }}>
            {children}
        </ThemeContext.Provider>
    );
}

export const useAppTheme = () => useContext(ThemeContext);
