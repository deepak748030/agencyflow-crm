import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';

const STEP_DATA_KEY = '@step_tracker_data';
const STEP_GOAL_KEY = '@step_tracker_goal';
const BG_DEVICE_ID_KEY = '@step_bg_device_id';
const BG_MOBILE_KEY = '@step_bg_mobile';
const STEPS_PER_KM = 1350;
const CALORIES_PER_STEP = 0.04;
const BACKGROUND_STEP_TASK = 'BACKGROUND_STEP_SYNC';
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://shree-jii-server.vercel.app/api';

interface StepData {
    date: string;
    steps: number;
}

function getTodayStr() {
    return new Date().toISOString().split('T')[0];
}

// ─── Dynamic module loaders (avoid crash if not installed) ───

async function getPedometerModule() {
    try {
        const mod = await import('expo-sensors');
        if (mod?.Pedometer) return mod.Pedometer;
    } catch { }
    return null;
}

async function getNotificationsModule() {
    try {
        return await import('expo-notifications');
    } catch { }
    return null;
}

async function getTaskManagerModule() {
    try {
        return await import('expo-task-manager');
    } catch { }
    return null;
}

async function getBackgroundTaskModule() {
    try {
        return await import('expo-background-task');
    } catch { }
    return null;
}

// ─── Background server sync (no React context needed) ───

async function syncToServerFromBackground(steps: number, distance: number, calories: number, goal: number) {
    try {
        const [deviceId, mobile] = await Promise.all([
            AsyncStorage.getItem(BG_DEVICE_ID_KEY),
            AsyncStorage.getItem(BG_MOBILE_KEY),
        ]);
        if (!deviceId || !mobile) return;

        await fetch(`${API_BASE_URL}/step-tracker/sync`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                deviceId,
                mobile,
                todaySteps: steps,
                todayDistance: distance,
                todayCalories: calories,
                dailyGoal: goal,
            }),
        });
    } catch { }
}

// ─── Persistent notification ───

const STEP_NOTIFICATION_ID = 'step-tracker-persistent';

async function updateStepNotification(steps: number, goal: number, distance: number, calories: number) {
    try {
        const Notifications = await getNotificationsModule();
        if (!Notifications) return;

        const progress = Math.min(Math.round((steps / goal) * 100), 100);
        const goalReached = steps >= goal;

        // Cancel only the previous step notification (same identifier = update in-place)
        try {
            await Notifications.cancelScheduledNotificationAsync(STEP_NOTIFICATION_ID);
        } catch { }

        // Schedule with fixed identifier — this replaces the previous one, not a new notification
        await Notifications.scheduleNotificationAsync({
            content: {
                title: goalReached ? '🎉 Goal Reached!' : '🚶 Step Tracker Active',
                body: `${steps.toLocaleString()} / ${goal.toLocaleString()} steps (${progress}%) • ${distance} km • ${calories} kcal`,
                data: { type: 'step-tracker' },
                sticky: true,
                autoDismiss: false,
                priority: Notifications.AndroidNotificationPriority?.DEFAULT,
                color: '#FFD700',
                ...(Platform.OS === 'android' && {
                    channelId: 'step-tracker',
                }),
            },
            trigger: null,
            identifier: STEP_NOTIFICATION_ID,
        });
    } catch { }
}

// ─── Notification channel (Android) ───

async function setupNotificationChannel() {
    try {
        const Notifications = await getNotificationsModule();
        if (!Notifications || Platform.OS !== 'android') return;

        await Notifications.setNotificationChannelAsync('step-tracker', {
            name: 'Step Tracker',
            importance: Notifications.AndroidImportance?.DEFAULT ?? 3,
            lockscreenVisibility: Notifications.AndroidNotificationVisibility?.PUBLIC ?? 1,
            enableVibrate: false,
            enableLights: true,
            lightColor: '#FFD700',
            showBadge: false,
        });
    } catch { }
}

// ─── Notification permissions ───

async function requestNotificationPermissions() {
    try {
        const Notifications = await getNotificationsModule();
        if (!Notifications) return false;

        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        if (existingStatus === 'granted') return true;

        const { status } = await Notifications.requestPermissionsAsync();
        return status === 'granted';
    } catch { }
    return false;
}

// ─── Background task registration ───

