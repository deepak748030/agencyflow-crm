import { useAppTheme } from '@/contexts/theme-context';
import { useLanguage } from '@/contexts/language-context';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Share } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import React, { useState, useEffect } from 'react';
import {
    ActivityIndicator,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import BottomSheetMessage from '@/components/ui/bottom-sheet-message';
import { fetchTodayImage } from '@/services/api';

const TEXT_DARK = '#333333';

// Fallback image when server is unavailable
const FALLBACK_IMAGE = require('@/assets/images/shree-ji-logo.png');

export default function DailyQuoteScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { theme } = useAppTheme();
    const { language, t } = useLanguage();
    const [sharing, setSharing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [imageUrl, setImageUrl] = useState<string | null>(null);

    const [sheetVisible, setSheetVisible] = useState(false);
    const [sheetConfig, setSheetConfig] = useState({
        type: 'error' as 'error' | 'warning' | 'success' | 'info',
        title: '',
        message: '',
    });

    useEffect(() => {
        loadTodayImage();
    }, []);

    const loadTodayImage = async () => {
        setLoading(true);
        try {
            const data = await fetchTodayImage();
            if (data?.imageUrl) {
                setImageUrl(data.imageUrl);
            } else {
                setImageUrl(null);
            }
        } catch {
            setImageUrl(null);
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadTodayImage();
        setRefreshing(false);
    };

    const handleShare = async () => {
        setSharing(true);
        try {
            const shareText = `🙏 ${t('app_name')} | ${t('daily_quote_share_via')}`;
            const shareContent: { message: string; url?: string } = {
                message: imageUrl ? `${shareText}\n${imageUrl}` : shareText,
            };
            if (imageUrl) shareContent.url = imageUrl;
            await Share.share(shareContent);
        } catch {
            setSheetConfig({
                type: 'error',
                title: t('error'),
                message: t('daily_quote_share_failed'),
            });
            setSheetVisible(true);
        } finally {
            setSharing(false);
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
                    <Text style={styles.headerTitle}>{t('daily_quote_header')}</Text>
                    <View style={{ width: 24 }} />
                </View>
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.accent} />
                </View>
            ) : (
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={[theme.accent]}
                            tintColor={theme.accent}
                        />
                    }
                >
                    <View style={[styles.imageCard, { borderColor: theme.cardBorder }]}>
                        <Image
                            source={imageUrl ? { uri: imageUrl } : FALLBACK_IMAGE}
                            style={styles.quoteImage}
                            contentFit="contain"
                            transition={300}
                        />
                    </View>

                    <Text style={[styles.dateText, { color: theme.accent }]}>
                        {t('daily_quote_today')} • {new Date().toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </Text>
                </ScrollView>
            )}

            <View style={[styles.shareButtonContainer, { paddingBottom: insets.bottom + 6 }]}>
                <TouchableOpacity
                    style={[styles.shareButton, { backgroundColor: theme.accent }]}
                    onPress={handleShare}
                    activeOpacity={0.8}
                    disabled={sharing}
                >
                    {sharing ? (
                        <ActivityIndicator color="#FFFFFF" />
                    ) : (
                        <>
                            <Ionicons name="share-social" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                            <Text style={styles.shareButtonText}>{t('daily_quote_share')}</Text>
                        </>
                    )}
                </TouchableOpacity>
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
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
        flex: 1,
        marginLeft: 12,
    },
    scrollContent: {
        paddingHorizontal: 6,
        paddingTop: 6,
        paddingBottom: 80,
    },
    imageCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        borderWidth: 1,
        overflow: 'hidden',
        marginBottom: 10,
    },
    quoteImage: {
        width: '100%',
        height: 400,
    },
    dateText: {
        fontSize: 13,
        textAlign: 'center',
        fontWeight: '500',
        opacity: 0.8,
    },
    shareButtonContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 6,
        paddingTop: 6,
        backgroundColor: 'transparent',
    },
    shareButton: {
        flexDirection: 'row',
        borderRadius: 8,
        paddingVertical: 12,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.15,
        shadowRadius: 3,
    },
    shareButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
});
