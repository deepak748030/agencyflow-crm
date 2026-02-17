import { useLanguage } from '@/contexts/language-context';
import { fetchPresetImages, PresetImageData } from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TEXT_DARK = '#333333';
const YELLOW_BG = '#FFEB3B';
const IMAGE_SIZE = (SCREEN_WIDTH - 60) / 3;
const STORAGE_KEY = '@naam_jap_user_images';

const textStyles = [
    { label: 'राधा', color: TEXT_DARK, bg: '#FFFFFF', borderColor: '#ccc' },
    { label: 'राधा', color: YELLOW_BG, bg: '#FFFFFF', borderColor: '#ccc' },
    { label: 'राधा', color: '#E53935', bg: '#FFFFFF', borderColor: '#ccc' },
];

interface PickImageSheetProps {
    visible: boolean;
    onClose: () => void;
    onSelectTextStyle: (index: number) => void;
    onSelectImage: (imageSource: any) => void;
}

export default function PickImageSheet({
    visible,
    onClose,
    onSelectTextStyle,
    onSelectImage,
}: PickImageSheetProps) {
    const { t } = useLanguage();
    const [userImages, setUserImages] = useState<string[]>([]);
    const [presetImages, setPresetImages] = useState<PresetImageData[]>([]);
    const [loadingPresets, setLoadingPresets] = useState(false);

    // Load user images + preset images from server
    useEffect(() => {
        if (!visible) return;
        AsyncStorage.getItem(STORAGE_KEY).then((val) => {
            if (val) {
                try { setUserImages(JSON.parse(val)); } catch { setUserImages([]); }
            }
        });
        setLoadingPresets(true);
        fetchPresetImages().then((imgs) => {
            setPresetImages(imgs);
        }).finally(() => setLoadingPresets(false));
    }, [visible]);

    const saveImages = useCallback(async (images: string[]) => {
        setUserImages(images);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(images));
    }, []);

    const handleUpload = useCallback(async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert(t('error'), 'Gallery permission is required to upload images.');
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            quality: 0.7,
            base64: false,
            allowsEditing: false,
        });
        if (!result.canceled && result.assets?.[0]?.uri) {
            const uri = result.assets[0].uri;
            const updated = [uri, ...userImages];
            await saveImages(updated);
        }
    }, [userImages, saveImages, t]);

    const handleDeleteImage = useCallback((index: number) => {
        const updated = userImages.filter((_, i) => i !== index);
        saveImages(updated);
    }, [userImages, saveImages]);

    const handleSelectUserImage = useCallback((uri: string) => {
        onSelectImage({ uri });
    }, [onSelectImage]);

    return (
        <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
            <Pressable style={styles.overlay} onPress={onClose} />
            <View style={styles.sheet}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>{t('pick_image_header')}</Text>
                    <TouchableOpacity onPress={onClose}>
                        <Ionicons name="close" size={24} color={TEXT_DARK} />
                    </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.uploadRow} onPress={handleUpload}>
                    <Ionicons name="cloud-upload-outline" size={24} color={TEXT_DARK} />
                    <Text style={styles.uploadText}>{t('pick_image_upload')}</Text>
                </TouchableOpacity>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                    {/* Text styles */}
                    <View style={styles.textStyleRow}>
                        {textStyles.map((item, index) => (
                            <TouchableOpacity
                                key={index}
                                style={[styles.textStyleCard, { borderColor: item.borderColor }]}
                                onPress={() => onSelectTextStyle(index)}
                            >
                                <Text style={[styles.textStyleLabel, { color: item.color }]}>{item.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* User uploaded images */}
                    {userImages.length > 0 && (
                        <>
                            <Text style={styles.sectionTitle}>{t('pick_image_my_uploads')}</Text>
                            <View style={styles.imageGrid}>
                                {userImages.map((uri, index) => (
                                    <View key={`user-${index}`} style={styles.imageCard}>
                                        <TouchableOpacity
                                            style={styles.imageCardInner}
                                            onPress={() => handleSelectUserImage(uri)}
                                            activeOpacity={0.8}
                                        >
                                            <Image source={{ uri }} style={styles.gridImage} contentFit="cover" />
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={styles.deleteBtn}
                                            onPress={() => handleDeleteImage(index)}
                                        >
                                            <Ionicons name="trash-outline" size={14} color="#FFF" />
                                        </TouchableOpacity>
                                    </View>
                                ))}
                            </View>
                        </>
                    )}

                    {/* Preset images from server */}
                    <Text style={styles.sectionTitle}>{t('pick_image_presets')}</Text>
                    {loadingPresets ? (
                        <ActivityIndicator size="small" color={TEXT_DARK} style={{ marginVertical: 20 }} />
                    ) : presetImages.length === 0 ? (
                        <Text style={styles.emptyText}>{t('pick_image_no_uploads')}</Text>
                    ) : (
                        <View style={styles.imageGrid}>
                            {presetImages.map((img) => (
                                <TouchableOpacity
                                    key={img._id}
                                    style={styles.imageCard}
                                    onPress={() => onSelectImage({ uri: img.imageUrl })}
                                >
                                    <Image source={{ uri: img.imageUrl }} style={styles.gridImage} contentFit="cover" />
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                </ScrollView>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 0.25,
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    sheet: {
        flex: 0.75,
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        paddingHorizontal: 6,
        paddingTop: 16,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
        paddingHorizontal: 14,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: TEXT_DARK,
    },
    uploadRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 14,
        marginBottom: 8,
        backgroundColor: '#F5F5F5',
        borderRadius: 10,
        marginHorizontal: 14,
    },
    uploadText: {
        fontSize: 15,
        fontWeight: '600',
        color: TEXT_DARK,
        marginLeft: 12,
    },
    scrollContent: {
        paddingBottom: 40,
        paddingHorizontal: 14,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: TEXT_DARK,
        opacity: 0.6,
        marginBottom: 10,
        marginTop: 8,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    emptyText: {
        fontSize: 14,
        color: TEXT_DARK,
        opacity: 0.5,
        textAlign: 'center',
        marginVertical: 20,
    },
    textStyleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    textStyleCard: {
        width: IMAGE_SIZE,
        height: IMAGE_SIZE * 0.6,
        borderRadius: 8,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFFFFF',
    },
    textStyleLabel: {
        fontSize: 32,
        fontWeight: 'bold',
    },
    imageGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'flex-start',
        gap: 8,
    },
    imageCard: {
        width: IMAGE_SIZE,
        height: IMAGE_SIZE,
        borderRadius: 8,
        overflow: 'hidden',
    },
    imageCardInner: {
        width: '100%',
        height: '100%',
    },
    gridImage: {
        width: '100%',
        height: '100%',
    },
    deleteBtn: {
        position: 'absolute',
        top: 4,
        right: 4,
        backgroundColor: 'rgba(229,57,53,0.85)',
        borderRadius: 12,
        width: 24,
        height: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
