import { useLanguage, type Language } from '@/contexts/language-context';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Image,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface LanguagePickerModalProps {
    visible: boolean;
    onDone: () => void;
}

interface LangOption {
    id: Language;
    nameNative: string;
    name: string;
}

const LANG_OPTIONS: LangOption[] = [
    { id: 'hi', nameNative: 'हिन्दी', name: 'Hindi' },
    { id: 'en', nameNative: 'English', name: 'English' },
];

export default function LanguagePickerModal({ visible, onDone }: LanguagePickerModalProps) {
    const { language, setLanguage } = useLanguage();
    const [selected, setSelected] = useState<Language>(language);
    const [saving, setSaving] = useState(false);

    const handleContinue = async () => {
        setSaving(true);
        try {
            await setLanguage(selected);
            onDone();
        } catch {
            onDone();
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal transparent visible={visible} animationType="slide" statusBarTranslucent>
            <Pressable style={styles.overlay} />
            <View style={styles.sheet}>
                <View style={styles.handle} />

                <Image
                    source={require('@/assets/images/shree-ji-logo.png')}
                    style={styles.logo}
                    resizeMode="contain"
                />

                <Text style={styles.title}>
                    {selected === 'hi' ? 'भाषा चुनें' : 'Choose Language'}
                </Text>
                <Text style={styles.subtitle}>
                    {selected === 'hi'
                        ? 'कृपया अपनी पसंदीदा भाषा चुनें'
                        : 'Please select your preferred language'}
                </Text>

                <View style={styles.optionsContainer}>
                    {LANG_OPTIONS.map((item) => {
                        const isSelected = item.id === selected;
                        return (
                            <TouchableOpacity
                                key={item.id}
                                style={[
                                    styles.langCard,
                                    isSelected && styles.langCardSelected,
                                ]}
                                onPress={() => setSelected(item.id)}
                                activeOpacity={0.7}
                            >
                                <View style={styles.langIcon}>
                                    <Text style={styles.langIconText}>
                                        {item.id === 'hi' ? 'अ' : 'A'}
                                    </Text>
                                </View>
                                <View style={styles.langInfo}>
                                    <Text style={styles.langName}>{item.nameNative}</Text>
                                    <Text style={styles.langNameEn}>{item.name}</Text>
                                </View>
                                {isSelected && (
                                    <Ionicons name="checkmark-circle" size={22} color="#FFD700" />
                                )}
                            </TouchableOpacity>
                        );
                    })}
                </View>

                <TouchableOpacity
                    style={styles.continueBtn}
                    onPress={handleContinue}
                    activeOpacity={0.7}
                    disabled={saving}
                >
                    {saving ? (
                        <ActivityIndicator color="#1a1a1a" size="small" />
                    ) : (
                        <Text style={styles.continueBtnText}>
                            {selected === 'hi' ? 'जारी रखें' : 'Continue'}
                        </Text>
                    )}
                </TouchableOpacity>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    sheet: {
        backgroundColor: '#1a1a1a',
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        paddingHorizontal: 6,
        paddingTop: 10,
        paddingBottom: 28,
    },
    handle: {
        width: 40,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#444',
        alignSelf: 'center',
        marginBottom: 6,
    },
    logo: {
        width: 60,
        height: 60,
        alignSelf: 'center',
        marginBottom: 6,
        borderRadius: 30,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFD700',
        textAlign: 'center',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 13,
        color: '#aaa',
        textAlign: 'center',
        marginBottom: 12,
    },
    optionsContainer: {
        paddingHorizontal: 6,
        marginBottom: 12,
        gap: 6,
    },
    langCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#222',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#333',
        padding: 10,
    },
    langCardSelected: {
        borderWidth: 2,
        borderColor: '#FFD700',
    },
    langIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#333',
        alignItems: 'center',
        justifyContent: 'center',
    },
    langIconText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFD700',
    },
    langInfo: {
        flex: 1,
        marginLeft: 10,
    },
    langName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
    langNameEn: {
        fontSize: 12,
        color: '#aaa',
    },
    continueBtn: {
        marginHorizontal: 6,
        backgroundColor: '#FFD700',
        borderRadius: 10,
        paddingVertical: 12,
        alignItems: 'center',
    },
    continueBtnText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1a1a1a',
    },
});
