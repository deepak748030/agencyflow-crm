import { useCallback, useRef, useState } from 'react';

const TEXT_DARK = '#333333';

// Get today's date string in Indian timezone (IST, UTC+5:30)
function getTodayString(): string {
    const now = new Date();
    // Manual IST offset: UTC + 5 hours 30 minutes
    const istMs = now.getTime() + (5.5 * 60 * 60 * 1000);
    const istDate = new Date(istMs);
    return `${istDate.getUTCFullYear()}-${String(istDate.getUTCMonth() + 1).padStart(2, '0')}-${String(istDate.getUTCDate()).padStart(2, '0')}`;
}

export function usePersistedCounter() {
    const [count, setCount] = useState(0);
    const [malaCount, setMalaCount] = useState(0);
    const [vibrationEnabled, setVibrationEnabled] = useState(true);
    const [displayMode, setDisplayMode] = useState<'text' | 'image'>('image');
    const [selectedImage, setSelectedImage] = useState<any>(null);
    const [selectedTextStyle, setSelectedTextStyle] = useState<{ color: string }>({ color: TEXT_DARK });
    const [todayCount, setTodayCount] = useState(0);
    const [todayMalas, setTodayMalas] = useState(0);
    const [autoChangeImage, setAutoChangeImage] = useState(true);
    const [isLoaded, setIsLoaded] = useState(false);
    const lastDateRef = useRef<string>(getTodayString());

    // Check if day changed and reset daily counters if needed
    const checkAndResetDaily = useCallback(() => {
        const today = getTodayString();
        if (lastDateRef.current !== today) {
            lastDateRef.current = today;
            setTodayCount(0);
            setTodayMalas(0);
        }
    }, []);

    // Mark as loaded (call after server data is fetched)
    const markLoaded = useCallback(() => {
        setIsLoaded(true);
    }, []);

    // Update count
    const updateCount = useCallback((updater: (prev: number) => number) => {
        setCount((prev) => updater(prev));
    }, []);

    // Update mala count
    const updateMalaCount = useCallback((updater: (prev: number) => number) => {
        setMalaCount((prev) => updater(prev));
    }, []);

    // Update today count
    const updateTodayCount = useCallback((updater: (prev: number) => number) => {
        setTodayCount((prev) => updater(prev));
    }, []);

    // Update today malas
    const updateTodayMalas = useCallback((updater: (prev: number) => number) => {
        setTodayMalas((prev) => updater(prev));
    }, []);

    // Update vibration
    const updateVibration = useCallback((value: boolean) => {
        setVibrationEnabled(value);
    }, []);

    // Update auto change image
    const updateAutoChangeImage = useCallback((value: boolean) => {
        setAutoChangeImage(value);
    }, []);

    // Update display mode
    const updateDisplayMode = useCallback((mode: 'text' | 'image') => {
        setDisplayMode(mode);
    }, []);

    // Update selected image
    const updateSelectedImage = useCallback((img: any) => {
        setSelectedImage(img);
    }, []);

    // Update text style
    const updateSelectedTextStyle = useCallback((style: { color: string }) => {
        setSelectedTextStyle(style);
    }, []);

    // Reset current mala
    const resetCurrentMala = useCallback(() => {
        setCount((prev) => {
            const remainder = prev % 108;
            const newVal = prev - remainder;
            setTodayCount((tc) => Math.max(0, tc - remainder));
            return newVal;
        });
    }, []);

    // Reset all malas
    const resetAllMalas = useCallback(() => {
        setCount(0);
        setMalaCount(0);
        setTodayCount(0);
        setTodayMalas(0);
    }, []);

    // Restore counts from server data
    const restoreFromServer = useCallback((totalCount: number, totalMalas: number, dailyCount: number, dailyMalas: number) => {
        setCount(totalCount);
        setMalaCount(totalMalas);
        setTodayCount(dailyCount);
        setTodayMalas(dailyMalas);
        lastDateRef.current = getTodayString();
    }, []);

    return {
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
        checkAndResetDaily,
        markLoaded,
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
    };
}
