import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    ActivityIndicator,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const YELLOW_BG = '#FFEB3B';
const TEXT_DARK = '#333333';

type MessageType = 'error' | 'warning' | 'success' | 'info' | 'confirm';

interface BottomSheetMessageProps {
    visible: boolean;
    onClose: () => void;
    type?: MessageType;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm?: () => void;
    loading?: boolean;
}

const iconMap: Record<MessageType, { name: keyof typeof Ionicons.glyphMap; color: string }> = {
    error: { name: 'alert-circle', color: '#D32F2F' },
    warning: { name: 'warning', color: '#F57C00' },
    success: { name: 'checkmark-circle', color: '#388E3C' },
    info: { name: 'information-circle', color: '#1976D2' },
    confirm: { name: 'help-circle', color: '#F57C00' },
};

export default function BottomSheetMessage({
    visible,
    onClose,
    type = 'info',
    title,
    message,
    confirmLabel = 'ठीक है',
    cancelLabel = 'रद्द करें',
    onConfirm,
    loading = false,
}: BottomSheetMessageProps) {
    const icon = iconMap[type];

    return (
        <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
            <Pressable style={styles.overlay} onPress={onClose} />
            <View style={styles.sheet}>
                <View style={styles.handle} />
                <View style={styles.iconRow}>
                    <Ionicons name={icon.name} size={32} color={icon.color} />
                    <Text style={styles.title}>{title}</Text>
                </View>
                <Text style={styles.message}>{message}</Text>
                <View style={styles.buttonRow}>
                    {type === 'confirm' && (
                        <TouchableOpacity
                            style={[styles.button, styles.cancelButton]}
                            onPress={onClose}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.cancelButtonText}>{cancelLabel}</Text>
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity
                        style={[styles.button, styles.confirmButton, { backgroundColor: icon.color }]}
                        onPress={onConfirm || onClose}
                        activeOpacity={0.7}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#FFFFFF" size="small" />
                        ) : (
                            <Text style={styles.confirmButtonText}>{confirmLabel}</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    sheet: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        paddingHorizontal: 6,
        paddingTop: 10,
        paddingBottom: 24,
    },
    handle: {
        width: 40,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#DDD',
        alignSelf: 'center',
        marginBottom: 12,
    },
    iconRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
        paddingHorizontal: 10,
    },
    title: {
        fontSize: 17,
        fontWeight: 'bold',
        color: TEXT_DARK,
        marginLeft: 10,
        flex: 1,
    },
    message: {
        fontSize: 14,
        color: TEXT_DARK,
        opacity: 0.8,
        lineHeight: 20,
        paddingHorizontal: 10,
        marginBottom: 16,
    },
    buttonRow: {
        flexDirection: 'row',
        paddingHorizontal: 10,
        gap: 8,
    },
    button: {
        flex: 1,
        borderRadius: 8,
        paddingVertical: 10,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: '#F5F5F5',
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    cancelButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: TEXT_DARK,
    },
    confirmButton: {
        backgroundColor: TEXT_DARK,
    },
    confirmButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#FFFFFF',
    },
});
