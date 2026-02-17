
import AnimatedSplash from '@/components/animated-splash';
import LanguagePickerModal from '@/components/language-picker-modal';
import MobileAuthScreen from '@/components/mobile-auth-screen';
import { AuthProvider, useAuth } from '@/contexts/auth-context';
import { LanguageProvider, useLanguage } from '@/contexts/language-context';
import { AppThemeProvider } from '@/contexts/theme-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useNotifications, requestNotificationPermission } from '@/hooks/use-notifications';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import 'react-native-reanimated';

export const unstable_settings = {
  anchor: '(tabs)',
};

function AppContent() {
  const colorScheme = useColorScheme();
  const { loading: langLoading, hasChosenLanguage, markLanguageChosen } = useLanguage();
  const { isLoggedIn, loading: authLoading } = useAuth();
  const [showLangPicker, setShowLangPicker] = useState(true);
  const [showMobileAuth, setShowMobileAuth] = useState(true);

  // Reset showMobileAuth when user logs out so auth screen shows again
  React.useEffect(() => {
    if (!isLoggedIn && !authLoading) {
      setShowMobileAuth(true);
    }
  }, [isLoggedIn, authLoading]);

  useNotifications();

  // Request all permissions on app startup
  useEffect(() => {
    (async () => {
      // 1. Notification permission
      await requestNotificationPermission();

      // 2. Sensor/Pedometer permission (uses expo-sensors API)
      try {
        const { Pedometer } = await import('expo-sensors');
        if (Pedometer) {
          const { status } = await Pedometer.getPermissionsAsync();
          if (status !== 'granted') {
            await Pedometer.requestPermissionsAsync();
          }
        }
      } catch { }
    })();
  }, []);

  const shouldShowLangPicker = !langLoading && !hasChosenLanguage && showLangPicker;
  const shouldShowMobileAuth = !langLoading && hasChosenLanguage && !authLoading && !isLoggedIn && showMobileAuth;

  if (shouldShowMobileAuth) {
    return (
      <>
        <StatusBar style="dark" />
        <MobileAuthScreen onDone={() => setShowMobileAuth(false)} />
      </>
    );
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <StatusBar style="dark" />
      <Stack initialRouteName="(tabs)">
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="naam-jap-counter" options={{ headerShown: false }} />
        <Stack.Screen name="step-tracker" options={{ headerShown: false }} />
        <Stack.Screen name="daily-quote" options={{ headerShown: false }} />
        <Stack.Screen name="privacy-policy" options={{ headerShown: false }} />
        <Stack.Screen name="terms-conditions" options={{ headerShown: false }} />
        <Stack.Screen name="share-app" options={{ headerShown: false }} />
        <Stack.Screen name="theme-settings" options={{ headerShown: false }} />
        <Stack.Screen name="language-settings" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <LanguagePickerModal
        visible={shouldShowLangPicker}
        onDone={async () => {
          await markLanguageChosen();
          setShowLangPicker(false);
        }}
      />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  const [showSplash, setShowSplash] = useState(true);

  if (showSplash) {
    return (
      <>
        <StatusBar style="light" backgroundColor="#1a1a1a" translucent={false} />
        <AnimatedSplash onFinish={() => setShowSplash(false)} />
      </>
    );
  }

  return (
    <AppThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </LanguageProvider>
    </AppThemeProvider>
  );
}
