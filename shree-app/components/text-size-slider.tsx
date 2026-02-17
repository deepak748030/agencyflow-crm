import React, { useCallback, useRef } from 'react';
import { GestureResponderEvent, LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';

const SLIDER_WIDTH = 160;
const THUMB_SIZE = 22;
const TRACK_HEIGHT = 4;
const MIN_FONT = 12;
const MAX_FONT = 24;

const YELLOW_DARK = '#F9A825';
const TEXT_BROWN = '#5D4037';

interface TextSizeSliderProps {
    value: number;
    onValueChange: (val: number) => void;
    onSlidingStart?: () => void;
    onSlidingEnd?: () => void;
}

export default function TextSizeSlider({
    value,
    onValueChange,
    onSlidingStart,
    onSlidingEnd,
}: TextSizeSliderProps) {
    const trackPageX = useRef(0);

    const fraction = (value - MIN_FONT) / (MAX_FONT - MIN_FONT);
    const thumbLeft = fraction * (SLIDER_WIDTH - THUMB_SIZE);

    const onTrackLayout = useCallback((e: LayoutChangeEvent) => {
        // We'll measure on touch start instead for accuracy
    }, []);

    const computeValue = (pageX: number) => {
        const localX = pageX - trackPageX.current;
        const clamped = Math.max(0, Math.min(localX, SLIDER_WIDTH));
        const newFraction = clamped / SLIDER_WIDTH;
        return Math.round(MIN_FONT + newFraction * (MAX_FONT - MIN_FONT));
    };

    const trackRef = useRef<View>(null);

    const handleStartShouldSetResponder = () => true;
    const handleMoveShouldSetResponder = () => true;

    const handleResponderGrant = (e: GestureResponderEvent) => {
        // Measure track position on screen at touch start
        trackRef.current?.measureInWindow((x) => {
            trackPageX.current = x;
            onValueChange(computeValue(e.nativeEvent.pageX));
        });
        onSlidingStart?.();
    };

    const handleResponderMove = (e: GestureResponderEvent) => {
        onValueChange(computeValue(e.nativeEvent.pageX));
    };

    const handleResponderRelease = () => {
        onSlidingEnd?.();
    };

    const handleResponderTerminate = () => {
        onSlidingEnd?.();
    };

    return (
        <View style={styles.container}>
            <Text style={styles.labelSmall}>A</Text>
            <View
                ref={trackRef}
                style={styles.sliderWrap}
                onStartShouldSetResponder={handleStartShouldSetResponder}
                onMoveShouldSetResponder={handleMoveShouldSetResponder}
                onResponderTerminationRequest={() => false}
                onResponderGrant={handleResponderGrant}
                onResponderMove={handleResponderMove}
                onResponderRelease={handleResponderRelease}
                onResponderTerminate={handleResponderTerminate}
            >
                <View style={styles.track}>
                    <View style={[styles.trackFilled, { width: thumbLeft + THUMB_SIZE / 2 }]} />
                </View>
                <View style={[styles.thumb, { left: thumbLeft }]} />
            </View>
            <Text style={styles.labelLarge}>A</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    labelSmall: {
        fontSize: 12,
        color: TEXT_BROWN,
        fontWeight: '600',
    },
    labelLarge: {
        fontSize: 20,
        color: TEXT_BROWN,
        fontWeight: '600',
    },
    sliderWrap: {
        width: SLIDER_WIDTH,
        height: THUMB_SIZE + 16,
        justifyContent: 'center',
    },
    track: {
        width: SLIDER_WIDTH,
        height: TRACK_HEIGHT,
        borderRadius: 2,
        backgroundColor: '#E0E0E0',
    },
    trackFilled: {
        height: TRACK_HEIGHT,
        borderRadius: 2,
        backgroundColor: YELLOW_DARK,
    },
    thumb: {
        position: 'absolute',
        width: THUMB_SIZE,
        height: THUMB_SIZE,
        borderRadius: THUMB_SIZE / 2,
        backgroundColor: YELLOW_DARK,
        borderWidth: 2,
        borderColor: '#FFFFFF',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
    },
});
