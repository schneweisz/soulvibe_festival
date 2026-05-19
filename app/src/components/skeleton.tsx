import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { SV } from '@/constants/theme';

// ─── Base pulse box ───────────────────────────────────────────────────────────

export function SkeletonBox({ style }: { style?: any }) {
  const pulse = useRef(new Animated.Value(0.32)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.68, duration: 780, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.32, duration: 780, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View style={[sk.base, style, { opacity: pulse }]} />
  );
}

// ─── Lineup row skeleton ──────────────────────────────────────────────────────

export function SkeletonLineupRow() {
  return (
    <View style={sk.lineupRow}>
      <View style={sk.pill} />
      <View style={sk.lineupBody}>
        <View style={sk.lineupTop}>
          <SkeletonBox style={{ flex: 1, height: 14, borderRadius: 7, marginRight: 44 }} />
          <SkeletonBox style={{ width: 20, height: 20, borderRadius: 10 }} />
        </View>
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 9 }}>
          <SkeletonBox style={{ width: 68, height: 10, borderRadius: 5 }} />
          <SkeletonBox style={{ width: 84, height: 10, borderRadius: 5 }} />
        </View>
      </View>
    </View>
  );
}

// ─── Gastro vendor skeleton ───────────────────────────────────────────────────

export function SkeletonGastroSection() {
  return (
    <View style={sk.gastroSection}>
      {/* Vendor header */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          <SkeletonBox style={{ width: 18, height: 18, borderRadius: 9 }} />
          <SkeletonBox style={{ width: 110, height: 16, borderRadius: 8 }} />
        </View>
        <SkeletonBox style={{ width: 78, height: 24, borderRadius: 12 }} />
      </View>
      <SkeletonBox style={{ width: '88%', height: 12, borderRadius: 6, marginBottom: 16 }} />

      {/* Cards */}
      {[0, 1].map(i => (
        <View key={i} style={sk.gastroCard}>
          <SkeletonBox style={{ width: 64, height: 64, borderRadius: 8 }} />
          <View style={{ flex: 1, gap: 9 }}>
            <SkeletonBox style={{ width: '68%', height: 14, borderRadius: 7 }} />
            <SkeletonBox style={{ width: '92%', height: 10, borderRadius: 5 }} />
            <SkeletonBox style={{ width: '42%', height: 10, borderRadius: 5 }} />
          </View>
          <SkeletonBox style={{ width: 58, height: 34, borderRadius: 8 }} />
        </View>
      ))}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const sk = StyleSheet.create({
  base: {
    backgroundColor: SV.surfaceContainerHigh,
  },
  lineupRow: {
    flexDirection: 'row',
    backgroundColor: '#0c0c14',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    marginBottom: 8,
    overflow: 'hidden',
  },
  pill: {
    width: 3,
    backgroundColor: SV.surfaceContainerHigh,
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
  },
  lineupBody: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  lineupTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  gastroSection: {
    marginHorizontal: 16,
    marginBottom: 28,
  },
  gastroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#0e0e18',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    padding: 12,
    marginBottom: 10,
  },
});
