import { useLanguage } from '@/contexts/language-context';
import { useAppTheme } from '@/contexts/theme-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import {
    Modal,
    Pressable,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const TEXT_DARK = '#333333';

interface SettingsSheetProps {
    visible: boolean;
    onClose: () => void;
    vibrationEnabled: boolean;
    onToggleVibration: (value: boolean) => void;
    autoChangeImage: boolean;
    onToggleAutoChange: (value: boolean) => void;
    onResetCurrentMala: () => void;
    onResetAllMalas: () => void;
}

export default function SettingsSheet({
    visible,
    onClose,
    vibrationEnabled,
    onToggleVibration,
    autoChangeImage,
    onToggleAutoChange,
    onResetCurrentMala,
    onResetAllMalas,
}: SettingsSheetProps) {
    const { theme } = useAppTheme();
    const { t } = useLanguage();

    return (
        <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
            <Pressable style={styles.overlay} onPress={onClose} />
            <View style={[styles.sheet, { backgroundColor: theme.headerBg }]}>
                <View style={styles.row}>
                    <View style={styles.rowLeft}>
                        <MaterialCommunityIcons name="vibrate" size={24} color={TEXT_DARK} />
                        <Text style={styles.rowLabel}>{t('settings_vibration')}</Text>
                    </View>
                    <Switch
                        value={vibrationEnabled}
                        onValueChange={onToggleVibration}
                        trackColor={{ false: '#ccc', true: TEXT_DARK }}
                        thumbColor="#FFFFFF"
                    />
                </View>

                <View style={styles.divider} />

                <View style={styles.row}>
                    <View style={styles.rowLeft}>
                        <MaterialCommunityIcons name="image-auto-adjust" size={24} color={TEXT_DARK} />
                        <View style={styles.rowTextGroup}>
                            <Text style={styles.rowLabel}>{t('settings_auto_change_image')}</Text>
                            <Text style={styles.rowSubLabel}>{t('settings_auto_change_image_sub')}</Text>
                        </View>
                    </View>
                    <Switch
                        value={autoChangeImage}
                        onValueChange={onToggleAutoChange}
                        trackColor={{ false: '#ccc', true: TEXT_DARK }}
                        thumbColor="#FFFFFF"
                    />
                </View>

                <View style={styles.divider} />

                <TouchableOpacity style={styles.row} onPress={() => { onResetCurrentMala(); onClose(); }}>
                    <View style={styles.rowLeft}>
                        <Ionicons name="refresh" size={24} color={TEXT_DARK} />
                        <View style={styles.rowTextGroup}>
                            <Text style={styles.rowLabel}>{t('settings_reset_current')}</Text>
                            <Text style={styles.rowSubLabel}>{t('settings_reset_current_sub')}</Text>
                        </View>
                    </View>
                </TouchableOpacity>

                <View style={styles.divider} />

                <TouchableOpacity style={styles.row} onPress={() => { onResetAllMalas(); onClose(); }}>
                    <View style={styles.rowLeft}>
                        <MaterialCommunityIcons name="close-box-outline" size={24} color={TEXT_DARK} />
                        <View style={styles.rowTextGroup}>
                            <Text style={styles.rowLabel}>{t('settings_reset_all')}</Text>
                            <Text style={styles.rowSubLabel}>{t('settings_reset_all_sub')}</Text>
                        </View>
                    </View>
                </TouchableOpacity>
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
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        paddingVertical: 16,
        paddingHorizontal: 20,
        paddingBottom: 30,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
    },
    rowLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    rowLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        color: TEXT_DARK,
        marginLeft: 14,
    },
    rowSubLabel: {
        fontSize: 13,
        color: TEXT_DARK,
        opacity: 0.7,
        marginLeft: 14,
        marginTop: 2,
    },
    rowTextGroup: {
        flexDirection: 'column',
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(0,0,0,0.1)',
    },
});
