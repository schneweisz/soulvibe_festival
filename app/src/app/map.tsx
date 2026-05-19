import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useRef, useEffect, useState } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SV, neonShadow } from '@/constants/theme';
import { CartFAB, ScreenHeader } from '@/components/screen-header';

type FilterKey = 'ALL ZONES' | 'STAGES' | 'FOOD & DRINK' | 'SERVICES';

interface POI {
  id: string;
  label: string;
  type: 'stage' | 'gastro' | 'chill' | 'wc';
  x: number; // 0-100 %
  y: number;
  color: string;
  glow: string;
  icon: string;
  size: 'large' | 'medium' | 'small';
  desc?: string;
  artist?: string;
  time?: string;
}

const POIS: POI[] = [
  { id: 'grid', label: 'THE GRID', type: 'stage', x: 45, y: 35, color: SV.primaryContainer, glow: SV.neonGlow, icon: 'speaker', size: 'large', desc: 'Main Stage • Industrial Techno', artist: 'Charlotte de Witte', time: '22:00 - 00:00' },
  { id: 'suburbia', label: 'SUBURBIA', type: 'stage', x: 65, y: 25, color: SV.secondaryContainer, glow: SV.purpleGlow, icon: 'music-note', size: 'medium', desc: 'Second Stage • Trap/Rap', artist: 'Azahriah', time: '21:30 - 23:00' },
  { id: 'basement', label: 'THE BASEMENT', type: 'stage', x: 30, y: 55, color: SV.tertiaryContainer, glow: SV.cyanGlow, icon: 'headphones', size: 'medium', desc: 'Underground • Tech House', artist: 'Daria Kolosova', time: '23:00 - 02:00' },
  { id: 'gastro', label: 'GASTRO HUB', type: 'gastro', x: 60, y: 45, color: SV.onSurfaceVariant, glow: 'transparent', icon: 'fastfood', size: 'small' },
  { id: 'backyard', label: 'THE BACKYARD', type: 'chill', x: 50, y: 65, color: SV.onSurfaceVariant, glow: 'transparent', icon: 'weekend', size: 'small' },
  { id: 'wc1', label: '', type: 'wc', x: 35, y: 30, color: SV.onSurfaceVariant, glow: 'transparent', icon: 'wc', size: 'small' },
  { id: 'wc2', label: '', type: 'wc', x: 70, y: 50, color: SV.onSurfaceVariant, glow: 'transparent', icon: 'wc', size: 'small' },
];

function PulseDot({ color }: { color: string }) {
  const scale = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scale, { toValue: 2.4, duration: 1000, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return <Animated.View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: color, transform: [{ scale }] }} />;
}

function YouAreHere() {
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1.8, duration: 1100, useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 1, duration: 1100, useNativeDriver: true }),
    ])).start();
  }, []);
  return (
    <View style={styles.youHereWrap}>
      <Animated.View style={[styles.youHereRing, { transform: [{ scale: pulse }] }]} />
      <View style={styles.youHereDot} />
      <Text style={styles.youHereLabel}>YOU ARE HERE</Text>
    </View>
  );
}

