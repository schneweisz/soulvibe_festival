import { MaterialIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SV, neonShadow } from '@/constants/theme';
import { ScreenHeader } from '@/components/screen-header';

const HOURS = [
  { day: 'FRI_JUL_18', time: '18:00 - 06:00' },
  { day: 'SAT_JUL_19', time: '15:00 - 08:00' },
  { day: 'SUN_JUL_20', time: '12:00 - 23:59' },
];

const FAQS = [
  {
    q: 'What is the prohibited items list?',
    a: 'We employ a strict techno-minimalist approach to entry. Prohibited items include: professional camera equipment, illegal substances, weapons of any kind, outside food/beverage, and large backpacks. Hydration packs are permitted if empty upon entry.',
  },
  { q: 'Are lockers available on site?', a: 'Yes — standard and large lockers are available in Sectors 2 and 4. Pre-book via the app or at the entrance.' },
  { q: 'How does cashless payment work?', a: 'Load HUF onto your festival wristband via the Wallet section of this app. All vendors accept wristband payments only.' },
  { q: 'Is there an age restriction?', a: 'SoulVibe Festival 2026 is 18+. Valid ID required at entry.' },
];

const PARTNERS = [
  { name: 'NEBULA', sub: 'ENERGY', icon: 'bolt', glow: SV.neonGlow, glowColor: SV.primaryContainer },
  { name: 'WAVORA', sub: 'WATER', icon: 'water-drop', glow: SV.cyanGlow, glowColor: SV.tertiaryFixed },
  { name: 'PULSE', sub: 'AUDIO', icon: 'graphic-eq', glow: SV.purpleGlow, glowColor: SV.secondaryFixedDim },
  { name: 'VIBES', sub: 'TECH', icon: 'memory', glow: SV.neonGlow, glowColor: SV.primaryContainer },
  { name: 'ECHO', sub: 'MEDIA', icon: 'cell-tower', glow: SV.neonGlow, glowColor: SV.primaryFixedDim },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <View style={[styles.faqItem, open && styles.faqItemOpen]}>
      <TouchableOpacity style={styles.faqHeader} onPress={() => setOpen(o => !o)}>
        <Text style={[styles.faqQ, open && styles.faqQOpen]}>{q}</Text>
        <MaterialIcons
          name={open ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
          size={22}
          color={open ? SV.primaryFixedDim : SV.outline}
        />
      </TouchableOpacity>
      {open && <Text style={styles.faqA}>{a}</Text>}
    </View>
  );
}

