import { MaterialIcons } from '@expo/vector-icons';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SV, neonShadow } from '../constants/theme';
import { ScreenHeader } from '../components/screen-header';
import { GlitchText } from '../components/glitch-text';
import { NebulaBackground } from '../components/nebula-background';
import { useAuth } from '../context/AuthContext';
import { useDatabase } from '../context/DatabaseContext';
import { supabase } from '../utils/supabase';

// ─── Types & constants ────────────────────────────────────────────────────────

type HubName = 'alpha' | 'beta' | 'gamma' | 'delta';
interface HubStatus { hub_name: HubName; available: number; total: number; }

const HUBS: HubName[] = ['alpha', 'beta', 'gamma', 'delta'];
const HUB_LABELS: Record<HubName, string> = {
  alpha: 'ALPHA', beta: 'BETA', gamma: 'GAMMA', delta: 'DELTA',
};
const DEFAULT_TOTAL = 100;
const PRICE_BASE = 2500;

function getPulseDiscount(points: number): number {
  if (points >= 500) return 0.15;
  if (points >= 250) return 0.10;
  if (points >= 100) return 0.05;
  return 0;
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function LockerScreen() {
  const { session } = useAuth();
  const { profile, locker, refreshLocker } = useDatabase();
  const { hub: hubParam } = useLocalSearchParams<{ hub?: string }>();

  const [hubStatuses, setHubStatuses]   = useState<HubStatus[]>([]);
  const [loadingScreen, setLoadingScreen] = useState(true);
  const [reserving, setReserving]       = useState(false);
  const [releasing, setReleasing]       = useState(false);
  const [selectedHub, setSelectedHub]   = useState<HubName | null>(
    HUBS.includes(hubParam as HubName) ? (hubParam as HubName) : null,
  );
  const [error, setError]               = useState<string | null>(null);
  const [justReserved, setJustReserved] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);

  const unlockScale = useRef(new Animated.Value(1)).current;
  const unlockGlow  = useRef(new Animated.Value(0)).current;

  const points   = profile?.points ?? 0;
  const discount = getPulseDiscount(points);
  const finalPrice = Math.round(PRICE_BASE * (1 - discount));

  const fetchOccupancy = useCallback(async () => {
    const { data, error: fetchErr } = await supabase.from('lockers').select('hub_name, status');
    if (fetchErr) {
      console.error('Error fetching lockers:', fetchErr.message);
      setError(`Database error: ${fetchErr.message}`);
      return;
    }
    
    if (data) {
      if (data.length === 0) {
        console.warn('Locker table is empty! Seed required.');
        setError('Vault system offline. Table contains 0 rows.');
      } else {
        const sample = data[0];
        console.log('Locker data sample:', sample);
        // If we have rows but none are available, let the user know for debugging
        const anyAvailable = data.some(l => l.status === 'available');
        if (!anyAvailable) {
          console.warn('No rows found with status="available"');
        }
      }
      
      setHubStatuses(HUBS.map(hub => {
        const hubRows = data.filter(l => l.hub_name?.toLowerCase().trim() === hub.toLowerCase());
        return {
          hub_name: hub,
          available: hubRows.filter(l => l.status?.toLowerCase().trim() === 'available').length,
          total: hubRows.length,
        };
      }));
    }
  }, []);

  // Re-fetch every time the screen comes into focus so stale context never
  // blocks interactions. loadingScreen gates all buttons until both fetches resolve.
  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        setLoadingScreen(true);
        setError(null);
        await Promise.all([refreshLocker(), fetchOccupancy()]);
        if (active) setLoadingScreen(false);
      })();
      return () => { active = false; };
    }, [refreshLocker, fetchOccupancy]),
  );

  const handleReserve = async () => {
    if (!session || !selectedHub) return;
    setShowPayModal(false);
    setReserving(true);
    setError(null);

    const { data, error: rpcErr } = await supabase.rpc('reserve_locker', {
      p_user_id: session.user.id,
      p_hub_name: selectedHub,
    });

    if (rpcErr || !data?.success) {
      if (data?.error === 'hub_full') {
        setError('This hub is at capacity. Select another vault.');
      } else if (data?.error === 'already_reserved') {
        await refreshLocker();
      } else {
        setError('Reservation failed. Try again.');
      }
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const currentBalance = profile?.balance ?? 0;
      await supabase
        .from('profiles')
        .update({ balance: currentBalance - finalPrice, points: points + 50 })
        .eq('id', session.user.id);
      await supabase.from('transactions').insert([{
        user_id: session.user.id,
        amount: finalPrice,
        type: 'debit',
        label: `Vault ${HUB_LABELS[selectedHub]} Locker Reservation`,
      }]);
      await Promise.all([refreshLocker(), fetchOccupancy()]);
      setJustReserved(true);
    }
    setReserving(false);
  };

  const handleRelease = async () => {
    if (!session) return;
    setReleasing(true);
    const { error: rpcErr } = await supabase.rpc('release_locker', { p_user_id: session.user.id });
    if (!rpcErr) {
      await Promise.all([refreshLocker(), fetchOccupancy()]);
      setJustReserved(false);
    }
    setReleasing(false);
  };

  const handleRemoteUnlock = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Animated.sequence([
      Animated.parallel([
        Animated.timing(unlockScale, { toValue: 0.96, duration: 70, useNativeDriver: true }),
        Animated.timing(unlockGlow,  { toValue: 1,    duration: 70, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.spring(unlockScale, { toValue: 1.03, useNativeDriver: true, damping: 6, stiffness: 220 }),
      ]),
      Animated.parallel([
        Animated.spring(unlockScale, { toValue: 1, useNativeDriver: true, damping: 12, stiffness: 160 }),
        Animated.timing(unlockGlow,  { toValue: 0, duration: 600, useNativeDriver: true }),
      ]),
    ]).start();
  };

  const glowBorder = unlockGlow.interpolate({ inputRange: [0, 1], outputRange: ['rgba(85,242,255,0.25)', 'rgba(85,242,255,0.9)'] });

  return (
    <View style={ls.root}>
      <NebulaBackground />
      <ScreenHeader showBack />

      <ScrollView style={ls.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={ls.scrollContent}>

        {/* Header */}
        <View style={ls.header}>
          <MaterialIcons name="lock" size={36} color={SV.tertiaryContainer} style={{ marginBottom: 10 }} />
          <GlitchText style={ls.title}>NEURAL VAULTS</GlitchText>
          <Text style={ls.subtitle}>SECURE STORAGE · BIOMETRIC ACCESS · AGILE FESTIVAL</Text>
        </View>

        {loadingScreen ? (
          <View style={{ alignItems: 'center', paddingVertical: 60 }}>
            <ActivityIndicator color={SV.tertiaryContainer} size="large" />
            <Text style={{ color: SV.onSurfaceVariant, fontFamily: 'monospace', fontSize: 11, marginTop: 14, letterSpacing: 1.5 }}>
              SCANNING VAULTS...
            </Text>
          </View>
        ) : locker ? (
          /* ── Reserved: Vault Dashboard ── */
          <>
            {justReserved && (
              <View style={ls.agileBanner}>
                <MaterialIcons name="bolt" size={16} color={SV.primaryContainer} />
                <Text style={ls.agileText}>AGILITY BOOST: +50 PULSE POINTS AWARDED</Text>
              </View>
            )}

            <Animated.View style={[ls.vaultCard, { transform: [{ scale: unlockScale }], borderColor: glowBorder as any }]}>
              <View style={ls.vaultGlow} />

              <View style={ls.vaultHeader}>
                <View>
                  <Text style={ls.vaultHubLabel}>VAULT {HUB_LABELS[locker.hub_name as HubName] ?? locker.hub_name.toUpperCase()}</Text>
                  <Text style={ls.vaultSlot}>SLOT #{String(locker.slot_number).padStart(3, '0')}</Text>
                </View>
                <View style={ls.vaultBadge}>
                  <View style={ls.vaultDot} />
                  <Text style={ls.vaultBadgeText}>SECURED</Text>
                </View>
              </View>

              <Text style={ls.pinLabel}>ACCESS CODE</Text>
              <View style={ls.pinRow}>
                {locker.pin_code.split('').map((digit, i) => (
                  <View key={i} style={ls.pinCell}>
                    <Text style={ls.pinDigit}>{digit}</Text>
                  </View>
                ))}
              </View>

              <TouchableOpacity style={ls.unlockBtn} onPress={handleRemoteUnlock} activeOpacity={0.8}>
                <MaterialIcons name="lock-open" size={20} color={SV.deepCharcoal} />
                <Text style={ls.unlockBtnText}>REMOTE UNLOCK</Text>
              </TouchableOpacity>

              <TouchableOpacity style={ls.releaseBtn} onPress={handleRelease} disabled={releasing} activeOpacity={0.8}>
                {releasing
                  ? <ActivityIndicator size="small" color="#FF6B6B" />
                  : <>
                      <MaterialIcons name="exit-to-app" size={16} color="#FF6B6B" />
                      <Text style={ls.releaseBtnText}>VACATE VAULT</Text>
                    </>}
              </TouchableOpacity>
            </Animated.View>

            <Text style={ls.hint}>Tap REMOTE UNLOCK before approaching the locker bank.</Text>
          </>
        ) : (
          /* ── No Reservation: Hub Selection ── */
          <>
            {discount > 0 && (
              <View style={ls.discountBanner}>
                <MaterialIcons name="bolt" size={14} color={SV.primaryContainer} />
                <Text style={ls.discountText}>
                  PULSE DISCOUNT {(discount * 100).toFixed(0)}% APPLIED → {finalPrice.toLocaleString()} HUF/DAY
                </Text>
              </View>
            )}

            <Text style={ls.sectionLabel}>SELECT VAULT HUB</Text>

            {HUBS.map(hub => {
              const status    = hubStatuses.find(s => s.hub_name === hub);
              const total     = status?.total ?? DEFAULT_TOTAL;
              const available = status?.available ?? (loadingScreen ? total : 0);
              const isFull    = !loadingScreen && total > 0 && available === 0;
              const isSelected = selectedHub === hub;
              const occupied  = total - available;
              const pct       = total > 0 ? Math.round((occupied / total) * 100) : 0;
              const barColor  = pct > 80 ? '#FF6B6B' : pct > 50 ? '#F5A623' : SV.tertiaryContainer;

              return (
                <TouchableOpacity
                  key={hub}
                  style={[ls.hubCard, isSelected && ls.hubCardSelected, isFull && ls.hubCardFull]}
                  onPress={() => {
                    if (isFull) return;
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedHub(hub);
                  }}
                  activeOpacity={0.8}
                  disabled={isFull}
                >
                  <View style={ls.hubLeft}>
                    <Text style={[ls.hubName, isSelected && ls.hubNameSelected]}>
                      VAULT {HUB_LABELS[hub]}
                    </Text>
                    <Text style={ls.hubMeta}>
                      {isFull ? 'CAPACITY REACHED' : `${occupied}/${total} SLOTS SECURED`}
                    </Text>
                    <View style={ls.occBar}>
                      <View style={[ls.occFill, { width: `${pct}%` as any, backgroundColor: barColor }]} />
                    </View>
                  </View>
                  <View style={ls.hubRight}>
                    {isSelected && <MaterialIcons name="check-circle" size={22} color={SV.tertiaryContainer} />}
                    {isFull    && <MaterialIcons name="block"         size={22} color={SV.outline} />}
                  </View>
                </TouchableOpacity>
              );
            })}

            {error && <Text style={ls.errorText}>{error}</Text>}

            <TouchableOpacity
              style={[ls.reserveBtn, (!selectedHub || reserving) && ls.reserveBtnDisabled]}
              onPress={() => { if (selectedHub) setShowPayModal(true); }}
              disabled={!selectedHub || reserving}
              activeOpacity={0.85}
            >
              {reserving
                ? <ActivityIndicator color={SV.deepCharcoal} />
                : <>
                    <MaterialIcons name="lock" size={20} color={!selectedHub ? SV.onSurfaceVariant : SV.deepCharcoal} />
                    <Text style={[ls.reserveBtnText, !selectedHub && ls.reserveBtnTextDisabled]}>
                      RESERVE VAULT — {finalPrice.toLocaleString()} HUF/DAY
                    </Text>
                  </>}
            </TouchableOpacity>

            <Text style={ls.disclaimer}>
              +50 PULSE POINTS AWARDED ON RESERVATION · DEMO MODE
            </Text>
          </>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ── Payment Modal ── */}
      <Modal
        visible={showPayModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPayModal(false)}
      >
        <View style={ls.modalOverlay}>
          <View style={ls.modalCard}>
            <View style={ls.modalGlow} />

            {/* Title */}
            <View style={ls.modalTitleRow}>
              <MaterialIcons name="account-balance-wallet" size={20} color={SV.tertiaryContainer} />
              <Text style={ls.modalTitle}>VAULT PAYMENT</Text>
            </View>

            {/* Wallet balance */}
            <View style={ls.modalBalanceBox}>
              <Text style={ls.modalBalanceLabel}>WALLET BALANCE</Text>
              <Text style={[
                ls.modalBalanceValue,
                (profile?.balance ?? 0) < finalPrice && { color: '#FF6B6B' },
              ]}>
                {(profile?.balance ?? 0).toLocaleString()} HUF
              </Text>
            </View>

            {/* Price breakdown */}
            <View style={ls.modalDivider} />
            <View style={ls.modalRow}>
              <Text style={ls.modalRowKey}>BASE PRICE</Text>
              <Text style={ls.modalRowVal}>{PRICE_BASE.toLocaleString()} HUF/DAY</Text>
            </View>
            {discount > 0 && (
              <View style={ls.modalRow}>
                <Text style={ls.modalRowKey}>
                  PULSE DISCOUNT {(discount * 100).toFixed(0)}%
                </Text>
                <Text style={[ls.modalRowVal, { color: SV.primaryContainer }]}>
                  -{Math.round(PRICE_BASE * discount).toLocaleString()} HUF
                </Text>
              </View>
            )}
            <View style={ls.modalDivider} />
            <View style={ls.modalRow}>
              <Text style={[ls.modalRowKey, { color: SV.onSurface, fontWeight: '700' }]}>TOTAL</Text>
              <Text style={[ls.modalRowVal, { color: SV.tertiaryContainer, fontSize: 16, fontWeight: '900' }]}>
                {finalPrice.toLocaleString()} HUF
              </Text>
            </View>

            {/* Balance after */}
            {(profile?.balance ?? 0) >= finalPrice ? (
              <View style={ls.modalRow}>
                <Text style={ls.modalRowKey}>BALANCE AFTER</Text>
                <Text style={ls.modalRowVal}>
                  {((profile?.balance ?? 0) - finalPrice).toLocaleString()} HUF
                </Text>
              </View>
            ) : (
              <View style={ls.modalInsufficientBox}>
                <MaterialIcons name="warning" size={14} color="#FF6B6B" />
                <Text style={ls.modalInsufficientText}>INSUFFICIENT FUNDS — TOP UP YOUR WALLET</Text>
              </View>
            )}

            {/* Buttons */}
            <TouchableOpacity
              style={[
                ls.modalConfirmBtn,
                (profile?.balance ?? 0) < finalPrice && ls.modalConfirmBtnDisabled,
              ]}
              onPress={handleReserve}
              disabled={(profile?.balance ?? 0) < finalPrice}
              activeOpacity={0.85}
            >
              <MaterialIcons
                name="lock"
                size={18}
                color={(profile?.balance ?? 0) < finalPrice ? SV.onSurfaceVariant : SV.deepCharcoal}
              />
              <Text style={[
                ls.modalConfirmBtnText,
                (profile?.balance ?? 0) < finalPrice && { color: SV.onSurfaceVariant },
              ]}>
                CONFIRM PURCHASE
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={ls.modalCancelBtn} onPress={() => setShowPayModal(false)} activeOpacity={0.75}>
              <Text style={ls.modalCancelBtnText}>CANCEL</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}


// ─── Styles ───────────────────────────────────────────────────────────────────

const ls = StyleSheet.create({
  root:          { flex: 1, backgroundColor: SV.background },
  scroll:        { flex: 1 },
  scrollContent: { paddingHorizontal: 16 },

  header:   { alignItems: 'center', paddingTop: 24, paddingBottom: 28 },
  title:    { fontSize: 26, fontWeight: '900', color: SV.tertiaryContainer, letterSpacing: 2, marginBottom: 6 },
  subtitle: { color: SV.onSurfaceVariant, fontFamily: 'monospace', fontSize: 9, letterSpacing: 2, textAlign: 'center' },

  agileBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: `${SV.primaryContainer}14`, borderWidth: 1, borderColor: `${SV.primaryContainer}30`,
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 14,
  },
  agileText: { color: SV.primaryContainer, fontFamily: 'monospace', fontSize: 11, letterSpacing: 0.5, flex: 1 },

  // Vault card
  vaultCard: {
    backgroundColor: SV.deepCharcoal, borderWidth: 1.5,
    borderRadius: 16, padding: 20, marginBottom: 14, overflow: 'hidden',
    shadowColor: SV.tertiaryContainer, shadowOpacity: 0.35, shadowRadius: 20,
    shadowOffset: { width: 0, height: 0 },
  },
  vaultGlow: {
    position: 'absolute', top: -50, right: -50, width: 180, height: 180, borderRadius: 90,
    backgroundColor: `${SV.tertiaryContainer}10`,
  },
  vaultHeader:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22 },
  vaultHubLabel:  { color: SV.tertiaryContainer, fontFamily: 'monospace', fontSize: 15, fontWeight: '900', letterSpacing: 2 },
  vaultSlot:      { color: SV.onSurfaceVariant, fontFamily: 'monospace', fontSize: 12, marginTop: 3 },
  vaultBadge:     {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: `${SV.tertiaryContainer}18`, borderWidth: 1, borderColor: `${SV.tertiaryContainer}50`,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
  },
  vaultDot:       { width: 7, height: 7, borderRadius: 3.5, backgroundColor: SV.tertiaryContainer },
  vaultBadgeText: { color: SV.tertiaryContainer, fontFamily: 'monospace', fontSize: 10, letterSpacing: 1.5 },

  pinLabel: { color: SV.onSurfaceVariant, fontFamily: 'monospace', fontSize: 10, letterSpacing: 2, marginBottom: 10 },
  pinRow:   { flexDirection: 'row', gap: 6, marginBottom: 22 },
  pinCell:  {
    flex: 1, backgroundColor: SV.surfaceContainerHigh, borderRadius: 8,
    borderWidth: 1, borderColor: `${SV.tertiaryContainer}40`,
    paddingVertical: 12, alignItems: 'center',
  },
  pinDigit: { color: SV.tertiaryContainer, fontFamily: 'monospace', fontSize: 22, fontWeight: '900' },

  unlockBtn: {
    backgroundColor: SV.tertiaryContainer, borderRadius: 12, paddingVertical: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 10,
    shadowColor: SV.tertiaryContainer, shadowOpacity: 0.45, shadowRadius: 14,
    shadowOffset: { width: 0, height: 0 },
  },
  unlockBtnText: { color: SV.deepCharcoal, fontWeight: '900', fontSize: 14, letterSpacing: 2 },

  releaseBtn: {
    borderWidth: 1, borderColor: 'rgba(255,107,107,0.4)', borderRadius: 12, paddingVertical: 12,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  releaseBtnText: { color: '#FF6B6B', fontFamily: 'monospace', fontSize: 12, letterSpacing: 1 },

  hint: { color: SV.outline, fontFamily: 'monospace', fontSize: 10, textAlign: 'center', marginTop: 10, letterSpacing: 0.5 },

  // Hub selection
  discountBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: `${SV.primaryContainer}10`, borderWidth: 1, borderColor: `${SV.primaryContainer}28`,
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 16,
  },
  discountText: { color: SV.primaryContainer, fontFamily: 'monospace', fontSize: 10, letterSpacing: 0.5, flex: 1 },

  sectionLabel: {
    color: SV.onSurfaceVariant, fontFamily: 'monospace', fontSize: 10,
    letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12,
  },

  hubCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: SV.deepCharcoal, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12, padding: 14, marginBottom: 10,
  },
  hubCardSelected: { borderColor: SV.tertiaryContainer, backgroundColor: `${SV.tertiaryContainer}0C` },
  hubCardFull:     { opacity: 0.4 },
  hubLeft:         { flex: 1 },
  hubRight:        { marginLeft: 12 },
  hubName:         { color: SV.onSurface, fontSize: 14, fontWeight: '700', letterSpacing: 1, marginBottom: 3 },
  hubNameSelected: { color: SV.tertiaryContainer },
  hubMeta:         { color: SV.onSurfaceVariant, fontFamily: 'monospace', fontSize: 11, marginBottom: 8 },
  occBar:          { height: 4, backgroundColor: SV.surfaceContainerHigh, borderRadius: 2, overflow: 'hidden' },
  occFill:         { height: '100%', borderRadius: 2 },

  errorText: { color: '#FF6B6B', fontFamily: 'monospace', fontSize: 11, textAlign: 'center', marginVertical: 8 },

  reserveBtn: {
    backgroundColor: SV.tertiaryContainer, borderRadius: 12, paddingVertical: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 8,
    shadowColor: SV.tertiaryContainer, shadowOpacity: 0.4, shadowRadius: 14,
    shadowOffset: { width: 0, height: 0 },
  },
  reserveBtnDisabled:     { backgroundColor: SV.surfaceContainerHigh, shadowOpacity: 0 },
  reserveBtnText:         { color: SV.deepCharcoal, fontWeight: '900', fontSize: 13, letterSpacing: 1.5 },
  reserveBtnTextDisabled: { color: SV.onSurfaceVariant },

  disclaimer: { color: SV.outline, fontFamily: 'monospace', fontSize: 9, textAlign: 'center', marginTop: 12, letterSpacing: 0.5 },

  // Payment modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.75)',
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24,
  },
  modalCard: {
    width: '100%', backgroundColor: SV.deepCharcoal,
    borderRadius: 20, borderWidth: 1.5, borderColor: `${SV.tertiaryContainer}40`,
    padding: 24, overflow: 'hidden',
    shadowColor: SV.tertiaryContainer, shadowOpacity: 0.25, shadowRadius: 24,
    shadowOffset: { width: 0, height: 0 },
  },
  modalGlow: {
    position: 'absolute', top: -60, right: -60,
    width: 200, height: 200, borderRadius: 100,
    backgroundColor: `${SV.tertiaryContainer}08`,
  },
  modalTitleRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20,
  },
  modalTitle: {
    color: SV.tertiaryContainer, fontFamily: 'monospace',
    fontSize: 15, fontWeight: '900', letterSpacing: 2,
  },
  modalBalanceBox: {
    backgroundColor: SV.surfaceContainerHigh, borderRadius: 12,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 16, paddingVertical: 14, marginBottom: 16,
  },
  modalBalanceLabel: {
    color: SV.onSurfaceVariant, fontFamily: 'monospace',
    fontSize: 10, letterSpacing: 1.5, marginBottom: 4,
  },
  modalBalanceValue: {
    color: SV.primaryContainer, fontFamily: 'monospace',
    fontSize: 24, fontWeight: '900',
  },
  modalDivider: {
    height: 1, backgroundColor: 'rgba(255,255,255,0.08)', marginVertical: 10,
  },
  modalRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingVertical: 6,
  },
  modalRowKey: {
    color: SV.onSurfaceVariant, fontFamily: 'monospace', fontSize: 11, letterSpacing: 0.5,
  },
  modalRowVal: {
    color: SV.onSurface, fontFamily: 'monospace', fontSize: 13, fontWeight: '700',
  },
  modalInsufficientBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(255,107,107,0.1)', borderWidth: 1, borderColor: 'rgba(255,107,107,0.3)',
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, marginTop: 6,
  },
  modalInsufficientText: {
    color: '#FF6B6B', fontFamily: 'monospace', fontSize: 10, letterSpacing: 0.5, flex: 1,
  },
  modalConfirmBtn: {
    backgroundColor: SV.tertiaryContainer, borderRadius: 12, paddingVertical: 15,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    marginTop: 20,
    shadowColor: SV.tertiaryContainer, shadowOpacity: 0.4, shadowRadius: 14,
    shadowOffset: { width: 0, height: 0 },
  },
  modalConfirmBtnDisabled: { backgroundColor: SV.surfaceContainerHigh, shadowOpacity: 0 },
  modalConfirmBtnText: {
    color: SV.deepCharcoal, fontWeight: '900', fontSize: 13, letterSpacing: 1.5,
  },
  modalCancelBtn: {
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', borderRadius: 12,
    paddingVertical: 13, alignItems: 'center', marginTop: 10,
  },
  modalCancelBtnText: {
    color: SV.onSurfaceVariant, fontFamily: 'monospace', fontSize: 12, letterSpacing: 1,
  },
});
