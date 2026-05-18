import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useRef, useEffect, useState } from 'react';
import {
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SV, neonShadow } from '@/constants/theme';
import { CartFAB, ScreenHeader } from '@/components/screen-header';

type Day = 'JUL 18' | 'JUL 19' | 'JUL 20';
type Stage = 'THE GRID' | 'SUBURBIA' | 'THE BASEMENT';

const SCHEDULE: Record<Day, Record<Stage, { time: string; artist: string; genre: string; live?: boolean; fav?: boolean }[]>> = {
  'JUL 18': {
    'THE GRID': [
      { time: '22:00', artist: 'AMELIE LENS', genre: 'INDUSTRIAL TECHNO', live: true, fav: true },
      { time: '00:00', artist: 'CHARLOTTE DE WITTE', genre: 'ACID TECHNO' },
      { time: '02:00', artist: 'TRAVIS SCOTT', genre: 'TRAP / HIP-HOP' },
      { time: '04:00', artist: 'PLAYBOI CARTI', genre: 'EXPERIMENTAL TRAP', fav: true },
    ],
    'SUBURBIA': [
      { time: '21:30', artist: 'AZAHRIAH', genre: 'RAP / POP', live: true },
      { time: '23:00', artist: 'HAAI', genre: 'DISCO TECHNO' },
      { time: '01:30', artist: 'VTSS', genre: 'EBM / CLUB' },
    ],
    'THE BASEMENT': [
      { time: '23:00', artist: 'DARIA KOLOSOVA', genre: 'TECH HOUSE', live: true },
      { time: '02:00', artist: 'I HATE MODELS', genre: 'INDUSTRIAL TECHNO' },
    ],
  },
  'JUL 19': {
    'THE GRID': [
      { time: '22:00', artist: 'KONTRAVØID', genre: 'DARKWAVE' },
      { time: '00:00', artist: 'RICHIE HAWTIN', genre: 'MINIMAL TECHNO' },
      { time: '03:00', artist: 'OFFSET', genre: 'TRAP / RAP' },
    ],
    'SUBURBIA': [
      { time: '21:00', artist: 'SOOLKING', genre: 'RAP' },
      { time: '23:30', artist: 'DEMBÉLÉ', genre: 'AFROBEATS' },
    ],
    'THE BASEMENT': [
      { time: '22:30', artist: 'INNELLEA', genre: 'MELODIC TECHNO' },
      { time: '01:00', artist: 'MATHAME', genre: 'MELODIC TECHNO' },
    ],
  },
  'JUL 20': {
    'THE GRID': [
      { time: '20:00', artist: 'ADAM BEYER', genre: 'TECHNO' },
      { time: '22:30', artist: 'JOSEPH CAPRIATI', genre: 'TECHNO' },
    ],
    'SUBURBIA': [
      { time: '19:00', artist: 'YOUNG THUG', genre: 'TRAP' },
      { time: '21:30', artist: 'LIL UZI VERT', genre: 'RAP' },
    ],
    'THE BASEMENT': [
      { time: '21:00', artist: 'RECONDITE', genre: 'AMBIENT TECHNO' },
      { time: '23:30', artist: 'BURIAL', genre: 'ELECTRONIC' },
    ],
  },
};

function PulseDot() {
  const scale = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.6, duration: 900, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return <Animated.View style={[styles.pulseDot, { transform: [{ scale }] }]} />;
}

