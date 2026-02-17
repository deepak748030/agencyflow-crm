import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

const DEVICE_ID_KEY = '@naam_jap_device_id';

function generateId(): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let id = '';
    for (let i = 0; i < 24; i++) {
        id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `device_${Date.now()}_${id}`;
}

export function useDeviceId() {
    const [deviceId, setDeviceId] = useState<string | null>(null);

    useEffect(() => {
        AsyncStorage.getItem(DEVICE_ID_KEY).then((stored) => {
            if (stored) {
                setDeviceId(stored);
            } else {
                const newId = generateId();
                AsyncStorage.setItem(DEVICE_ID_KEY, newId);
                setDeviceId(newId);
            }
        });
    }, []);

    return deviceId;
}