export default function MapScreen() {
  const [filter, setFilter] = useState<FilterKey>('ALL ZONES');
  const [selected, setSelected] = useState<POI | null>(null);
  const sheetY = useRef(new Animated.Value(300)).current;

  const openSheet = (poi: POI) => {
    if (poi.type !== 'stage') return;
    setSelected(poi);
    Animated.spring(sheetY, { toValue: 0, useNativeDriver: true }).start();
  };
  const closeSheet = () => {
    Animated.timing(sheetY, { toValue: 300, duration: 250, useNativeDriver: true }).start(() => setSelected(null));
  };

  const isVisible = (poi: POI) => {
    if (filter === 'ALL ZONES') return true;
    if (filter === 'STAGES') return poi.type === 'stage';
    if (filter === 'FOOD & DRINK') return poi.type === 'gastro';
    if (filter === 'SERVICES') return poi.type === 'wc' || poi.type === 'chill';
    return true;
  };

  return (
    <View style={styles.root}>
      <ScreenHeader />

      {/* Map Canvas */}
      <View style={styles.mapCanvas}>
        {/* Grid background */}
        <View style={styles.gridOverlay} />

        {/* Lake silhouette */}
        <View style={styles.lake} />

        {/* POIs */}
        {POIS.filter(isVisible).map(poi => {
          const big = poi.size === 'large';
          const med = poi.size === 'medium';
          const boxSize = big ? 72 : med ? 56 : 36;
          return (
            <TouchableOpacity
              key={poi.id}
              style={[styles.poi, { left: `${poi.x}%`, top: `${poi.y}%` }]}
              onPress={() => openSheet(poi)}>
              <View style={[styles.poiBox, { width: boxSize, height: boxSize, borderColor: poi.color, borderRadius: big ? 16 : 12 }]}>
                <MaterialIcons name={poi.icon as any} size={big ? 32 : med ? 24 : 18} color={poi.color} />
              </View>
              {poi.label ? (
                <View style={[styles.poiLabel, { borderColor: poi.color }]}>
                  <Text style={[styles.poiLabelText, { color: poi.color }]}>{poi.label}</Text>
                </View>
              ) : null}
            </TouchableOpacity>
          );
        })}

        {/* You are here */}
        <View style={[styles.poi, { left: '48%', top: '48%' }]}>
          <YouAreHere />
        </View>

        {/* Filter chips */}
        <View style={styles.filterRow}>
          {(['ALL ZONES', 'STAGES', 'FOOD & DRINK', 'SERVICES'] as FilterKey[]).map(f => (
            <TouchableOpacity
              key={f}
              style={[styles.filterChip, f === filter && styles.filterChipActive]}
              onPress={() => setFilter(f)}>
              <Text style={[styles.filterChipText, f === filter && styles.filterChipTextActive]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Map controls */}
        <View style={styles.controls}>
          <TouchableOpacity style={styles.controlBtn}>
            <MaterialIcons name="my-location" size={20} color={SV.onSurface} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.controlBtn, { borderBottomWidth: 1, borderBottomColor: SV.white10 }]}>
            <MaterialIcons name="add" size={20} color={SV.onSurface} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.controlBtn}>
            <MaterialIcons name="remove" size={20} color={SV.onSurface} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Bottom Sheet */}
      {selected && (
        <>
          <TouchableOpacity style={styles.overlay} onPress={closeSheet} activeOpacity={1} />
          <Animated.View style={[styles.sheet, { transform: [{ translateY: sheetY }] }]}>
            <TouchableOpacity style={styles.sheetHandle} onPress={closeSheet}>
              <View style={styles.handleBar} />
            </TouchableOpacity>

            <View style={styles.sheetHeader}>
              <View>
                <View style={styles.sheetLiveBadge}>
                  <View style={styles.sheetLiveDot} />
                  <Text style={styles.sheetLiveTxt}>LIVE NOW</Text>
                </View>
                <Text style={styles.sheetStageName}>{selected.label}</Text>
                <Text style={styles.sheetStageDesc}>{selected.desc}</Text>
              </View>
              <TouchableOpacity style={styles.directionsBtn}>
                <MaterialIcons name="directions" size={20} color={SV.onSurfaceVariant} />
              </TouchableOpacity>
            </View>

            <View style={styles.nowPlaying}>
              <View style={{ flex: 1 }}>
                <Text style={styles.nowPlayingLabel}>CURRENTLY PLAYING</Text>
                <Text style={styles.nowPlayingArtist}>{selected.artist}</Text>
                <Text style={styles.nowPlayingTime}>{selected.time}</Text>
              </View>
              <View style={styles.spinnerOuter}>
                <MaterialIcons name="equalizer" size={18} color={SV.primaryContainer} />
              </View>
            </View>

            <View style={styles.sheetActions}>
              <TouchableOpacity style={styles.sheetBtnPrimary} onPress={() => { closeSheet(); router.push('/lineup'); }}>
                <MaterialIcons name="event" size={18} color={SV.deepCharcoal} />
                <Text style={styles.sheetBtnPrimaryText}>SCHEDULE</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.sheetBtnOutline}>
                <MaterialIcons name="share" size={18} color={SV.primaryContainer} />
                <Text style={styles.sheetBtnOutlineText}>SHARE</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </>
      )}

      <CartFAB count={2} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: SV.background },

  header: {
    height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, backgroundColor: SV.surfaceGlass,
    borderBottomWidth: 1, borderBottomColor: SV.white10, zIndex: 10, ...neonShadow,
  },
  headerTitle: { color: SV.primaryFixedDim, fontFamily: 'monospace', fontSize: 17, fontWeight: '800', letterSpacing: -0.5, textTransform: 'uppercase' },

  mapCanvas: { flex: 1, backgroundColor: SV.surfaceContainerHighest, position: 'relative', overflow: 'hidden' },

  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.07,
  },

  lake: {
    position: 'absolute', top: '8%', left: '18%', width: '60%', height: '30%',
    backgroundColor: SV.tertiaryFixedDim, borderRadius: 100, opacity: 0.07,
  },

  poi: { position: 'absolute', alignItems: 'center' },
  poiBox: {
    borderWidth: 2, backgroundColor: SV.surfaceContainerHigh,
    alignItems: 'center', justifyContent: 'center',
  },
  poiLabel: {
    marginTop: 6, paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 20, borderWidth: 1, backgroundColor: SV.surfaceContainerLow,
  },
  poiLabelText: { fontFamily: 'monospace', fontSize: 10, letterSpacing: 1, fontWeight: '700' },

  youHereWrap: { alignItems: 'center' },
  youHereRing: { position: 'absolute', width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(57,255,20,0.25)' },
  youHereDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: SV.primaryContainer, borderWidth: 2, borderColor: SV.background, shadowColor: '#39ff14', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 8 },
  youHereLabel: { color: SV.primaryContainer, fontFamily: 'monospace', fontSize: 9, letterSpacing: 1, marginTop: 6 },

  filterRow: {
    position: 'absolute', top: 12, left: 12, right: 60,
    flexDirection: 'row', flexWrap: 'wrap', gap: 6,
  },
  filterChip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  filterChipActive: { backgroundColor: SV.primaryContainer, borderColor: SV.primaryContainer, ...neonShadow },
  filterChipText: { color: SV.onSurface, fontFamily: 'monospace', fontSize: 11, letterSpacing: 0.5 },
  filterChipTextActive: { color: SV.onPrimaryContainer, fontWeight: '700' },

  controls: {
    position: 'absolute', right: 12, top: 12,
    backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
    overflow: 'hidden',
  },
  controlBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },

  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 30 },

  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 40,
    backgroundColor: SV.surfaceContainerLow, borderTopWidth: 1, borderTopColor: SV.white10,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, paddingBottom: 36,
  },
  sheetHandle: { alignItems: 'center', marginBottom: 20 },
  handleBar: { width: 40, height: 4, backgroundColor: SV.surfaceVariant, borderRadius: 2 },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  sheetLiveBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  sheetLiveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: SV.primaryContainer, shadowColor: '#39ff14', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 6 },
  sheetLiveTxt: { color: SV.primaryFixedDim, fontFamily: 'monospace', fontSize: 10, letterSpacing: 2 },
  sheetStageName: { color: SV.onSurface, fontSize: 22, fontWeight: '800', textTransform: 'uppercase', letterSpacing: -0.5 },
  sheetStageDesc: { color: SV.onSurfaceVariant, fontSize: 14, marginTop: 2 },
  directionsBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: SV.surfaceContainerHigh,
    borderWidth: 1, borderColor: SV.outlineVariant, alignItems: 'center', justifyContent: 'center',
  },
  nowPlaying: {
    backgroundColor: SV.deepCharcoal, borderRadius: 12, borderWidth: 1, borderColor: SV.outlineVariant,
    padding: 14, marginBottom: 16, flexDirection: 'row', alignItems: 'center',
  },
  nowPlayingLabel: { color: SV.onSurface, fontFamily: 'monospace', fontSize: 12, letterSpacing: 1.5, marginBottom: 6, fontWeight: '700' },
  nowPlayingArtist: { color: SV.onSurface, fontSize: 18, fontWeight: '700' },
  nowPlayingTime: { color: SV.onSurfaceVariant, fontFamily: 'monospace', fontSize: 11, marginTop: 4 },
  spinnerOuter: {
    width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: SV.primaryContainer,
    alignItems: 'center', justifyContent: 'center',
  },
  sheetActions: { flexDirection: 'row', gap: 12 },
  sheetBtnPrimary: {
    flex: 1, backgroundColor: SV.primaryContainer, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: 8, ...neonShadow,
  },
  sheetBtnPrimaryText: { color: SV.deepCharcoal, fontWeight: '800', fontSize: 14, letterSpacing: 1.5 },
  sheetBtnOutline: {
    flex: 1, borderWidth: 1, borderColor: SV.primaryContainer, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: 8,
  },
  sheetBtnOutlineText: { color: SV.primaryContainer, fontWeight: '800', fontSize: 14, letterSpacing: 1.5 },

  fab: {
    position: 'absolute', right: 20, bottom: 88,
    width: 56, height: 56, borderRadius: 28, backgroundColor: SV.primaryContainer,
    alignItems: 'center', justifyContent: 'center', zIndex: 50, ...neonShadow,
  },
  fabBadge: {
    position: 'absolute', top: -4, right: -4, width: 20, height: 20, borderRadius: 10,
    backgroundColor: SV.error, borderWidth: 2, borderColor: SV.background, alignItems: 'center', justifyContent: 'center',
  },
  fabBadgeText: { color: SV.onError, fontSize: 10, fontWeight: '700' },
});
