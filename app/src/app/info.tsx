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
import { useLanguage } from '@/context/LanguageContext';

const HOURS_DATA = [
  { en: 'FRI_JUL_18', hu: 'PÉN_JÚL_18', time: '18:00 - 06:00' },
  { en: 'SAT_JUL_19', hu: 'SZO_JÚL_19', time: '15:00 - 08:00' },
  { en: 'SUN_JUL_20', hu: 'V_JÚL_20', time: '12:00 - 23:59' },
];

const FAQS_DATA = [
  {
    q: { en: 'What is the prohibited items list?', hu: 'Mi a tiltott tárgyak listája?' },
    a: {
      en: 'We employ a strict techno-minimalist approach to entry. Prohibited items include: professional camera equipment, illegal substances, weapons of any kind, outside food/beverage, and large backpacks. Hydration packs are permitted if empty upon entry.',
      hu: 'Szigorú megközelítést alkalmazunk a beléptetésnél. Tiltott tárgyak: professzionális fényképezőfelszerelés, tiltott anyagok, bármilyen fegyver, külső étel/ital, nagy hátizsákok. Hidratáló táskák üres állapotban megengedettek.',
    },
  },
  {
    q: { en: 'Are lockers available on site?', hu: 'Elérhetők szekrények a helyszínen?' },
    a: { en: 'Yes — standard and large lockers are available in Sectors 2 and 4. Pre-book via the app or at the entrance.', hu: 'Igen — standard és nagy szekrények a 2-es és 4-es Szektorban. Előre foglalható az alkalmazáson vagy a bejáratnál.' },
  },
  {
    q: { en: 'How does cashless payment work?', hu: 'Hogyan működik a készpénzmentes fizetés?' },
    a: { en: 'Load HUF onto your festival wristband via the Wallet section of this app. All vendors accept wristband payments only.', hu: 'Töltsd fel a karszalagodat HUF-ban az alkalmazás Pénztárca szekciójában. Minden árus csak karszalag-fizetést fogad el.' },
  },
  {
    q: { en: 'Is there an age restriction?', hu: 'Van korhatár?' },
    a: { en: 'SoulVibe Festival 2026 is 18+. Valid ID required at entry.', hu: 'A SoulVibe Fesztivál 2026 18+ esemény. Érvényes személyi igazolvány szükséges a belépéshez.' },
  },
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

export function InfoScreen() {
  const { lang } = useLanguage();
  const t = (en: string, hu: string) => lang === 'hu' ? hu : en;
  const HOURS = HOURS_DATA.map(h => ({ day: lang === 'hu' ? h.hu : h.en, time: h.time }));
  const FAQS = FAQS_DATA.map(f => ({ q: f.q[lang], a: f.a[lang] }));

  return (
    <View style={styles.root}>
      <ScreenHeader />

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Page header */}
        <View style={styles.pageHeader}>
          <View style={styles.tagChip}>
            <Text style={styles.tagChipText}>{t('DATA.CORE // INFO', 'ADAT.MAG // INFO')}</Text>
          </View>
          <Text style={styles.pageTitle}>{t('FESTIVAL\nINTELLIGENCE', 'FESZTIVÁL\nINFORMÁCIÓ')}</Text>
          <Text style={styles.pageSubtitle}>
            {t('Essential logistics, operational hours, and the vital partners powering the pulse of SoulVibe 2026.', 'Alapvető logisztika, nyitvatartási idők és a SoulVibe 2026 lüktetését biztosító kulcspartnerek.')}
          </Text>
        </View>

        {/* Hours Card */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <MaterialIcons name="schedule" size={20} color={SV.primaryContainer} />
            <Text style={styles.cardTitle}>{t('OPERATIONAL HOURS', 'NYITVATARTÁS')}</Text>
          </View>
          {HOURS.map(h => (
            <View key={h.day} style={styles.hoursRow}>
              <Text style={styles.hoursDay}>{h.day}</Text>
              <Text style={styles.hoursTime}>{h.time}</Text>
            </View>
          ))}
          <View style={styles.hoursNote}>
            <Text style={styles.hoursNoteLabel}>{t('GATES OPEN', 'KAPUK NYITVA')}</Text>
            <Text style={styles.hoursNoteText}>
              {t('Box office closes 2 hours before event end time each night. No re-entry permitted after 02:00.', 'A pénztár minden este 2 órával a rendezvény vége előtt zár. Visszalépés 02:00 után nem engedélyezett.')}
            </Text>
          </View>
        </View>

        {/* Contact Card */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <MaterialIcons name="radar" size={20} color={SV.primaryContainer} />
            <Text style={styles.cardTitle}>{t('CONTACT HQ', 'KAPCSOLAT')}</Text>
          </View>
          <TouchableOpacity style={styles.contactRow} onPress={() => Linking.openURL('mailto:info@soulvibe2026.com')}>
            <MaterialIcons name="mail" size={18} color={SV.outline} />
            <View>
              <Text style={styles.contactLabel}>{t('GENERAL_INQUIRIES', 'ÁLTALÁNOS_MEGKERESÉSEK')}</Text>
              <Text style={styles.contactValue}>info@soulvibe2026.com</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.contactRow} onPress={() => Linking.openURL('tel:+18008423911')}>
            <MaterialIcons name="support-agent" size={18} color={SV.outline} />
            <View>
              <Text style={styles.contactLabel}>{t('EMERGENCY_SUPPORT', 'VÉSZHELYZETI_TÁMOGATÁS')}</Text>
              <Text style={[styles.contactValue, { color: SV.primaryContainer }]}>+1 (800) VIBE-911</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* FAQ */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <MaterialIcons name="help" size={20} color={SV.primaryContainer} />
            <Text style={styles.cardTitle}>{t('FAQ_MATRIX', 'GYIK_MÁTRIX')}</Text>
          </View>
          {FAQS.map(f => <FaqItem key={f.q} q={f.q} a={f.a} />)}
        </View>

        {/* Partners */}
        <View style={styles.partnersSection}>
          <View style={styles.partnersTitleRow}>
            <MaterialIcons name="handshake" size={22} color={SV.primaryContainer} />
            <Text style={styles.partnersTitle}>{t('OUR PARTNERS', 'PARTNEREINK')}</Text>
          </View>
          <Text style={styles.partnersSubtitle}>
            {t('The structural integrity of SoulVibe is reinforced by our allied corporate entities. These partners power the grid, sustain the hydration networks, and amplify the signal.', 'A SoulVibe szerkezeti integritását szövetséges vállalati partnereink erősítik. Ők biztosítják az áramot, fenntartják a hidratációs hálózatot és felerősítik a jelet.')}
          </Text>
          <View style={styles.partnersGrid}>
            {PARTNERS.map(p => (
              <TouchableOpacity key={p.name} style={styles.partnerCard} activeOpacity={0.75}>
                <View style={[styles.partnerIcon, { backgroundColor: `${p.glowColor}22` }]}>
                  <MaterialIcons name={p.icon as any} size={26} color={p.glowColor} />
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

  scroll: { flex: 1 },

  pageHeader: { paddingHorizontal: 16, paddingTop: 24, paddingBottom: 20 },
  tagChip: {
    alignSelf: 'flex-start', backgroundColor: SV.surfaceContainerHigh, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, marginBottom: 12,
  },
  tagChipText: { color: SV.primaryFixedDim, fontFamily: 'monospace', fontSize: 11, letterSpacing: 1 },
  pageTitle: { color: SV.onSurface, fontSize: 28, fontWeight: '900', letterSpacing: -0.5, textTransform: 'uppercase', lineHeight: 34, marginBottom: 10 },
  pageSubtitle: { color: SV.onSurfaceVariant, fontSize: 15, lineHeight: 22, maxWidth: 340 },

  card: {
    marginHorizontal: 16, marginBottom: 14,
    backgroundColor: SV.deepCharcoal, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14, padding: 16,
  },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)', paddingBottom: 12 },
  cardTitle: { color: SV.onSurface, fontFamily: 'monospace', fontWeight: '700', fontSize: 12, letterSpacing: 1.5, textTransform: 'uppercase' },

  hoursRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)', paddingVertical: 13,
  },
  hoursDay: { color: SV.onSurfaceVariant, fontFamily: 'monospace', fontSize: 12, letterSpacing: 1 },
  hoursTime: { color: SV.onSurface, fontSize: 14, fontWeight: '600' },
  hoursNote: { backgroundColor: SV.surfaceContainerHigh, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(57,255,20,0.15)', padding: 12, marginTop: 14 },
  hoursNoteLabel: { color: SV.primaryFixedDim, fontFamily: 'monospace', fontSize: 11, letterSpacing: 1.5, marginBottom: 4 },
  hoursNoteText: { color: SV.onSurfaceVariant, fontSize: 13, lineHeight: 19 },

  contactRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, marginBottom: 16 },
  contactLabel: { color: SV.onSurfaceVariant, fontFamily: 'monospace', fontSize: 10, letterSpacing: 1, marginBottom: 3 },
  contactValue: { color: SV.onSurface, fontSize: 14, fontWeight: '600' },

  faqItem: {
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', borderRadius: 10,
    backgroundColor: SV.surfaceContainerLow, marginBottom: 8, overflow: 'hidden',
  },
  faqItemOpen: { borderColor: 'rgba(57,255,20,0.35)' },
  faqHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14 },
  faqQ: { color: SV.onSurface, fontSize: 14, fontWeight: '600', flex: 1, marginRight: 8, lineHeight: 20 },
  faqQOpen: { color: SV.primaryFixedDim },
  faqA: { color: SV.onSurfaceVariant, fontSize: 13, lineHeight: 20, paddingHorizontal: 14, paddingBottom: 14 },

  partnersSection: { paddingHorizontal: 16, paddingTop: 24 },
  partnersTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)', paddingBottom: 14, marginBottom: 14 },
  partnersTitle: { color: SV.onSurface, fontSize: 20, fontWeight: '800', letterSpacing: -0.3, textTransform: 'uppercase' },
  partnersSubtitle: { color: SV.onSurfaceVariant, fontSize: 13, lineHeight: 20, marginBottom: 16 },
  partnersGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  partnerCard: {
    width: '30%', aspectRatio: 1, flexGrow: 1,
    backgroundColor: SV.deepCharcoal, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14, alignItems: 'center', justifyContent: 'center', padding: 12,
  },
  partnerIcon: {
    width: 52, height: 52, borderRadius: 26,
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  partnerName: { color: SV.onSurface, fontWeight: '700', fontSize: 12, letterSpacing: 1, textAlign: 'center' },
  partnerSub: { color: SV.onSurfaceVariant, fontFamily: 'monospace', fontSize: 10, letterSpacing: 0.5, textAlign: 'center', marginTop: 2 },
});
