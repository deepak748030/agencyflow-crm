import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { privacySections } from '@/constants/translations';
import { useLanguage } from '@/contexts/language-context';
import { useAppTheme } from '@/contexts/theme-context';

const TEXT_DARK = '#333333';

export default function PrivacyPolicyScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { theme } = useAppTheme();
    const { language, t } = useLanguage();

    const sections = privacySections[language];

    return (
        <View style={[styles.container, { backgroundColor: theme.bgCream }]}>
            <StatusBar style="dark" backgroundColor={theme.headerBg} translucent={false} />
            <View style={[styles.headerBg, { paddingTop: insets.top, backgroundColor: theme.headerBg }]}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={TEXT_DARK} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{t('privacy_header')}</Text>
                    <View style={{ width: 32 }} />
                </View>
            </View>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <Text style={styles.lastUpdated}>{t('privacy_last_updated')}</Text>
                {sections.map((section, index) => (
                    <View key={index} style={[styles.sectionCard, { borderColor: theme.cardBorder }]}>
                        <Text style={styles.sectionTitle}>{section.title}</Text>
                        <Text style={styles.sectionContent}>{section.content}</Text>
                    </View>
                ))}
            </ScrollView>
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
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 6,
        paddingBottom: 30,
    },
    lastUpdated: {
        fontSize: 12,
        color: TEXT_DARK,
        opacity: 0.6,
        textAlign: 'center',
        marginTop: 6,
        marginBottom: 6,
    },
    sectionCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 10,
        borderWidth: 1,
        paddingHorizontal: 12,
        paddingVertical: 10,
        marginBottom: 6,
    },
    sectionTitle: {
        fontSize: 15,
        fontWeight: 'bold',
        color: TEXT_DARK,
        marginBottom: 4,
    },
    sectionContent: {
        fontSize: 13,
        color: TEXT_DARK,
        opacity: 0.85,
        lineHeight: 20,
    },
});
