import AnalyticsSheet from '@/components/naam-jap/analytics-sheet';
import MenuDropdown from '@/components/naam-jap/menu-dropdown';
import PickImageSheet from '@/components/naam-jap/pick-image-sheet';
import SettingsSheet from '@/components/naam-jap/settings-sheet';
import UserInfoModal from '@/components/naam-jap/user-info-modal';
import { useAuth } from '@/contexts/auth-context';
import { useLanguage } from '@/contexts/language-context';
import { useAppTheme } from '@/contexts/theme-context';
import { useDeviceId } from '@/hooks/use-device-id';
import { useNaamJapSync } from '@/hooks/use-naam-jap-sync';
import { getExpoPushToken } from '@/hooks/use-notifications';
import { usePersistedCounter } from '@/hooks/use-persisted-counter';
import { fetchPresetImages, fetchUserDailyData, PresetImageData } from '@/services/api';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    Dimensions,
    Pressable,
    StyleSheet,
    Text,
    TouchableOpacity,
    Vibration,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TEXT_DARK = '#333333';
const CIRCLE_BG = '#E0D6A0';
const CIRCLE_PROGRESS = '#333333';
const MALA_COUNT = 108;
const CIRCLE_SIZE = 180;
const STROKE_WIDTH = 14;
const RADIUS = (CIRCLE_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const USER_NAAM_JAP_KEY = '@naam_jap_user_info';

export default function NaamJapCounterScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { theme } = useAppTheme();
    const { t } = useLanguage();
    const deviceId = useDeviceId();
    const { isLoggedIn } = useAuth();

    const {
        count,
        malaCount,
        vibrationEnabled,
        displayMode,
        selectedImage,
        selectedTextStyle,
        todayCount,
        todayMalas,
        autoChangeImage,
        isLoaded,
        updateCount,
        updateMalaCount,
        updateTodayCount,
        updateTodayMalas,
        updateVibration,
        updateDisplayMode,
        updateSelectedImage,
        updateSelectedTextStyle,
        updateAutoChangeImage,
        resetCurrentMala,
        resetAllMalas,
        restoreFromServer,
        checkAndResetDaily,
        markLoaded,
    } = usePersistedCounter();

    const [menuVisible, setMenuVisible] = useState(false);
    const [settingsVisible, setSettingsVisible] = useState(false);
    const [pickImageVisible, setPickImageVisible] = useState(false);
    const [analyticsVisible, setAnalyticsVisible] = useState(false);
    const [userInfoVisible, setUserInfoVisible] = useState(false);

    const [rank, setRank] = useState<number | null>(null);
    const [totalUsers, setTotalUsers] = useState<number | null>(null);

    // Preset images for auto-change
    const [presetImages, setPresetImages] = useState<PresetImageData[]>([]);
    const imageIndexRef = useRef(0);

    // Fetch preset images on mount
    useEffect(() => {
        fetchPresetImages().then((imgs) => {
            setPresetImages(imgs);
            // Set first preset image as default if no image selected and images exist
            if (imgs.length > 0 && !selectedImage && displayMode === 'image') {
                updateSelectedImage({ uri: imgs[0].imageUrl });
            }
        });
    }, []);

    // Check if user info exists — skip if already logged in via auth screen
    useEffect(() => {
        if (isLoggedIn) return;
        AsyncStorage.getItem(USER_NAAM_JAP_KEY).then((val) => {
            if (!val) {
                setUserInfoVisible(true);
            }
        });
    }, [isLoggedIn]);

    // On mount: fetch today's data from server — no cache
    const restoredRef = useRef(false);
    useEffect(() => {
        // Always reset daily counters if new day
        checkAndResetDaily();

        if (!deviceId) {
            markLoaded();
            return;
        }

        // Prevent duplicate fetches
        if (restoredRef.current) return;
        restoredRef.current = true;

        // Use Indian timezone for date — manual UTC+5:30 offset
        const now = new Date();
        const istMs = now.getTime() + (5.5 * 60 * 60 * 1000);
        const istDate = new Date(istMs);
        const today = `${istDate.getUTCFullYear()}-${String(istDate.getUTCMonth() + 1).padStart(2, '0')}-${String(istDate.getUTCDate()).padStart(2, '0')}`;
        fetchUserDailyData(deviceId, today)
            .then((data) => {
                if (data) {
                    restoreFromServer(
                        data.user.totalCount || 0,
                        data.user.totalMalas || 0,
                        data.dailyLog?.count || 0,
                        data.dailyLog?.malas || 0
                    );
                    setRank(data.rank);
                    setTotalUsers(data.totalUsers);
                }
            })
            .catch(() => { })
            .finally(() => {
                markLoaded();
            });
    }, [deviceId]);

    // Sync state object for the hook
    const syncState = useMemo(() => ({
        count,
        malaCount,
        todayCount,
        todayMalas,
    }), [count, malaCount, todayCount, todayMalas]);

    const handleSyncResult = useCallback((result: { rank: number | null; totalUsers: number | null }) => {
        setRank(result.rank);
        setTotalUsers(result.totalUsers);
    }, []);

    const { syncNow } = useNaamJapSync(deviceId, syncState, handleSyncResult);

    // Computed values
    const currentInMala = count % MALA_COUNT;
    const progress = currentInMala / MALA_COUNT;
    const strokeDashoffset = CIRCUMFERENCE * (1 - progress);
    const menuAnchorY = insets.top + 40;

    const handleTap = useCallback(async () => {
        // Check if day changed — reset daily counters to 0 if new day
        await checkAndResetDaily();

        if (vibrationEnabled) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }

        // Auto-change image on each tap
        if (autoChangeImage && presetImages.length > 0 && displayMode === 'image') {
            imageIndexRef.current = (imageIndexRef.current + 1) % presetImages.length;
            updateSelectedImage({ uri: presetImages[imageIndexRef.current].imageUrl });
        }

        updateCount((prev) => {
            const newCount = prev + 1;
            if (newCount % MALA_COUNT === 0 && newCount > 0) {
                updateMalaCount((m) => m + 1);
                updateTodayMalas((m) => m + 1);
                if (vibrationEnabled) Vibration.vibrate(1000);
            }
            return newCount;
        });

        updateTodayCount((prev) => prev + 1);
    }, [vibrationEnabled, autoChangeImage, presetImages, displayMode, updateCount, updateMalaCount, updateTodayCount, updateTodayMalas, updateSelectedImage, checkAndResetDaily]);

    const handleUserSaved = useCallback(() => {
        setUserInfoVisible(false);
        setTimeout(() => syncNow(), 1000);
    }, [syncNow]);

    const rankDisplay = rank && totalUsers
        ? `${rank.toLocaleString('en-IN')} / ${totalUsers.toLocaleString('en-IN')}`
        : '-- / --';

    if (!isLoaded) {
        return (
            <View style={[styles.container, { backgroundColor: theme.bgCream }]}>
                <StatusBar style="dark" backgroundColor={theme.headerBg} translucent={false} />
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.bgCream }]}>
            <StatusBar style="dark" backgroundColor={theme.headerBg} translucent={false} />

            <View style={[styles.headerBg, { paddingTop: insets.top, backgroundColor: theme.headerBg }]}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={TEXT_DARK} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{t('naam_jap_header')}</Text>
                    <TouchableOpacity style={styles.menuDots} onPress={() => setMenuVisible(true)}>
                        <MaterialIcons name="more-vert" size={24} color={TEXT_DARK} />
                    </TouchableOpacity>
                </View>
            </View>

            <Pressable style={styles.content} onPress={handleTap}>
                {displayMode === 'image' && selectedImage ? (
                    <Image source={typeof selectedImage === 'object' && selectedImage?.uri ? { uri: selectedImage.uri } : selectedImage} style={styles.displayImage} contentFit="cover" />
                ) : (
                    <Text style={[styles.radhaText, { color: selectedTextStyle.color }]}>राधा</Text>
                )}

                <View style={styles.circleContainer}>
                    <Svg width={CIRCLE_SIZE} height={CIRCLE_SIZE} style={styles.svgCircle}>
                        <Circle cx={CIRCLE_SIZE / 2} cy={CIRCLE_SIZE / 2} r={RADIUS} stroke={CIRCLE_BG} strokeWidth={STROKE_WIDTH} fill="none" />
                        <Circle cx={CIRCLE_SIZE / 2} cy={CIRCLE_SIZE / 2} r={RADIUS} stroke={CIRCLE_PROGRESS} strokeWidth={STROKE_WIDTH} fill="none" strokeDasharray={CIRCUMFERENCE} strokeDashoffset={strokeDashoffset} strokeLinecap="round" transform={`rotate(-90 ${CIRCLE_SIZE / 2} ${CIRCLE_SIZE / 2})`} />
                    </Svg>
                    <Text style={styles.countText}>{count}</Text>
                </View>

                <Text style={styles.totalCountText}>{currentInMala} / {MALA_COUNT}</Text>
                <Text style={styles.malaText}>{t('naam_jap_today_mala')}: {malaCount}</Text>

                <View style={styles.rankCard}>
                    <MaterialIcons name="bar-chart" size={28} color={theme.headerBg} style={styles.rankIcon} />
                    <View>
                        <Text style={styles.rankLabel}>{t('naam_jap_my_rank')}</Text>
                        <Text style={styles.rankValue}>{rankDisplay}</Text>
                    </View>
                </View>
            </Pressable>

            <MenuDropdown
                visible={menuVisible}
                onClose={() => setMenuVisible(false)}
                anchorY={menuAnchorY}
                onPickImage={() => setPickImageVisible(true)}
                onAnalytics={() => setAnalyticsVisible(true)}
                onSettings={() => setSettingsVisible(true)}
            />

            <SettingsSheet
                visible={settingsVisible}
                onClose={() => setSettingsVisible(false)}
                vibrationEnabled={vibrationEnabled}
                onToggleVibration={updateVibration}
                autoChangeImage={autoChangeImage}
                onToggleAutoChange={updateAutoChangeImage}
                onResetCurrentMala={resetCurrentMala}
                onResetAllMalas={resetAllMalas}
            />

            <PickImageSheet
                visible={pickImageVisible}
                onClose={() => setPickImageVisible(false)}
                onSelectTextStyle={(index) => {
                    updateDisplayMode('text');
                    const textStyles = [{ color: TEXT_DARK }, { color: theme.headerBg }, { color: '#E53935' }];
                    updateSelectedTextStyle(textStyles[index]);
                    setPickImageVisible(false);
                }}
                onSelectImage={(img) => {
                    updateDisplayMode('image');
                    updateSelectedImage(img);
                    setPickImageVisible(false);
                }}
            />

            <AnalyticsSheet
                visible={analyticsVisible}
                onClose={() => setAnalyticsVisible(false)}
                deviceId={deviceId}
            />

            <UserInfoModal
                visible={userInfoVisible}
                onClose={() => setUserInfoVisible(false)}
                onSave={handleUserSaved}
                deviceId={deviceId}
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
        flex: 1,
        marginLeft: 12,
    },
    menuDots: {
        padding: 4,
    },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 6,
    },
    radhaText: {
        fontSize: 100,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    displayImage: {
        width: SCREEN_WIDTH - 12,
        height: 350,
        marginBottom: 20,
        borderRadius: 12,
        resizeMode: 'contain',
    },
    circleContainer: {
        width: CIRCLE_SIZE,
        height: CIRCLE_SIZE,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 30,
    },
    svgCircle: {
        position: 'absolute',
    },
    countText: {
        fontSize: 48,
        fontWeight: 'bold',
        color: TEXT_DARK,
    },
    totalCountText: {
        fontSize: 16,
        fontWeight: '500',
        color: TEXT_DARK,
        marginBottom: 10,
        opacity: 0.7,
    },
    malaText: {
        fontSize: 22,
        fontWeight: '600',
        color: TEXT_DARK,
        marginBottom: 30,
    },
    rankCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderWidth: 1.5,
        borderColor: '#333333',
    },
    rankIcon: {
        marginRight: 10,
    },
    rankLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: TEXT_DARK,
    },
    rankValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: TEXT_DARK,
    },
});