async function registerBackgroundTask() {
    try {
        const TaskManager = await getTaskManagerModule();
        const BackgroundTask = await getBackgroundTaskModule();
        if (!TaskManager || !BackgroundTask) return;

        const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_STEP_TASK);
        if (isRegistered) return;

        TaskManager.defineTask(BACKGROUND_STEP_TASK, async () => {
            try {
                const Pedometer = await getPedometerModule();
                if (!Pedometer) return BackgroundTask.BackgroundTaskResult?.Failed ?? 2;

                const start = new Date();
                start.setHours(0, 0, 0, 0);
                const end = new Date();
                const result = await Pedometer.getStepCountAsync(start, end);

                if (result?.steps) {
                    const today = getTodayStr();
                    const data: StepData = { date: today, steps: result.steps };
                    await AsyncStorage.setItem(STEP_DATA_KEY, JSON.stringify(data));

                    const savedGoal = await AsyncStorage.getItem(STEP_GOAL_KEY);
                    const goal = savedGoal ? parseInt(savedGoal, 10) : 5000;
                    const distance = parseFloat((result.steps / STEPS_PER_KM).toFixed(2));
                    const calories = Math.round(result.steps * CALORIES_PER_STEP);

                    // Update persistent notification
                    await updateStepNotification(result.steps, goal, distance, calories);

                    // Sync to server in background
                    await syncToServerFromBackground(result.steps, distance, calories, goal);
                }

                return BackgroundTask.BackgroundTaskResult?.Success ?? 1;
            } catch {
                return BackgroundTask.BackgroundTaskResult?.Failed ?? 2;
            }
        });

        await BackgroundTask.registerTaskAsync(BACKGROUND_STEP_TASK, {
            minimumInterval: 5 * 60, // 5 minutes (OS may throttle)
        });
    } catch { }
}

// ─── Helper: persist auth info for background task ───

export async function persistBgAuthInfo(deviceId: string, mobile: string) {
    try {
        await Promise.all([
            AsyncStorage.setItem(BG_DEVICE_ID_KEY, deviceId),
            AsyncStorage.setItem(BG_MOBILE_KEY, mobile),
        ]);
    } catch { }
}

// ─── Main hook ───

