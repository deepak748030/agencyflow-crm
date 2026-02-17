import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configure notification behavior
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

const DAILY_REMINDER_ID = 'naam-jap-daily-reminder';

export interface PushNotificationState {
    expoPushToken: string | null;
    notification: Notifications.Notification | null;
    error: string | null;
}

/** Request notification permission early (call at app start) */
export async function requestNotificationPermission(): Promise<boolean> {
    try {
        if (Platform.OS === 'web') return false;
        if (!Device.isDevice) return false;

        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        if (existingStatus === 'granted') return true;

        const { status } = await Notifications.requestPermissionsAsync();
        return status === 'granted';
    } catch {
        return false;
    }
}

/** Get Expo push token — requests permission if not granted */
export async function getExpoPushToken(): Promise<string | null> {
    try {
        if (Platform.OS === 'web') return null;
        if (!Device.isDevice) return null;

        // Setup Android channels
        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('default', {
                name: 'Default',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#FFD700',
            });
            await Notifications.setNotificationChannelAsync('daily-reminder', {
                name: 'Daily Naam Jap Reminder',
                importance: Notifications.AndroidImportance.HIGH,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#FFD700',
                sound: 'default',
            });
        }

        // Check and request permission
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') return null;

        // Get project ID
        const projectId =
            Constants.expoConfig?.extra?.eas?.projectId ??
            (Constants as any).easConfig?.projectId ??
            '9c4fa1b8-042b-43f9-8ce7-25289f027c6e';

        const pushTokenData = await Notifications.getExpoPushTokenAsync({ projectId });
        return pushTokenData.data;
    } catch {
        return null;
    }
}

export function useNotifications() {
    const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
    const [notification, setNotification] = useState<Notifications.Notification | null>(null);
    const [error, setError] = useState<string | null>(null);
    const notificationListener = useRef<Notifications.EventSubscription | null>(null);
    const responseListener = useRef<Notifications.EventSubscription | null>(null);

    async function updatePushTokenOnServer(token: string) {
        try {
            await AsyncStorage.setItem('@naam_jap_push_token', token);

            const deviceId = await AsyncStorage.getItem('@naam_jap_device_id');
            if (!deviceId) return;

            const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://shree-jii-server.vercel.app/api';
            await fetch(`${API_BASE_URL}/naam-jap/update-push-token`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ deviceId, pushToken: token }),
            });
        } catch {
            // Silent fail
        }
    }

    useEffect(() => {
        // Request permission at app start
        requestNotificationPermission();

        // Also try to get token at app start
        getExpoPushToken().then((token) => {
            if (token) {
                setExpoPushToken(token);
            }
        });

        // Schedule daily reminders
        scheduleDailyReminder();

        notificationListener.current = Notifications.addNotificationReceivedListener((notif) => {
            setNotification(notif);
        });

        responseListener.current = Notifications.addNotificationResponseReceivedListener(() => { });

        return () => {
            if (notificationListener.current) notificationListener.current.remove();
            if (responseListener.current) responseListener.current.remove();
        };
    }, []);

    return { expoPushToken, notification, error, getExpoPushToken, updatePushTokenOnServer, scheduleDailyReminder, cancelDailyReminder };
}

async function scheduleDailyReminder() {
    try {
        if (Platform.OS === 'web') return;
        await cancelDailyReminder();

        await Notifications.scheduleNotificationAsync({
            content: {
                title: 'श्री जी 🙏',
                body: 'जय श्री राधे! आज का नाम जप करना न भूलें। राधा नाम की शक्ति से दिन मंगलमय हो।',
                sound: 'default',
                data: { screen: 'naam-jap-counter' },
            },
            trigger: {
                type: Notifications.SchedulableTriggerInputTypes.DAILY,
                hour: 7,
                minute: 0,
            },
            identifier: DAILY_REMINDER_ID,
        });

        await Notifications.scheduleNotificationAsync({
            content: {
                title: 'श्री जी 🙏',
                body: 'राधा नाम जपें और अपनी माला पूरी करें। जय श्री राधे!',
                sound: 'default',
                data: { screen: 'naam-jap-counter' },
            },
            trigger: {
                type: Notifications.SchedulableTriggerInputTypes.DAILY,
                hour: 19,
                minute: 0,
            },
            identifier: `${DAILY_REMINDER_ID}-evening`,
        });
    } catch {
        // Silent fail
    }
}

async function cancelDailyReminder() {
    try {
        await Notifications.cancelScheduledNotificationAsync(DAILY_REMINDER_ID);
        await Notifications.cancelScheduledNotificationAsync(`${DAILY_REMINDER_ID}-evening`);
    } catch {
        // Ignore
    }
}

export async function sendLocalNotification(
    title: string,
    body: string,
    data?: Record<string, unknown>
) {
    await Notifications.scheduleNotificationAsync({
        content: { title, body, data: data || {} },
        trigger: null,
    });
}