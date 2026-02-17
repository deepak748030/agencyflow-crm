
import AnimatedSplash from '@/components/animated-splash';
import { AppThemeProvider } from '@/contexts/theme-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import 'react-native-reanimated';

export const unstable_settings = {
  anchor: '(tabs)',
};

function AppContent() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <StatusBar style="dark" />
      <Stack initialRouteName="(tabs)">
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
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
      <AppContent />
    </AppThemeProvider>
  );
}
