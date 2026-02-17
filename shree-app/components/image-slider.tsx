import { Image } from 'expo-image';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Dimensions, FlatList, StyleSheet, View } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const SLIDER_HEIGHT = 500;

const localImages = [
    require('@/assets/images/slider-1.png'),
    require('@/assets/images/slider-2.png'),
    require('@/assets/images/slider-3.png'),
    require('@/assets/images/slider-4.png'),
];

const AUTO_SCROLL_INTERVAL = 3000;

interface ImageSliderProps {
    remoteImages?: string[];
}

export default function ImageSlider({ remoteImages }: ImageSliderProps) {
    const flatListRef = useRef<FlatList>(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Use remote images if available, otherwise local
    const useRemote = remoteImages && remoteImages.length > 0;
    const imageCount = useRemote ? remoteImages.length : localImages.length;

    const startAutoScroll = useCallback(() => {
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
            setCurrentIndex((prev) => {
                const next = (prev + 1) % imageCount;
                flatListRef.current?.scrollToIndex({ index: next, animated: true });
                return next;
            });
        }, AUTO_SCROLL_INTERVAL);
    }, [imageCount]);

    useEffect(() => {
        startAutoScroll();
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [startAutoScroll]);

    // Reset index when images change
    useEffect(() => {
        setCurrentIndex(0);
        flatListRef.current?.scrollToIndex({ index: 0, animated: false });
    }, [useRemote, imageCount]);

    const onScrollEnd = useCallback(
        (e: any) => {
            const offsetX = e.nativeEvent.contentOffset.x;
            const index = Math.round(offsetX / SCREEN_WIDTH);
            setCurrentIndex(index);
            startAutoScroll();
        },
        [startAutoScroll],
    );

    const data = useRemote
        ? remoteImages.map((url, i) => ({ key: String(i), uri: url }))
        : localImages.map((src, i) => ({ key: String(i), local: src }));

    return (
        <View style={styles.container}>
            <FlatList
                ref={flatListRef}
                data={data}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={onScrollEnd}
                keyExtractor={(item) => item.key}
                getItemLayout={(_, index) => ({
                    length: SCREEN_WIDTH,
                    offset: SCREEN_WIDTH * index,
                    index,
                })}
                renderItem={({ item }) => (
                    <Image
                        source={'uri' in item ? { uri: item.uri } : item.local}
                        style={styles.image}
                        contentFit="cover"
                    />
                )}
            />
            {/* Dots */}
            <View style={styles.dotsRow}>
                {data.map((_, i) => (
                    <View
                        key={i}
                        style={[styles.dot, i === currentIndex && styles.dotActive]}
                    />
                ))}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: SCREEN_WIDTH,
        height: SLIDER_HEIGHT,
    },
    image: {
        width: SCREEN_WIDTH,
        height: SLIDER_HEIGHT,
    },
    dotsRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'absolute',
        bottom: 8,
        left: 0,
        right: 0,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: 'rgba(255,255,255,0.5)',
        marginHorizontal: 3,
    },
    dotActive: {
        backgroundColor: '#FFFFFF',
        width: 10,
        height: 10,
        borderRadius: 5,
    },
});