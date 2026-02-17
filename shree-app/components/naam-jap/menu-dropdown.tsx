import { useLanguage } from '@/contexts/language-context';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import {
    Modal,
    Pressable,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const TEXT_DARK = '#333333';

interface MenuDropdownProps {
    visible: boolean;
    onClose: () => void;
    onPickImage: () => void;
    onAnalytics: () => void;
    onSettings: () => void;
    anchorY: number;
}

export default function MenuDropdown({
    visible,
    onClose,
    onPickImage,
    onAnalytics,
    onSettings,
    anchorY,
}: MenuDropdownProps) {
    const { t } = useLanguage();

    if (!visible) return null;

    return (
        <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
            <Pressable style={styles.backdrop} onPress={onClose}>
                <View style={[styles.menu, { top: anchorY }]}>
                    <TouchableOpacity style={styles.menuItem} onPress={() => { onClose(); onPickImage(); }}>
                        <Ionicons name="image-outline" size={22} color={TEXT_DARK} />
                        <Text style={styles.menuText}>{t('menu_pick_image')}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.menuItem} onPress={() => { onClose(); onAnalytics(); }}>
                        <MaterialIcons name="bar-chart" size={22} color={TEXT_DARK} />
                        <Text style={styles.menuText}>{t('menu_analytics')}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.menuItem} onPress={() => { onClose(); onSettings(); }}>
                        <Ionicons name="settings-outline" size={22} color={TEXT_DARK} />
                        <Text style={styles.menuText}>{t('menu_settings')}</Text>
                    </TouchableOpacity>
                </View>
            </Pressable>
        </Modal>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
    },
    menu: {
        position: 'absolute',
        right: 10,
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        paddingVertical: 4,
        minWidth: 180,
        borderWidth: 1.5,
        borderColor: '#333333',
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.1)',
    },
    menuText: {
        fontSize: 15,
        fontWeight: '400',
        color: TEXT_DARK,
        marginLeft: 14,
    },
});
