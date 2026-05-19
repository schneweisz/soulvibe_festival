import { MaterialIcons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import React, { useEffect, useState, useCallback } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SV, neonShadow } from '@/constants/theme';
import { CartFAB, ScreenHeader } from '@/components/screen-header';
import { supabase } from '../utils/supabase';
import { Session } from '@supabase/supabase-js';
import { ThemedView } from '../components/themed-view';

const MY_LINEUP = [
  { time: '22:00', day: 'FRI', artist: 'Charlotte de Witte', stage: 'MAIN_GRID STAGE' },
  { time: '01:30', day: 'SAT', artist: 'Amelie Lens', stage: 'VOID CHAMBER' },
  { time: '03:00', day: 'SAT', artist: 'I Hate Models', stage: 'VOID CHAMBER' },
];

export default function ProfileScreen() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Check auth every time the screen is focused
  useFocusEffect(
    useCallback(() => {
      let isMounted = true;

      async function checkSession() {
        try {
          const { data: { session: currentSession } } = await supabase.auth.getSession();
          if (isMounted) {
            setSession(currentSession);
            setLoading(false);
            if (!currentSession) {
              router.push('/auth');
            }
          }
        } catch (e) {
          console.error('Session check failed', e);
          if (isMounted) setLoading(false);
        }
      }

      checkSession();

      return () => {
        isMounted = false;
      };
    }, [])
  );

  async function handleSignOut() {
    const { error } = await supabase.auth.signOut();
    if (error) {
      Alert.alert('Error signing out', error.message);
    } else {
      setSession(null);
      router.replace('/auth');
    }
  }

  if (loading) {
    return (
      <ThemedView style={styles.center}>
        <ActivityIndicator size="large" color={SV.primaryContainer} />
        <Text style={styles.loadingText}>SCANNING BIOMETRICS...</Text>
      </ThemedView>
    );
  }

  if (!session) {
    return (
      <ThemedView style={styles.center}>
        <TouchableOpacity style={styles.authBtn} onPress={() => router.push('/auth')}>
          <Text style={styles.authBtnText}>AUTHORIZE SYSTEM ACCESS</Text>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  return (
    <View style={styles.root}>
      <ScreenHeader showBack />

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Profile Hero */}
        <View style={styles.profileHero}>
          <View style={styles.heroGlass} />
          <Image
            source={{ uri: `https://api.dicebear.com/7.x/avataaars/svg?seed=${session.user.email}` }}
            style={styles.avatar}
          />
          <Text style={styles.username}>{session.user.email?.split('@')[0].toUpperCase()}</Text>
          <View style={styles.badgeRow}>
            <View style={styles.badgePrimary}>
              <Text style={styles.badgePrimaryText}>PULSE LEVEL: HIGH</Text>
            </View>
            <View style={styles.badgeSecondary}>
              <MaterialIcons name="check-circle" size={12} color={SV.secondaryFixedDim} />
              <Text style={styles.badgeSecondaryText}>VIBE CHECKED</Text>
            </View>
          </View>
        </View>

        {/* Active Pass */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.cardTitle}>ACTIVE PASS</Text>
            <MaterialIcons name="confirmation-number" size={20} color={SV.primaryContainer} />
          </View>
          <View style={styles.ticketBox}>
            <View style={styles.ticketGlow} />
            <View style={styles.ticketHeader}>
              <View>
                <Text style={styles.ticketName}>VIP WEEKEND</Text>
                <Text style={styles.ticketId}>ID: SV26-8842-XQ</Text>
              </View>
              <View style={styles.liveBadge}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>LIVE</Text>
              </View>
            </View>
            <View style={styles.ticketActions}>
              <TouchableOpacity style={styles.showQrBtn}>
                <Text style={styles.showQrText}>SHOW QR</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.shareBtn}>
                <MaterialIcons name="share" size={18} color={SV.primaryContainer} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Pulse Points */}
        <View style={styles.card}>
          <Text style={styles.pulseLabel}>Pulse Points</Text>
          <View style={styles.pulseRow}>
            <Text style={styles.pulseValue}>4,250</Text>
            <Text style={styles.pulsePts}>PTS</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={styles.progressFill} />
          </View>
          <View style={styles.progressLabels}>
            <Text style={styles.progressLabel}>Lvl 3: RAIDER</Text>
            <Text style={styles.progressLabel}>750 to Lvl 4</Text>
          </View>
        </View>

        {/* Wallet */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.cardTitle}>WALLET BALANCE</Text>
            <MaterialIcons name="account-balance-wallet" size={20} color={SV.primaryContainer} />
          </View>
          <View style={styles.walletRow}>
            <View style={styles.walletAmountRow}>
              <Text style={styles.walletAmount}>12,500</Text>
              <Text style={styles.walletCurrency}>HUF</Text>
            </View>
            <TouchableOpacity style={styles.topUpBtn} onPress={() => router.push('/wallet')}>
              <Text style={styles.topUpText}>TOP UP BALANCE</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Settings / Logout */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.cardTitle}>SYSTEM</Text>
            <MaterialIcons name="settings" size={20} color={SV.outline} />
          </View>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleSignOut}>
            <MaterialIcons name="logout" size={20} color={SV.error} />
            <Text style={styles.logoutText}>DISCONNECT FROM GRID</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <CartFAB count={2} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: SV.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: SV.background },
  loadingText: { color: SV.primaryContainer, fontFamily: 'monospace', marginTop: 20, letterSpacing: 2 },

  scroll: { flex: 1 },

  profileHero: {
    alignItems: 'center', paddingVertical: 32, marginHorizontal: 20, marginTop: 20,
    backgroundColor: SV.deepCharcoal, borderWidth: 1, borderColor: SV.white10, borderRadius: 16, overflow: 'hidden',
  },
  heroGlass: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(57,255,20,0.03)' },
  avatar: { width: 100, height: 100, borderRadius: 50, borderWidth: 2, borderColor: SV.primaryContainer, marginBottom: 12, ...neonShadow },
  username: { color: SV.primaryFixedDim, fontSize: 22, fontWeight: '900', letterSpacing: -0.5, textTransform: 'uppercase', marginBottom: 10 },
  badgeRow: { flexDirection: 'row', gap: 8 },
  badgePrimary: { backgroundColor: SV.surfaceContainerHigh, borderWidth: 1, borderColor: 'rgba(57,255,20,0.3)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgePrimaryText: { color: SV.primaryContainer, fontFamily: 'monospace', fontSize: 11, letterSpacing: 0.5 },
  badgeSecondary: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: SV.surfaceContainerHigh, borderWidth: 1, borderColor: 'rgba(236,177,255,0.3)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeSecondaryText: { color: SV.secondaryFixedDim, fontFamily: 'monospace', fontSize: 11 },

  card: {
    marginHorizontal: 20, marginTop: 16,
    backgroundColor: SV.deepCharcoal, borderTopWidth: 1, borderLeftWidth: 1, borderColor: SV.white10,
    borderRadius: 14, padding: 16, overflow: 'hidden',
  },
  cardTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, borderBottomWidth: 1, borderBottomColor: SV.surfaceVariant, paddingBottom: 8 },
  cardTitle: { color: SV.onSurface, fontWeight: '700', fontSize: 14, letterSpacing: 1.5, textTransform: 'uppercase' },

  ticketBox: {
    backgroundColor: SV.surfaceContainerHighest, borderRadius: 10, padding: 14,
    borderWidth: 1, borderColor: SV.primaryContainer, overflow: 'hidden', ...neonShadow,
  },
  ticketGlow: { position: 'absolute', right: -20, top: -20, width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(57,255,20,0.08)' },
  ticketHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  ticketName: { color: SV.primaryFixedDim, fontSize: 17, fontWeight: '800', letterSpacing: -0.5, marginBottom: 4 },
  ticketId: { color: SV.onSurfaceVariant, fontFamily: 'monospace', fontSize: 11 },
  liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(57,255,20,0.15)', borderWidth: 1, borderColor: 'rgba(57,255,20,0.5)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: SV.primaryContainer },
  liveText: { color: SV.primaryContainer, fontFamily: 'monospace', fontSize: 10, letterSpacing: 1 },
  ticketActions: { flexDirection: 'row', gap: 8 },
  showQrBtn: { flex: 1, backgroundColor: SV.primaryContainer, paddingVertical: 8, borderRadius: 2, alignItems: 'center' },
  showQrText: { color: SV.deepCharcoal, fontWeight: '800', fontSize: 13, letterSpacing: 1 },
  shareBtn: { width: 38, height: 38, borderWidth: 1, borderColor: SV.primaryContainer, borderRadius: 2, alignItems: 'center', justifyContent: 'center' },

  pulseLabel: { color: SV.onSurfaceVariant, fontFamily: 'monospace', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', textAlign: 'center', marginBottom: 4 },
  pulseRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6, justifyContent: 'center', marginBottom: 10 },
  pulseValue: { color: SV.primaryContainer, fontSize: 40, fontWeight: '900', textShadowColor: 'rgba(57,255,20,0.6)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 8 },
  pulsePts: { color: SV.primaryFixedDim, fontFamily: 'monospace', fontSize: 14, fontWeight: '700' },
  progressBar: { height: 8, backgroundColor: SV.surfaceVariant, borderRadius: 4, overflow: 'hidden', marginBottom: 6 },
  progressFill: { width: '75%', height: '100%', backgroundColor: SV.primaryContainer, ...neonShadow },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  progressLabel: { color: SV.onSurfaceVariant, fontFamily: 'monospace', fontSize: 10, letterSpacing: 0.5 },

  walletRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 },
  walletAmountRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  walletAmount: { color: SV.primaryContainer, fontSize: 36, fontWeight: '900', textShadowColor: 'rgba(57,255,20,0.6)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 8 },
  walletCurrency: { color: SV.primaryFixedDim, fontFamily: 'monospace', fontSize: 14, fontWeight: '700' },
  topUpBtn: {
    backgroundColor: 'rgba(57,255,20,0.15)', borderWidth: 1, borderColor: SV.primaryContainer,
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
  },
  topUpText: { color: SV.primaryContainer, fontFamily: 'monospace', fontSize: 12, letterSpacing: 1 },

  logoutBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  logoutText: { color: SV.error, fontFamily: 'monospace', fontSize: 13, fontWeight: '700', letterSpacing: 1 },

  authBtn: {
    backgroundColor: 'rgba(57,255,20,0.1)',
    borderWidth: 1,
    borderColor: SV.primaryContainer,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 4,
    ...neonShadow,
  },
  authBtnText: {
    color: SV.primaryContainer,
    fontFamily: 'monospace',
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 2,
  },
});
