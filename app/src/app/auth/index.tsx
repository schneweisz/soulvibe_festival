import React, { useState ,useEffect } from 'react';
import { View, StyleSheet, TextInput, ScrollView, Alert, ActivityIndicator, Pressable, Platform } from 'react-native';
import { supabase } from '../../utils/supabase';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { SV, neonShadow } from '../../constants/theme';
import { ThemedView } from '../../components/themed-view';
import { ThemedText } from '../../components/themed-text';
import { ScreenHeader } from '../../components/screen-header';
import { useAuth } from '../../context/AuthContext';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';

// Handle redirect for web
WebBrowser.maybeCompleteAuthSession();

export default function AuthScreen() {
  const { session } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  useEffect(() => {
    if (session) {
      router.replace('/profile');
    }
  }, [session]);

  async function signInWithEmail() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) Alert.alert('Login Error', error.message);
    setLoading(false);
  }

  async function signUpWithEmail() {
    setLoading(true);
    const { error, data } = await supabase.auth.signUp({ email, password });
    if (error) {
      Alert.alert('Sign Up Error', error.message);
    } else if (!data.session) {
      Alert.alert('Almost there!', 'Check your email and click the confirmation link, then come back to log in.');
    }
    setLoading(false);
  }

  async function signInWithGoogle() {
    if (loading) return;
    setLoading(true);

    try {
      // Use a consistent path without leading slash
      const redirectTo = Linking.createURL('auth/callback');
      console.log('Auth Redirect URL:', redirectTo);
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          skipBrowserRedirect: Platform.OS !== 'web',
        },
      });

      if (error) throw error;

      if (Platform.OS !== 'web' && data?.url) {
        const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
        
        if (result.type === 'success' && result.url) {
          const { params, errorCode } = Linking.parse(result.url);
          
          if (errorCode) throw new Error(errorCode);
          
          // Supabase returns tokens in the hash (#) which Linking.parse might put in params or 
          // we might need to parse manually from the fragment.
          let accessToken = params?.access_token;
          let refreshToken = params?.refresh_token;

          // If Linking.parse didn't get them (because of the #), parse manually from the fragment
          if (!accessToken && result.url.includes('#')) {
            const fragment = result.url.split('#')[1];
            const parts = fragment.split('&');
            for (const part of parts) {
              const [key, value] = part.split('=');
              if (key === 'access_token') accessToken = value;
              if (key === 'refresh_token') refreshToken = value;
            }
          }

          if (accessToken) {
            const { error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken as string,
              refresh_token: (refreshToken as string) || '',
            });
            if (sessionError) throw sessionError;
          }
        }
      }
    } catch (error: any) {
      Alert.alert('Google Login Error', error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ThemedView style={styles.container}>
      <ScreenHeader />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <MaterialIcons name="fingerprint" size={60} color={SV.primaryContainer} />
          <ThemedText type="title" style={styles.title}>
            {isSignUp ? 'CREATE ACCOUNT' : 'SYSTEM ACCESS'}
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            Connect your soul to the grid.
          </ThemedText>
        </View>

        <View style={styles.form}>
          <View style={styles.inputWrapper}>
            <MaterialIcons name="email" size={20} color={SV.outline} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email Address"
              placeholderTextColor={SV.outline}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <View style={styles.inputWrapper}>
            <MaterialIcons name="lock" size={20} color={SV.outline} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor={SV.outline}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
            />
          </View>

          <Pressable 
            style={[styles.mainBtn, loading && styles.disabledBtn]} 
            onPress={isSignUp ? signUpWithEmail : signInWithEmail}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={SV.deepCharcoal} />
            ) : (
              <ThemedText style={styles.mainBtnText}>
                {isSignUp ? 'REGISTER' : 'AUTHORIZE'}
              </ThemedText>
            )}
          </Pressable>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <ThemedText style={styles.dividerText}>OR</ThemedText>
            <View style={styles.dividerLine} />
          </View>

          <Pressable 
            style={styles.googleBtn} 
            onPress={signInWithGoogle}
            disabled={loading}
          >
            <MaterialIcons name="login" size={20} color={SV.onSurface} />
            <ThemedText style={styles.googleBtnText}>SIGN IN WITH GOOGLE</ThemedText>
          </Pressable>

          <Pressable 
            onPress={() => setIsSignUp(!isSignUp)} 
            style={styles.toggleBtn}
          >
            <ThemedText style={styles.toggleText}>
              {isSignUp ? 'Already have an account? Login' : "Don't have an account? Sign Up"}
            </ThemedText>
          </Pressable>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingTop: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    color: SV.primaryContainer,
    fontSize: 28,
    marginTop: 16,
    textAlign: 'center',
  },
  subtitle: {
    color: SV.onSurfaceVariant,
    fontSize: 14,
    fontFamily: 'monospace',
    marginTop: 8,
  },
  form: {
    gap: 16,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: SV.surfaceContainer,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: SV.outlineVariant,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 50,
    color: SV.onSurface,
    fontFamily: 'monospace',
  },
  mainBtn: {
    backgroundColor: SV.primaryContainer,
    height: 50,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    ...neonShadow,
  },
  mainBtnText: {
    color: SV.deepCharcoal,
    fontWeight: '900',
    fontSize: 14,
    letterSpacing: 2,
  },
  disabledBtn: {
    opacity: 0.7,
  },
  googleBtn: {
    flexDirection: 'row',
    backgroundColor: SV.surfaceContainerHigh,
    height: 50,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: SV.outlineVariant,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  googleBtnText: {
    color: SV.onSurface,
    fontWeight: '700',
    fontSize: 13,
    letterSpacing: 1,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: SV.outlineVariant,
  },
  dividerText: {
    paddingHorizontal: 10,
    color: SV.outline,
    fontSize: 12,
    fontFamily: 'monospace',
  },
  toggleBtn: {
    alignItems: 'center',
    marginTop: 10,
  },
  toggleText: {
    color: SV.primaryContainer,
    fontSize: 13,
    fontFamily: 'monospace',
    textDecorationLine: 'underline',
  },
});
