import { useAuth } from '@/contexts/auth-context';
import { useLanguage } from '@/contexts/language-context';
import { useAppTheme } from '@/contexts/theme-context';
import { useDeviceId } from '@/hooks/use-device-id';
import { useStepTracker, persistBgAuthInfo } from '@/hooks/use-step-tracker';
import { syncStepData, fetchStepData } from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    Dimensions,
    Platform,
    PermissionsAndroid,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const RING_SIZE = SCREEN_WIDTH * 0.55;
const STROKE_WIDTH = 14;
const RADIUS = (RING_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// ─── Notification Bar Component ───
function StepNotificationBar({ steps, goal, distance, calories, accentColor, theme }: {
    steps: number; goal: number; distance: number; calories: number; accentColor: string; theme: any;
}) {
    const progress = goal > 0 ? Math.min(steps / goal, 1) : 0;
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.15, duration: 800, useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
            ])
        ).start();
    }, []);

    return (
        <View style={[notifStyles.bar, { backgroundColor: accentColor + '12', borderColor: accentColor + '30' }]}>
            <Animated.View style={[notifStyles.liveDot, { backgroundColor: '#4CAF50', transform: [{ scale: pulseAnim }] }]} />
            <Ionicons name="footsteps" size={16} color={accentColor} />
            <Text style={[notifStyles.liveText, { color: '#1A1A1A' }]}>
                <Text style={{ fontWeight: '800' }}>{steps.toLocaleString()}</Text> steps
            </Text>
            <View style={notifStyles.barDivider} />
            <Text style={[notifStyles.barStat, { color: '#666' }]}>{distance} km</Text>
            <View style={notifStyles.barDivider} />
            <Text style={[notifStyles.barStat, { color: '#666' }]}>{calories} kcal</Text>
            <View style={[notifStyles.progressPill, { backgroundColor: accentColor + '20' }]}>
                <Text style={[notifStyles.progressText, { color: accentColor }]}>{Math.round(progress * 100)}%</Text>
            </View>
        </View>
    );
}

const notifStyles = StyleSheet.create({
    bar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 10,
        borderWidth: 1,
        marginHorizontal: 6,
        marginTop: 4,
        gap: 6,
    },
    liveDot: { width: 6, height: 6, borderRadius: 3 },
    liveText: { fontSize: 13, fontWeight: '600' },
    barDivider: { width: 1, height: 12, backgroundColor: '#DDD' },
    barStat: { fontSize: 11, fontWeight: '500' },
    progressPill: { marginLeft: 'auto', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
    progressText: { fontSize: 11, fontWeight: '700' },
});

