import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SV, neonShadow } from '@/constants/theme';
import { CartFAB, ScreenHeader } from '@/components/screen-header';
import { useLanguage } from '@/context/LanguageContext';
import { GlitchText } from '@/components/glitch-text';

// ─── Countdown ──────────────────────────────────────────────────────────────

const FESTIVAL_DATE = new Date('2026-07-18T18:00:00');

function useCountdown() {
  const [time, setTime] = useState({ days: 0, hrs: 0, min: 0, sec: 0 });
  useEffect(() => {
    const tick = () => {
      const diff = FESTIVAL_DATE.getTime() - Date.now();
      if (diff <= 0) return;
      setTime({
        days: Math.floor(diff / 86400000),
        hrs: Math.floor((diff % 86400000) / 3600000),
        min: Math.floor((diff % 3600000) / 60000),
        sec: Math.floor((diff % 60000) / 1000),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return time;
}

// ─── Animated elements ───────────────────────────────────────────────────────

function PulseDot({ color = SV.primaryContainer }: { color?: string }) {
  const scale = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.7, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return <Animated.View style={[styles.pulseDot, { backgroundColor: color, transform: [{ scale }] }]} />;
}

/** Scale-spring animated pressable */
function AnimPressable({
  onPress,
  style,
  children,
}: {
  onPress: () => void;
  style: any;
  children: React.ReactNode;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const pressIn = () =>
    Animated.spring(scale, { toValue: 0.94, useNativeDriver: true, speed: 50, bounciness: 4 }).start();
  const pressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 40, bounciness: 8 }).start();

  // Animated.View holds layout style (flex:1 works as direct flex-row child).
  // Pressable with absoluteFill captures touches without disrupting layout or hiding children.
  return (
    <Animated.View style={[style, { transform: [{ scale }] }]}>
      {children}
      <Pressable
        onPress={onPress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        style={StyleSheet.absoluteFill}
      />
    </Animated.View>
  );
}

function CountdownCell({ value, label, highlight }: { value: number; label: string; highlight?: boolean }) {
  return (
    <View style={[styles.countCell, highlight && styles.countCellHL]}>
      <Text style={[styles.countValue, highlight && styles.countValueHL]}>
        {String(value).padStart(2, '0')}
      </Text>
      <Text style={styles.countLabel}>{label}</Text>
    </View>
  );
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const time = useCountdown();
  const { lang } = useLanguage();
  const t = (en: string, hu: string) => lang === 'hu' ? hu : en;

  return (
    <View style={styles.root}>
      <ScreenHeader />

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <ImageBackground
          source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBrosGZqLhFkJiJd3S36P89FrIh8uvCREt6EKjYlJdJN1NCd3g6UtuZ9IDYQGOCrV8JDDsvErIr5sXHeTmWv8JEV4h7MMi-w0-e_Z_xXAmf2cmWmU8ePz31GuRw7hK1NzO-1uc8gl7_fJ-cRhCut1yIn7EO2j2w_F2XS77kVHp3EhOmcBOtMjs_thb_pTcvZwiUodln2b_Q8J0XuXMQ9o-i5v6tYsYYO7xOLltc9LOu5JYurS_LG4D42A95JQqnpXT7RU6ilh47ZyW2' }}
          style={styles.hero}>
          <View style={styles.heroOverlay} />
          <View style={styles.heroContent}>
            <View style={{ flex: 1 }} />
            <View style={styles.liveBadge}>
              <PulseDot />
              <Text style={styles.liveBadgeText}>{t('SYS.INIT // JULY 18 2026', 'RENDSZER.INIT // 2026. JÚL. 18.')}</Text>
            </View>
            <GlitchText style={styles.heroTitle}>{t('THE PULSE\nAWAKENS', 'A PULZUS\nFELÉBRED')}</GlitchText>
            <View style={styles.countRow}>
              <CountdownCell value={time.days} label={t('DAYS', 'NAP')} />
              <CountdownCell value={time.hrs} label={t('HRS', 'ÓRA')} />
              <CountdownCell value={time.min} label={t('MIN', 'PERC')} />
              <CountdownCell value={time.sec} label={t('SEC', 'MP')} highlight />
            </View>
            <View style={styles.heroActions}>
              <AnimPressable style={styles.btnPrimary} onPress={() => router.push('/profile' as any)}>
                <Text style={styles.btnPrimaryText}>{t('MY TICKET', 'JEGYEM')}</Text>
              </AnimPressable>
              <AnimPressable style={styles.btnOutline} onPress={() => router.push('/lineup' as any)}>
                <Text style={styles.btnOutlineText}>{t('LINEUP', 'PROGRAM')}</Text>
              </AnimPressable>
            </View>
            <View style={{ height: 28 }} />
          </View>
        </ImageBackground>

        {/* Next Up */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <MaterialIcons name="sensors" size={18} color={SV.primaryContainer} />
              <Text style={styles.sectionTitle}>{t('NEXT UP', 'KÖVETKEZŐ')}</Text>
            </View>
            <Pressable onPress={() => router.push('/lineup' as any)}>
              <Text style={styles.sectionLink}>{t('VIEW ALL', 'ÖSSZES')}</Text>
            </Pressable>
          </View>

          <AnimPressable style={styles.featuredCard} onPress={() => router.push('/lineup' as any)}>
            <ImageBackground
              source={{ uri: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=800&auto=format&fit=crop' }}
              style={styles.featuredBg}
              imageStyle={{ borderRadius: 12 }}>
              <View style={styles.featuredOverlay} />
              <View style={styles.liveNowBadge}>
                <PulseDot />
                <Text style={styles.liveNowText}>{t('LIVE NOW', 'ÉLŐ ADÁS')}</Text>
              </View>
              <View style={styles.featuredInfo}>
                <Text style={styles.featuredStage}>{t('MAIN STAGE // THE FORGE', 'FŐSZÍNPAD // THE FORGE')}</Text>
                <Text style={styles.featuredArtist}>KONTRAVØID</Text>
                <Text style={styles.featuredGenre}>Industrial / Darkwave Set</Text>
              </View>
            </ImageBackground>
          </AnimPressable>

          {[
            { time: '22:00 - 23:30', name: 'HAAi', stage: 'THE SILO' },
            { time: '23:30 - 01:00', name: 'VTSS', stage: 'THE SILO' },
          ].map(act => (
            <AnimPressable key={act.name} style={styles.upcomingCard} onPress={() => router.push('/lineup' as any)}>
              <View style={styles.upcomingAccent} />
              <View style={styles.upcomingThumb}>
                <MaterialIcons name="music-note" size={22} color={SV.outlineVariant} />
              </View>
              <View style={styles.upcomingInfo}>
                <Text style={styles.upcomingTime}>{act.time}</Text>
                <Text style={styles.upcomingArtist}>{act.name}</Text>
                <Text style={styles.upcomingStage}>{act.stage}</Text>
              </View>
            </AnimPressable>
          ))}

          <AnimPressable style={styles.fullScheduleBtn} onPress={() => router.push('/lineup' as any)}>
            <Text style={styles.fullScheduleText}>{t('FULL SCHEDULE', 'TELJES PROGRAM')}</Text>
            <MaterialIcons name="arrow-forward" size={16} color={SV.onSurfaceVariant} />
          </AnimPressable>
        </View>

        {/* System Log */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <MaterialIcons name="feed" size={18} color={SV.outline} />
              <Text style={styles.sectionTitle}>{t('SYSTEM LOG', 'RENDSZERNAPLÓ')}</Text>
            </View>
          </View>

          {[
            {
              badge: t('ALERT', 'FIGYELMEZTETÉS'),
              badgeStyle: styles.alertBadge,
              badgeText: styles.alertBadgeText,
              time: t('2 HOURS AGO', '2 ÓRÁVAL EZELŐTT'),
              title: t('Lockers Running Low', 'Szekrények fogyóban'),
              body: t('Secure your gear. Standard lockers in Sector 4 are nearly at capacity.', 'Gondoskodj a felszerelésedről. A 4-es szektorban lévő standard szekrények szinte megteltek.'),
              cta: t('BOOK LOCKER', 'SZEKRÉNY FOGLALÁS'),
            },
            {
              badge: 'INFO',
              badgeStyle: styles.infoBadge,
              badgeText: styles.infoBadgeText,
              time: t('1 DAY AGO', '1 NAPJA'),
              title: t("New Merch Drop: 'GRID' Collection", "Új merch: 'GRID' Kollekció"),
              body: t('Exclusive run of 200 heavy-weight organic cotton tees featuring the 2026 Grid design.', '200 darabos exkluzív, nehézsúlyú organikus pamut póló a 2026-os Grid dizájnnal.'),
              cta: t('PREVIEW DROP', 'ELŐNÉZET'),
            },
          ].map((item, i) => (
            <View key={item.title} style={[styles.logCard, i > 0 && { marginTop: 12 }]}>
              <View style={styles.logCardHeader}>
                <View style={item.badgeStyle}><Text style={item.badgeText}>{item.badge}</Text></View>
                <Text style={styles.logTime}>{item.time}</Text>
              </View>
              <Text style={styles.logTitle}>{item.title}</Text>
              <Text style={styles.logBody}>{item.body}</Text>
              <AnimPressable style={styles.logBtn} onPress={() => { }}>
                <Text style={styles.logBtnText}>{item.cta}</Text>
              </AnimPressable>
            </View>
          ))}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <CartFAB count={2} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: SV.background },
  scroll: { flex: 1 },

  // Hero
  hero: { height: 500 },
  heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(18,18,18,0.55)' },
  heroContent: { flex: 1, paddingHorizontal: 20, alignItems: 'center' },
  liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(42,42,42,0.85)', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, borderWidth: 1, borderColor: SV.white10, marginBottom: 14 },
  pulseDot: { width: 8, height: 8, borderRadius: 4 },
  liveBadgeText: { color: SV.onSurface, fontFamily: 'monospace', fontSize: 11, letterSpacing: 1.5 },
  heroTitle: { color: SV.primaryContainer, fontSize: 36, fontWeight: '900', letterSpacing: -1, textTransform: 'uppercase', textAlign: 'center', marginBottom: 20, textShadowColor: 'rgba(57,255,20,0.5)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 12 },

  countRow: { flexDirection: 'row', gap: 8, marginBottom: 24, width: '100%', justifyContent: 'center' },
  countCell: { flex: 1, alignItems: 'center', backgroundColor: 'rgba(18,18,18,0.85)', borderRadius: 4, paddingVertical: 10, borderWidth: 1, borderColor: SV.outlineVariant },
  countCellHL: { borderColor: SV.primaryContainer },
  countValue: { color: SV.onSurface, fontSize: 26, fontWeight: '800', fontFamily: 'monospace' },
  countValueHL: { color: SV.primaryContainer },
  countLabel: { color: SV.outline, fontFamily: 'monospace', fontSize: 10, letterSpacing: 1.5 },

  heroActions: { flexDirection: 'row', gap: 14, width: '100%', maxWidth: 320 },
  btnPrimary: { flex: 1, backgroundColor: SV.primaryContainer, paddingVertical: 14, borderRadius: 10, alignItems: 'center', ...neonShadow },
  btnPrimaryText: { color: SV.deepCharcoal, fontWeight: '800', fontSize: 13, letterSpacing: 1.5, textTransform: 'uppercase' },
  btnOutline: { flex: 1, borderWidth: 1.5, borderColor: SV.primaryContainer, paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  btnOutlineText: { color: SV.primaryContainer, fontWeight: '800', fontSize: 13, letterSpacing: 1.5, textTransform: 'uppercase' },

  // Sections
  section: { paddingHorizontal: 16, paddingTop: 32 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)', paddingBottom: 10 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { color: SV.onSurfaceVariant, fontFamily: 'monospace', fontSize: 11, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase' },
  sectionLink: { color: SV.primaryFixedDim, fontFamily: 'monospace', fontSize: 11, letterSpacing: 0.5 },

  featuredCard: { borderRadius: 14, overflow: 'hidden', marginBottom: 10 },
  featuredBg: { height: 240, justifyContent: 'flex-end' },
  featuredOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(10,10,10,0.5)' },
  liveNowBadge: { position: 'absolute', top: 12, right: 12, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(57,255,20,0.18)', borderWidth: 1, borderColor: SV.primaryContainer, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  liveNowText: { color: SV.primaryContainer, fontFamily: 'monospace', fontSize: 10, letterSpacing: 1.5 },
  featuredInfo: { padding: 16 },
  featuredStage: { color: SV.primaryContainer, fontFamily: 'monospace', fontSize: 11, letterSpacing: 1.5, marginBottom: 4 },
  featuredArtist: { color: SV.onSurface, fontSize: 22, fontWeight: '800', textTransform: 'uppercase', letterSpacing: -0.5 },
  featuredGenre: { color: SV.onSurfaceVariant, fontSize: 14, marginTop: 4 },

  upcomingCard: { backgroundColor: SV.deepCharcoal, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, marginBottom: 8, overflow: 'hidden' },
  upcomingAccent: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, backgroundColor: SV.primaryContainer },
  upcomingThumb: { width: 48, height: 48, backgroundColor: SV.surfaceContainerHigh, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  upcomingInfo: { flex: 1 },
  upcomingTime: { color: SV.outline, fontFamily: 'monospace', fontSize: 11, letterSpacing: 1 },
  upcomingArtist: { color: SV.onSurface, fontSize: 14, fontWeight: '700', textTransform: 'uppercase' },
  upcomingStage: { color: SV.onSurfaceVariant, fontFamily: 'monospace', fontSize: 10, marginTop: 2 },

  fullScheduleBtn: { backgroundColor: SV.deepCharcoal, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 4 },
  fullScheduleText: { color: SV.onSurfaceVariant, fontFamily: 'monospace', fontSize: 12, letterSpacing: 1 },

  logCard: { backgroundColor: SV.deepCharcoal, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: 16, overflow: 'hidden' },
  logCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  alertBadge: { backgroundColor: 'rgba(208,91,255,0.15)', borderWidth: 1, borderColor: 'rgba(208,91,255,0.3)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  alertBadgeText: { color: SV.secondaryFixedDim, fontFamily: 'monospace', fontSize: 10, letterSpacing: 1 },
  infoBadge: { backgroundColor: SV.surfaceContainerHigh, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  infoBadgeText: { color: SV.onSurfaceVariant, fontFamily: 'monospace', fontSize: 10, letterSpacing: 1 },
  logTime: { color: SV.outline, fontFamily: 'monospace', fontSize: 11 },
  logTitle: { color: SV.onSurface, fontSize: 15, fontWeight: '700', marginBottom: 6 },
  logBody: { color: SV.onSurfaceVariant, fontSize: 14, lineHeight: 21, marginBottom: 14 },
  logBtn: { alignSelf: 'flex-start', backgroundColor: SV.surfaceContainerHigh, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  logBtnText: { color: SV.onSurface, fontFamily: 'monospace', fontSize: 11, letterSpacing: 1 },
});
