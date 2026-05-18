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

/**
 * Scale-spring animated pressable.
 * Layout style goes on Animated.View (direct child of flex parent → flex:1 works).
 * Pressable is absoluteFill underneath children so it captures touches without
 * interfering with flex layout or child positioning.
 */
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
    Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, speed: 50, bounciness: 4 }).start();
  const pressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 40, bounciness: 8 }).start();

  return (
    <Animated.View style={[style, { transform: [{ scale }] }]}>
      <Pressable
        onPress={onPress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        style={StyleSheet.absoluteFill}
      />
      {children}
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
              <Text style={styles.liveBadgeText}>SYS.INIT // JULY 18 2026</Text>
            </View>
            <Text style={styles.heroTitle}>THE PULSE{'\n'}AWAKENS</Text>
            <View style={styles.countRow}>
              <CountdownCell value={time.days} label="DAYS" />
              <CountdownCell value={time.hrs} label="HRS" />
              <CountdownCell value={time.min} label="MIN" />
              <CountdownCell value={time.sec} label="SEC" highlight />
            </View>
            <View style={styles.heroActions}>
              <AnimPressable style={styles.btnPrimary} onPress={() => router.push('/profile' as any)}>
                <Text style={styles.btnPrimaryText}>MY TICKET</Text>
              </AnimPressable>
              <AnimPressable style={styles.btnOutline} onPress={() => router.push('/lineup' as any)}>
                <Text style={styles.btnOutlineText}>LINEUP</Text>
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
              <Text style={styles.sectionTitle}>NEXT UP</Text>
            </View>
            <Pressable onPress={() => router.push('/lineup' as any)}>
              <Text style={styles.sectionLink}>VIEW ALL</Text>
            </Pressable>
          </View>

          <AnimPressable style={styles.featuredCard} onPress={() => router.push('/lineup' as any)}>
            <ImageBackground
              source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC5Iw3yAj4fagXH7ijJhLWHMUCYgTmJmGN-ax2qNAKnBNdx-uHy5js6jlEYMQl4jnHyEtLRleMfDY3lp3HRnEUI7MLNTWNt9DVT2bCowdZDC8SDFq72uJs48Z7JU6Fr9MEbBloB6LcHm3GPZkYwPk3suTWNC09PpxrgCjNG0t04kq9KDqsW7pYH8Kf2ooWB05pLrdGk3Q364YhRPEZHK-P4fY6mDDVG9Z9txvssKhmV9jo7mQonbCjm3Q__nZBlANELP1aUTlsz7gcG' }}
              style={styles.featuredBg}
              imageStyle={{ borderRadius: 12 }}>
              <View style={styles.featuredOverlay} />
              <View style={styles.liveNowBadge}>
                <PulseDot />
                <Text style={styles.liveNowText}>LIVE NOW</Text>
              </View>
              <View style={styles.featuredInfo}>
                <Text style={styles.featuredStage}>MAIN STAGE // THE FORGE</Text>
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
              <View style={styles.upcomingThumb} />
              <View style={styles.upcomingInfo}>
                <Text style={styles.upcomingTime}>{act.time}</Text>
                <Text style={styles.upcomingArtist}>{act.name}</Text>
                <Text style={styles.upcomingStage}>{act.stage}</Text>
              </View>
            </AnimPressable>
          ))}

          <AnimPressable style={styles.fullScheduleBtn} onPress={() => router.push('/lineup' as any)}>
            <Text style={styles.fullScheduleText}>FULL SCHEDULE</Text>
            <MaterialIcons name="arrow-forward" size={16} color={SV.onSurfaceVariant} />
          </AnimPressable>
        </View>

        {/* System Log */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <MaterialIcons name="feed" size={18} color={SV.outline} />
              <Text style={styles.sectionTitle}>SYSTEM LOG</Text>
            </View>
          </View>

          {[
            { badge: 'ALERT', badgeStyle: styles.alertBadge, badgeText: styles.alertBadgeText, time: '2 HOURS AGO', title: 'Lockers Running Low', body: 'Secure your gear. Standard lockers in Sector 4 are nearly at capacity.', cta: 'BOOK LOCKER' },
            { badge: 'INFO', badgeStyle: styles.infoBadge, badgeText: styles.infoBadgeText, time: '1 DAY AGO', title: "New Merch Drop: 'GRID' Collection", body: 'Exclusive run of 200 heavy-weight organic cotton tees featuring the 2026 Grid design.', cta: 'PREVIEW DROP' },
          ].map((item, i) => (
            <View key={item.title} style={[styles.logCard, i > 0 && { marginTop: 12 }]}>
              <View style={styles.logCardHeader}>
                <View style={item.badgeStyle}><Text style={item.badgeText}>{item.badge}</Text></View>
                <Text style={styles.logTime}>{item.time}</Text>
              </View>
              <Text style={styles.logTitle}>{item.title}</Text>
              <Text style={styles.logBody}>{item.body}</Text>
              <AnimPressable style={styles.logBtn} onPress={() => {}}>
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

  heroActions: { flexDirection: 'row', gap: 12, width: '100%', maxWidth: 340 },
  btnPrimary: { flex: 1, backgroundColor: SV.primaryContainer, paddingVertical: 15, borderRadius: 8, alignItems: 'center', justifyContent: 'center', ...neonShadow },
  btnPrimaryText: { color: '#0a1a00', fontWeight: '900', fontSize: 14, letterSpacing: 1.5, textTransform: 'uppercase' },
  btnOutline: { flex: 1, borderWidth: 1.5, borderColor: SV.primaryContainer, paddingVertical: 15, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  btnOutlineText: { color: SV.primaryContainer, fontWeight: '900', fontSize: 14, letterSpacing: 1.5, textTransform: 'uppercase' },

  // Sections
  section: { paddingHorizontal: 20, paddingTop: 36 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16, borderBottomWidth: 1, borderBottomColor: SV.outlineVariant, paddingBottom: 8 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { color: SV.onSurface, fontFamily: 'monospace', fontSize: 13, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase' },
  sectionLink: { color: SV.onSurfaceVariant, fontFamily: 'monospace', fontSize: 11, letterSpacing: 1 },

  featuredCard: { borderRadius: 12, overflow: 'hidden', marginBottom: 10, ...neonShadow },
  featuredBg: { height: 250, justifyContent: 'flex-end' },
  featuredOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(18,18,18,0.45)' },
  liveNowBadge: { position: 'absolute', top: 12, right: 12, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(57,255,20,0.2)', borderWidth: 1, borderColor: SV.primaryContainer, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  liveNowText: { color: SV.primaryContainer, fontFamily: 'monospace', fontSize: 10, letterSpacing: 1.5 },
  featuredInfo: { padding: 16 },
  featuredStage: { color: SV.primaryContainer, fontFamily: 'monospace', fontSize: 11, letterSpacing: 1.5, marginBottom: 4 },
  featuredArtist: { color: SV.onSurface, fontSize: 22, fontWeight: '800', textTransform: 'uppercase', letterSpacing: -0.5 },
  featuredGenre: { color: SV.onSurfaceVariant, fontSize: 14, marginTop: 4 },

  upcomingCard: { backgroundColor: SV.surfaceContainer, borderRadius: 8, borderTopWidth: 1, borderLeftWidth: 1, borderColor: SV.white10, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, marginBottom: 8, overflow: 'hidden' },
  upcomingAccent: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, backgroundColor: SV.outlineVariant },
  upcomingThumb: { width: 52, height: 52, backgroundColor: SV.surfaceVariant, borderRadius: 4, borderWidth: 1, borderColor: SV.outlineVariant },
  upcomingInfo: { flex: 1 },
  upcomingTime: { color: SV.outline, fontFamily: 'monospace', fontSize: 11, letterSpacing: 1 },
  upcomingArtist: { color: SV.onSurface, fontSize: 15, fontWeight: '700', textTransform: 'uppercase' },
  upcomingStage: { color: SV.onSurfaceVariant, fontFamily: 'monospace', fontSize: 10, marginTop: 2 },

  fullScheduleBtn: { backgroundColor: SV.surfaceContainer, borderRadius: 8, borderWidth: 1, borderColor: SV.outlineVariant, borderStyle: 'dashed', padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 4 },
  fullScheduleText: { color: SV.onSurfaceVariant, fontFamily: 'monospace', fontSize: 12, letterSpacing: 1 },

  logCard: { backgroundColor: SV.surfaceContainerLow, borderTopWidth: 1, borderLeftWidth: 1, borderColor: SV.white10, borderRadius: 12, padding: 16 },
  logCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  alertBadge: { backgroundColor: 'rgba(208,91,255,0.15)', borderWidth: 1, borderColor: 'rgba(208,91,255,0.3)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 3 },
  alertBadgeText: { color: SV.secondaryFixedDim, fontFamily: 'monospace', fontSize: 10, letterSpacing: 1 },
  infoBadge: { backgroundColor: SV.surfaceVariant, borderWidth: 1, borderColor: SV.outlineVariant, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 3 },
  infoBadgeText: { color: SV.onSurface, fontFamily: 'monospace', fontSize: 10, letterSpacing: 1 },
  logTime: { color: SV.outline, fontFamily: 'monospace', fontSize: 11 },
  logTitle: { color: SV.onSurface, fontSize: 16, fontWeight: '700', marginBottom: 6 },
  logBody: { color: SV.onSurfaceVariant, fontSize: 14, lineHeight: 20, marginBottom: 12 },
  logBtn: { alignSelf: 'flex-start', borderWidth: 1, borderColor: SV.outlineVariant, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 3 },
  logBtnText: { color: SV.onSurface, fontFamily: 'monospace', fontSize: 11, letterSpacing: 1 },
});