// ─── Main Screen ───
export default function StepTrackerScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { theme } = useAppTheme();
    const { t } = useLanguage();
    const { user, isLoggedIn, mobile } = useAuth();
    const deviceId = useDeviceId();
    const {
        todaySteps,
        distance,
        calories,
        dailyGoal,
        progress,
        isAvailable,
        loading,
        notificationEnabled,
        updateGoal,
        restoreFromServer,
    } = useStepTracker();

    const [syncing, setSyncing] = useState(false);
    const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
    const progressAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.9)).current;

    // Request step tracking permissions when entering this screen
    useEffect(() => {
        (async () => {
            if (Platform.OS === 'android') {
                if (Platform.Version >= 29) {
                    try {
                        await PermissionsAndroid.request(
                            'android.permission.ACTIVITY_RECOGNITION' as any,
                            {
                                title: 'Step Tracking Permission',
                                message: 'Allow access to track your steps.',
                                buttonPositive: 'Allow',
                                buttonNegative: 'Deny',
                            }
                        );
                    } catch { }
                }
                try {
                    await PermissionsAndroid.request(
                        'android.permission.BODY_SENSORS' as any,
                        {
                            title: 'Body Sensor Permission',
                            message: 'Allow access to body sensors for accurate step tracking.',
                            buttonPositive: 'Allow',
                            buttonNegative: 'Deny',
                        }
                    );
                } catch { }
            }
            if (Platform.OS === 'ios') {
                try {
                    const sensors = await import('expo-sensors');
                    if (sensors?.Pedometer) {
                        await sensors.Pedometer.isAvailableAsync();
                        const start = new Date();
                        start.setHours(0, 0, 0, 0);
                        await sensors.Pedometer.getStepCountAsync(start, new Date());
                    }
                } catch { }
            }
        })();
    }, []);

    useEffect(() => {
        Animated.parallel([
            Animated.timing(progressAnim, {
                toValue: progress,
                duration: 1200,
                useNativeDriver: false,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 5,
                useNativeDriver: true,
            }),
        ]).start();
    }, [progress]);

    const strokeDashoffset = progressAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [CIRCUMFERENCE, 0],
    });

    // Persist auth info for background task access
    useEffect(() => {
        if (deviceId && mobile) {
            persistBgAuthInfo(deviceId, mobile);
        }
    }, [deviceId, mobile]);

    // Restore from server on first load
    useEffect(() => {
        if (!isLoggedIn || !deviceId) return;
        (async () => {
            const data = await fetchStepData(deviceId);
            if (data) {
                const today = new Date().toISOString().split('T')[0];
                const todayLog = data.dailyLogs?.find((l: any) => l.date === today);
                // Only restore if local has no steps yet (new day or fresh install)
                if (todaySteps === 0 && todayLog?.steps > 0) {
                    restoreFromServer({
                        todaySteps: todayLog.steps,
                        dailyGoal: data.dailyGoal || 5000,
                    });
                }
            }
        })();
    }, [isLoggedIn, deviceId]);

    const syncToServer = useCallback(async () => {
        if (!deviceId || !isLoggedIn || !mobile) return;
        setSyncing(true);
        try {
            await syncStepData(deviceId, mobile, todaySteps, distance, calories, dailyGoal);
            setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        } catch { }
        setSyncing(false);
    }, [deviceId, isLoggedIn, mobile, todaySteps, distance, calories, dailyGoal]);

    // Auto sync every 30 seconds
    useEffect(() => {
        if (!isLoggedIn || !deviceId) return;
        syncToServer(); // Sync immediately on mount
        const interval = setInterval(syncToServer, 30000);
        return () => clearInterval(interval);
    }, [syncToServer, isLoggedIn, deviceId]);

    const accentColor = theme.accent;
    const bgColor = theme.bgCream;
    const cardBg = '#FFFFFF';
    const ringTrackColor = theme.cardBorder + '40';
    const textColor = '#1A1A1A';
    const subTextColor = '#666666';

    if (loading) {
        return (
            <View style={[styles.center, { backgroundColor: bgColor, paddingTop: insets.top }]}>
                <StatusBar style="dark" backgroundColor="#FFD700" translucent={false} />
                <ActivityIndicator size="large" color={accentColor} />
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: bgColor, paddingTop: insets.top }]}>
            <StatusBar style="dark" backgroundColor="#FFD700" translucent={false} />

            {/* Header */}
            <View style={[styles.header, { backgroundColor: '#FFD700' }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={textColor} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: textColor }]}>{t('step_tracker_header' as any)}</Text>
                <TouchableOpacity onPress={syncToServer} style={styles.syncBtn} disabled={syncing}>
                    {syncing ? (
                        <ActivityIndicator size="small" color={accentColor} />
                    ) : (
                        <Ionicons name="sync" size={22} color={accentColor} />
                    )}
                </TouchableOpacity>
            </View>

            {/* Live Notification Bar */}
            <StepNotificationBar
                steps={todaySteps}
                goal={dailyGoal}
                distance={distance}
                calories={calories}
                accentColor={accentColor}
                theme={theme}
            />

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Ring Card */}
                <View style={[styles.ringCard, { backgroundColor: cardBg, borderColor: theme.cardBorder }]}>
                    <Animated.View style={[styles.ringContainer, { transform: [{ scale: scaleAnim }] }]}>
                        <Svg width={RING_SIZE} height={RING_SIZE}>
                            <Circle
                                cx={RING_SIZE / 2}
                                cy={RING_SIZE / 2}
                                r={RADIUS}
                                stroke={ringTrackColor}
                                strokeWidth={STROKE_WIDTH}
                                fill="none"
                            />
                            <AnimatedCircle
                                cx={RING_SIZE / 2}
                                cy={RING_SIZE / 2}
                                r={RADIUS}
                                stroke={accentColor}
                                strokeWidth={STROKE_WIDTH}
                                fill="none"
                                strokeLinecap="round"
                                strokeDasharray={CIRCUMFERENCE}
                                strokeDashoffset={strokeDashoffset}
                                rotation="-90"
                                origin={`${RING_SIZE / 2}, ${RING_SIZE / 2}`}
                            />
                        </Svg>
                        <View style={styles.ringCenter}>
                            <Text style={[styles.stepsCount, { color: textColor }]}>{todaySteps.toLocaleString()}</Text>
                            <Text style={[styles.stepsLabel, { color: subTextColor }]}>{t('step_tracker_steps' as any)}</Text>
                            {todaySteps >= dailyGoal && (
                                <Text style={{ fontSize: 20, marginTop: 4 }}>🎉</Text>
                            )}
                        </View>
                    </Animated.View>
                </View>

                {/* Stats Row */}
                <View style={[styles.statsRow, { backgroundColor: cardBg, borderColor: theme.cardBorder }]}>
                    <View style={styles.statItem}>
                        <View style={[styles.statIconBg, { backgroundColor: '#EBF0FF' }]}>
                            <Ionicons name="location" size={18} color="#5B7FFF" />
                        </View>
                        <View>
                            <Text style={[styles.statValue, { color: textColor }]}>{distance} km</Text>
                            <Text style={[styles.statLabel, { color: subTextColor }]}>Distance</Text>
                        </View>
                    </View>
                    <View style={[styles.statDivider, { backgroundColor: theme.cardBorder }]} />
                    <View style={styles.statItem}>
                        <View style={[styles.statIconBg, { backgroundColor: '#FFEBEB' }]}>
                            <Ionicons name="flame" size={18} color="#FF6B6B" />
                        </View>
                        <View>
                            <Text style={[styles.statValue, { color: textColor }]}>{calories} kcal</Text>
                            <Text style={[styles.statLabel, { color: subTextColor }]}>Calories</Text>
                        </View>
                    </View>
                </View>

                {/* Goal Card */}
                <View style={[styles.goalCard, { backgroundColor: cardBg, borderColor: theme.cardBorder }]}>
                    <View style={styles.goalHeader}>
                        <Text style={[styles.goalTitle, { color: textColor }]}>{t('step_tracker_daily_goal' as any)}</Text>
                        {lastSyncTime && (
                            <Text style={[styles.syncTime, { color: subTextColor }]}>
                                <Ionicons name="cloud-done" size={10} color="#4CAF50" /> Synced {lastSyncTime}
                            </Text>
                        )}
                    </View>
                    <Text style={[styles.goalValue, { color: accentColor }]}>{dailyGoal.toLocaleString()} {t('step_tracker_steps' as any)}</Text>
                    <View style={[styles.goalBarBg, { backgroundColor: ringTrackColor }]}>
                        <View style={[styles.goalBarFill, { width: `${Math.min(progress * 100, 100)}%`, backgroundColor: accentColor }]} />
                    </View>
                    <Text style={[styles.goalPercent, { color: subTextColor }]}>
                        {Math.round(progress * 100)}% {t('step_tracker_completed' as any)}
                    </Text>
                </View>

                {/* Goal presets */}
                <View style={styles.goalPresetsRow}>
                    {[3000, 5000, 8000, 10000].map(g => (
                        <TouchableOpacity
                            key={g}
                            onPress={() => updateGoal(g)}
                            style={[
                                styles.goalPresetBtn,
                                {
                                    borderColor: dailyGoal === g ? accentColor : theme.cardBorder,
                                    backgroundColor: dailyGoal === g ? accentColor : cardBg,
                                },
                            ]}
                        >
                            <Text style={[styles.goalPresetText, { color: dailyGoal === g ? '#FFF' : textColor }]}>
                                {(g / 1000).toFixed(0)}K
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Status indicators */}
                <View style={[styles.statusCard, { backgroundColor: cardBg, borderColor: theme.cardBorder }]}>
                    <View style={styles.statusRow}>
                        <Ionicons name="hardware-chip" size={16} color={isAvailable ? '#4CAF50' : '#F44336'} />
                        <Text style={[styles.statusText, { color: subTextColor }]}>
                            Pedometer: {isAvailable ? 'Active' : 'Not Available'}
                        </Text>
                    </View>
                    <View style={styles.statusRow}>
                        <Ionicons name="notifications" size={16} color={notificationEnabled ? '#4CAF50' : '#F44336'} />
                        <Text style={[styles.statusText, { color: subTextColor }]}>
                            Notifications: {notificationEnabled ? 'On' : 'Off'}
                        </Text>
                    </View>
                    <View style={styles.statusRow}>
                        <Ionicons name="cloud" size={16} color={isLoggedIn ? '#4CAF50' : '#FF9800'} />
                        <Text style={[styles.statusText, { color: subTextColor }]}>
                            Cloud Sync: {isLoggedIn ? 'Active' : 'Login Required'}
                        </Text>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 48,
        paddingHorizontal: 6,
    },
    backBtn: { padding: 6 },
    headerTitle: { flex: 1, fontSize: 17, fontWeight: '700', textAlign: 'center' },
    syncBtn: { padding: 6 },
    scrollContent: { alignItems: 'center', paddingBottom: 40, paddingHorizontal: 6 },
    ringCard: {
        width: '100%',
        borderRadius: 16,
        borderWidth: 1,
        alignItems: 'center',
        paddingVertical: 20,
        marginTop: 6,
    },
    ringContainer: {
        width: RING_SIZE,
        height: RING_SIZE,
        alignItems: 'center',
        justifyContent: 'center',
    },
    ringCenter: {
        position: 'absolute',
        alignItems: 'center',
    },
    stepsCount: { fontSize: 42, fontWeight: '800' },
    stepsLabel: { fontSize: 14, fontWeight: '500', marginTop: 2 },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        width: '100%',
        borderRadius: 12,
        borderWidth: 1,
        padding: 14,
        marginTop: 6,
    },
    statItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    statIconBg: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    statDivider: { width: 1, height: 36, marginHorizontal: 6 },
    statValue: { fontSize: 16, fontWeight: '700' },
    statLabel: { fontSize: 11, fontWeight: '500', marginTop: 1 },
    goalCard: {
        width: '100%',
        borderRadius: 12,
        borderWidth: 1,
        padding: 16,
        marginTop: 6,
    },
    goalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    goalTitle: { fontSize: 14, fontWeight: '600' },
    syncTime: { fontSize: 10, fontWeight: '500' },
    goalValue: { fontSize: 22, fontWeight: '800', marginBottom: 10 },
    goalBarBg: {
        height: 8,
        borderRadius: 4,
        overflow: 'hidden',
    },
    goalBarFill: { height: '100%', borderRadius: 4 },
    goalPercent: { fontSize: 12, marginTop: 6 },
    goalPresetsRow: {
        flexDirection: 'row',
        gap: 6,
        marginTop: 6,
    },
    goalPresetBtn: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1.5,
    },
    goalPresetText: { fontSize: 13, fontWeight: '600' },
    statusCard: {
        width: '100%',
        borderRadius: 12,
        borderWidth: 1,
        padding: 14,
        marginTop: 10,
        gap: 8,
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    statusText: { fontSize: 12, fontWeight: '500' },
});
