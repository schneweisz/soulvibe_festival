import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { SV } from '../../constants/theme';
import { ThemedText } from '../../components/themed-text';

/**
 * Blank callback route to handle deep links from OAuth providers.
 * The session is handled by AuthContext and _layout.tsx, so this
 * screen just shows a loader and redirects to profile once ready.
 */
export default function AuthCallback() {
  const { session, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (session) {
        // Successful login, go to profile
        router.replace('/profile');
      } else {
        // Fallback to login if something went wrong
        router.replace('/auth');
      }
    }
  }, [session, loading]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={SV.primaryContainer} />
      <ThemedText style={styles.text}>Synchronizing soul to the grid...</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#131313',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  text: {
    fontFamily: 'monospace',
    color: SV.onSurfaceVariant,
    fontSize: 14,
    letterSpacing: 1,
  },
});