export default function LineupScreen() {
  const [day, setDay] = useState<Day>('JUL 18');
  const [stage, setStage] = useState<Stage>('THE GRID');
  const [favs, setFavs] = useState<Record<string, boolean>>({ 'AMELIE LENS': true, 'PLAYBOI CARTI': true });

  const acts = SCHEDULE[day][stage] ?? [];
  const toggleFav = (artist: string) => setFavs(f => ({ ...f, [artist]: !f[artist] }));

  return (
    <View style={styles.root}>
      <ScreenHeader />

      {/* Day Tabs */}
      <View style={styles.dayTabs}>
        {(['JUL 18', 'JUL 19', 'JUL 20'] as Day[]).map(d => (
          <TouchableOpacity key={d} style={styles.dayTab} onPress={() => setDay(d)}>
            <Text style={[styles.dayTabText, d === day && styles.dayTabTextActive]}>{d}</Text>
            <View style={[styles.dayTabLine, d === day && styles.dayTabLineActive]} />
          </TouchableOpacity>
        ))}
      </View>

      {/* Stage Chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.stageScroll} contentContainerStyle={styles.stageScrollContent}>
        {(['THE GRID', 'SUBURBIA', 'THE BASEMENT'] as Stage[]).map(s => (
          <TouchableOpacity key={s} onPress={() => setStage(s)}
            style={[styles.stageChip, s === stage && styles.stageChipActive]}>
            <Text style={[styles.stageChipText, s === stage && styles.stageChipTextActive]}>{s}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Timeline */}
      <ScrollView style={styles.timeline} showsVerticalScrollIndicator={false}>
        {acts.map((act, i) => (
          <View key={act.artist} style={[styles.timelineItem, i < acts.length - 1 && styles.timelineItemBorder]}>
            {/* Time column */}
            <View style={styles.timeCol}>
              <Text style={[styles.timeText, act.live && styles.timeTextLive]}>{act.time}</Text>
            </View>
            {/* Timeline dot */}
            <View style={styles.dotCol}>
              {act.live ? <PulseDot /> : <View style={styles.dotInactive} />}
              {i < acts.length - 1 && <View style={styles.timelineLine} />}
            </View>
            {/* Card */}
            <TouchableOpacity
              style={[styles.actCard, act.live && styles.actCardLive]}
              onPress={() => {}}>
              {act.live && <View style={styles.actCardLiveTint} />}
              <View style={styles.actCardHeader}>
                <View>
                  {act.live && (
                    <View style={styles.liveLabel}>
                      <Text style={styles.liveLabelText}>LIVE NOW</Text>
                    </View>
                  )}
                  <Text style={[styles.actName, act.live && styles.actNameLive]}>{act.artist}</Text>
                  <Text style={styles.actGenre}>{act.genre}</Text>
                </View>
                <TouchableOpacity onPress={() => toggleFav(act.artist)} hitSlop={8}>
                  <MaterialIcons
                    name={favs[act.artist] ? 'favorite' : 'favorite-border'}
                    size={22}
                    color={favs[act.artist] ? SV.primaryContainer : SV.onSurfaceVariant}
                  />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </View>
        ))}
        <View style={{ height: 120 }} />
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

  dayTabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: SV.surfaceContainerHighest },
  dayTab: { flex: 1, alignItems: 'center', paddingVertical: 12 },
  dayTabText: { color: SV.onSurfaceVariant, fontSize: 16, fontWeight: '700' },
  dayTabTextActive: { color: SV.primaryContainer },
  dayTabLine: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, backgroundColor: 'transparent' },
  dayTabLineActive: { backgroundColor: SV.primaryContainer },

  stageScroll: { maxHeight: 56 },
  stageScrollContent: { paddingHorizontal: 20, gap: 8, alignItems: 'center', paddingVertical: 8 },
  stageChip: {
    paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20,
    borderWidth: 1, borderColor: SV.outlineVariant, backgroundColor: SV.deepCharcoal,
  },
  stageChipActive: { borderColor: SV.primaryContainer, ...neonShadow },
  stageChipText: { color: SV.onSurface, fontFamily: 'monospace', fontSize: 12, letterSpacing: 1 },
  stageChipTextActive: { color: SV.primaryFixedDim },

  timeline: { flex: 1, paddingHorizontal: 20, paddingTop: 16 },
  timelineItem: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  timelineItemBorder: {},

  timeCol: { width: 52, alignItems: 'flex-end', paddingTop: 4 },
  timeText: { color: SV.onSurface, fontFamily: 'monospace', fontSize: 13, letterSpacing: 0.5 },
  timeTextLive: { color: SV.primaryContainer },

  dotCol: { width: 20, alignItems: 'center', paddingTop: 6 },
  pulseDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: SV.primaryContainer, ...neonShadow },
  dotInactive: { width: 12, height: 12, borderRadius: 6, backgroundColor: SV.surfaceVariant, borderWidth: 1, borderColor: SV.outlineVariant },
  timelineLine: { flex: 1, width: 1, backgroundColor: SV.surfaceContainerHighest, marginTop: 6 },

  actCard: {
    flex: 1, backgroundColor: SV.deepCharcoal, borderWidth: 1,
    borderColor: SV.outlineVariant, borderRadius: 8, padding: 14, overflow: 'hidden',
  },
  actCardLive: { borderColor: 'rgba(57,255,20,0.4)', ...neonShadow },
  actCardLiveTint: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(57,255,20,0.04)' },
  actCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  liveLabel: {
    backgroundColor: SV.surfaceContainer, borderWidth: 1, borderColor: SV.primaryContainer,
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 2, alignSelf: 'flex-start', marginBottom: 6,
  },
  liveLabelText: { color: SV.primaryContainer, fontFamily: 'monospace', fontSize: 10, letterSpacing: 1 },
  actName: { color: SV.onSurface, fontSize: 20, fontWeight: '800', textTransform: 'uppercase', letterSpacing: -0.5 },
  actNameLive: { fontSize: 24 },
  actGenre: { color: SV.onSurfaceVariant, fontFamily: 'monospace', fontSize: 12, letterSpacing: 1, marginTop: 2 },

  fab: {
    position: 'absolute', right: 20, bottom: 88,
    width: 56, height: 56, borderRadius: 28, backgroundColor: SV.primaryContainer,
    alignItems: 'center', justifyContent: 'center', ...neonShadow,
  },
  fabBadge: {
    position: 'absolute', top: -4, right: -4, width: 20, height: 20, borderRadius: 10,
    backgroundColor: SV.error, borderWidth: 2, borderColor: SV.background, alignItems: 'center', justifyContent: 'center',
  },
  fabBadgeText: { color: SV.onError, fontSize: 10, fontWeight: '700' },
});
