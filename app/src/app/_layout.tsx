import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import React from 'react';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { MenuProvider } from '@/components/menu-drawer';
import { LanguageProvider } from '@/context/LanguageContext';

const SoulVibeDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: '#131313',
    card: '#0e0e0e',
    border: 'rgba(255,255,255,0.1)',
    primary: '#39ff14',
    text: '#e5e2e1',
  },
};

export default function RootLayout() {
  return (
    <LanguageProvider>
      <ThemeProvider value={SoulVibeDarkTheme}>
        <MenuProvider>
          <AnimatedSplashOverlay />
          <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="profile" />
            <Stack.Screen name="cart" />
            <Stack.Screen name="wallet" />
            <Stack.Screen name="auth" />
            <Stack.Screen name="explore" />
          </Stack>
        </MenuProvider>
      </ThemeProvider>
    </LanguageProvider>
  );
}
