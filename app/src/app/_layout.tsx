import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { router, useSegments } from 'expo-router';
import React, { useEffect } from 'react';

import { AnimatedSplashOverlay } from '../components/animated-icon';
import { MenuProvider } from '../components/menu-drawer';
import AppTabs from '../components/app-tabs';
import { LanguageProvider } from '../context/LanguageContext';
import { CartProvider } from '../context/CartContext';
import { AuthProvider, useAuth } from '../context/AuthContext';
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

/**
 * Handles global authentication redirection.
 * Redirects to /auth if accessing protected routes while logged out.
 */
function AuthGuard({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  const segments = useSegments();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === 'auth';
    const isProtectedRoute = ['profile', 'wallet', 'cart', 'ticket_shop'].includes(segments[0] as string);

    if (!session && isProtectedRoute && !inAuthGroup) {
      // Use push instead of replace because the root navigator is a Tabs navigator 
      // which does not support the REPLACE action.
      router.push('/auth');
    }
  }, [session, loading, segments]);

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <AuthGuard>
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
      </AuthGuard>
    </AuthProvider>
  );
}
