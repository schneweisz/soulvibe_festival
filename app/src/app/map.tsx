import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { GestureDetector, Gesture, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import React, { useRef, useEffect, useState } from 'react';
import {
  Animated as RNAnimated,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SV, neonShadow } from '@/constants/theme';
import { CartFAB, ScreenHeader } from '@/components/screen-header';

// ─── Map constants ────────────────────────────────────────────────────────────

const MAP_W = 1200;
const MAP_H = 1400;
const { width: SW, height: SH } = Dimensions.get('window');
// Center the view on the festival heart (near "You Are Here")
const INIT_TX = SW / 2 - 530;
const INIT_TY = SH / 2 - 820;
const MIN_SCALE = 0.3;
const MAX_SCALE = 3.5;

// ─── Types ────────────────────────────────────────────────────────────────────

type FilterKey = 'ALL' | 'STAGES' | 'FOOD' | 'SERVICES';

interface POI {
  id: string;
  label: string;
  type: 'stage' | 'gastro' | 'chill' | 'wc' | 'medical' | 'vip' | 'gate' | 'camping';
  x: number;
  y: number;
  color: string;
  icon: string;
  size: 'large' | 'medium' | 'small';
  desc?: string;
  artist?: string;
  time?: string;
}

const POIS: POI[] = [
  // Stages
  { id: 'suburbia', label: 'SUBURBIA', type: 'stage', x: 580, y: 640, color: SV.primaryContainer, icon: 'speaker', size: 'large', desc: 'Main Stage · Rap & Trap', artist: 'AZAHRIAH', time: '22:30 - 00:00' },
  { id: 'grid', label: 'THE GRID', type: 'stage', x: 920, y: 500, color: SV.secondaryContainer, icon: 'graphic-eq', size: 'large', desc: 'Techno Stage · Industrial', artist: 'CHARLOTTE DE WITTE', time: '02:00 - 04:00' },
  { id: 'basement', label: 'THE BASEMENT', type: 'stage', x: 250, y: 820, color: SV.tertiaryContainer, icon: 'headphones', size: 'medium', desc: 'Underground Stage', artist: 'BETON.HOFI', time: '18:00 - 19:45' },
  // Gastro & bars
  { id: 'gastro1', label: 'GASTRO HUB', type: 'gastro', x: 730, y: 800, color: '#F5A623', icon: 'fastfood', size: 'medium', desc: 'Smash burgers, wood-fired pizza & craft drinks — order in-app!' },
  { id: 'gastro2', label: 'LOOP BAR', type: 'gastro', x: 420, y: 1000, color: '#F5A623', icon: 'local-bar', size: 'small', desc: 'Neon cocktails, shots & energy drinks. Skip the queue — order in-app!' },
  { id: 'gastro3', label: 'VIP BAR', type: 'gastro', x: 970, y: 790, color: '#F5A623', icon: 'local-bar', size: 'small', desc: 'Exclusive cocktail lounge — reserved for VIP pass holders.' },
  // Services
  { id: 'chill', label: 'CHILL ZONE', type: 'chill', x: 380, y: 590, color: SV.onSurfaceVariant, icon: 'weekend', size: 'small' },
  { id: 'vip', label: 'VIP', type: 'vip', x: 1020, y: 700, color: '#FFD700', icon: 'star', size: 'small' },
  { id: 'medical', label: 'MEDICAL', type: 'medical', x: 600, y: 490, color: '#FF4444', icon: 'local-hospital', size: 'small', desc: '24h first-aid & medical support. Always fully staffed — approach any crew member for help.' },
  { id: 'wc1', label: '', type: 'wc', x: 310, y: 660, color: SV.onSurfaceVariant, icon: 'wc', size: 'small' },
  { id: 'wc2', label: '', type: 'wc', x: 870, y: 960, color: SV.onSurfaceVariant, icon: 'wc', size: 'small' },
  { id: 'wc3', label: '', type: 'wc', x: 490, y: 1060, color: SV.onSurfaceVariant, icon: 'wc', size: 'small' },
  { id: 'gate', label: 'ENTRANCE', type: 'gate', x: 600, y: 1180, color: SV.primaryFixedDim, icon: 'meeting-room', size: 'small' },
  // Camping — right bottom corner
  { id: 'camping', label: 'CAMPING', type: 'camping', x: 1090, y: 1120, color: '#7EC8A0', icon: 'cabin', size: 'small' },
];

// Filter mapping
const isVisible = (poi: POI, filter: FilterKey) => {
  if (filter === 'ALL') return true;
  if (filter === 'STAGES') return poi.type === 'stage';
  if (filter === 'FOOD') return poi.type === 'gastro';
  if (filter === 'SERVICES') return poi.type === 'wc' || poi.type === 'medical' || poi.type === 'chill' || poi.type === 'vip' || poi.type === 'gate' || poi.type === 'camping';
  return true;
};

// ─── Road helper (diagonal lines via rotation) ────────────────────────────────

function roadStyle(x1: number, y1: number, x2: number, y2: number, w: number) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);
  return {
    position: 'absolute' as const,
    width: len,
    height: w,
    left: (x1 + x2) / 2 - len / 2,
    top: (y1 + y2) / 2 - w / 2,
    transform: [{ rotate: `${angle}deg` }],
  };
}

