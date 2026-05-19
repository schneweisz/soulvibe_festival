import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SV, neonShadow } from '@/constants/theme';
import { ScreenHeader } from '@/components/screen-header';

const AMOUNTS = [5000, 10000, 20000] as const;

export default function WalletScreen() {
  const [selected, setSelected] = useState<number>(10000);
  const [custom, setCustom] = useState('');
  const currentBalance = 12500;

  const finalAmount = custom ? parseInt(custom, 10) || 0 : selected;

  const handleTopUp = () => {
    Alert.alert('Top Up Successful!', `${finalAmount.toLocaleString()} HUF added to your wristband.`, [
      { text: 'OK', onPress: () => router.back() },
    ]);
  };

  return (
    <View style={styles.root}>
      {/* Grid background decoration */}
      <View style={styles.gridBg} />

      <ScreenHeader showBack />

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Page title */}
        <View style={styles.titleBlock}>
          <Text style={styles.pageTitle}>Wallet Top-Up</Text>
          <Text style={styles.pageSubtitle}>Recharge your festival wristband.</Text>
        </View>

        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <View style={styles.balanceGlow} />
          <View style={styles.balanceHeader}>
            <Text style={styles.balanceLabel}>CURRENT BALANCE</Text>
            <MaterialIcons name="account-balance-wallet" size={20} color={SV.primaryFixedDim} />
          </View>
          <View style={styles.balanceRow}>
            <Text style={styles.balanceAmount}>{currentBalance.toLocaleString()}</Text>
            <Text style={styles.balanceCurrency}>HUF</Text>
          </View>
          <View style={styles.idBadge}>
            <Text style={styles.idText}>ID: RAVER_082</Text>
          </View>
        </View>

        {/* Amount Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SELECT AMOUNT</Text>
          <View style={styles.amountGrid}>
            {AMOUNTS.map(amt => {
              const isActive = !custom && selected === amt;
              return (
                <TouchableOpacity
                  key={amt}
                  style={[styles.amountCell, isActive && styles.amountCellActive]}
                  onPress={() => { setSelected(amt); setCustom(''); }}>
                  {isActive && <View style={styles.activeDot} />}
                  <Text style={[styles.amountValue, isActive && styles.amountValueActive]}>
                    {amt.toLocaleString()}
                  </Text>
                  <Text style={[styles.amountCur, isActive && styles.amountCurActive]}>HUF</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Custom amount */}
        <View style={styles.section}>
          <Text style={styles.inputLabel}>OR ENTER CUSTOM AMOUNT</Text>
          <View style={styles.inputWrap}>
            <TextInput
              style={styles.input}
              placeholder="e.g. 15000"
              placeholderTextColor={SV.surfaceVariant}
              keyboardType="numeric"
              value={custom}
              onChangeText={setCustom}
            />
            <Text style={styles.inputSuffix}>HUF</Text>
          </View>
        </View>

        {/* Payment method */}
        <View style={styles.payMethodCard}>
          <View style={styles.payMethodLeft}>
            <View style={styles.payMethodIcon}>
              <MaterialIcons name="credit-card" size={20} color={SV.onSurfaceVariant} />
            </View>
            <View>
              <Text style={styles.payMethodName}>Apple Pay</Text>
              <Text style={styles.payMethodSub}>Default Method</Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => Alert.alert('Coming Soon', 'Select new payment method feature coming soon.')}>
            <Text style={styles.changeBtn}>Change</Text>
          </TouchableOpacity>
        </View>

        {/* Top-up button */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.topUpBtn} onPress={handleTopUp}>
            <Text style={styles.topUpText}>TOP UP NOW</Text>
            <MaterialIcons name="bolt" size={22} color={SV.deepCharcoal} />
          </TouchableOpacity>
        </View>

        <View style={{ height: 80 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: SV.background },

  gridBg: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.15,
  },

  header: {
    height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, backgroundColor: SV.surfaceGlass,
    borderBottomWidth: 1, borderBottomColor: SV.white10, ...neonShadow,
  },
  headerTitle: { color: SV.primaryFixedDim, fontFamily: 'monospace', fontSize: 17, fontWeight: '800', letterSpacing: -0.5, textTransform: 'uppercase' },

  scroll: { flex: 1 },

  titleBlock: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 8 },
  pageTitle: { color: SV.onSurface, fontSize: 32, fontWeight: '900', letterSpacing: -1, textTransform: 'uppercase' },
  pageSubtitle: { color: SV.onSurfaceVariant, fontSize: 17, lineHeight: 26, marginTop: 6 },

  balanceCard: {
    marginHorizontal: 20, marginTop: 20,
    backgroundColor: SV.surfaceGlass, borderTopWidth: 1, borderLeftWidth: 1, borderColor: SV.white10,
    borderRadius: 14, padding: 20, overflow: 'hidden',
  },
  balanceGlow: {
    position: 'absolute', right: -30, top: -30, width: 140, height: 140, borderRadius: 70,
    backgroundColor: SV.neonGlow,
  },
  balanceHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  balanceLabel: { color: SV.onSurfaceVariant, fontFamily: 'monospace', fontSize: 11, letterSpacing: 1.5 },
  balanceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginBottom: 12 },
  balanceAmount: { color: SV.primaryContainer, fontSize: 40, fontWeight: '900', textShadowColor: 'rgba(57,255,20,0.5)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 10 },
  balanceCurrency: { color: SV.primaryFixedDim, fontSize: 20, fontWeight: '700' },
  idBadge: { alignSelf: 'flex-start', backgroundColor: SV.surfaceContainerHigh, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, borderWidth: 1, borderColor: SV.outlineVariant },
  idText: { color: SV.onSurfaceVariant, fontFamily: 'monospace', fontSize: 12, letterSpacing: 1 },

  section: { paddingHorizontal: 20, paddingTop: 24 },
  sectionTitle: { color: SV.onSurface, fontWeight: '700', fontSize: 16, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 14 },

  amountGrid: { flexDirection: 'row', gap: 10 },
  amountCell: {
    flex: 1, alignItems: 'center', paddingVertical: 16, borderRadius: 8,
    borderWidth: 1, borderColor: SV.outlineVariant, backgroundColor: SV.surfaceContainerLow, position: 'relative',
  },
  amountCellActive: { borderColor: SV.primaryContainer, backgroundColor: SV.surfaceContainerHigh, ...neonShadow },
  activeDot: { position: 'absolute', top: 8, right: 8, width: 8, height: 8, borderRadius: 4, backgroundColor: SV.primaryContainer, shadowColor: '#39ff14', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 4 },
  amountValue: { color: SV.onSurface, fontSize: 18, fontWeight: '700' },
  amountValueActive: { color: SV.primaryContainer },
  amountCur: { color: SV.onSurfaceVariant, fontFamily: 'monospace', fontSize: 11, marginTop: 4 },
  amountCurActive: { color: SV.primaryFixedDim },

  inputLabel: { color: SV.onSurfaceVariant, fontFamily: 'monospace', fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 2, borderBottomColor: SV.outlineVariant, paddingBottom: 8 },
  input: { flex: 1, color: SV.onSurface, fontSize: 18, paddingVertical: 4 },
  inputSuffix: { color: SV.onSurfaceVariant, fontFamily: 'monospace', fontSize: 13 },

  payMethodCard: {
    marginHorizontal: 20, marginTop: 20,
    backgroundColor: SV.surfaceGlass, borderTopWidth: 1, borderLeftWidth: 1, borderColor: SV.white10,
    borderRadius: 10, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  payMethodLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  payMethodIcon: { width: 40, height: 40, backgroundColor: SV.surfaceContainerHigh, borderRadius: 6, borderWidth: 1, borderColor: SV.outlineVariant, alignItems: 'center', justifyContent: 'center' },
  payMethodName: { color: SV.onSurface, fontSize: 15 },
  payMethodSub: { color: SV.onSurfaceVariant, fontFamily: 'monospace', fontSize: 11, marginTop: 2 },
  changeBtn: { color: SV.primaryFixedDim, fontFamily: 'monospace', fontSize: 12, letterSpacing: 0.5, textTransform: 'uppercase' },

  topUpBtn: {
    backgroundColor: SV.primaryContainer, borderRadius: 2, paddingVertical: 18,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, ...neonShadow,
  },
  topUpText: { color: SV.deepCharcoal, fontWeight: '800', fontSize: 16, letterSpacing: 2, textTransform: 'uppercase' },
});