export default function InfoScreen() {
  return (
    <View style={styles.root}>
      <ScreenHeader />

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Page header */}
        <View style={styles.pageHeader}>
          <View style={styles.tagChip}>
            <Text style={styles.tagChipText}>DATA.CORE // INFO</Text>
          </View>
          <Text style={styles.pageTitle}>FESTIVAL{'\n'}INTELLIGENCE</Text>
          <Text style={styles.pageSubtitle}>
            Essential logistics, operational hours, and the vital partners powering the pulse of SoulVibe 2026.
          </Text>
        </View>

        {/* Hours Card */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <MaterialIcons name="schedule" size={20} color={SV.primaryContainer} />
            <Text style={styles.cardTitle}>OPERATIONAL HOURS</Text>
          </View>
          {HOURS.map(h => (
            <View key={h.day} style={styles.hoursRow}>
              <Text style={styles.hoursDay}>{h.day}</Text>
              <Text style={styles.hoursTime}>{h.time}</Text>
            </View>
          ))}
          <View style={styles.hoursNote}>
            <Text style={styles.hoursNoteLabel}>GATES OPEN</Text>
            <Text style={styles.hoursNoteText}>
              Box office closes 2 hours before event end time each night. No re-entry permitted after 02:00.
            </Text>
          </View>
        </View>

        {/* Contact Card */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <MaterialIcons name="radar" size={20} color={SV.primaryContainer} />
            <Text style={styles.cardTitle}>CONTACT HQ</Text>
          </View>
          <TouchableOpacity style={styles.contactRow} onPress={() => Linking.openURL('mailto:info@soulvibe2026.com')}>
            <MaterialIcons name="mail" size={18} color={SV.outline} />
            <View>
              <Text style={styles.contactLabel}>GENERAL_INQUIRIES</Text>
              <Text style={styles.contactValue}>info@soulvibe2026.com</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.contactRow} onPress={() => Linking.openURL('tel:+18008423911')}>
            <MaterialIcons name="support-agent" size={18} color={SV.outline} />
            <View>
              <Text style={styles.contactLabel}>EMERGENCY_SUPPORT</Text>
              <Text style={[styles.contactValue, { color: SV.primaryContainer }]}>+1 (800) VIBE-911</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* FAQ */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <MaterialIcons name="help" size={20} color={SV.primaryContainer} />
            <Text style={styles.cardTitle}>FAQ_MATRIX</Text>
          </View>
          {FAQS.map(f => <FaqItem key={f.q} q={f.q} a={f.a} />)}
        </View>

        {/* Partners */}
        <View style={styles.partnersSection}>
          <View style={styles.partnersTitleRow}>
            <MaterialIcons name="handshake" size={22} color={SV.primaryContainer} />
            <Text style={styles.partnersTitle}>OUR PARTNERS</Text>
          </View>
          <Text style={styles.partnersSubtitle}>
            The structural integrity of SoulVibe is reinforced by our allied corporate entities. These partners power the grid, sustain the hydration networks, and amplify the signal.
          </Text>
          <View style={styles.partnersGrid}>
            {PARTNERS.map(p => (
              <TouchableOpacity key={p.name} style={styles.partnerCard} activeOpacity={0.75}>
                <View style={styles.partnerIcon}>
                  <MaterialIcons name={p.icon as any} size={28} color={SV.outline} />
                </View>
                <Text style={styles.partnerName}>{p.name}</Text>
                <Text style={styles.partnerSub}>{p.sub}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
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

  pageHeader: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 20 },
  tagChip: {
    alignSelf: 'flex-start', backgroundColor: SV.surfaceContainer, borderWidth: 1, borderColor: SV.outlineVariant,
    paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, marginBottom: 12,
  },
  tagChipText: { color: SV.primaryFixedDim, fontFamily: 'monospace', fontSize: 11, letterSpacing: 1 },
  pageTitle: { color: SV.onSurface, fontSize: 32, fontWeight: '900', letterSpacing: -1, textTransform: 'uppercase', lineHeight: 36, marginBottom: 10 },
  pageSubtitle: { color: SV.onSurfaceVariant, fontSize: 16, lineHeight: 24, maxWidth: 340 },

  card: {
    marginHorizontal: 20, marginBottom: 16,
    backgroundColor: SV.surfaceGlass, borderTopWidth: 1, borderLeftWidth: 1, borderColor: SV.white10,
    borderRadius: 12, padding: 16,
  },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  cardTitle: { color: SV.onSurface, fontWeight: '700', fontSize: 15, letterSpacing: 1, textTransform: 'uppercase' },

  hoursRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderBottomWidth: 1, borderBottomColor: SV.surfaceVariant, paddingVertical: 12,
  },
  hoursDay: { color: SV.onSurfaceVariant, fontFamily: 'monospace', fontSize: 12, letterSpacing: 1 },
  hoursTime: { color: SV.onSurface, fontSize: 15 },
  hoursNote: { backgroundColor: SV.surfaceContainerHigh, borderRadius: 8, borderWidth: 1, borderColor: SV.outlineVariant, padding: 12, marginTop: 14 },
  hoursNoteLabel: { color: SV.primaryFixedDim, fontFamily: 'monospace', fontSize: 11, letterSpacing: 1.5, marginBottom: 4 },
  hoursNoteText: { color: SV.onSurfaceVariant, fontSize: 13, lineHeight: 18 },

  contactRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 14 },
  contactLabel: { color: SV.onSurfaceVariant, fontFamily: 'monospace', fontSize: 11, letterSpacing: 1, marginBottom: 2 },
  contactValue: { color: SV.onSurface, fontSize: 15 },

  faqItem: {
    borderWidth: 1, borderColor: SV.surfaceVariant, borderRadius: 8,
    backgroundColor: SV.surfaceContainer, marginBottom: 8, overflow: 'hidden',
  },
  faqItemOpen: { borderColor: SV.primaryContainer, ...neonShadow },
  faqHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14 },
  faqQ: { color: SV.onSurface, fontSize: 14, fontWeight: '700', flex: 1, marginRight: 8 },
  faqQOpen: { color: SV.primaryFixedDim },
  faqA: { color: SV.onSurfaceVariant, fontSize: 14, lineHeight: 20, paddingHorizontal: 14, paddingBottom: 14 },

  partnersSection: { paddingHorizontal: 20, paddingTop: 24 },
  partnersTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: 1, borderBottomColor: SV.surfaceVariant, paddingBottom: 14, marginBottom: 12 },
  partnersTitle: { color: SV.onSurface, fontSize: 22, fontWeight: '800', letterSpacing: -0.5, textTransform: 'uppercase' },
  partnersSubtitle: { color: SV.onSurfaceVariant, fontSize: 14, lineHeight: 20, marginBottom: 20 },
  partnersGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  partnerCard: {
    width: '30%', aspectRatio: 1, flexGrow: 1,
    backgroundColor: SV.surfaceGlass, borderTopWidth: 1, borderLeftWidth: 1, borderColor: SV.white10,
    borderRadius: 12, alignItems: 'center', justifyContent: 'center', padding: 12,
  },
  partnerIcon: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: SV.surfaceContainerHigh,
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  partnerName: { color: SV.onSurface, fontWeight: '800', fontSize: 13, letterSpacing: 1.5, textAlign: 'center' },
  partnerSub: { color: SV.primaryFixedDim, fontFamily: 'monospace', fontSize: 10, letterSpacing: 1, textAlign: 'center' },
});
