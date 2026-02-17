import { useAuth } from '@/contexts/auth-context';
import { useLanguage } from '@/contexts/language-context';
import { authByMobile, registerNaamJapUser } from '@/services/api';
import { useDeviceId } from '@/hooks/use-device-id';
import { getExpoPushToken } from '@/hooks/use-notifications';
import { Alert } from 'react-native';
import BottomSheetMessage from '@/components/ui/bottom-sheet-message';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

interface MobileAuthScreenProps {
    onDone: () => void;
}

type Step = 'mobile' | 'register';

export default function MobileAuthScreen({ onDone }: MobileAuthScreenProps) {
    const { setAuthUser } = useAuth();
    const { language } = useLanguage();
    const deviceId = useDeviceId();
    const isHi = language === 'hi';

    const [step, setStep] = useState<Step>('mobile');
    const [mobile, setMobile] = useState('');
    const [name, setName] = useState('');
    const [city, setCity] = useState('');
    const [loading, setLoading] = useState(false);
    const [pushToken, setPushToken] = useState<string | null>(null);

    // Bottom sheet state
    const [sheetVisible, setSheetVisible] = useState(false);
    const [sheetTitle, setSheetTitle] = useState('');
    const [sheetMessage, setSheetMessage] = useState('');
    const [sheetType, setSheetType] = useState<'error' | 'info'>('error');

    const showError = (title: string, message: string) => {
        setSheetTitle(title);
        setSheetMessage(message);
        setSheetType('error');
        setSheetVisible(true);
    };

    const showInfo = (title: string, message: string) => {
        setSheetTitle(title);
        setSheetMessage(message);
        setSheetType('info');
        setSheetVisible(true);
    };

    /** Get push token — works in both dev (Expo Go) and production (EAS build) */
    const obtainPushToken = async (): Promise<string | null> => {
        try {
            const token = await getExpoPushToken();
            if (token) {
                setPushToken(token);
            }
            return token;
        } catch {
            return null;
        }
    };

    const handleMobileSubmit = async () => {
        const cleaned = mobile.trim().replace(/[^0-9]/g, '');
        if (cleaned.length < 10) {
            showError(
                isHi ? 'गलत नंबर' : 'Invalid Number',
                isHi ? 'कृपया सही मोबाइल नंबर दर्ज करें (कम से कम 10 अंक)' : 'Please enter a valid mobile number (at least 10 digits)'
            );
            return;
        }
        if (!deviceId) return;

        setLoading(true);
        try {
            // Get push token before auth
            const token = await obtainPushToken();

            const result = await authByMobile(cleaned, deviceId, token);
            if (!result.success) {
                showError(
                    isHi ? 'त्रुटि' : 'Error',
                    result.message || (isHi ? 'कुछ गलत हो गया' : 'Something went wrong')
                );
                return;
            }

            if (result.isNewUser) {
                // Show push token warning for new users before registration
                if (!token) {
                    showInfo(
                        isHi ? 'सूचना अनुमति' : 'Notification Permission',
                        isHi
                            ? 'पुश नोटिफिकेशन टोकन प्राप्त नहीं हो सका। आपको दैनिक अनुस्मारक नहीं मिलेंगे। कृपया ऐप सेटिंग्स में नोटिफिकेशन अनुमति दें।'
                            : 'Could not get push notification token. You will not receive daily reminders. Please enable notification permission in app settings.'
                    );
                }
                setStep('register');
            } else if (result.response) {
                // Existing user login — show warning if no token
                if (!token) {
                    showInfo(
                        isHi ? 'सूचना अनुमति' : 'Notification Permission',
                        isHi
                            ? 'पुश नोटिफिकेशन टोकन प्राप्त नहीं हो सका। आपको दैनिक अनुस्मारक नहीं मिलेंगे।'
                            : 'Could not get push notification token. You will not receive daily reminders.'
                    );
                }
                await setAuthUser(result.response, cleaned);
                onDone();
            }
        } catch {
            showError(
                isHi ? 'नेटवर्क त्रुटि' : 'Network Error',
                isHi ? 'कृपया अपना इंटरनेट कनेक्शन जांचें' : 'Please check your internet connection'
            );
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async () => {
        const trimmedName = name.trim();
        const trimmedCity = city.trim();
        const cleaned = mobile.trim().replace(/[^0-9]/g, '');

        if (!trimmedName) {
            showError(
                isHi ? 'नाम आवश्यक' : 'Name Required',
                isHi ? 'कृपया अपना नाम दर्ज करें' : 'Please enter your name'
            );
            return;
        }
        if (!trimmedCity) {
            showError(
                isHi ? 'शहर आवश्यक' : 'City Required',
                isHi ? 'कृपया अपना शहर दर्ज करें' : 'Please enter your city'
            );
            return;
        }
        if (!deviceId) return;

        setLoading(true);
        try {
            // Try to get push token again if we didn't get it earlier
            let token = pushToken;
            if (!token) {
                token = await obtainPushToken();
            }

            const result = await registerNaamJapUser(deviceId, trimmedName, trimmedCity, cleaned, token || undefined);
            if (!result.success) {
                showError(
                    isHi ? 'पंजीकरण विफल' : 'Registration Failed',
                    result.message || (isHi ? 'कुछ गलत हो गया' : 'Something went wrong')
                );
                return;
            }

            if (!token) {
                showInfo(
                    isHi ? 'सूचना अनुमति' : 'Notification Permission',
                    isHi
                        ? 'पुश नोटिफिकेशन टोकन प्राप्त नहीं हो सका। आपको दैनिक अनुस्मारक नहीं मिलेंगे।'
                        : 'Could not get push notification token. You will not receive daily reminders.'
                );
            }

            if (result.response) {
                await setAuthUser(result.response, cleaned);
                onDone();
            }
        } catch {
            showError(
                isHi ? 'नेटवर्क त्रुटि' : 'Network Error',
                isHi ? 'कृपया अपना इंटरनेट कनेक्शन जांचें' : 'Please check your internet connection'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                <Image
                    source={require('@/assets/images/shree-ji-logo.png')}
                    style={styles.logo}
                    resizeMode="contain"
                />

                <Text style={styles.title}>
                    {step === 'mobile'
                        ? (isHi ? 'मोबाइल नंबर दर्ज करें' : 'Enter Mobile Number')
                        : (isHi ? 'पंजीकरण करें' : 'Register')}
                </Text>
                <Text style={styles.subtitle}>
                    {step === 'mobile'
                        ? (isHi ? 'अपना मोबाइल नंबर डालकर आगे बढ़ें' : 'Enter your mobile number to continue')
                        : (isHi ? 'अपनी जानकारी भरें' : 'Fill in your details')}
                </Text>

                {step === 'mobile' ? (
                    <View style={styles.formContainer}>
                        <Text style={styles.label}>{isHi ? 'मोबाइल नंबर' : 'Mobile Number'}</Text>
                        <View style={styles.mobileRow}>
                            <View style={styles.prefixBox}>
                                <Text style={styles.prefixText}>+91</Text>
                            </View>
                            <TextInput
                                style={[styles.input, styles.mobileInput]}
                                placeholder={isHi ? 'मोबाइल नंबर' : 'Mobile Number'}
                                placeholderTextColor="#888"
                                keyboardType="phone-pad"
                                maxLength={10}
                                value={mobile}
                                onChangeText={setMobile}
                            />
                        </View>
                        <TouchableOpacity
                            style={styles.submitBtn}
                            onPress={handleMobileSubmit}
                            activeOpacity={0.7}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#1a1a1a" size="small" />
                            ) : (
                                <Text style={styles.submitBtnText}>
                                    {isHi ? 'आगे बढ़ें' : 'Continue'}
                                </Text>
                            )}
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={styles.formContainer}>
                        <Text style={styles.label}>{isHi ? 'मोबाइल नंबर' : 'Mobile Number'}</Text>
                        <View style={styles.mobileRow}>
                            <View style={[styles.prefixBox, styles.inputDisabled]}>
                                <Text style={[styles.prefixText, { color: '#888' }]}>+91</Text>
                            </View>
                            <TextInput
                                style={[styles.input, styles.mobileInput, styles.inputDisabled]}
                                value={mobile}
                                editable={false}
                            />
                        </View>

                        <Text style={styles.label}>{isHi ? 'नाम' : 'Name'}</Text>
                        <TextInput
                            style={styles.input}
                            placeholder={isHi ? 'अपना नाम दर्ज करें' : 'Enter your name'}
                            placeholderTextColor="#888"
                            maxLength={100}
                            value={name}
                            onChangeText={setName}
                        />

                        <Text style={styles.label}>{isHi ? 'शहर' : 'City'}</Text>
                        <TextInput
                            style={styles.input}
                            placeholder={isHi ? 'अपना शहर दर्ज करें' : 'Enter your city'}
                            placeholderTextColor="#888"
                            maxLength={100}
                            value={city}
                            onChangeText={setCity}
                        />

                        <TouchableOpacity
                            style={styles.submitBtn}
                            onPress={handleRegister}
                            activeOpacity={0.7}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#1a1a1a" size="small" />
                            ) : (
                                <Text style={styles.submitBtnText}>
                                    {isHi ? 'पंजीकरण करें' : 'Register'}
                                </Text>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.backBtn}
                            onPress={() => setStep('mobile')}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.backBtnText}>
                                {isHi ? '← वापस जाएं' : '← Go Back'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>

            <BottomSheetMessage
                visible={sheetVisible}
                onClose={() => setSheetVisible(false)}
                type={sheetType}
                title={sheetTitle}
                message={sheetMessage}
            />
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFDE7',
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 6,
        paddingTop: 60,
        alignItems: 'center',
    },
    logo: {
        width: 100,
        height: 100,
        borderRadius: 50,
        marginBottom: 6,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#B8860B',
        textAlign: 'center',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 13,
        color: '#8B6914',
        textAlign: 'center',
        marginBottom: 16,
    },
    formContainer: {
        width: '100%',
        paddingHorizontal: 6,
    },
    label: {
        fontSize: 13,
        fontWeight: '600',
        color: '#5D4037',
        marginBottom: 4,
        marginLeft: 2,
    },
    input: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#D4A017',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 15,
        color: '#333',
        marginBottom: 6,
    },
    inputDisabled: {
        backgroundColor: '#F5F0DC',
        color: '#888',
    },
    mobileRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    prefixBox: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#D4A017',
        borderRadius: 8,
        borderTopRightRadius: 0,
        borderBottomRightRadius: 0,
        paddingHorizontal: 10,
        paddingVertical: 10,
        justifyContent: 'center',
    },
    prefixText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#333',
    },
    mobileInput: {
        flex: 1,
        borderTopLeftRadius: 0,
        borderBottomLeftRadius: 0,
        marginBottom: 0,
    },
    submitBtn: {
        backgroundColor: '#FFD700',
        borderRadius: 8,
        paddingVertical: 12,
        alignItems: 'center',
        marginTop: 6,
    },
    submitBtnText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1a1a1a',
    },
    backBtn: {
        alignItems: 'center',
        marginTop: 10,
        paddingVertical: 8,
    },
    backBtnText: {
        fontSize: 14,
        color: '#B8860B',
        fontWeight: '600',
    },
});