export function useStepTracker() {
    const [todaySteps, setTodaySteps] = useState(0);
    const [dailyGoal, setDailyGoal] = useState(5000);
    const [isAvailable, setIsAvailable] = useState(false);
    const [loading, setLoading] = useState(true);
    const [notificationEnabled, setNotificationEnabled] = useState(false);
    const subscriptionRef = useRef<{ remove: () => void } | null>(null);
    const baseStepsRef = useRef(0);
    const lastNotifStepsRef = useRef(-1);

    const distance = parseFloat((todaySteps / STEPS_PER_KM).toFixed(2));
    const calories = Math.round(todaySteps * CALORIES_PER_STEP);
    const progress = dailyGoal > 0 ? Math.min(todaySteps / dailyGoal, 1) : 0;

    const saveTodaySteps = useCallback(async (steps: number) => {
        try {
            const data: StepData = { date: getTodayStr(), steps };
            await AsyncStorage.setItem(STEP_DATA_KEY, JSON.stringify(data));
        } catch { }
    }, []);

    // Setup notification channel + permissions + background task on mount
    useEffect(() => {
        (async () => {
            await setupNotificationChannel();
            const granted = await requestNotificationPermissions();
            setNotificationEnabled(granted);
            await registerBackgroundTask();
        })();
    }, []);

    // Load saved data with proper daily reset
    useEffect(() => {
        (async () => {
            try {
                const [savedData, savedGoal] = await Promise.all([
                    AsyncStorage.getItem(STEP_DATA_KEY),
                    AsyncStorage.getItem(STEP_GOAL_KEY),
                ]);
                if (savedGoal) setDailyGoal(parseInt(savedGoal, 10));
                if (savedData) {
                    const parsed: StepData = JSON.parse(savedData);
                    const today = getTodayStr();
                    if (parsed.date === today) {
                        setTodaySteps(parsed.steps);
                        baseStepsRef.current = parsed.steps;
                    } else {
                        // NEW DAY - reset to 0
                        setTodaySteps(0);
                        baseStepsRef.current = 0;
                        await AsyncStorage.setItem(STEP_DATA_KEY, JSON.stringify({ date: today, steps: 0 }));
                    }
                }
            } catch { }
            setLoading(false);
        })();
    }, []);

    // Start pedometer with proper daily reset
    useEffect(() => {
        let sub: { remove: () => void } | null = null;

        (async () => {
            try {
                const Pedometer = await getPedometerModule();
                if (!Pedometer) {
                    setIsAvailable(false);
                    return;
                }
                const available = await Pedometer.isAvailableAsync();
                setIsAvailable(available);
                if (!available) return;

                // Get today's steps from midnight
                const start = new Date();
                start.setHours(0, 0, 0, 0);
                const end = new Date();

                try {
                    const result = await Pedometer.getStepCountAsync(start, end);
                    if (result?.steps) {
                        setTodaySteps(result.steps);
                        baseStepsRef.current = result.steps;
                        saveTodaySteps(result.steps);
                    }
                } catch { }

                // Watch for live updates
                sub = Pedometer.watchStepCount((result: any) => {
                    setTodaySteps(prev => {
                        const newSteps = baseStepsRef.current + result.steps;
                        saveTodaySteps(newSteps);
                        return newSteps;
                    });
                });
                subscriptionRef.current = sub;
            } catch {
                setIsAvailable(false);
            }
        })();

        return () => { sub?.remove(); };
    }, []);

    // Update notification when steps change (throttled - every 50 steps)
    useEffect(() => {
        if (!notificationEnabled || todaySteps === 0) return;
        if (Math.abs(todaySteps - lastNotifStepsRef.current) < 50 && lastNotifStepsRef.current !== -1) return;
        lastNotifStepsRef.current = todaySteps;
        updateStepNotification(todaySteps, dailyGoal, distance, calories);
    }, [todaySteps, dailyGoal, notificationEnabled, distance, calories]);

    // Re-fetch on app foreground + sync on background + handle daily reset
    useEffect(() => {
        const listener = AppState.addEventListener('change', async (state) => {
            if (state === 'active') {
                // ── FOREGROUND: re-fetch accurate steps, restart live subscription ──
                try {
                    // Check if new day - reset if needed
                    const savedData = await AsyncStorage.getItem(STEP_DATA_KEY);
                    if (savedData) {
                        const parsed: StepData = JSON.parse(savedData);
                        if (parsed.date !== getTodayStr()) {
                            setTodaySteps(0);
                            baseStepsRef.current = 0;
                            await AsyncStorage.setItem(STEP_DATA_KEY, JSON.stringify({ date: getTodayStr(), steps: 0 }));
                        }
                    }

                    const Pedometer = await getPedometerModule();
                    if (!Pedometer) return;
                    const start = new Date();
                    start.setHours(0, 0, 0, 0);
                    const end = new Date();
                    const result = await Pedometer.getStepCountAsync(start, end);
                    if (result?.steps) {
                        setTodaySteps(result.steps);
                        baseStepsRef.current = result.steps;
                        saveTodaySteps(result.steps);

                        // Immediate server sync + notification update on foreground
                        const goal = dailyGoal;
                        const dist = parseFloat((result.steps / STEPS_PER_KM).toFixed(2));
                        const cal = Math.round(result.steps * CALORIES_PER_STEP);
                        await syncToServerFromBackground(result.steps, dist, cal, goal);
                        if (notificationEnabled) {
                            await updateStepNotification(result.steps, goal, dist, cal);
                        }
                    }

                    // Re-subscribe to live pedometer updates (previous sub dies in background)
                    if (subscriptionRef.current) {
                        subscriptionRef.current.remove();
                        subscriptionRef.current = null;
                    }
                    const sub = Pedometer.watchStepCount((r: any) => {
                        setTodaySteps(prev => {
                            const newSteps = baseStepsRef.current + r.steps;
                            saveTodaySteps(newSteps);
                            return newSteps;
                        });
                    });
                    subscriptionRef.current = sub;
                } catch { }
            } else if (state === 'background') {
                // ── BACKGROUND: do a final sync + update notification before OS suspends ──
                try {
                    const Pedometer = await getPedometerModule();
                    if (!Pedometer) return;
                    const start = new Date();
                    start.setHours(0, 0, 0, 0);
                    const end = new Date();
                    const result = await Pedometer.getStepCountAsync(start, end);
                    if (result?.steps) {
                        // Persist locally so background task / next foreground has latest
                        const data: StepData = { date: getTodayStr(), steps: result.steps };
                        await AsyncStorage.setItem(STEP_DATA_KEY, JSON.stringify(data));

                        const goal = dailyGoal;
                        const dist = parseFloat((result.steps / STEPS_PER_KM).toFixed(2));
                        const cal = Math.round(result.steps * CALORIES_PER_STEP);

                        // Sync to server before OS suspends
                        await syncToServerFromBackground(result.steps, dist, cal, goal);

                        // Update notification so it stays current while backgrounded
                        await updateStepNotification(result.steps, goal, dist, cal);
                    }
                } catch { }
            }
        });
        return () => listener.remove();
    }, [dailyGoal, notificationEnabled, saveTodaySteps]);

    // saveTodaySteps is defined above (before useEffects that reference it)

    const updateGoal = useCallback(async (goal: number) => {
        setDailyGoal(goal);
        await AsyncStorage.setItem(STEP_GOAL_KEY, goal.toString());
    }, []);

    const restoreFromServer = useCallback((serverData: {
        todaySteps: number;
        dailyGoal: number;
    }) => {
        setTodaySteps(serverData.todaySteps);
        setDailyGoal(serverData.dailyGoal);
        baseStepsRef.current = serverData.todaySteps;
        saveTodaySteps(serverData.todaySteps);
        AsyncStorage.setItem(STEP_GOAL_KEY, serverData.dailyGoal.toString());
    }, [saveTodaySteps]);

    const dismissNotification = useCallback(async () => {
        try {
            const Notifications = await getNotificationsModule();
            if (Notifications) await Notifications.cancelScheduledNotificationAsync(STEP_NOTIFICATION_ID);
        } catch { }
    }, []);

    return {
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
        dismissNotification,
    };
}
