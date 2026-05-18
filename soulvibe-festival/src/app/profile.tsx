import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SV, neonShadow } from '@/constants/theme';
import { CartFAB, ScreenHeader } from '@/components/screen-header';

const MY_LINEUP = [
  { time: '22:00', day: 'FRI', artist: 'Charlotte de Witte', stage: 'MAIN_GRID STAGE' },
  { time: '01:30', day: 'SAT', artist: 'Amelie Lens', stage: 'VOID CHAMBER' },
  { time: '03:00', day: 'SAT', artist: 'I Hate Models', stage: 'VOID CHAMBER' },
];

export default function ProfileScreen() {
  return (
    <View style={styles.root}>
      <ScreenHeader showBack />

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Profile Hero */}
        <View style={styles.profileHero}>
          <View style={styles.heroGlass} />
          <Image
            source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAy1EowdBNK22w-bmef-d9wgdV_Hhmr42gKSUWaHp8oUtQ1q3N3tf0nEHWSQPllXX5j5FtGKH0YL-sUZPvsLtlnqzOhH55nBzHAvzFtn3YxFI7F6fMeJRdleOQ0cvGYFbpsnlpIJu5ccU2Xqs9d2aG39HRmcTVCL66-cEJMzReAwhjtFQmDUxXfc4X7ZKxnmixJv2oG2S0gMdkCkV1nfnyDJW9TYCA4UvYe_X8SkQBMEaCmWPcm7Zf_JioJ9-UHkfwTzbHc_eS9nBxV' }}
            style={styles.avatar}
          />
          <Text style={styles.username}>RAVER_082</Text>
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

        {/* My Lineup */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.cardTitle}>MY LINEUP</Text>
            <MaterialIcons name="favorite" size={20} color={SV.secondaryFixedDim} />
          </View>
          {MY_LINEUP.map(set => (
            <TouchableOpacity key={set.artist} style={styles.setRow} onPress={() => router.push('/lineup')}>
              <View style={styles.setTime}>
                <Text style={styles.setTimeText}>{set.time}</Text>
                <Text style={styles.setDay}>{set.day}</Text>
              </View>
              <View style={styles.setInfo}>
                <Text style={styles.setArtist}>{set.artist}</Text>
                <View style={styles.setStageRow}>
                  <MaterialIcons name="location-on" size={12} color={SV.onSurfaceVariant} />
                  <Text style={styles.setStage}>{set.stage}</Text>
                </View>
              </View>
              <TouchableOpacity hitSlop={8}>
                <MaterialIcons name="favorite" size={20} color={SV.primaryContainer} />
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={styles.viewScheduleBtn} onPress={() => router.push('/lineup')}>
            <Text style={styles.viewScheduleText}>VIEW FULL SCHEDULE</Text>
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

  header: {
    height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, backgroundColor: SV.surfaceGlass,
    borderBottomWidth: 1, borderBottomColor: SV.white10, ...neonShadow,
  },
  headerTitle: { color: SV.primaryFixedDim, fontFamily: 'monospace', fontSize: 17, fontWeight: '800', letterSpacing: -0.5, textTransform: 'uppercase' },

  scroll: { flex: 1 },

  profileHero: {
    alignItems: 'center', paddingVertical: 32, marginHorizontal: 20, marginTop: 20,
    backgroundColor: SV.deepCharcoal, borderWidth: 1, borderColor: SV.white10, borderRadius: 16, overflow: 'hidden',
  },
  heroGlass: { ...StyleSheet.absoluteFillObject, backgroundColor: SV.surfaceGlass },
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
  showQrText: { color: SV.onPrimaryFixed, fontWeight: '800', fontSize: 13, letterSpacing: 1 },
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

  setRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: SV.surfaceContainerLow, borderRadius: 8, borderWidth: 1, borderColor: 'transparent',
    padding: 10, marginBottom: 8,
  },
  setTime: { width: 52, paddingRight: 12, borderRightWidth: 1, borderRightColor: SV.surfaceVariant },
  setTimeText: { color: SV.primaryFixedDim, fontFamily: 'monospace', fontSize: 13, letterSpacing: 0.5 },
  setDay: { color: SV.onSurfaceVariant, fontFamily: 'monospace', fontSize: 10, marginTop: 2 },
  setInfo: { flex: 1 },
  setArtist: { color: SV.onSurface, fontSize: 15, fontWeight: '700', textTransform: 'uppercase' },
  setStageRow: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 3 },
  setStage: { color: SV.onSurfaceVariant, fontFamily: 'monospace', fontSize: 11 },
  viewScheduleBtn: {
    marginTop: 8, paddingVertical: 10, borderWidth: 1, borderColor: SV.surfaceVariant, borderRadius: 4, alignItems: 'center',
  },
  viewScheduleText: { color: SV.onSurfaceVariant, fontFamily: 'monospace', fontSize: 12, letterSpacing: 1, textTransform: 'uppercase' },

  fab: {
    position: 'absolute', right: 20, bottom: 24,
    width: 56, height: 56, borderRadius: 28, backgroundColor: SV.primaryContainer,
    alignItems: 'center', justifyContent: 'center', ...neonShadow,
  },
  fabBadge: {
    position: 'absolute', top: -4, right: -4, width: 20, height: 20, borderRadius: 10,
    backgroundColor: SV.error, borderWidth: 2, borderColor: SV.background, alignItems: 'center', justifyContent: 'center',
  },
  fabBadgeText: { color: SV.onError, fontSize: 10, fontWeight: '700' },
});
