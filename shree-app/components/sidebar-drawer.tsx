import BottomSheetMessage from '@/components/ui/bottom-sheet-message';
import { useAuth } from '@/contexts/auth-context';
import { useLanguage } from '@/contexts/language-context';
import { useAppTheme } from '@/contexts/theme-context';
import { fetchHomeContent } from '@/services/api';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DRAWER_WIDTH = SCREEN_WIDTH * 0.78;
const TEXT_DARK = '#333333';

interface DrawerMenuItem {
    icon: React.ReactNode;
    labelKey: string;
    route: string;
}

const menuItems: DrawerMenuItem[] = [
    { icon: <Ionicons name="home" size={22} color={TEXT_DARK} />, labelKey: 'sidebar_home', route: '/' },
    { icon: <MaterialCommunityIcons name="counter" size={22} color={TEXT_DARK} />, labelKey: 'sidebar_naam_jap', route: '/naam-jap-counter' },
    { icon: <Ionicons name="footsteps-outline" size={22} color={TEXT_DARK} />, labelKey: 'sidebar_step_tracker', route: '/step-tracker' },
    { icon: <Ionicons name="chatbubble-ellipses-outline" size={22} color={TEXT_DARK} />, labelKey: 'sidebar_daily_quote', route: '/daily-quote' },
    { icon: <Ionicons name="color-palette-outline" size={22} color={TEXT_DARK} />, labelKey: 'sidebar_theme', route: '/theme-settings' },
    { icon: <Ionicons name="language-outline" size={22} color={TEXT_DARK} />, labelKey: 'sidebar_language', route: '/language-settings' },
    { icon: <Ionicons name="share-social-outline" size={22} color={TEXT_DARK} />, labelKey: 'sidebar_share', route: '/share-app' },
    { icon: <Ionicons name="shield-checkmark-outline" size={22} color={TEXT_DARK} />, labelKey: 'sidebar_privacy', route: '/privacy-policy' },
    { icon: <Ionicons name="document-text-outline" size={22} color={TEXT_DARK} />, labelKey: 'sidebar_terms', route: '/terms-conditions' },
];

interface SidebarDrawerProps {
    visible: boolean;
    onClose: () => void;
}

export default function SidebarDrawer({ visible, onClose }: SidebarDrawerProps) {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { theme } = useAppTheme();
    const { t } = useLanguage();
    const { isLoggedIn, logout, user } = useAuth();
    const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
    const overlayAnim = useRef(new Animated.Value(0)).current;
    const [logoutSheetVisible, setLogoutSheetVisible] = useState(false);
    const [sidebarImageUrl, setSidebarImageUrl] = useState<string | null>(null);

    // Fetch sidebar image from API
    useEffect(() => {
        (async () => {
            try {
                const data = await fetchHomeContent();
                if (data?.sidebarImage) {
                    setSidebarImageUrl(data.sidebarImage);
                }
            } catch { }
        })();
    }, []);

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.timing(slideAnim, { toValue: 0, duration: 280, useNativeDriver: true }),
                Animated.timing(overlayAnim, { toValue: 1, duration: 280, useNativeDriver: true }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(slideAnim, { toValue: -DRAWER_WIDTH, duration: 250, useNativeDriver: true }),
                Animated.timing(overlayAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
            ]).start();
        }
    }, [visible]);

    const [shouldRender, setShouldRender] = React.useState(false);

    const handleLogout = async () => {
        onClose();
        await logout();
        setLogoutSheetVisible(false);
    };

    useEffect(() => {
        if (visible) setShouldRender(true);
    }, [visible]);

    useEffect(() => {
        if (!visible && !shouldRender) return;
        if (!visible) {
            const timer = setTimeout(() => setShouldRender(false), 300);
            return () => clearTimeout(timer);
        }
    }, [visible, shouldRender]);

    if (!shouldRender) return null;

    return (
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
            <Animated.View style={[styles.overlay, { opacity: overlayAnim }]}>
                <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
            </Animated.View>

            <Animated.View
                style={[
                    styles.drawer,
                    { paddingTop: insets.top, backgroundColor: theme.headerBg, transform: [{ translateX: slideAnim }] },
                ]}
            >
                <View style={styles.drawerHeader}>
                    <Image
                        source={sidebarImageUrl ? { uri: sidebarImageUrl } : require('@/assets/images/slider-2.png')}
                        style={styles.drawerHeaderImage}
                        contentFit="cover"
                    />
                    <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                        <Ionicons name="close" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                </View>

                <ScrollView
                    style={styles.menuScroll}
                    contentContainerStyle={styles.menuContent}
                    showsVerticalScrollIndicator={false}
                >
                    {menuItems.map((item, index) => (
                        <TouchableOpacity
                            key={index}
                            style={styles.menuItem}
                            onPress={() => {
                                onClose();
                                router.push(item.route as any);
                            }}
                            activeOpacity={0.6}
                        >
                            <View style={styles.menuIconContainer}>{item.icon}</View>
                            <Text style={styles.menuLabel}>{t(item.labelKey as any)}</Text>
                        </TouchableOpacity>
                    ))}

                    {isLoggedIn && (
                        <TouchableOpacity
                            style={[styles.menuItem, styles.logoutItem]}
                            onPress={() => setLogoutSheetVisible(true)}
                            activeOpacity={0.6}
                        >
                            <View style={styles.menuIconContainer}>
                                <Ionicons name="log-out-outline" size={22} color="#D32F2F" />
                            </View>
                            <Text style={[styles.menuLabel, { color: '#D32F2F' }]}>{t('sidebar_logout' as any)}</Text>
                        </TouchableOpacity>
                    )}
                </ScrollView>

                {isLoggedIn && user && (
                    <View style={[styles.userInfo, { borderTopColor: 'rgba(0,0,0,0.1)' }]}>
                        <Ionicons name="person-circle-outline" size={28} color={TEXT_DARK} />
                        <Text style={styles.userName} numberOfLines={1}>{user.name}</Text>
                    </View>
                )}
            </Animated.View>

            <BottomSheetMessage
                visible={logoutSheetVisible}
                onClose={() => setLogoutSheetVisible(false)}
                type="confirm"
                title={t('logout_confirm_title' as any)}
                message={t('logout_confirm_msg' as any)}
                confirmLabel={t('sidebar_logout' as any)}
                onConfirm={handleLogout}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    drawer: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        width: DRAWER_WIDTH,
    },
    drawerHeader: {
        width: '100%',
        height: 200,
        position: 'relative',
    },
    drawerHeaderImage: {
        width: '100%',
        height: '100%',
    },
    closeButton: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: 'rgba(0,0,0,0.4)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    menuScroll: {
        flex: 1,
    },
    menuContent: {
        paddingVertical: 4,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 6,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.06)',
    },
    logoutItem: {
        marginTop: 6,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.1)',
    },
    menuIconContainer: {
        width: 32,
        alignItems: 'center',
    },
    menuLabel: {
        fontSize: 15,
        color: TEXT_DARK,
        marginLeft: 12,
        flex: 1,
        fontWeight: '500',
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 6,
        borderTopWidth: 1,
        gap: 8,
    },
    userName: {
        fontSize: 14,
        fontWeight: '600',
        color: TEXT_DARK,
        flex: 1,
    },
});
