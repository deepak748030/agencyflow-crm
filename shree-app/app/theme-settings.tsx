import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import {
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import BottomSheetMessage from '@/components/ui/bottom-sheet-message';
import type { TranslationKeys } from '@/constants/translations';
import { useLanguage } from '@/contexts/language-context';
import { THEME_OPTIONS, useAppTheme, type ThemeColors } from '@/contexts/theme-context';

const TEXT_DARK = '#333333';

const THEME_NAME_KEYS: Record<string, TranslationKeys> = {
    yellow: 'theme_yellow',
    saffron: 'theme_saffron',
    lotus: 'theme_lotus',
    peacock: 'theme_peacock',
    tulsi: 'theme_tulsi',
    sandal: 'theme_sandal',
};

const THEME_NAME_EN: Record<string, string> = {
    yellow: 'Golden Yellow',
    saffron: 'Saffron Orange',
    lotus: 'Lotus Pink',
    peacock: 'Peacock Blue',
    tulsi: 'Tulsi Green',
    sandal: 'Sandalwood',
};

export default function ThemeSettingsScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { theme, themeId, setThemeId } = useAppTheme();
    const { t } = useLanguage();
    const [saving, setSaving] = useState(false);
    const [sheetVisible, setSheetVisible] = useState(false);
    const [sheetConfig, setSheetConfig] = useState({
        type: 'success' as 'success' | 'error',
        title: '',
        message: '',
    });

    const handleSelectTheme = async (id: string) => {
        if (id === themeId) return;
        setSaving(true);
        try {
            await setThemeId(id);
            setSheetConfig({
                type: 'success',
                title: t('theme_changed'),
                message: t('theme_changed_msg'),
            });
            setSheetVisible(true);
        } catch {
            setSheetConfig({
                type: 'error',
                title: t('error'),
                message: t('theme_error_msg'),
            });
            setSheetVisible(true);
        } finally {
            setSaving(false);
        }
    };

    const renderThemeItem = ({ item }: { item: ThemeColors }) => {
        const isSelected = item.id === themeId;
        return (
            <TouchableOpacity
                style={[
                    styles.themeCard,
                    { borderColor: isSelected ? item.accent : '#E0E0E0' },
                    isSelected && { borderWidth: 2 },
                ]}
                onPress={() => handleSelectTheme(item.id)}
                activeOpacity={0.7}
                disabled={saving}
            >
                <View style={styles.themePreview}>
                    <View style={[styles.previewHeader, { backgroundColor: item.headerBg }]} />
                    <View style={[styles.previewBody, { backgroundColor: item.bgCream }]}>
                        <View style={[styles.previewCard, { borderColor: item.cardBorder }]} />
                        <View style={[styles.previewCard, { borderColor: item.cardBorder, width: '60%' }]} />
                    </View>
                </View>
                <View style={styles.themeInfo}>
                    <Text style={styles.themeName}>{t(THEME_NAME_KEYS[item.id])}</Text>
                    <Text style={styles.themeNameEn}>{THEME_NAME_EN[item.id]}</Text>
                </View>
                {isSelected && (
                    <Ionicons name="checkmark-circle" size={24} color={item.accent} />
                )}
            </TouchableOpacity>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.bgCream }]}>
            <StatusBar style="dark" backgroundColor={theme.headerBg} translucent={false} />
            <View style={[styles.headerBg, { paddingTop: insets.top, backgroundColor: theme.headerBg }]}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={TEXT_DARK} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{t('theme_header')}</Text>
                    <View style={{ width: 32 }} />
                </View>
            </View>

            <FlatList
                data={THEME_OPTIONS}
                renderItem={renderThemeItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                ItemSeparatorComponent={() => <View style={{ height: 6 }} />}
            />

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
        paddingBottom: 30,
    },
    themeCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        padding: 10,
    },
    themePreview: {
        width: 60,
        height: 44,
        borderRadius: 6,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    previewHeader: {
        height: 14,
    },
    previewBody: {
        flex: 1,
        padding: 3,
        gap: 2,
    },
    previewCard: {
        height: 6,
        borderRadius: 2,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        width: '80%',
    },
    themeInfo: {
        flex: 1,
        marginLeft: 10,
    },
    themeName: {
        fontSize: 14,
        fontWeight: '600',
        color: TEXT_DARK,
    },
    themeNameEn: {
        fontSize: 12,
        color: TEXT_DARK,
        opacity: 0.6,
    },
});
