import { MaterialIcons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { SV, neonShadow } from '../constants/theme';
import { ScreenHeader } from '../components/screen-header';
import { useAuth } from '../context/AuthContext';
import { useDatabase } from '../context/DatabaseContext';
import { supabase } from '../utils/supabase';

// ─── Constants ────────────────────────────────────────────────────────────────

const AMOUNTS = [5000, 10000, 20000, 50000] as const;

const METHODS = [
  { id: 'apple',  icon: 'phone-iphone',  label: 'Apple Pay',          sub: 'Touch ID ready'     },
  { id: 'google', icon: 'android',        label: 'Google Pay',         sub: 'Linked account'     },
  { id: 'card',   icon: 'credit-card',    label: '•••• •••• •••• 4242', sub: 'Visa · exp 08/28'  },
] as const;

interface Transaction {
  id: string;
  type: 'credit' | 'debit';
  label: string;
  amount: number;
  created_at: string;
}

// Random hex string for the processing animation
const randHex = () => Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0').toUpperCase();

type Phase = 'select' | 'processing' | 'success';

// ─── Processing overlay ───────────────────────────────────────────────────────

function ProcessingOverlay({ amount, onDone }: { amount: number; onDone: () => void }) {
  const progress  = useRef(new Animated.Value(0)).current;
  const scanY     = useRef(new Animated.Value(0)).current;
  const [hexLines, setHexLines] = useState(() => Array.from({ length: 6 }, randHex));

  useEffect(() => {
    // Fill the progress bar over 2.2 seconds
    Animated.timing(progress, {
      toValue: 1,
      duration: 2200,
      easing: Easing.inOut(Easing.quad),
      useNativeDriver: false,
    }).start(() => onDone());

    // Scan line looping
    Animated.loop(
      Animated.timing(scanY, {
        toValue: 1,
        duration: 900,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Flicker hex codes
    const interval = setInterval(() => {
      setHexLines(Array.from({ length: 6 }, randHex));
    }, 140);
    return () => clearInterval(interval);
  }, []);

  const barWidth = progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });
  const scanTranslate = scanY.interpolate({ inputRange: [0, 1], outputRange: [-2, 200] });

  return (
    <View style={p.overlay}>
      <View style={p.innerCircle}>
        <MaterialIcons name="bolt" size={44} color={SV.primaryContainer} />
      </View>

      <Text style={p.label}>PROCESSING TRANSACTION</Text>
      <Text style={p.amount}>{amount.toLocaleString()} HUF</Text>

      {/* Progress bar */}
      <View style={p.barTrack}>
        <Animated.View style={[p.barFill, { width: barWidth }]}>
          <Animated.View style={[p.scanLine, { transform: [{ translateX: scanTranslate }] }]} />
        </Animated.View>
      </View>

      {/* Flickering hex codes */}
      <View style={p.hexBlock}>
        {hexLines.map((h, i) => (
          <Text key={i} style={p.hexLine}>{h}</Text>
        ))}
      </View>

      <Text style={p.sub}>ENCRYPTING · AUTHORISING · TRANSFERRING</Text>
    </View>
  );
}

// ─── Success overlay ──────────────────────────────────────────────────────────

function SuccessOverlay({ amount, newBalance, dbError, onClose }: {
  amount: number; newBalance: number; dbError: boolean; onClose: () => void;
}) {
  const scale   = useRef(new Animated.Value(0.6)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale,   { toValue: 1,    useNativeDriver: true, damping: 14, stiffness: 200 }),
      Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
  }, []);

  const txId = `SV-${Date.now().toString(36).toUpperCase().slice(-8)}`;

  return (
    <Animated.View style={[p.overlay, { opacity }]}>
      <Animated.View style={[p.successCard, { transform: [{ scale }] }]}>
        <View style={p.checkCircle}>
          <MaterialIcons name="check" size={36} color={SV.primaryContainer} />
        </View>
        <Text style={p.successTitle}>SYSTEM RECHARGED</Text>
        <Text style={p.successAmount}>+{amount.toLocaleString()} HUF</Text>

        <View style={p.successRow}>
          <Text style={p.successKey}>NEW BALANCE</Text>
          <Text style={[p.successVal, { color: SV.primaryContainer }]}>{newBalance.toLocaleString()} HUF</Text>
        </View>
        <View style={p.successRow}>
          <Text style={p.successKey}>TX ID</Text>
          <Text style={p.successVal}>{txId}</Text>
        </View>
        <View style={p.successRow}>
          <Text style={p.successKey}>STATUS</Text>
          <Text style={[p.successVal, { color: '#7EC8A0' }]}>CONFIRMED</Text>
        </View>

        {dbError ? (
          <Text style={{ color: '#FF6B6B', fontFamily: 'monospace', fontSize: 10, textAlign: 'center', marginTop: 8 }}>
            Sync delay detected. Profile will update shortly.
          </Text>
        ) : null}
        <TouchableOpacity style={p.doneBtn} onPress={onClose}>
          <Text style={p.doneBtnTxt}>BACK TO PROFILE</Text>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function WalletScreen() {
  const { session } = useAuth();
  const { profile, transactions, loading, refreshAll } = useDatabase();
  
  const [selected,    setSelected]    = useState<number>(10000);
  const [custom,      setCustom]      = useState('');
  const [method,      setMethod]      = useState<string>('apple');
  const [phase,       setPhase]       = useState<Phase>('select');
  const [updateErr,   setUpdateErr]   = useState(false);
  const [expectedBalance, setExpectedBalance] = useState<number>(0);

  const userId = session?.user?.id;
  const balance = profile?.balance ?? 0;

  // Formatter for timestamps (e.g., "18:45")
  const formatTime = (isoString: string) => {
    const d = new Date(isoString);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  // Refresh data on focus
  useFocusEffect(
    useCallback(() => {
      if (!session) {
        router.replace('/auth');
        return;
      }
      refreshAll();
    }, [session, refreshAll])
  );

  const finalAmount = custom ? (parseInt(custom, 10) || 0) : selected;

  const handleTopUp = async () => {
    if (finalAmount < 500 || !userId) return;
    
    setUpdateErr(false);
    const newBal = (balance ?? 0) + finalAmount;
    setExpectedBalance(newBal);
    setPhase('processing');

    // Start background processing IMMEDIATELY
    processTopUp(newBal);
  };

  const processTopUp = async (newBal: number) => {
    if (!userId) return;
    try {
      const currentPoints = profile?.points ?? 0;
      const newPoints = currentPoints + 50;

      // Parallelize Supabase updates for speed and reliability
      const results = await Promise.allSettled([
        supabase
          .from('profiles')
          .update({ balance: newBal, points: newPoints })
          .eq('id', userId),
        
        supabase
          .from('transactions')
          .insert([{
            user_id: userId,
            amount: finalAmount,
            type: 'credit',
            label: 'Wallet Top-Up via App'
          }]),

        supabase
          .from('pulse_logs')
          .insert([{
            user_id: userId,
            points_change: 50,
            reason: 'Wallet Top-Up Bonus'
          }])
      ]);

      // Check if critical balance update failed
      const profileResult = results[0];
      if (profileResult.status === 'rejected' || (profileResult.value as any).error) {
        setUpdateErr(true);
      }

      // Trigger a silent background refresh of the context
      refreshAll().catch(() => {});
    } catch (err: any) {
      console.error('CRITICAL TOP-UP ERROR:', err.message);
      setUpdateErr(true);
    }
  };

  const handleAnimationDone = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setPhase('success');
  };

  const handleSuccessClose = () => {
    setPhase('select');
    setCustom('');
    router.back();
  };

  return (
    <View style={s.root}>
      <ScreenHeader showBack />

      <ScrollView style={s.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* Page header */}
        <View style={s.titleBlock}>
          <Text style={s.pageTitle}>WALLET TOP-UP</Text>
          <Text style={s.pageSubtitle}>Recharge your festival wristband instantly.</Text>
        </View>

        {/* Balance card */}
        <View style={s.balanceCard}>
          <View style={s.balanceGlow} />
          <View style={s.balanceHeader}>
            <Text style={s.balanceLabel}>CURRENT BALANCE</Text>
            <MaterialIcons name="account-balance-wallet" size={20} color={SV.primaryFixedDim} />
          </View>
          <View style={s.balanceRow}>
            {profile === null ? (
              <ActivityIndicator color={SV.primaryContainer} size="large" />
            ) : (
              <>
                <Text style={s.balanceAmount}>{balance.toLocaleString()}</Text>
                <Text style={s.balanceCurrency}>HUF</Text>
              </>
            )}
          </View>
          <View style={s.idBadge}>
            <MaterialIcons name="nfc" size={12} color={SV.onSurfaceVariant} />
            <Text style={s.idText}>WRISTBAND · RAVER_082</Text>
          </View>
        </View>

        {/* ── Amount Selection ── */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>SELECT AMOUNT</Text>
          <View style={s.amountGrid}>
            {AMOUNTS.map(amt => {
              const isActive = !custom && selected === amt;
              return (
                <TouchableOpacity
                  key={amt}
                  style={[s.amountCell, isActive && s.amountCellActive]}
                  onPress={() => { setSelected(amt); setCustom(''); }}
                  activeOpacity={0.75}>
                  {isActive && <View style={s.activeDot} />}
                  <Text style={[s.amountValue, isActive && s.amountValueActive]}>
                    {(amt / 1000).toFixed(0)}K
                  </Text>
                  <Text style={[s.amountCur, isActive && s.amountCurActive]}>HUF</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Custom amount */}
        <View style={s.section}>
          <Text style={s.inputLabel}>OR ENTER CUSTOM AMOUNT</Text>
          <View style={s.inputWrap}>
            <TextInput
              style={s.input}
              placeholder="e.g. 15000"
              placeholderTextColor={SV.surfaceVariant}
              keyboardType="numeric"
              value={custom}
              onChangeText={v => { setCustom(v.replace(/[^0-9]/g, '')); }}
            />
            <Text style={s.inputSuffix}>HUF</Text>
          </View>
          {(custom && parseInt(custom) < 500) ? (
            <Text style={s.inputError}>Minimum top-up is 500 HUF</Text>
          ) : null}
        </View>

        {/* ── Payment Method ── */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>PAYMENT METHOD</Text>
          {METHODS.map(m => (
            <TouchableOpacity
              key={m.id}
              style={[s.methodCard, m.id === method && s.methodCardActive]}
              onPress={() => setMethod(m.id)}
              activeOpacity={0.75}>
              <View style={[s.methodIconWrap, m.id === method && s.methodIconActive]}>
                <MaterialIcons name={m.icon as any} size={22} color={m.id === method ? SV.primaryContainer : SV.onSurfaceVariant} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.methodLabel, m.id === method && s.methodLabelActive]}>{m.label}</Text>
                <Text style={s.methodSub}>{m.sub}</Text>
              </View>
              <View style={[s.radioOuter, m.id === method && s.radioOuterActive]}>
                {m.id === method && <View style={s.radioInner} />}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Summary ── */}
        <View style={[s.section, { paddingTop: 20 }]}>
          <View style={s.summaryCard}>
            <View style={s.summaryRow}>
              <Text style={s.summaryKey}>TOP-UP AMOUNT</Text>
              <Text style={s.summaryVal}>{finalAmount.toLocaleString()} HUF</Text>
            </View>
            <View style={s.summaryRow}>
              <Text style={s.summaryKey}>AFTER TOP-UP</Text>
              <Text style={[s.summaryVal, { color: SV.primaryContainer }]}>
                {balance !== null ? (balance + finalAmount).toLocaleString() : '…'} HUF
              </Text>
            </View>
          </View>
        </View>

        {/* ── Top-up button ── */}
        <View style={s.section}>
          <TouchableOpacity
            style={[s.topUpBtn, (finalAmount < 500 || balance === null) && s.topUpBtnDisabled]}
            onPress={handleTopUp}
            disabled={finalAmount < 500 || balance === null}
            activeOpacity={0.85}>
            <MaterialIcons name="bolt" size={22} color={finalAmount < 500 ? SV.onSurfaceVariant : SV.deepCharcoal} />
            <Text style={[s.topUpText, finalAmount < 500 && s.topUpTextDisabled]}>
              TOP UP {finalAmount.toLocaleString()} HUF
            </Text>
          </TouchableOpacity>
          <Text style={s.disclaimer}>
            This is a demo — no real payment is processed.
          </Text>
        </View>

        {/* ── Transaction history ── */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>RECENT TRANSACTIONS</Text>
          {loading ? (
            <ActivityIndicator color={SV.primaryContainer} style={{ marginTop: 20 }} />
          ) : transactions.length === 0 ? (
            <Text style={{ color: SV.outline, fontFamily: 'monospace', fontSize: 12, textAlign: 'center', marginTop: 20 }}>
              THE LEDGER IS CLEAN. NO TRANSACTIONS LOGGED.
            </Text>
          ) : (
            transactions.map(tx => (
              <View key={tx.id} style={s.txRow}>
                <View style={[s.txDot, { backgroundColor: tx.type === 'credit' ? SV.primaryContainer : SV.secondaryContainer }]} />
                <View style={{ flex: 1 }}>
                  <Text style={s.txLabel}>{tx.label}</Text>
                  <Text style={s.txTime}>{formatTime(tx.created_at)}</Text>
                </View>
                <Text style={[s.txAmount, tx.type === 'credit' ? s.txCredit : s.txDebit]}>
                  {tx.type === 'credit' ? '+' : ''}{tx.amount.toLocaleString()} Ft
                </Text>
              </View>
            ))
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ── Processing overlay ── */}
      {phase === 'processing' && (
        <ProcessingOverlay amount={finalAmount} onDone={handleAnimationDone} />
      )}

      {/* ── Success overlay ── */}
      {phase === 'success' && (
        <SuccessOverlay
          amount={finalAmount}
          newBalance={expectedBalance}
          dbError={updateErr}
          onClose={handleSuccessClose}
        />
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root:  { flex: 1, backgroundColor: SV.background },
  scroll: { flex: 1 },

  titleBlock:    { paddingHorizontal: 16, paddingTop: 24, paddingBottom: 4 },
  pageTitle:     { color: SV.onSurface, fontSize: 26, fontWeight: '900', letterSpacing: -0.5, textTransform: 'uppercase' },
  pageSubtitle:  { color: SV.onSurfaceVariant, fontSize: 14, marginTop: 4 },

  balanceCard: {
    marginHorizontal: 16, marginTop: 20,
    backgroundColor: SV.deepCharcoal, borderWidth: 1.5, borderColor: 'rgba(57,255,20,0.25)',
    borderRadius: 16, padding: 20, overflow: 'hidden',
  },
  balanceGlow: {
    position: 'absolute', right: -30, top: -30,
    width: 150, height: 150, borderRadius: 75,
    backgroundColor: SV.neonGlow,
  },
  balanceHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  balanceLabel:  { color: SV.onSurfaceVariant, fontFamily: 'monospace', fontSize: 11, letterSpacing: 1.5 },
  balanceRow:    { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginBottom: 14 },
  balanceAmount: {
    color: SV.primaryContainer, fontSize: 42, fontWeight: '900',
    textShadowColor: 'rgba(57,255,20,0.5)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 12,
  },
  balanceCurrency: { color: SV.primaryFixedDim, fontSize: 20, fontWeight: '700' },
  idBadge: {
    alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: SV.surfaceContainerHigh, paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  idText: { color: SV.onSurfaceVariant, fontFamily: 'monospace', fontSize: 11, letterSpacing: 1 },

  section:      { paddingHorizontal: 16, paddingTop: 24 },
  sectionTitle: { color: SV.onSurfaceVariant, fontFamily: 'monospace', fontWeight: '700', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 14 },

  amountGrid:       { flexDirection: 'row', gap: 8 },
  amountCell: {
    flex: 1, alignItems: 'center', paddingVertical: 18, borderRadius: 12,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', backgroundColor: SV.deepCharcoal,
    position: 'relative',
  },
  amountCellActive: { borderColor: SV.primaryContainer, backgroundColor: SV.surfaceContainerHigh, ...neonShadow },
  activeDot: {
    position: 'absolute', top: 7, right: 7, width: 7, height: 7, borderRadius: 3.5,
    backgroundColor: SV.primaryContainer,
    shadowColor: '#39ff14', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 4,
  },
  amountValue:       { color: SV.onSurface, fontSize: 18, fontWeight: '800' },
  amountValueActive: { color: SV.primaryContainer },
  amountCur:         { color: SV.onSurfaceVariant, fontFamily: 'monospace', fontSize: 10, marginTop: 3 },
  amountCurActive:   { color: SV.primaryFixedDim },

  inputLabel:  { color: SV.onSurfaceVariant, fontFamily: 'monospace', fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 10 },
  inputWrap:   { flexDirection: 'row', alignItems: 'center', backgroundColor: SV.deepCharcoal, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12 },
  input:       { flex: 1, color: SV.onSurface, fontSize: 18 },
  inputSuffix: { color: SV.onSurfaceVariant, fontFamily: 'monospace', fontSize: 13 },
  inputError:  { color: '#FF6B6B', fontFamily: 'monospace', fontSize: 11, marginTop: 6, letterSpacing: 0.5 },

  methodCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: SV.deepCharcoal, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12, padding: 14, marginBottom: 10,
  },
  methodCardActive: { borderColor: SV.primaryContainer, backgroundColor: SV.surfaceContainerHigh },
  methodIconWrap: {
    width: 44, height: 44, borderRadius: 10, backgroundColor: SV.surfaceContainerHigh,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center',
  },
  methodIconActive:  { borderColor: SV.primaryContainer, backgroundColor: 'rgba(57,255,20,0.1)' },
  methodLabel:       { color: SV.onSurface, fontSize: 14, fontWeight: '600' },
  methodLabelActive: { color: SV.primaryContainer },
  methodSub:         { color: SV.onSurfaceVariant, fontFamily: 'monospace', fontSize: 11, marginTop: 2 },
  radioOuter: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  radioOuterActive: { borderColor: SV.primaryContainer },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: SV.primaryContainer },

  summaryCard: {
    backgroundColor: SV.surfaceContainerLow, borderRadius: 12, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)', padding: 16, gap: 10,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryKey: { color: SV.onSurfaceVariant, fontFamily: 'monospace', fontSize: 11, letterSpacing: 1 },
  summaryVal: { color: SV.onSurface, fontFamily: 'monospace', fontSize: 14, fontWeight: '700' },

  topUpBtn: {
    backgroundColor: SV.primaryContainer, borderRadius: 12, paddingVertical: 18,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, ...neonShadow,
  },
  topUpBtnDisabled: { backgroundColor: SV.surfaceContainerHigh, shadowOpacity: 0 },
  topUpText:         { color: SV.deepCharcoal, fontWeight: '900', fontSize: 15, letterSpacing: 2, textTransform: 'uppercase' },
  topUpTextDisabled: { color: SV.onSurfaceVariant },
  disclaimer:        { color: SV.outline, fontFamily: 'monospace', fontSize: 10, textAlign: 'center', marginTop: 10, letterSpacing: 0.5 },

  txRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  txDot: { width: 8, height: 8, borderRadius: 4 },
  txLabel:  { color: SV.onSurface, fontSize: 14, fontWeight: '600' },
  txTime:   { color: SV.onSurfaceVariant, fontFamily: 'monospace', fontSize: 10, marginTop: 2 },
  txAmount: { fontFamily: 'monospace', fontSize: 13, fontWeight: '700' },
  txCredit: { color: SV.primaryContainer },
  txDebit:  { color: SV.secondaryContainer },
});

// Processing overlay styles
const p = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject, backgroundColor: '#09090E',
    alignItems: 'center', justifyContent: 'center', zIndex: 100, paddingHorizontal: 32,
  },
  innerCircle: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: 'rgba(57,255,20,0.08)', borderWidth: 1.5, borderColor: SV.primaryContainer,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 32,
  },
  label: {
    color: SV.primaryFixedDim, fontFamily: 'monospace', fontSize: 12,
    letterSpacing: 2.5, fontWeight: '700', marginBottom: 8,
  },
  amount: {
    color: SV.primaryContainer, fontSize: 28, fontWeight: '900',
    textShadowColor: 'rgba(57,255,20,0.5)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 12,
    marginBottom: 28,
  },
  barTrack: {
    width: '100%', height: 6, backgroundColor: SV.surfaceContainerHigh,
    borderRadius: 3, overflow: 'hidden', marginBottom: 24,
  },
  barFill: {
    height: '100%', backgroundColor: SV.primaryContainer,
    borderRadius: 3, overflow: 'hidden', position: 'relative',
    shadowColor: '#39ff14', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 6,
  },
  scanLine: {
    position: 'absolute', top: 0, bottom: 0, width: 40,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  hexBlock: { alignItems: 'center', marginBottom: 24, gap: 3 },
  hexLine: { color: 'rgba(57,255,20,0.35)', fontFamily: 'monospace', fontSize: 12, letterSpacing: 2 },
  sub:  { color: SV.outline, fontFamily: 'monospace', fontSize: 10, letterSpacing: 1.5, textAlign: 'center' },

  successCard: {
    backgroundColor: SV.surfaceContainerLow, borderRadius: 20, borderWidth: 1.5,
    borderColor: 'rgba(57,255,20,0.3)', padding: 28, width: '100%', alignItems: 'center',
  },
  checkCircle: {
    width: 76, height: 76, borderRadius: 38, backgroundColor: 'rgba(57,255,20,0.1)',
    borderWidth: 2, borderColor: SV.primaryContainer, alignItems: 'center', justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#39ff14', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.6, shadowRadius: 16,
  },
  successTitle: {
    color: SV.primaryContainer, fontFamily: 'monospace', fontSize: 16, fontWeight: '900',
    letterSpacing: 2, marginBottom: 6,
  },
  successAmount: {
    color: SV.onSurface, fontSize: 30, fontWeight: '900', marginBottom: 24,
    textShadowColor: 'rgba(57,255,20,0.4)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 10,
  },
  successRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    width: '100%', paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  successKey: { color: SV.onSurfaceVariant, fontFamily: 'monospace', fontSize: 11, letterSpacing: 1 },
  successVal: { color: SV.onSurface, fontFamily: 'monospace', fontSize: 13, fontWeight: '700' },
  doneBtn: {
    marginTop: 24, backgroundColor: SV.primaryContainer, borderRadius: 10,
    paddingVertical: 14, paddingHorizontal: 32, ...neonShadow,
  },
  doneBtnTxt: { color: SV.deepCharcoal, fontWeight: '900', fontSize: 13, letterSpacing: 1.5, textTransform: 'uppercase' },
});
