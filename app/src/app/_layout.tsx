import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import React from 'react';

import { AnimatedSplashOverlay } from '../components/animated-icon';
import { MenuProvider } from '../components/menu-drawer';
import AppTabs from '../components/app-tabs';
import { LanguageProvider } from '../context/LanguageContext';
import { CartProvider } from '../context/CartContext';
import { AuthProvider } from '../context/AuthContext';
import { DatabaseProvider } from '../context/DatabaseContext';

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
    <AuthProvider>
      <DatabaseProvider>
        <LanguageProvider>
          <CartProvider>
            <ThemeProvider value={SoulVibeDarkTheme}>
              <MenuProvider>
                <AnimatedSplashOverlay />
                <AppTabs />
              </MenuProvider>
            </ThemeProvider>
          </CartProvider>
        </LanguageProvider>
      </DatabaseProvider>
    </AuthProvider>
  );
}
