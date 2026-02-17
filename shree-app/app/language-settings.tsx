import BottomSheetMessage from '@/components/ui/bottom-sheet-message';
import { useLanguage, type Language } from '@/contexts/language-context';
import { useAppTheme } from '@/contexts/theme-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TEXT_DARK = '#333333';

interface LangOption {
    id: Language;
    name: string;
    nameNative: string;
    flag: string;
}

const LANG_OPTIONS: LangOption[] = [
    { id: 'hi', name: 'Hindi', nameNative: 'हिन्दी', flag: '🇮🇳' },
    { id: 'en', name: 'English', nameNative: 'English', flag: '🇬🇧' },
];

export default function LanguageSettingsScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { theme } = useAppTheme();
    const { language, setLanguage, t } = useLanguage();
    const [saving, setSaving] = useState(false);
    const [sheetVisible, setSheetVisible] = useState(false);
    const [sheetConfig, setSheetConfig] = useState({
        type: 'success' as 'success' | 'error',
        title: '',
        message: '',
    });

    const handleSelectLang = async (langId: Language) => {
        if (langId === language) return;
        setSaving(true);
        try {
            await setLanguage(langId);
            setSheetConfig({
                type: 'success',
                title: langId === 'hi' ? 'भाषा बदली गई' : 'Language Changed',
                message: langId === 'hi' ? 'नई भाषा सफलतापूर्वक लागू हो गई है।' : 'New language has been applied successfully.',
            });
            setSheetVisible(true);
        } catch {
            setSheetConfig({
                type: 'error',
                title: t('error'),
                message: t('lang_error_msg'),
            });
            setSheetVisible(true);
        } finally {
            setSaving(false);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.bgCream }]}>
            <StatusBar style="dark" backgroundColor={theme.headerBg} translucent={false} />
            <View style={[styles.headerBg, { paddingTop: insets.top, backgroundColor: theme.headerBg }]}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={TEXT_DARK} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{t('lang_header')}</Text>
                    <View style={{ width: 32 }} />
                </View>
            </View>

            <View style={styles.listContent}>
                {LANG_OPTIONS.map((item) => {
                    const isSelected = item.id === language;
                    return (
                        <TouchableOpacity
                            key={item.id}
                            style={[
                                styles.langCard,
                                { borderColor: isSelected ? theme.accent : '#E0E0E0' },
                                isSelected && { borderWidth: 2 },
                            ]}
                            onPress={() => handleSelectLang(item.id)}
                            activeOpacity={0.7}
                            disabled={saving}
                        >
                            <Text style={styles.flag}>{item.flag}</Text>
                            <View style={styles.langInfo}>
                                <Text style={styles.langName}>{item.nameNative}</Text>
                                <Text style={styles.langNameEn}>{item.name}</Text>
                            </View>
                            {saving && item.id !== language ? null : isSelected ? (
                                <Ionicons name="checkmark-circle" size={24} color={theme.accent} />
                            ) : null}
                            {saving && item.id !== language && (
                                <ActivityIndicator size="small" color={theme.accent} />
                            )}
                        </TouchableOpacity>
                    );
                })}
            </View>

            <BottomSheetMessage
                visible={sheetVisible}
                onClose={() => setSheetVisible(false)}
                type={sheetConfig.type}
                title={sheetConfig.title}
                message={sheetConfig.message}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    headerBg: {},
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 6,
        paddingVertical: 10,
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: TEXT_DARK,
    },
    listContent: {
        paddingHorizontal: 6,
        paddingTop: 6,
    },
    langCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        padding: 10,
        marginBottom: 6,
    },
    flag: {
        fontSize: 28,
    },
    langInfo: {
        flex: 1,
        marginLeft: 10,
    },
    langName: {
        fontSize: 16,
        fontWeight: '600',
        color: TEXT_DARK,
    },
    langNameEn: {
        fontSize: 12,
        color: TEXT_DARK,
        opacity: 0.6,
    },
});
