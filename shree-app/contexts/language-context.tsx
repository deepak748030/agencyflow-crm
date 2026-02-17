import { translations, type TranslationKeys } from '@/constants/translations';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';

const LANGUAGE_KEY = '@app_language';
const LANGUAGE_CHOSEN_KEY = '@app_language_chosen';

export type Language = 'hi' | 'en';

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => Promise<void>;
    t: (key: TranslationKeys) => string;
    loading: boolean;
    hasChosenLanguage: boolean;
    markLanguageChosen: () => Promise<void>;
}

const LanguageContext = createContext<LanguageContextType>({
    language: 'hi',
    setLanguage: async () => { },
    t: (key) => key,
    loading: true,
    hasChosenLanguage: false,
    markLanguageChosen: async () => { },
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
    const [language, setLangState] = useState<Language>('hi');
    const [loading, setLoading] = useState(true);
    const [hasChosenLanguage, setHasChosenLanguage] = useState(false);

    useEffect(() => {
        Promise.all([
            AsyncStorage.getItem(LANGUAGE_KEY),
            AsyncStorage.getItem(LANGUAGE_CHOSEN_KEY),
        ])
            .then(([saved, chosen]) => {
                if (saved === 'en' || saved === 'hi') setLangState(saved);
                if (chosen === 'true') setHasChosenLanguage(true);
            })
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    const setLanguage = async (lang: Language) => {
        await AsyncStorage.setItem(LANGUAGE_KEY, lang);
        setLangState(lang);
    };

    const markLanguageChosen = async () => {
        await AsyncStorage.setItem(LANGUAGE_CHOSEN_KEY, 'true');
        setHasChosenLanguage(true);
    };

    const t = (key: TranslationKeys): string => {
        return translations[language]?.[key] || key;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t, loading, hasChosenLanguage, markLanguageChosen }}>
            {children}
        </LanguageContext.Provider>
    );
}

export const useLanguage = () => useContext(LanguageContext);