// ─── Pulse dot (uses RN Animated for simplicity) ──────────────────────────────

function PulseDot({ color }: { color: string }) {
  const scale = useRef(new RNAnimated.Value(1)).current;
  useEffect(() => {
    RNAnimated.loop(
      RNAnimated.sequence([
        RNAnimated.timing(scale, { toValue: 2.2, duration: 900, useNativeDriver: true }),
        RNAnimated.timing(scale, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return <RNAnimated.View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: color, transform: [{ scale }] }} />;
}

// ─── You-Are-Here marker ──────────────────────────────────────────────────────

function YouAreHere() {
  const pulse = useRef(new RNAnimated.Value(1)).current;
  useEffect(() => {
    RNAnimated.loop(RNAnimated.sequence([
      RNAnimated.timing(pulse, { toValue: 1.9, duration: 1100, useNativeDriver: true }),
      RNAnimated.timing(pulse, { toValue: 1, duration: 1100, useNativeDriver: true }),
    ])).start();
  }, []);
  return (
    <View style={s.yah}>
      <View style={s.yahCenter}>
        <RNAnimated.View style={[s.yahRing, { transform: [{ scale: pulse }] }]} />
        <View style={s.yahDot} />
      </View>
      <View style={s.yahLabel}>
        <Text style={s.yahLabelTxt}>YOU</Text>
      </View>
    </View>
  );
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function MapScreen() {
  const [filter, setFilter] = useState<FilterKey>('ALL');
  const [selected, setSelected] = useState<POI | null>(null);
  const sheetY = useRef(new RNAnimated.Value(320)).current;

  const openSheet = (poi: POI) => {
    // Only interactive types get a sheet
    if (poi.type === 'wc' || poi.type === 'chill' || poi.type === 'vip' || poi.type === 'gate' || poi.type === 'camping') return;
    setSelected(poi);
    RNAnimated.spring(sheetY, { toValue: 0, useNativeDriver: true }).start();
  };
  const closeSheet = () => {
    RNAnimated.timing(sheetY, { toValue: 320, duration: 220, useNativeDriver: true }).start(() => setSelected(null));
  };

  // ── Gesture state ────────────────────────────────────────────────────────
  const translateX = useSharedValue(INIT_TX);
  const translateY = useSharedValue(INIT_TY);
  const savedTX = useSharedValue(INIT_TX);
  const savedTY = useSharedValue(INIT_TY);
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      translateX.value = savedTX.value + e.translationX;
      translateY.value = savedTY.value + e.translationY;
    })
    .onEnd(() => {
      savedTX.value = translateX.value;
      savedTY.value = translateY.value;
    });

  const pinchGesture = Gesture.Pinch()
    .onBegin(() => {
      savedScale.value = scale.value;
    })
    .onUpdate((e) => {
      scale.value = Math.min(MAX_SCALE, Math.max(MIN_SCALE, savedScale.value * e.scale));
    })
    .onEnd(() => {
      savedScale.value = scale.value;
    });

  const composed = Gesture.Simultaneous(panGesture, pinchGesture);

  const mapStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  const ZOOM_CFG = { duration: 260, easing: Easing.out(Easing.quad) };
  const PAN_CFG  = { duration: 380, easing: Easing.out(Easing.cubic) };

  const zoomIn = () => {
    const next = Math.min(MAX_SCALE, scale.value * 1.45);
    scale.value = withTiming(next, ZOOM_CFG);
    savedScale.value = next;
  };
  const zoomOut = () => {
    const next = Math.max(MIN_SCALE, scale.value / 1.45);
    scale.value = withTiming(next, ZOOM_CFG);
    savedScale.value = next;
  };
  const recenter = () => {
    translateX.value = withTiming(INIT_TX, PAN_CFG);
    translateY.value = withTiming(INIT_TY, PAN_CFG);
    scale.value = withTiming(1, PAN_CFG);
    savedTX.value = INIT_TX;
    savedTY.value = INIT_TY;
    savedScale.value = 1;
  };

  return (
    <GestureHandlerRootView style={s.root}>
      <ScreenHeader />

      {/* ── Map viewport ── */}
      <View style={s.viewport}>

        {/* Filter chips (above map) */}
        <View style={s.filterRow}>
          {(['ALL', 'STAGES', 'FOOD', 'SERVICES'] as FilterKey[]).map(f => (
            <TouchableOpacity
              key={f}
              style={[s.chip, f === filter && s.chipActive]}
              onPress={() => setFilter(f)}>
              <Text style={[s.chipTxt, f === filter && s.chipTxtActive]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Map controls */}
        <View style={s.controls}>
          <TouchableOpacity style={s.ctrlBtn} onPress={recenter}>
            <MaterialIcons name="my-location" size={18} color={SV.onSurface} />
          </TouchableOpacity>
          <View style={s.ctrlDivider} />
          <TouchableOpacity style={s.ctrlBtn} onPress={zoomIn}>
            <MaterialIcons name="add" size={18} color={SV.onSurface} />
          </TouchableOpacity>
          <View style={s.ctrlDivider} />
          <TouchableOpacity style={s.ctrlBtn} onPress={zoomOut}>
            <MaterialIcons name="remove" size={18} color={SV.onSurface} />
          </TouchableOpacity>
        </View>

        {/* Pannable / zoomable canvas */}
        <GestureDetector gesture={composed}>
          <Animated.View style={[s.canvas, mapStyle]}>

            {/* ── Terrain ── */}

            {/* Lake — north end */}
            <View style={[s.terrain, { left: 100, top: 30, width: 1000, height: 260, borderRadius: 140, backgroundColor: 'rgba(10,35,70,0.65)' }]} />
            {/* Lake shimmer line */}
            <View style={{ position: 'absolute', left: 100, top: 270, width: 1000, height: 2, backgroundColor: 'rgba(80,160,255,0.18)' }} />

            {/* Hill zone NE (elevated, slightly lighter) */}
            <View style={[s.terrain, { left: 780, top: 180, width: 420, height: 500, borderRadius: 180, backgroundColor: '#0D0D16' }]} />
            {/* Hill contour lines */}
            <View style={{ position: 'absolute', left: 830, top: 220, width: 360, height: 420, borderRadius: 160, borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)' }} />
            <View style={{ position: 'absolute', left: 880, top: 270, width: 280, height: 320, borderRadius: 140, borderWidth: 1, borderColor: 'rgba(255,255,255,0.03)' }} />

            {/* Forest patch W */}
            <View style={[s.terrain, { left: 30, top: 580, width: 220, height: 450, borderRadius: 120, backgroundColor: 'rgba(8,18,8,0.7)' }]} />

            {/* Open ground zone (darker, festival floor) */}
            <View style={[s.terrain, { left: 180, top: 380, width: 840, height: 880, borderRadius: 60, backgroundColor: 'rgba(15,15,22,0.5)' }]} />

            {/* Parking lot south */}
            <View style={[s.terrain, { left: 350, top: 1200, width: 500, height: 180, borderRadius: 12, backgroundColor: '#0E0E16' }]}>
              {/* Parking grid lines */}
              {[420, 480, 540, 600, 660, 720, 780].map(px => (
                <View key={px} style={{ position: 'absolute', left: px - 350, top: 0, bottom: 0, width: 1, backgroundColor: 'rgba(255,255,255,0.04)' }} />
              ))}
            </View>

            {/* ── Roads ── */}

            {/* Road segments are grouped by network.
                Each segment is [x1,y1 → x2,y2, width] drawn via the roadStyle() helper.
                Multiple short segments per "path" create gentle bends between POIs. */}

            {/* ── Coastal access road (slight S-bend, connects parking → beach) ── */}
            {([[80,296,400,278,24],[400,278,750,282,24],[750,282,1100,296,24]] as [number,number,number,number,number][]).map(([x1,y1,x2,y2,w],i)=>(
              <View key={`coast${i}`} style={[s.road, roadStyle(x1,y1,x2,y2,w)]} />
            ))}

            {/* ── Main festival promenade (central winding path through all POIs) ── */}
            {([
              // Basement → WC1 junction
              [222, 838, 308, 802, 26],
              // WC1 → Chill Zone approach
              [308, 802, 382, 762, 26],
              // Chill → Suburbia west
              [382, 762, 490, 722, 26],
              // Suburbia west → Suburbia east
              [490, 722, 595, 712, 26],
              // Suburbia east → Gastro Hub
              [595, 712, 698, 742, 26],
              // Gastro Hub → east junction
              [698, 742, 800, 788, 26],
              // East junction → Grid/VIP corridor
              [800, 788, 910, 758, 26],
            ] as [number,number,number,number,number][]).map(([x1,y1,x2,y2,w],i)=>(
              <View key={`prom${i}`} style={[s.road, roadStyle(x1,y1,x2,y2,w)]} />
            ))}

            {/* ── South entrance road (from Gate up to promenade) ── */}
            {([
              [600,1178,598,1100,30],
              [598,1100,580,1018,28],
              [580,1018,558,938,27],
              [558, 938,535, 858,26],
            ] as [number,number,number,number,number][]).map(([x1,y1,x2,y2,w],i)=>(
              <View key={`gate${i}`} style={[s.road, roadStyle(x1,y1,x2,y2,w)]} />
            ))}

            {/* ── Medical / North spine (Medical → Suburbia) ── */}
            {([
              [600,490,598,568,22],
              [598,568,585,642,22],
            ] as [number,number,number,number,number][]).map(([x1,y1,x2,y2,w],i)=>(
              <View key={`spine${i}`} style={[s.road, roadStyle(x1,y1,x2,y2,w)]} />
            ))}

            {/* ── Grid access (from promenade → The Grid, curves NE) ── */}
            {([
              [910,758,905,678,22],
              [905,678,916,592,22],
              [916,592,920,510,22],
            ] as [number,number,number,number,number][]).map(([x1,y1,x2,y2,w],i)=>(
              <View key={`grid${i}`} style={[s.road, roadStyle(x1,y1,x2,y2,w)]} />
            ))}

            {/* ── Basement stub (short connector to promenade) ── */}
            <View style={[s.road, roadStyle(252,822,308,800,20)]} />

            {/* ── WC1 stub (drops south from promenade) ── */}
            <View style={[s.road, roadStyle(308,802,310,720,18)]} />

            {/* ── Chill Zone access (north spur off promenade) ── */}
            <View style={[s.road, roadStyle(382,762,380,590,18)]} />

            {/* ── Loop Bar access (winds SW from promenade) ── */}
            {([
              [452,852,438,925,20],
              [438,925,422,1002,20],
            ] as [number,number,number,number,number][]).map(([x1,y1,x2,y2,w],i)=>(
              <View key={`loop${i}`} style={[s.road, roadStyle(x1,y1,x2,y2,w)]} />
            ))}

            {/* ── VIP access (short spur east off Grid corridor) ── */}
            {([
              [910,758,968,730,18],
              [968,730,1022,700,18],
            ] as [number,number,number,number,number][]).map(([x1,y1,x2,y2,w],i)=>(
              <View key={`vip${i}`} style={[s.road, roadStyle(x1,y1,x2,y2,w)]} />
            ))}

            {/* ── WC2 access (branch SE from promenade) ── */}
            {([
              [820,800,852,882,18],
              [852,882,868,962,18],
            ] as [number,number,number,number,number][]).map(([x1,y1,x2,y2,w],i)=>(
              <View key={`wc2${i}`} style={[s.road, roadStyle(x1,y1,x2,y2,w)]} />
            ))}

            {/* ── Parking lot access forks south of Gate ── */}
            <View style={[s.road, roadStyle(600,1178,472,1235,22)]} />
            <View style={[s.road, roadStyle(600,1178,728,1235,22)]} />

            {/* ── VIP Bar stub (off the Grid/VIP corridor) ── */}
            <View style={[s.road, roadStyle(968,730,970,790,16)]} />

            {/* ── WC3 spur (off Loop Bar access) ── */}
            <View style={[s.road, roadStyle(422,1002,490,1060,16)]} />

            {/* ── Camping access (south-east perimeter path) ── */}
            {([
              [910,758,980,900,18],
              [980,900,1050,1020,18],
              [1050,1020,1090,1120,18],
            ] as [number,number,number,number,number][]).map(([x1,y1,x2,y2,w],i)=>(
              <View key={`camp${i}`} style={[s.road, roadStyle(x1,y1,x2,y2,w)]} />
            ))}

            {/* ── Festival perimeter ── */}
            <View style={s.perimeter} />

            {/* ── Subtle dot-grid texture overlay ── */}
            {Array.from({ length: 20 }).map((_, row) =>
              Array.from({ length: 16 }).map((__, col) => (
                <View
                  key={`${row}-${col}`}
                  style={{
                    position: 'absolute',
                    left: col * 76 + 14,
                    top: row * 72 + 14,
                    width: 1.5,
                    height: 1.5,
                    borderRadius: 1,
                    backgroundColor: 'rgba(255,255,255,0.032)',
                  }}
                />
              ))
            )}

            {/* ── You Are Here ── */}
            <View style={[s.poi, { left: 505, top: 795 }]}>
              <YouAreHere />
            </View>

            {/* ── POIs ── */}
            {POIS.filter(poi => isVisible(poi, filter)).map(poi => {
              const isLarge = poi.size === 'large';
              const isMed = poi.size === 'medium';
              const boxSize = isLarge ? 68 : isMed ? 52 : 38;
              const iconSize = isLarge ? 30 : isMed ? 22 : 16;
              const radius = isLarge ? 14 : isMed ? 10 : 8;
              return (
                <TouchableOpacity
                  key={poi.id}
                  style={[s.poi, { left: poi.x - boxSize / 2, top: poi.y - boxSize / 2 }]}
                  onPress={() => openSheet(poi)}
                  activeOpacity={0.8}
                  hitSlop={8}>
                  <View style={[
                    s.poiBox,
                    {
                      width: boxSize,
                      height: boxSize,
                      borderRadius: radius,
                      borderColor: poi.color,
                      backgroundColor: `${poi.color}18`,
                    },
                    isLarge && { shadowColor: poi.color, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 12, elevation: 8 },
                  ]}>
                    {isLarge && <View style={[s.poiGlow, { backgroundColor: `${poi.color}14` }]} />}
                    <MaterialIcons name={poi.icon as any} size={iconSize} color={poi.color} />
                  </View>
                  {poi.label ? (
                    <View style={[s.poiTag, { borderColor: `${poi.color}55`, backgroundColor: '#09090E' }]}>
                      <Text style={[s.poiTagTxt, { color: poi.color }]}>{poi.label}</Text>
                    </View>
                  ) : null}
                </TouchableOpacity>
              );
            })}

          </Animated.View>
        </GestureDetector>
      </View>

      {/* ── Bottom sheet ── */}
      {selected && (
        <>
          <TouchableOpacity style={s.overlay} onPress={closeSheet} activeOpacity={1} />
          <RNAnimated.View style={[s.sheet, { transform: [{ translateY: sheetY }] }]}>
            <TouchableOpacity style={s.sheetHandle} onPress={closeSheet}>
              <View style={s.handleBar} />
            </TouchableOpacity>

            {/* ── Stage sheet ── */}
            {selected.type === 'stage' && (
              <>
                <View style={s.sheetHead}>
                  <View>
                    <View style={s.liveBadge}>
                      <PulseDot color={SV.primaryContainer} />
                      <Text style={s.liveTxt}>LIVE NOW</Text>
                    </View>
                    <Text style={s.stageName}>{selected.label}</Text>
                    <Text style={s.stageDesc}>{selected.desc}</Text>
                  </View>
                  <TouchableOpacity style={s.dirBtn}>
                    <MaterialIcons name="directions" size={20} color={SV.onSurfaceVariant} />
                  </TouchableOpacity>
                </View>
                <View style={s.nowPlaying}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.npLabel}>CURRENTLY PLAYING</Text>
                    <Text style={s.npArtist}>{selected.artist}</Text>
                    <Text style={s.npTime}>{selected.time}</Text>
                  </View>
                  <View style={s.eqIcon}>
                    <MaterialIcons name="equalizer" size={20} color={SV.primaryContainer} />
                  </View>
                </View>
                <View style={s.sheetActions}>
                  <TouchableOpacity style={s.btnPrimary} onPress={() => { closeSheet(); router.push('/lineup'); }}>
                    <MaterialIcons name="event" size={18} color={SV.deepCharcoal} />
                    <Text style={s.btnPrimaryTxt}>SCHEDULE</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={s.btnOutline}>
                    <MaterialIcons name="share" size={18} color={SV.primaryContainer} />
                    <Text style={s.btnOutlineTxt}>SHARE</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {/* ── Gastro / bar sheet ── */}
            {selected.type === 'gastro' && (
              <>
                <View style={s.sheetHead}>
                  <View style={{ flex: 1, marginRight: 12 }}>
                    <Text style={s.stageName}>{selected.label}</Text>
                    <Text style={s.stageDesc}>{selected.desc}</Text>
                  </View>
                  <View style={[s.dirBtn, { backgroundColor: 'rgba(245,166,35,0.12)', borderColor: 'rgba(245,166,35,0.3)' }]}>
                    <MaterialIcons name={selected.icon as any} size={20} color="#F5A623" />
                  </View>
                </View>
                <View style={[s.nowPlaying, { borderColor: 'rgba(245,166,35,0.18)' }]}>
                  <MaterialIcons name="access-time" size={16} color="#F5A623" />
                  <View style={{ marginLeft: 10 }}>
                    <Text style={[s.npLabel, { color: '#F5A623' }]}>OPEN HOURS</Text>
                    <Text style={[s.npArtist, { fontSize: 14 }]}>Daily 14:00 – 06:00</Text>
                  </View>
                </View>
                <View style={s.sheetActions}>
                  <TouchableOpacity style={[s.btnPrimary, { backgroundColor: '#F5A623' }]} onPress={() => { closeSheet(); router.push('/gastro'); }}>
                    <MaterialIcons name="fastfood" size={18} color="#000" />
                    <Text style={s.btnPrimaryTxt}>ORDER IN-APP</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[s.btnOutline, { borderColor: '#F5A623' }]}>
                    <MaterialIcons name="directions" size={18} color="#F5A623" />
                    <Text style={[s.btnOutlineTxt, { color: '#F5A623' }]}>DIRECTIONS</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {/* ── Medical sheet ── */}
            {selected.type === 'medical' && (
              <>
                <View style={s.sheetHead}>
                  <View style={{ flex: 1, marginRight: 12 }}>
                    <Text style={[s.stageName, { color: '#FF6666' }]}>{selected.label}</Text>
                    <Text style={s.stageDesc}>{selected.desc}</Text>
                  </View>
                  <View style={[s.dirBtn, { backgroundColor: 'rgba(255,68,68,0.12)', borderColor: 'rgba(255,68,68,0.3)' }]}>
                    <MaterialIcons name="local-hospital" size={20} color="#FF4444" />
                  </View>
                </View>
                <View style={[s.nowPlaying, { borderColor: 'rgba(255,68,68,0.2)' }]}>
                  <View style={[s.eqIcon, { borderColor: '#FF4444', width: 36, height: 36 }]}>
                    <MaterialIcons name="emergency" size={16} color="#FF4444" />
                  </View>
                  <View style={{ marginLeft: 12 }}>
                    <Text style={[s.npLabel, { color: '#FF4444' }]}>OPEN 24 / 7</Text>
                    <Text style={[s.npArtist, { fontSize: 14 }]}>Always fully staffed</Text>
                  </View>
                </View>
                <TouchableOpacity style={[s.btnPrimary, { backgroundColor: '#FF4444' }, neonShadow, { shadowColor: '#FF4444' }]}>
                  <MaterialIcons name="phone" size={18} color="#fff" />
                  <Text style={[s.btnPrimaryTxt, { color: '#fff' }]}>CALL EMERGENCY LINE</Text>
                </TouchableOpacity>
              </>
            )}
          </RNAnimated.View>
        </>
      )}

      <CartFAB count={2} />
    </GestureHandlerRootView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#09090E' },

  viewport: { flex: 1, overflow: 'hidden', backgroundColor: '#09090E', position: 'relative' },

  // ── Canvas ──────────────────────────────────────────────────────────────
  canvas: {
    width: MAP_W,
    height: MAP_H,
    backgroundColor: '#09090E',
    position: 'absolute',
  },

  terrain: { position: 'absolute' },

  // Roads
  road: { position: 'absolute', backgroundColor: '#151520' },
  roadDiag: { backgroundColor: '#151520' },
  roadCenter: { position: 'absolute', top: '50%', left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,255,220,0.06)' },
  roadLane: { position: 'absolute', left: 20, right: 20, height: 1, backgroundColor: 'rgba(255,255,220,0.04)' },

  // Festival perimeter (glowing green rectangle)
  perimeter: {
    position: 'absolute',
    left: 160,
    top: 380,
    width: 880,
    height: 870,
    borderRadius: 60,
    borderWidth: 1.5,
    borderColor: 'rgba(57,255,20,0.2)',
    backgroundColor: 'rgba(57,255,20,0.02)',
  },

  // ── POIs ────────────────────────────────────────────────────────────────
  poi: { position: 'absolute', alignItems: 'center' },
  poiBox: {
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  poiGlow: { ...StyleSheet.absoluteFillObject },
  poiTag: {
    marginTop: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    borderWidth: 1,
  },
  poiTagTxt: { fontFamily: 'monospace', fontSize: 9, letterSpacing: 0.8, fontWeight: '700' },

  // You Are Here
  yah: { alignItems: 'center' },
  yahCenter: { alignItems: 'center', justifyContent: 'center' },
  yahRing: { position: 'absolute', width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(57,255,20,0.2)' },
  yahDot: { width: 14, height: 14, borderRadius: 7, backgroundColor: SV.primaryContainer, borderWidth: 2.5, borderColor: '#09090E', shadowColor: '#39ff14', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 10 },
  yahLabel: { marginTop: 5, backgroundColor: '#09090E', borderWidth: 1, borderColor: 'rgba(57,255,20,0.4)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10 },
  yahLabelTxt: { color: SV.primaryContainer, fontFamily: 'monospace', fontSize: 8, letterSpacing: 1.5, fontWeight: '700' },

  // ── Filters & controls ───────────────────────────────────────────────────
  filterRow: {
    position: 'absolute',
    top: 10,
    left: 10,
    zIndex: 20,
    flexDirection: 'row',
    gap: 6,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(14,14,22,0.88)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  chipActive: { backgroundColor: SV.primaryContainer, borderColor: SV.primaryContainer, ...neonShadow },
  chipTxt: { color: SV.onSurface, fontFamily: 'monospace', fontSize: 10, letterSpacing: 0.5 },
  chipTxtActive: { color: '#000', fontWeight: '800' },

  controls: {
    position: 'absolute',
    right: 10,
    top: 10,
    zIndex: 20,
    backgroundColor: 'rgba(14,14,22,0.9)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    overflow: 'hidden',
  },
  ctrlBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  ctrlDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.08)', marginHorizontal: 8 },

  // ── Bottom sheet ─────────────────────────────────────────────────────────
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 30 },

  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 40,
    backgroundColor: '#101018',
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)',
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, paddingBottom: 32,
  },
  sheetHandle: { alignItems: 'center', marginBottom: 18 },
  handleBar: { width: 36, height: 4, backgroundColor: SV.surfaceVariant, borderRadius: 2 },

  sheetHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  liveTxt: { color: SV.primaryFixedDim, fontFamily: 'monospace', fontSize: 10, letterSpacing: 2 },
  stageName: { color: SV.onSurface, fontSize: 22, fontWeight: '800', textTransform: 'uppercase', letterSpacing: -0.5 },
  stageDesc: { color: SV.onSurfaceVariant, fontSize: 13, marginTop: 2 },
  dirBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: SV.surfaceContainerHigh, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },

  nowPlaying: { backgroundColor: SV.deepCharcoal, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', padding: 14, marginBottom: 16, flexDirection: 'row', alignItems: 'center' },
  npLabel: { color: SV.onSurface, fontFamily: 'monospace', fontSize: 11, letterSpacing: 1.5, marginBottom: 5, fontWeight: '700' },
  npArtist: { color: SV.onSurface, fontSize: 17, fontWeight: '700' },
  npTime: { color: SV.onSurfaceVariant, fontFamily: 'monospace', fontSize: 11, marginTop: 3 },
  eqIcon: { width: 40, height: 40, borderRadius: 20, borderWidth: 1.5, borderColor: SV.primaryContainer, alignItems: 'center', justifyContent: 'center' },

  sheetActions: { flexDirection: 'row', gap: 12 },
  btnPrimary: { flex: 1, backgroundColor: SV.primaryContainer, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 13, borderRadius: 10, ...neonShadow },
  btnPrimaryTxt: { color: SV.deepCharcoal, fontWeight: '800', fontSize: 13, letterSpacing: 1.5 },
  btnOutline: { flex: 1, borderWidth: 1.5, borderColor: SV.primaryContainer, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 13, borderRadius: 10 },
  btnOutlineTxt: { color: SV.primaryContainer, fontWeight: '800', fontSize: 13, letterSpacing: 1.5 },
});
