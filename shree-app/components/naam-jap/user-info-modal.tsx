import { useLanguage } from '@/contexts/language-context';
import { useAppTheme } from '@/contexts/theme-context';
import { getExpoPushToken } from '@/hooks/use-notifications';
import { registerNaamJapUser } from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

import BottomSheetMessage from '@/components/ui/bottom-sheet-message';

const TEXT_DARK = '#333333';
const USER_NAAM_JAP_KEY = '@naam_jap_user_info';

interface UserInfoModalProps {
    visible: boolean;
    onClose: () => void;
    onSave: (name: string, city: string) => void;
    deviceId: string | null;
}

export default function UserInfoModal({ visible, onClose, onSave, deviceId }: UserInfoModalProps) {
    const { theme } = useAppTheme();
    const { t } = useLanguage();
    const [name, setName] = useState('');
    const [city, setCity] = useState('');
    const [saving, setSaving] = useState(false);

    const [sheetVisible, setSheetVisible] = useState(false);
    const [sheetConfig, setSheetConfig] = useState({
        type: 'warning' as 'error' | 'warning' | 'success' | 'info',
        title: '',
        message: '',
    });

    useEffect(() => {
        if (visible) {
            AsyncStorage.getItem(USER_NAAM_JAP_KEY).then((val) => {
                if (val) {
                    try {
                        const parsed = JSON.parse(val);
                        setName(parsed.name || '');
                        setCity(parsed.city || '');
                    } catch { }
                }
            });
        }
    }, [visible]);

    const handleSave = async () => {
        if (!name.trim()) {
            setSheetConfig({
                type: 'warning',
                title: t('naam_jap_info_required'),
                message: t('naam_jap_name_required'),
            });
            setSheetVisible(true);
            return;
        }
        if (!city.trim()) {
            setSheetConfig({
                type: 'warning',
                title: t('naam_jap_info_required'),
                message: t('naam_jap_city_required'),
            });
            setSheetVisible(true);
            return;
        }

        setSaving(true);
        try {
            // Save locally
            await AsyncStorage.setItem(
                USER_NAAM_JAP_KEY,
                JSON.stringify({ name: name.trim(), city: city.trim() })
            );

            // Register with server (include push token from stored or fresh)
            if (deviceId) {
                // Try cached token first
                let pushToken = await AsyncStorage.getItem('@naam_jap_push_token');

                // If no cached token, try getting fresh one with retry
                if (!pushToken) {
                    pushToken = await getExpoPushToken();
                }

                // Retry after short delay if still null
                if (!pushToken) {
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    pushToken = await getExpoPushToken();
                }

                if (pushToken) {
                    await AsyncStorage.setItem('@naam_jap_push_token', pushToken);
                }

                await registerNaamJapUser(deviceId, name.trim(), city.trim(), pushToken || undefined);
            }

            onSave(name.trim(), city.trim());
        } catch {
            setSheetConfig({
                type: 'error',
                title: t('error'),
                message: t('naam_jap_save_error'),
            });
            setSheetVisible(true);
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
            <KeyboardAvoidingView
                style={styles.flex}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <Pressable style={styles.overlay} onPress={onClose} />
                <View style={[styles.sheet, { borderTopColor: theme.cardBorder }]}>
                    <View style={styles.handle} />

                    <View style={styles.iconRow}>
                        <Ionicons name="trophy-outline" size={28} color={theme.accent} />
                        <Text style={[styles.title, { color: theme.accent }]}>{t('naam_jap_info_title')}</Text>
                    </View>

                    <Text style={styles.subtitle}>{t('naam_jap_info_subtitle')}</Text>

                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>{t('naam_jap_name_label')}</Text>
                        <View style={[styles.inputWrapper, { borderColor: theme.cardBorder }]}>
                            <Ionicons name="person-outline" size={16} color={theme.accent} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder={t('naam_jap_name_placeholder')}
                                placeholderTextColor="#999"
                                value={name}
                                onChangeText={setName}
                                autoCapitalize="words"
                                returnKeyType="next"
                            />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>{t('naam_jap_city_label')}</Text>
                        <View style={[styles.inputWrapper, { borderColor: theme.cardBorder }]}>
                            <Ionicons name="location-outline" size={16} color={theme.accent} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder={t('naam_jap_city_placeholder')}
                                placeholderTextColor="#999"
                                value={city}
                                onChangeText={setCity}
                                autoCapitalize="words"
                                returnKeyType="done"
                            />
                        </View>
                    </View>

                    <View style={styles.buttonRow}>
                        <TouchableOpacity
                            style={[styles.button, styles.cancelButton]}
                            onPress={onClose}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.cancelButtonText}>{t('cancel')}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.button, styles.saveButton, { backgroundColor: theme.accent }]}
                            onPress={handleSave}
                            activeOpacity={0.7}
                            disabled={saving}
                        >
                            {saving ? (
                                <ActivityIndicator color="#FFFFFF" size="small" />
                            ) : (
                                <Text style={styles.saveButtonText}>{t('naam_jap_save')}</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>

            <BottomSheetMessage
                visible={sheetVisible}
                onClose={() => setSheetVisible(false)}
                type={sheetConfig.type}
                title={sheetConfig.title}
                message={sheetConfig.message}
            />
        </Modal>
    );
}

const styles = StyleSheet.create({
    flex: {
        flex: 1,
    },
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    sheet: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        borderTopWidth: 2,
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
        marginBottom: 6,
    },
    iconRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        marginBottom: 4,
    },
    title: {
        fontSize: 17,
        fontWeight: 'bold',
        marginLeft: 8,
        flex: 1,
    },
    subtitle: {
        fontSize: 13,
        color: TEXT_DARK,
        opacity: 0.7,
        paddingHorizontal: 10,
        marginBottom: 6,
        lineHeight: 18,
    },
    inputGroup: {
        marginBottom: 6,
        paddingHorizontal: 10,
    },
    inputLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: TEXT_DARK,
        marginBottom: 4,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        borderWidth: 1,
        paddingHorizontal: 10,
    },
    inputIcon: {
        marginRight: 8,
    },
    input: {
        flex: 1,
        fontSize: 14,
        color: TEXT_DARK,
        paddingVertical: 14,
    },
    buttonRow: {
        flexDirection: 'row',
        paddingHorizontal: 10,
        gap: 8,
        marginTop: 6,
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
    saveButton: {},
    saveButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#FFFFFF',
    },
});