import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Location from 'expo-location';
import { supabase } from '../utils/supabase';
import { GestureDetector, Gesture, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  Animated as RNAnimated,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SV, neonShadow } from '../constants/theme';
import { CartFAB, ScreenHeader } from '../components/screen-header';
import { useDatabase } from '../context/DatabaseContext';

// ─── Constants ────────────────────────────────────────────────────────────────

const MAP_W = 1400;
const MAP_H = 1850;
const { width: SW, height: SH } = Dimensions.get('window');
const INIT_TX = SW / 2 - 580;
const INIT_TY = SH / 2 - 900;
const MIN_SCALE = 0.26;
const MAX_SCALE = 4.0;

// ─── GPS ─────────────────────────────────────────────────────────────────────
// Approximate GPS bounding box for the festival grounds at Zamárdi, Lake Balaton.
// Adjust these bounds if you have more accurate coordinates.
const GPS_BOUNDS = { north: 46.896, south: 46.874, west: 17.918, east: 17.965 };

function gpsToCanvas(lat: number, lon: number) {
  const x = ((lon - GPS_BOUNDS.west) / (GPS_BOUNDS.east - GPS_BOUNDS.west)) * MAP_W;
  const y = ((GPS_BOUNDS.north - lat) / (GPS_BOUNDS.north - GPS_BOUNDS.south)) * MAP_H;
  return {
    x: Math.max(0, Math.min(MAP_W, x)),
    y: Math.max(0, Math.min(MAP_H, y)),
    inBounds: lon >= GPS_BOUNDS.west && lon <= GPS_BOUNDS.east
           && lat >= GPS_BOUNDS.south && lat <= GPS_BOUNDS.north,
  };
}

// ─── Types ────────────────────────────────────────────────────────────────────

type FilterKey = 'ALL' | 'STAGES' | 'FOOD' | 'SERVICES';
type CrowdLevel = 'LOW' | 'MED' | 'HIGH';

interface POI {
  id: string;
  label: string;
  type: 'stage' | 'gastro' | 'chill' | 'wc' | 'medical' | 'vip' | 'gate' | 'camping'
      | 'info' | 'atm' | 'charging' | 'lockers' | 'water';
  x: number;
  y: number;
  color: string;
  icon: string;
  size: 'large' | 'medium' | 'small';
  desc?: string;
  artist?: string;
  nextArtist?: string;
  time?: string;
  nextTime?: string;
  crowd?: CrowdLevel;
  walkMin?: number;
  queueMin?: number;
}

// ─── POI data ─────────────────────────────────────────────────────────────────

const POIS: POI[] = [
  // Stages
  {
    id: 'suburbia', label: 'SUBURBIA', type: 'stage',
    x: 580, y: 720, color: SV.primaryContainer, icon: 'speaker', size: 'large',
    desc: 'Main Stage · Rap & Trap', artist: 'AZAHRIAH', time: '22:30–00:00',
    nextArtist: 'DZSÚDLÓ', nextTime: '00:30–02:00', crowd: 'HIGH', walkMin: 0,
  },
  {
    id: 'grid', label: 'THE GRID', type: 'stage',
    x: 1090, y: 470, color: SV.secondaryContainer, icon: 'graphic-eq', size: 'large',
    desc: 'Techno Stage · Industrial', artist: 'CHARLOTTE DE WITTE', time: '02:00–04:00',
    nextArtist: 'BOGDANOV', nextTime: '04:00–06:00', crowd: 'MED', walkMin: 9,
  },
  {
    id: 'basement', label: 'THE BASEMENT', type: 'stage',
    x: 200, y: 900, color: SV.tertiaryContainer, icon: 'headphones', size: 'medium',
    desc: 'Underground Stage · Techno / Industrial', artist: 'BETON.HOFI', time: '18:00–19:45',
    nextArtist: 'OBJECT BLUE', nextTime: '20:00–21:30', crowd: 'MED', walkMin: 5,
  },
  {
    id: 'lakeside', label: 'LAKESIDE', type: 'stage',
    x: 730, y: 290, color: '#26C6DA', icon: 'waves', size: 'medium',
    desc: 'Beach Stage · Chill Electronic', artist: 'FISHER', time: '20:00–21:30',
    nextArtist: 'SKRILLEX', nextTime: '22:00–00:00', crowd: 'LOW', walkMin: 7,
  },
  // Gastro
  {
    id: 'gastro_hub', label: 'GASTRO HUB', type: 'gastro',
    x: 760, y: 870, color: '#F5A623', icon: 'fastfood', size: 'medium',
    desc: 'Smash burgers, wood-fired pizza & craft drinks — order in-app!',
    crowd: 'MED', walkMin: 3, queueMin: 8,
  },
  {
    id: 'loop_bar', label: 'LOOP BAR', type: 'gastro',
    x: 390, y: 1060, color: '#F5A623', icon: 'local-bar', size: 'small',
    desc: 'Neon cocktails, shots & energy drinks. Skip the queue — order in-app!',
    crowd: 'LOW', walkMin: 5, queueMin: 3,
  },
  {
    id: 'vip_bar', label: 'VIP BAR', type: 'gastro',
    x: 1100, y: 840, color: '#F5A623', icon: 'local-bar', size: 'small',
    desc: 'Exclusive cocktail lounge — reserved for VIP pass holders.',
    crowd: 'LOW', walkMin: 11, queueMin: 0,
  },
  {
    id: 'beach_bar', label: 'BEACH BAR', type: 'gastro',
    x: 510, y: 310, color: '#F5A623', icon: 'local-bar', size: 'small',
    desc: 'Ice-cold drinks and light snacks right at the waterfront.',
    crowd: 'LOW', walkMin: 8, queueMin: 5,
  },
  // Services
  { id: 'chill', label: 'CHILL ZONE', type: 'chill', x: 340, y: 600, color: SV.onSurfaceVariant, icon: 'weekend', size: 'small' },
  { id: 'vip_area', label: 'VIP', type: 'vip', x: 1130, y: 680, color: '#FFD700', icon: 'star', size: 'small' },
  {
    id: 'medical', label: 'MEDICAL', type: 'medical',
    x: 640, y: 490, color: '#FF4444', icon: 'local-hospital', size: 'small',
    desc: '24 h first-aid & medical support — always fully staffed. Approach any crew member for help.',
    walkMin: 0,
  },
  {
    id: 'info', label: 'INFO', type: 'info',
    x: 590, y: 1230, color: '#4FC3F7', icon: 'info', size: 'small',
    desc: 'Festival information, lost & found, ticket support and general assistance.',
    walkMin: 0,
  },
  { id: 'atm1', label: 'ATM', type: 'atm', x: 710, y: 1090, color: '#80CBC4', icon: 'atm', size: 'small' },
  { id: 'charging1', label: 'CHARGE', type: 'charging', x: 460, y: 810, color: '#CE93D8', icon: 'battery-charging-full', size: 'small' },
  { id: 'charging2', label: 'CHARGE', type: 'charging', x: 900, y: 600, color: '#CE93D8', icon: 'battery-charging-full', size: 'small' },
  { id: 'locker_alpha', label: 'VAULT ALPHA', type: 'lockers', x: 660, y: 1130, color: '#55f2ff', icon: 'lock', size: 'small', desc: 'Neural Vault Hub Alpha · 100 slots · 2500 HUF/day' },
  { id: 'locker_beta',  label: 'VAULT BETA',  type: 'lockers', x: 310, y: 780,  color: '#55f2ff', icon: 'lock', size: 'small', desc: 'Neural Vault Hub Beta · 100 slots · 2500 HUF/day'  },
  { id: 'locker_gamma', label: 'VAULT GAMMA', type: 'lockers', x: 1040, y: 620, color: '#55f2ff', icon: 'lock', size: 'small', desc: 'Neural Vault Hub Gamma · 100 slots · 2500 HUF/day' },
  { id: 'locker_delta', label: 'VAULT DELTA', type: 'lockers', x: 620, y: 385,  color: '#55f2ff', icon: 'lock', size: 'small', desc: 'Neural Vault Hub Delta · 100 slots · 2500 HUF/day' },
  { id: 'water1', label: '', type: 'water', x: 500, y: 650, color: '#4FC3F7', icon: 'water-drop', size: 'small' },
  { id: 'water2', label: '', type: 'water', x: 820, y: 780, color: '#4FC3F7', icon: 'water-drop', size: 'small' },
  { id: 'water3', label: '', type: 'water', x: 330, y: 940, color: '#4FC3F7', icon: 'water-drop', size: 'small' },
  // WC
  { id: 'wc1', label: '', type: 'wc', x: 290, y: 670, color: SV.onSurfaceVariant, icon: 'wc', size: 'small' },
  { id: 'wc2', label: '', type: 'wc', x: 930, y: 1010, color: SV.onSurfaceVariant, icon: 'wc', size: 'small' },
  { id: 'wc3', label: '', type: 'wc', x: 480, y: 1100, color: SV.onSurfaceVariant, icon: 'wc', size: 'small' },
  { id: 'wc4', label: '', type: 'wc', x: 850, y: 680, color: SV.onSurfaceVariant, icon: 'wc', size: 'small' },
  // Gates & access
  { id: 'gate_main', label: 'MAIN GATE', type: 'gate', x: 700, y: 1330, color: SV.primaryFixedDim, icon: 'meeting-room', size: 'small' },
  { id: 'gate_vip', label: 'VIP GATE', type: 'gate', x: 1160, y: 1100, color: '#FFD700', icon: 'vpn-key', size: 'small' },
  // Camping
  { id: 'camp_a', label: 'CAMP A', type: 'camping', x: 1200, y: 1190, color: '#7EC8A0', icon: 'cabin', size: 'small' },
  { id: 'camp_b', label: 'CAMP B', type: 'camping', x: 185, y: 1220, color: '#7EC8A0', icon: 'cabin', size: 'small' },
];

// ─── Filter logic ─────────────────────────────────────────────────────────────

const FILTER_ICON: Record<FilterKey, string> = {
  ALL: 'apps', STAGES: 'speaker', FOOD: 'fastfood', SERVICES: 'build',
};

function isVisible(poi: POI, filter: FilterKey) {
  if (filter === 'ALL') return true;
  if (filter === 'STAGES') return poi.type === 'stage';
  if (filter === 'FOOD') return poi.type === 'gastro';
  return ['wc','medical','chill','vip','gate','camping','info','atm','charging','lockers','water'].includes(poi.type);
}

// ─── Road helper ──────────────────────────────────────────────────────────────

function roadStyle(x1: number, y1: number, x2: number, y2: number, w: number) {
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);
  return {
    position: 'absolute' as const,
    width: len, height: w,
    left: (x1 + x2) / 2 - len / 2,
    top: (y1 + y2) / 2 - w / 2,
    transform: [{ rotate: `${angle}deg` }],
  };
}

// Road centerline (dashed feel via opacity strip down the middle)
function RoadSegment({ x1, y1, x2, y2, w, color = '#1a1a2a' }: {
  x1: number; y1: number; x2: number; y2: number; w: number; color?: string;
}) {
  return (
    <View style={[roadStyle(x1, y1, x2, y2, w), { backgroundColor: color }]}>
      <View style={{ position: 'absolute', top: w / 2 - 0.5, left: 8, right: 8, height: 1, backgroundColor: 'rgba(255,255,220,0.055)' }} />
    </View>
  );
}

// ─── Animated components ──────────────────────────────────────────────────────

function PulseDot({ color }: { color: string }) {
  const scale = useRef(new RNAnimated.Value(1)).current;
  useEffect(() => {
    RNAnimated.loop(RNAnimated.sequence([
      RNAnimated.timing(scale, { toValue: 1.3, duration: 900, useNativeDriver: true }),
      RNAnimated.timing(scale, { toValue: 1, duration: 900, useNativeDriver: true }),
    ])).start();
  }, []);
  return <RNAnimated.View style={{ width: 9, height: 9, borderRadius: 4.5, backgroundColor: color, transform: [{ scale }] }} />;
}

function YouAreHere() {
  const pulse = useRef(new RNAnimated.Value(1)).current;
  useEffect(() => {
    RNAnimated.loop(RNAnimated.sequence([
      RNAnimated.timing(pulse, { toValue: 1.5, duration: 1100, useNativeDriver: true }),
      RNAnimated.timing(pulse, { toValue: 1, duration: 1100, useNativeDriver: true }),
    ])).start();
  }, []);
  return (
    <View style={s.yah}>
      <View style={s.yahCenter}>
        <RNAnimated.View style={[s.yahRing, { transform: [{ scale: pulse }] }]} />
        <RNAnimated.View style={[s.yahRing2, { transform: [{ scale: pulse }], opacity: 0.5 }]} />
        <View style={s.yahDot} />
      </View>
      <View style={s.yahLabel}><Text style={s.yahLabelTxt}>YOU</Text></View>
    </View>
  );
}

// Friend marker (shown on map canvas at friend's position)
function FriendMarker({ username }: { username: string }) {
  return (
    <View style={s.friendWrap}>
      <View style={s.friendDot} />
      <View style={s.friendLabel}>
        <Text style={s.friendLabelTxt}>{username}</Text>
      </View>
    </View>
  );
}

// Crowd level badge
function CrowdBadge({ level }: { level: CrowdLevel }) {
  const cfg = {
    LOW:  { color: '#7EC8A0', label: 'LOW' },
    MED:  { color: '#F5A623', label: 'MED' },
    HIGH: { color: '#FF6B6B', label: 'HIGH' },
  }[level];
  return (
    <View style={[s.crowdBadge, { borderColor: `${cfg.color}60`, backgroundColor: `${cfg.color}18` }]}>
      <View style={[s.crowdDot, { backgroundColor: cfg.color }]} />
      <Text style={[s.crowdTxt, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  );
}

// Legend panel
const LEGEND_ITEMS = [
  { color: SV.primaryContainer, icon: 'speaker', label: 'Stage' },
  { color: '#F5A623', icon: 'fastfood', label: 'Food & Bar' },
  { color: '#FF4444', icon: 'local-hospital', label: 'Medical' },
  { color: '#4FC3F7', icon: 'water-drop', label: 'Water' },
  { color: '#CE93D8', icon: 'battery-charging-full', label: 'Charging' },
  { color: '#80CBC4', icon: 'atm', label: 'ATM / Lockers' },
  { color: SV.onSurfaceVariant, icon: 'wc', label: 'WC' },
  { color: '#7EC8A0', icon: 'cabin', label: 'Camping' },
  { color: SV.primaryFixedDim, icon: 'meeting-room', label: 'Gate' },
];

function Legend({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const opacity = useRef(new RNAnimated.Value(0)).current;
  useEffect(() => {
    RNAnimated.timing(opacity, { toValue: visible ? 1 : 0, duration: 180, useNativeDriver: true }).start();
  }, [visible]);
  if (!visible) return null;
  return (
    <RNAnimated.View style={[s.legend, { opacity }]}>
      <View style={s.legendHeader}>
        <Text style={s.legendTitle}>LEGEND</Text>
        <TouchableOpacity onPress={onClose} hitSlop={10}>
          <MaterialIcons name="close" size={20} color={SV.onSurfaceVariant} />
        </TouchableOpacity>
      </View>
      {LEGEND_ITEMS.map(item => (
        <View key={item.label} style={s.legendRow}>
          <MaterialIcons name={item.icon as any} size={20} color={item.color} />
          <Text style={s.legendLabel}>{item.label}</Text>
        </View>
      ))}
    </RNAnimated.View>
  );
}

// Compact weather notification pill
function WeatherStrip() {
  return (
    <View style={s.weatherStrip} pointerEvents="none">
      <View style={s.weatherPill}>
        <MaterialIcons name="wb-sunny" size={13} color="#F5A623" />
        <Text style={s.weatherTemp}>32°C</Text>
        <View style={s.weatherSep} />
        <Text style={s.weatherCond}>SUNNY</Text>
        <View style={s.weatherSep} />
        <MaterialIcons name="water-drop" size={11} color="#4FC3F7" />
        <Text style={s.weatherData}>NO RAIN TODAY</Text>
        <View style={s.weatherSep} />
        <MaterialIcons name="air" size={11} color={SV.onSurfaceVariant} />
        <Text style={s.weatherData}>12 km/h</Text>
      </View>
    </View>
  );
}

// Live now strip (above map, below header)
function LiveStrip() {
  return (
    <View style={s.liveStrip}>
      <PulseDot color={SV.primaryContainer} />
      <Text style={s.liveStripTxt}>LIVE: </Text>
      <Text style={s.liveStripArtist}>AZAHRIAH</Text>
      <Text style={s.liveStripSep}> · SUBURBIA · 22:30</Text>
      <View style={{ flex: 1 }} />
      <TouchableOpacity onPress={() => router.push('/lineup')} style={s.liveStripBtn}>
        <Text style={s.liveStripBtnTxt}>SCHEDULE</Text>
        <MaterialIcons name="chevron-right" size={13} color={SV.primaryContainer} />
      </TouchableOpacity>
    </View>
  );
}

// ─── Trees ────────────────────────────────────────────────────────────────────

const TREES: Array<{ x: number; y: number; r: number }> = [
  // West forest band
  { x:55, y:420, r:18 }, { x:90, y:480, r:22 }, { x:42, y:550, r:16 },
  { x:110, y:520, r:20 }, { x:70, y:600, r:19 }, { x:45, y:660, r:17 },
  { x:100, y:640, r:21 }, { x:60, y:720, r:18 }, { x:120, y:700, r:16 },
  { x:50, y:790, r:20 }, { x:95, y:770, r:18 }, { x:40, y:850, r:22 },
  { x:115, y:840, r:16 }, { x:75, y:910, r:19 }, { x:55, y:960, r:17 },
  { x:105, y:950, r:21 }, { x:70, y:1020, r:18 }, { x:45, y:1080, r:16 },
  { x:120, y:1060, r:20 },
  // NW corner grove
  { x:160, y:430, r:15 }, { x:195, y:450, r:18 }, { x:170, y:500, r:14 },
  { x:155, y:560, r:17 }, { x:200, y:530, r:16 },
  // SE strip near camping
  { x:1260, y:1060, r:16 }, { x:1300, y:1090, r:18 }, { x:1280, y:1140, r:14 },
  { x:1320, y:1150, r:17 }, { x:1265, y:1200, r:15 },
];



// ─── Screen ───────────────────────────────────────────────────────────────────

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const { locker } = useDatabase();
  const myVaultPoiId = locker ? `locker_${locker.hub_name}` : null;
  const [filter, setFilter] = useState<FilterKey>('ALL');
  const [selected, setSelected] = useState<POI | null>(null);
  const [legendOpen, setLegendOpen] = useState(false);
  const sheetY = useRef(new RNAnimated.Value(400)).current;
  const [gpsPos, setGpsPos] = useState<{ x: number; y: number; inBounds: boolean } | null>(null);
  const [dbPos,  setDbPos]  = useState<{ x: number; y: number } | null>(null);
  const [friendMarkers, setFriendMarkers] = useState<{ username: string; x: number; y: number }[]>([]);
  const centeredOnUser = useRef(false); // ensures auto-center only fires once

  // Fetch own DB position + friend positions
  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Own profile: position + friends list
      const { data: myProfile } = await supabase
        .from('profiles')
        .select('position, friends')
        .eq('id', session.user.id)
        .single();

      // Position is now stored as canvas pixel coords {cx, cy} — no conversion needed.
      // Legacy rows with {lat, lon} fall through to null so the GPS fallback is used.
      const pos = myProfile?.position;
      if (pos?.cx != null && pos?.cy != null) {
        setDbPos({ x: pos.cx, y: pos.cy });
      } else if (pos?.lat != null && pos?.lon != null) {
        // Migrate: convert old GPS record to canvas coords on first view
        const c = gpsToCanvas(pos.lat, pos.lon);
        setDbPos({ x: c.x, y: c.y });
      }

      const ids: string[] = myProfile?.friends ?? [];
      if (ids.length === 0) return;

      const { data: friendData } = await supabase
        .from('profiles').select('id, username, position').in('id', ids);
      const markers = (friendData ?? [])
        .filter((f: any) => {
          const p = f.position;
          return (p?.cx != null && p?.cy != null) || (p?.lat != null && p?.lon != null);
        })
        .map((f: any) => {
          const p = f.position;
          let x: number, y: number;
          if (p?.cx != null && p?.cy != null) {
            x = p.cx; y = p.cy;
          } else {
            const c = gpsToCanvas(p.lat, p.lon);
            x = c.x; y = c.y;
          }
          return { username: f.username ?? 'RAVER', x, y };
        });
      setFriendMarkers(markers);
    })();
  }, []);

  // Request location permission and track position
  useEffect(() => {
    let sub: Location.LocationSubscription | null = null;
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      sub = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Balanced, distanceInterval: 5, timeInterval: 5000 },
        ({ coords }) => setGpsPos(gpsToCanvas(coords.latitude, coords.longitude))
      );
    })();
    return () => { sub?.remove(); };
  }, []);

  const openSheet = useCallback((poi: POI) => {
    const noSheet: POI['type'][] = ['wc', 'chill', 'vip', 'gate', 'camping', 'atm', 'water'];
    if (noSheet.includes(poi.type)) return;
    setSelected(poi);
    RNAnimated.spring(sheetY, { toValue: 0, useNativeDriver: true, damping: 22, stiffness: 180 }).start();
  }, [sheetY]);

  const closeSheet = useCallback(() => {
    RNAnimated.timing(sheetY, { toValue: 400, duration: 200, useNativeDriver: true }).start(() => setSelected(null));
  }, [sheetY]);

  // ── Gesture state ────────────────────────────────────────────────────────
  const translateX = useSharedValue(INIT_TX);
  const translateY = useSharedValue(INIT_TY);
  const savedTX = useSharedValue(INIT_TX);
  const savedTY = useSharedValue(INIT_TY);
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);

  // Compute the translate needed to place canvas point (cx, cy) at the centre of
  // the visible viewport when the canvas is rendered at the given scale.
  // React Native scales the canvas around its OWN geometric centre (MAP_W/2, MAP_H/2),
  // so the formula must account for that pivot shift.
  function centreOn(cx: number, cy: number, S: number) {
    const tx = SW / 2 + MAP_W / 2 * (S - 1) - cx * S;
    const ty = SH / 2 + MAP_H / 2 * (S - 1) - cy * S;
    return { tx, ty };
  }

  // Auto-center on the user's DB position the first time it loads
  useEffect(() => {
    if (!dbPos || centeredOnUser.current) return;
    centeredOnUser.current = true;
    const S   = 1.4;
    const PAN = { duration: 600, easing: Easing.out(Easing.cubic) };
    const { tx, ty } = centreOn(dbPos.x, dbPos.y, S);
    translateX.value = withTiming(tx, PAN);
    translateY.value = withTiming(ty, PAN);
    scale.value      = withTiming(S, PAN);
    savedTX.value    = tx;
    savedTY.value    = ty;
    savedScale.value = S;
  }, [dbPos]);

  const panGesture = Gesture.Pan()
    .onUpdate(e => { translateX.value = savedTX.value + e.translationX; translateY.value = savedTY.value + e.translationY; })
    .onEnd(() => { savedTX.value = translateX.value; savedTY.value = translateY.value; });

  const pinchGesture = Gesture.Pinch()
    .onBegin(() => { savedScale.value = scale.value; })
    .onUpdate(e => { scale.value = Math.min(MAX_SCALE, Math.max(MIN_SCALE, savedScale.value * e.scale)); })
    .onEnd(() => { savedScale.value = scale.value; });

  const composed = Gesture.Simultaneous(panGesture, pinchGesture);
  const mapStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }, { translateY: translateY.value }, { scale: scale.value }],
  }));

  const ZOOM_CFG = { duration: 240, easing: Easing.out(Easing.quad) };
  const PAN_CFG  = { duration: 360, easing: Easing.out(Easing.cubic) };

  const zoomIn  = () => { const n = Math.min(MAX_SCALE, scale.value * 1.5); scale.value = withTiming(n, ZOOM_CFG); savedScale.value = n; };
  const zoomOut = () => { const n = Math.max(MIN_SCALE, scale.value / 1.5); scale.value = withTiming(n, ZOOM_CFG); savedScale.value = n; };
  const recenter = () => {
    const target = (gpsPos && gpsPos.inBounds) ? gpsPos : (dbPos ?? { x: 580, y: 800 });
    const S = 1.4;
    const { tx, ty } = centreOn(target.x, target.y, S);
    translateX.value = withTiming(tx, PAN_CFG); translateY.value = withTiming(ty, PAN_CFG);
    scale.value = withTiming(S, PAN_CFG);
    savedTX.value = tx; savedTY.value = ty; savedScale.value = S;
  };

  // Navigate to a specific POI
  const focusPOI = useCallback((poi: POI) => {
    const S = 1.6;
    const { tx, ty } = centreOn(poi.x, poi.y, S);
    translateX.value = withTiming(tx, PAN_CFG);
    translateY.value = withTiming(ty, PAN_CFG);
    scale.value = withTiming(S, PAN_CFG);
    savedTX.value = tx; savedTY.value = ty; savedScale.value = S;
    setTimeout(() => openSheet(poi), 300);
  }, []);

  return (
    <GestureHandlerRootView style={s.root}>
      <ScreenHeader />
      <LiveStrip />
      <WeatherStrip />

      <View style={s.viewport}>

        {/* ── Filter chips ── */}
        <View style={s.filterRow}>
          {(['ALL', 'STAGES', 'FOOD', 'SERVICES'] as FilterKey[]).map(f => (
            <TouchableOpacity key={f} style={[s.chip, f === filter && s.chipActive]} onPress={() => setFilter(f)}>
              <MaterialIcons name={FILTER_ICON[f] as any} size={12} color={f === filter ? '#000' : SV.onSurface} />
              <Text style={[s.chipTxt, f === filter && s.chipTxtActive]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Map controls (right) ── */}
        <View style={s.controls}>
          {/* Compass */}
          <View style={s.compass}>
            <Text style={s.compassN}>N</Text>
            <View style={s.compassArrow} />
          </View>
          <View style={s.ctrlDivider} />
          <TouchableOpacity style={s.ctrlBtn} onPress={recenter}>
            <MaterialIcons name="my-location" size={18} color={SV.primaryContainer} />
          </TouchableOpacity>
          {myVaultPoiId && (
            <>
              <View style={s.ctrlDivider} />
              <TouchableOpacity
                style={s.ctrlBtn}
                onPress={() => {
                  const vaultPoi = POIS.find(p => p.id === myVaultPoiId);
                  if (vaultPoi) focusPOI(vaultPoi);
                }}
              >
                <MaterialIcons name="lock" size={18} color={SV.tertiaryContainer} />
              </TouchableOpacity>
            </>
          )}
          <View style={s.ctrlDivider} />
          <TouchableOpacity style={s.ctrlBtn} onPress={zoomIn}>
            <MaterialIcons name="add" size={20} color={SV.onSurface} />
          </TouchableOpacity>
          <View style={s.ctrlDivider} />
          <TouchableOpacity style={s.ctrlBtn} onPress={zoomOut}>
            <MaterialIcons name="remove" size={20} color={SV.onSurface} />
          </TouchableOpacity>
        </View>

        {/* ── Legend toggle ── */}
        <View style={s.legendToggleWrap}>
          <TouchableOpacity style={s.legendToggleBtn} onPress={() => setLegendOpen(o => !o)}>
            <MaterialIcons name="layers" size={24} color={legendOpen ? '#000' : SV.onSurface} />
          </TouchableOpacity>
          <Legend visible={legendOpen} onClose={() => setLegendOpen(false)} />
        </View>

        {/* ── Scale bar ── */}
        <View style={s.scalebar}>
          <View style={s.scalebarLine} />
          <Text style={s.scalebarTxt}>~100 m</Text>
        </View>

        {/* ── Pannable / zoomable canvas ── */}
        <GestureDetector gesture={composed}>
          <Animated.View style={[s.canvas, mapStyle]}>

            {/* ════ LAYER 0 — Lake Balaton ════ */}
            <View style={[s.lake, { left: 0, top: 0, width: MAP_W, height: 310 }]}>
              {/* Wave shimmer lines */}
              {[60, 100, 145, 185, 225, 265].map(y => (
                <View key={y} style={{ position:'absolute', left:20, right:20, top:y, height:1, backgroundColor:'rgba(100,180,255,0.09)' }} />
              ))}
              {/* Balaton label */}
              <Text style={s.lakeLabel}>LAKE BALATON</Text>
            </View>

            {/* Shoreline edge only — no fill */}
            <View style={{ position:'absolute', left:0, top:308, width:MAP_W, height:2, backgroundColor:'rgba(100,180,255,0.18)' }} />

            {/* ════ LAYER 1 — External roads (outside perimeter) ════ */}

            {/* Perimeter ring road — runs just outside the green fence */}
            {/* North ring */}
            <RoadSegment x1={60}   y1={355} x2={700}  y2={355} w={24} />
            <RoadSegment x1={700}  y1={355} x2={1340} y2={355} w={24} />
            {/* South ring */}
            <RoadSegment x1={60}   y1={1395} x2={700}  y2={1395} w={28} />
            <RoadSegment x1={700}  y1={1395} x2={1340} y2={1395} w={28} />
            {/* West ring */}
            <RoadSegment x1={60}   y1={355} x2={60}   y2={1395} w={24} />
            {/* East ring */}
            <RoadSegment x1={1340} y1={355} x2={1340} y2={1395} w={24} />

            {/* External approach roads — extend to canvas edges */}
            {/* West exit (leaves festival westward) */}
            <RoadSegment x1={60}  y1={820} x2={0}   y2={820} w={22} />
            {/* East exit */}
            <RoadSegment x1={1340} y1={820} x2={MAP_W} y2={820} w={22} />
            {/* North approach (comes from city, meets coastal road) */}
            <RoadSegment x1={700} y1={295} x2={700} y2={355} w={26} />
            {/* South main artery — gate → parking artery */}
            <RoadSegment x1={700} y1={1395} x2={700} y2={1480} w={32} />

            {/* ════ LAYER 1b — Parking lot (3 symmetric bays) ════ */}

            {/* Parking artery — wide horizontal road at top of parking */}
            <RoadSegment x1={60}  y1={1480} x2={1340} y2={1480} w={30} />

            {/* Bay entry stubs — artery down into each bay */}
            <RoadSegment x1={245}  y1={1480} x2={245}  y2={1510} w={22} />
            <RoadSegment x1={700}  y1={1480} x2={700}  y2={1510} w={22} />
            <RoadSegment x1={1155} y1={1480} x2={1155} y2={1510} w={22} />

            {/* Bay P1 — left (x=80 w=330) */}
            <View style={s.parkingBay}>
              {/* driving lanes */}
              <View style={[s.parkLane, { top:85 }]} />
              <View style={[s.parkLane, { top:175 }]} />
              {/* slot dividers */}
              {[33,66,99,132,165,198,231,264,297].map(x => (
                <View key={x} style={[s.parkSlot, { left:x }]} />
              ))}
              <Text style={s.parkLabel}>P1</Text>
            </View>

            {/* Bay P2 — center (x=535 w=330) */}
            <View style={[s.parkingBay, { left:535 }]}>
              <View style={[s.parkLane, { top:85 }]} />
              <View style={[s.parkLane, { top:175 }]} />
              {[33,66,99,132,165,198,231,264,297].map(x => (
                <View key={x} style={[s.parkSlot, { left:x }]} />
              ))}
              <Text style={s.parkLabel}>P2</Text>
            </View>

            {/* Bay P3 — right (x=990 w=330) */}
            <View style={[s.parkingBay, { left:990 }]}>
              <View style={[s.parkLane, { top:85 }]} />
              <View style={[s.parkLane, { top:175 }]} />
              {[33,66,99,132,165,198,231,264,297].map(x => (
                <View key={x} style={[s.parkSlot, { left:x }]} />
              ))}
              <Text style={s.parkLabel}>P3</Text>
            </View>

            {/* Exit roads from south end of each bay */}
            <RoadSegment x1={245}  y1={1770} x2={245}  y2={1800} w={22} />
            <RoadSegment x1={700}  y1={1770} x2={700}  y2={1800} w={22} />
            <RoadSegment x1={1155} y1={1770} x2={1155} y2={1800} w={22} />
            {/* South exit artery */}
            <RoadSegment x1={60}  y1={1800} x2={1340} y2={1800} w={28} />
            {/* South road extending off-canvas */}
            <RoadSegment x1={700} y1={1800} x2={700}  y2={MAP_H} w={32} />

            {/* ════ LAYER 2 — Trees ════ */}
            {TREES.map(t => (
              <View key={`${t.x}-${t.y}`} style={{
                position:'absolute',
                left: t.x - t.r, top: t.y - t.r,
                width: t.r * 2, height: t.r * 2,
                borderRadius: t.r,
                backgroundColor:'rgba(6,22,6,0.85)',
                borderWidth:1, borderColor:'rgba(20,50,20,0.5)',
              }} />
            ))}

            {/* ════ LAYER 4 — Roads ════ */}

            {/* Coastal access road */}
            {([[60,296,400,292,26],[400,292,750,295,26],[750,295,1140,298,26]] as [number,number,number,number,number][]).map(([x1,y1,x2,y2,w],i)=>(
              <RoadSegment key={`coast${i}`} x1={x1} y1={y1} x2={x2} y2={y2} w={w} />
            ))}

            {/* Main festival promenade */}
            {([
              [215,918,300,870,28], [300,870,380,830,28],
              [380,830,490,800,28], [490,800,595,780,28],
              [595,780,700,800,28], [700,800,810,840,28],
              [810,840,920,820,28],
            ] as [number,number,number,number,number][]).map(([x1,y1,x2,y2,w],i)=>(
              <RoadSegment key={`prom${i}`} x1={x1} y1={y1} x2={x2} y2={y2} w={w} />
            ))}

            {/* North spine (Medical → Lakeside beach road) */}
            {([
              [640,490,630,420,22],[630,420,620,360,22],[620,360,680,310,22],
            ] as [number,number,number,number,number][]).map(([x1,y1,x2,y2,w],i)=>(
              <RoadSegment key={`nspine${i}`} x1={x1} y1={y1} x2={x2} y2={y2} w={w} />
            ))}

            {/* South entrance road */}
            {([
              [700,1328,698,1240,32],[698,1240,680,1150,30],
              [680,1150,660,1070,28],[660,1070,645,990,27],[645,990,625,910,26],
            ] as [number,number,number,number,number][]).map(([x1,y1,x2,y2,w],i)=>(
              <RoadSegment key={`gate${i}`} x1={x1} y1={y1} x2={x2} y2={y2} w={w} />
            ))}

            {/* Grid access road */}
            {([
              [920,820,940,740,22],[940,740,990,660,22],
              [990,660,1040,570,22],[1040,570,1090,485,22],
            ] as [number,number,number,number,number][]).map(([x1,y1,x2,y2,w],i)=>(
              <RoadSegment key={`grid${i}`} x1={x1} y1={y1} x2={x2} y2={y2} w={w} />
            ))}

            {/* Basement stub */}
            <RoadSegment x1={215} y1={900} x2={300} y2={872} w={20} />

            {/* Chill zone spur */}
            <RoadSegment x1={380} y1={830} x2={340} y2={680} w={18} />
            <RoadSegment x1={340} y1={680} x2={335} y2={610} w={18} />

            {/* WC1 stub */}
            <RoadSegment x1={300} y1={870} x2={290} y2={740} w={16} />

            {/* Loop Bar access */}
            <RoadSegment x1={475} y1={800} x2={440} y2={930} w={20} />
            <RoadSegment x1={440} y1={930} x2={392} y2={1060} w={20} />

            {/* WC3 / Lockers spur */}
            <RoadSegment x1={392} y1={1060} x2={480} y2={1100} w={16} />
            <RoadSegment x1={660} y1={1070} x2={660} y2={1130} w={16} />

            {/* VIP Bar spur */}
            <RoadSegment x1={990} y1={660} x2={1020} y2={762} w={16} />
            <RoadSegment x1={1020} y1={762} x2={1100} y2={840} w={16} />
            <RoadSegment x1={1020} y1={762} x2={1130} y2={682} w={16} />

            {/* WC2 branch */}
            <RoadSegment x1={830} y1={845} x2={875} y2={930} w={18} />
            <RoadSegment x1={875} y1={930} x2={930} y2={1010} w={18} />

            {/* Charging2 spur */}
            <RoadSegment x1={940} y1={740} x2={900} y2={600} w={14} />

            {/* Beach bar access */}
            <RoadSegment x1={620} y1={360} x2={510} y2={315} w={18} />

            {/* Camping A access */}
            {([
              [920,820,1000,930,18],[1000,930,1080,1060,18],[1080,1060,1160,1100,18],
            ] as [number,number,number,number,number][]).map(([x1,y1,x2,y2,w],i)=>(
              <RoadSegment key={`campa${i}`} x1={x1} y1={y1} x2={x2} y2={y2} w={w} />
            ))}

            {/* Camping B access */}
            {([
              [392,1060,280,1120,18],[280,1120,185,1220,18],
            ] as [number,number,number,number,number][]).map(([x1,y1,x2,y2,w],i)=>(
              <RoadSegment key={`campb${i}`} x1={x1} y1={y1} x2={x2} y2={y2} w={w} />
            ))}

            {/* VIP gate spur */}
            <RoadSegment x1={1160} y1={1100} x2={1160} y2={1060} w={18} />

            {/* South exit — gate to south ring road */}
            <RoadSegment x1={700} y1={1330} x2={700} y2={1395} w={30} />

            {/* ════ LAYER 5 — Festival perimeter ════ */}
            <View style={s.perimeter} />
            {/* Perimeter corner accents */}
            {[
              {left:120,top:380},{left:1240,top:380},{left:120,top:1290},{left:1240,top:1290}
            ].map((pos,i) => (
              <View key={i} style={[s.perimeterCorner, pos]} />
            ))}

            {/* ════ LAYER 6 — Dot grid overlay ════ */}
            {Array.from({ length: 22 }).map((_, row) =>
              Array.from({ length: 18 }).map((__,col) => (
                <View key={`${row}-${col}`} style={{
                  position:'absolute',
                  left: col * 78 + 20, top: row * 74 + 20,
                  width:1.5, height:1.5, borderRadius:1,
                  backgroundColor:'rgba(255,255,255,0.028)',
                }} />
              ))
            )}

            {/* ════ LAYER 7 — You Are Here ════
                Priority: live device GPS (if at festival) → DB position (set at registration) */}
            {(() => {
              const pos = (gpsPos && gpsPos.inBounds) ? gpsPos : dbPos;
              if (!pos) return null;
              return (
                <View style={[s.poi, { left: pos.x - 12, top: pos.y - 12 }]}>
                  <YouAreHere />
                </View>
              );
            })()}

            {/* ════ LAYER 7b — Friend markers ════ */}
            {friendMarkers.map(f => (
              <View key={f.username} style={[s.poi, { left: f.x - 16, top: f.y - 20 }]}>
                <FriendMarker username={f.username} />
              </View>
            ))}

            {/* ════ LAYER 8 — POIs ════ */}
            {POIS.filter(poi => isVisible(poi, filter)).map(poi => {
              const isMyVault = poi.id === myVaultPoiId;
              const isLarge = poi.size === 'large';
              const isMed   = isMyVault || poi.size === 'medium';
              const boxSize = isLarge ? 72 : isMed ? 56 : 40;
              const iconSz  = isLarge ? 32 : isMed ? 23 : 17;
              const radius  = isLarge ? 16 : isMed ? 12 : 9;
              const poiColor = isMyVault ? SV.tertiaryContainer : poi.color;
              return (
                <TouchableOpacity
                  key={poi.id}
                  style={[s.poi, { left: poi.x - boxSize / 2, top: poi.y - boxSize / 2 }]}
                  onPress={() => openSheet(poi)}
                  activeOpacity={0.78}
                  hitSlop={10}>
                  {isMyVault}
                  <View style={[
                    s.poiBox,
                    { width:boxSize, height:boxSize, borderRadius:radius, borderColor:poiColor, backgroundColor:`${poiColor}22` },
                    isLarge && { shadowColor:poiColor, shadowOffset:{width:0,height:0}, shadowOpacity:0.55, shadowRadius:14, elevation:10 },
                    isMyVault && { borderWidth:2, shadowColor:SV.tertiaryContainer, shadowOffset:{width:0,height:0}, shadowOpacity:0.6, shadowRadius:16, elevation:12 },
                  ]}>
                    <MaterialIcons name={poi.icon as any} size={iconSz} color={poiColor} />
                    {poi.crowd && poi.size === 'large' && (
                      <View style={[s.poiCrowdBadge, {
                        backgroundColor: poi.crowd==='HIGH'?'rgba(255,107,107,0.9)':poi.crowd==='MED'?'rgba(245,166,35,0.9)':'rgba(126,200,160,0.9)'
                      }]}>
                        <View style={[s.poiCrowdDot, {backgroundColor:'#fff'}]} />
                      </View>
                    )}
                  </View>
                  {/* Label tag */}
                  {(poi.label || isMyVault) ? (
                    <View style={[s.poiTag, { borderColor:`${poiColor}55`, backgroundColor:'rgba(9,9,14,0.94)' }]}>
                      <Text style={[s.poiTagTxt, { color: poiColor }]}>
                        {isMyVault ? 'MY VAULT' : poi.label}
                      </Text>
                      {isMyVault && locker ? (
                        <Text style={[s.poiTagTime, { color:`${SV.tertiaryContainer}BB` }]}>
                          SLOT #{String(locker.slot_number).padStart(3, '0')}
                        </Text>
                      ) : poi.time ? (
                        <Text style={[s.poiTagTime, { color:`${poi.color}AA` }]}>{poi.time.split('–')[0]}</Text>
                      ) : null}
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
          <RNAnimated.View style={[s.sheet, { transform:[{ translateY: sheetY }], paddingBottom: Math.max(insets.bottom + 12, 24) }]}>

            {/* Handle */}
            <TouchableOpacity style={s.sheetHandle} onPress={closeSheet}>
              <View style={s.handleBar} />
            </TouchableOpacity>

            {/* ── Stage sheet ── */}
            {selected.type === 'stage' && (
              <>
                <View style={s.sheetHead}>
                  <View style={{ flex:1, marginRight:12 }}>
                    <View style={s.liveBadge}>
                      <PulseDot color={selected.color} />
                      <Text style={[s.liveTxt, { color:selected.color }]}>LIVE NOW</Text>
                    </View>
                    <Text style={[s.stageName, { color:selected.color }]}>{selected.label}</Text>
                    <Text style={s.stageDesc}>{selected.desc}</Text>
                  </View>
                  <View style={[s.typeIcon, { borderColor:`${selected.color}45`, backgroundColor:`${selected.color}14` }]}>
                    <MaterialIcons name={selected.icon as any} size={22} color={selected.color} />
                  </View>
                </View>

                {/* Walk time + Crowd row */}
                <View style={s.metaRow}>
                  <View style={s.metaChip}>
                    <MaterialIcons name="directions-walk" size={13} color={SV.onSurfaceVariant} />
                    <Text style={s.metaTxt}>{selected.walkMin === 0 ? 'You are here' : `~${selected.walkMin} min walk`}</Text>
                  </View>
                  {selected.crowd && (
                    <CrowdBadge level={selected.crowd} />
                  )}
                </View>

                {/* Now playing */}
                <View style={[s.nowPlaying, { borderColor:`${selected.color}22` }]}>
                  <View style={{ flex:1 }}>
                    <Text style={[s.npLabel, { color:selected.color }]}>NOW PLAYING</Text>
                    <Text style={s.npArtist}>{selected.artist}</Text>
                    <Text style={s.npTime}>{selected.time}</Text>
                  </View>
                  <View style={[s.eqIcon, { borderColor:selected.color }]}>
                    <MaterialIcons name="equalizer" size={20} color={selected.color} />
                  </View>
                </View>

                {/* Next up */}
                {selected.nextArtist && (
                  <View style={s.nextUp}>
                    <Text style={s.nextUpLabel}>NEXT UP</Text>
                    <Text style={s.nextUpArtist}>{selected.nextArtist}</Text>
                    <Text style={s.nextUpTime}>{selected.nextTime}</Text>
                  </View>
                )}

                <View style={s.sheetActions}>
                  <TouchableOpacity style={[s.btnPrimary, { backgroundColor:selected.color, ...(selected.color===SV.primaryContainer ? neonShadow : {}) }]}
                    onPress={() => { closeSheet(); router.push('/lineup'); }}>
                    <MaterialIcons name="event" size={18} color={SV.deepCharcoal} />
                    <Text style={s.btnPrimaryTxt}>SCHEDULE</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[s.btnOutline, { borderColor:selected.color }]}>
                    <MaterialIcons name="star-outline" size={18} color={selected.color} />
                    <Text style={[s.btnOutlineTxt, { color:selected.color }]}>SAVE</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {/* ── Gastro / bar sheet ── */}
            {selected.type === 'gastro' && (
              <>
                <View style={s.sheetHead}>
                  <View style={{ flex:1, marginRight:12 }}>
                    <Text style={[s.stageName, { color:'#F5A623' }]}>{selected.label}</Text>
                    <Text style={s.stageDesc}>{selected.desc}</Text>
                  </View>
                  <View style={[s.typeIcon, { borderColor:'rgba(245,166,35,0.4)', backgroundColor:'rgba(245,166,35,0.12)' }]}>
                    <MaterialIcons name={selected.icon as any} size={22} color="#F5A623" />
                  </View>
                </View>

                <View style={s.metaRow}>
                  <View style={s.metaChip}>
                    <MaterialIcons name="directions-walk" size={13} color={SV.onSurfaceVariant} />
                    <Text style={s.metaTxt}>~{selected.walkMin} min walk</Text>
                  </View>
                  {selected.queueMin !== undefined && (
                    <View style={s.metaChip}>
                      <MaterialIcons name="access-time" size={13} color={SV.onSurfaceVariant} />
                      <Text style={s.metaTxt}>
                        {selected.queueMin === 0 ? 'No queue' : `~${selected.queueMin} min queue`}
                      </Text>
                    </View>
                  )}
                  {selected.crowd && <CrowdBadge level={selected.crowd} />}
                </View>

                <View style={[s.nowPlaying, { borderColor:'rgba(245,166,35,0.2)' }]}>
                  <MaterialIcons name="access-time" size={18} color="#F5A623" />
                  <View style={{ marginLeft:10, flex:1 }}>
                    <Text style={[s.npLabel, { color:'#F5A623' }]}>OPEN HOURS</Text>
                    <Text style={s.npArtist}>Daily 14:00 – 06:00</Text>
                  </View>
                </View>

                <View style={s.sheetActions}>
                  <TouchableOpacity style={[s.btnPrimary, { backgroundColor:'#F5A623' }]}
                    onPress={() => { closeSheet(); router.push('/gastro'); }}>
                    <MaterialIcons name="fastfood" size={18} color="#000" />
                    <Text style={[s.btnPrimaryTxt, { color:'#000' }]}>ORDER IN-APP</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[s.btnOutline, { borderColor:'#F5A623' }]}>
                    <MaterialIcons name="directions" size={18} color="#F5A623" />
                    <Text style={[s.btnOutlineTxt, { color:'#F5A623' }]}>DIRECTIONS</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {/* ── Medical sheet ── */}
            {selected.type === 'medical' && (
              <>
                <View style={s.sheetHead}>
                  <View style={{ flex:1, marginRight:12 }}>
                    <Text style={[s.stageName, { color:'#FF6666' }]}>MEDICAL</Text>
                    <Text style={s.stageDesc}>{selected.desc}</Text>
                  </View>
                  <View style={[s.typeIcon, { borderColor:'rgba(255,68,68,0.4)', backgroundColor:'rgba(255,68,68,0.12)' }]}>
                    <MaterialIcons name="local-hospital" size={22} color="#FF4444" />
                  </View>
                </View>
                <View style={[s.metaRow]}>
                  <View style={[s.metaChip, { borderColor:'rgba(255,68,68,0.3)', backgroundColor:'rgba(255,68,68,0.08)' }]}>
                    <MaterialIcons name="emergency" size={13} color="#FF4444" />
                    <Text style={[s.metaTxt, { color:'#FF4444' }]}>OPEN 24 / 7</Text>
                  </View>
                </View>
                <TouchableOpacity style={[s.btnPrimary, { backgroundColor:'#FF4444', marginTop:16 }]}>
                  <MaterialIcons name="phone" size={18} color="#fff" />
                  <Text style={[s.btnPrimaryTxt, { color:'#fff' }]}>CALL EMERGENCY LINE</Text>
                </TouchableOpacity>
              </>
            )}

            {/* ── Info / Charging sheet ── */}
            {(selected.type === 'info' || selected.type === 'charging') && (
              <>
                <View style={s.sheetHead}>
                  <View style={{ flex:1, marginRight:12 }}>
                    <Text style={[s.stageName, { color:selected.color, fontSize:18 }]}>{selected.label}</Text>
                    <Text style={s.stageDesc}>{selected.desc}</Text>
                  </View>
                  <View style={[s.typeIcon, { borderColor:`${selected.color}45`, backgroundColor:`${selected.color}14` }]}>
                    <MaterialIcons name={selected.icon as any} size={22} color={selected.color} />
                  </View>
                </View>
                {selected.walkMin !== undefined && (
                  <View style={s.metaRow}>
                    <View style={s.metaChip}>
                      <MaterialIcons name="directions-walk" size={13} color={SV.onSurfaceVariant} />
                      <Text style={s.metaTxt}>~{selected.walkMin} min walk</Text>
                    </View>
                  </View>
                )}
              </>
            )}

            {/* ── Locker / Vault sheet ── */}
            {selected.type === 'lockers' && (() => {
              const isMyHub = selected.id === myVaultPoiId;
              return (
                <>
                  <View style={s.sheetHead}>
                    <View style={{ flex:1, marginRight:12 }}>
                      {isMyHub && (
                        <View style={{ flexDirection:'row', alignItems:'center', gap:6, marginBottom:6 }}>
                          <View style={{ width:7, height:7, borderRadius:3.5, backgroundColor:SV.tertiaryContainer }} />
                          <Text style={{ color:SV.tertiaryContainer, fontFamily:'monospace', fontSize:10, letterSpacing:2, fontWeight:'700' }}>
                            YOUR VAULT
                          </Text>
                        </View>
                      )}
                      <Text style={[s.stageName, { color:'#55f2ff', fontSize:18 }]}>{selected.label}</Text>
                      <Text style={s.stageDesc}>{selected.desc}</Text>
                    </View>
                    <View style={[s.typeIcon, { borderColor:'rgba(85,242,255,0.35)', backgroundColor:'rgba(85,242,255,0.1)' }]}>
                      <MaterialIcons name="lock" size={22} color="#55f2ff" />
                    </View>
                  </View>

                  {isMyHub && locker && (
                    <View style={{
                      flexDirection:'row', justifyContent:'space-between',
                      backgroundColor:'rgba(85,242,255,0.08)', borderWidth:1,
                      borderColor:'rgba(85,242,255,0.25)', borderRadius:12,
                      paddingHorizontal:16, paddingVertical:12, marginBottom:14,
                    }}>
                      <View>
                        <Text style={{ color:SV.onSurfaceVariant, fontFamily:'monospace', fontSize:10, letterSpacing:1.5, marginBottom:3 }}>SLOT</Text>
                        <Text style={{ color:SV.tertiaryContainer, fontFamily:'monospace', fontSize:18, fontWeight:'900' }}>
                          #{String(locker.slot_number).padStart(3, '0')}
                        </Text>
                      </View>
                      <View style={{ alignItems:'flex-end' }}>
                        <Text style={{ color:SV.onSurfaceVariant, fontFamily:'monospace', fontSize:10, letterSpacing:1.5, marginBottom:3 }}>ACCESS CODE</Text>
                        <Text style={{ color:SV.tertiaryContainer, fontFamily:'monospace', fontSize:18, fontWeight:'900', letterSpacing:4 }}>
                          {locker.pin_code}
                        </Text>
                      </View>
                    </View>
                  )}

                  <TouchableOpacity
                    style={[s.btnPrimary, { backgroundColor:'#55f2ff', marginTop: isMyHub ? 0 : 14 }]}
                    onPress={() => {
                      const hub = selected.id.replace('locker_', '');
                      router.push(`/locker?hub=${hub}` as any);
                    }}
                  >
                    <MaterialIcons name={isMyHub ? 'lock-open' : 'lock'} size={18} color="#07070c" />
                    <Text style={[s.btnPrimaryTxt, { color:'#07070c' }]}>
                      {isMyHub ? 'MANAGE MY VAULT' : 'ACCESS NEURAL VAULT'}
                    </Text>
                  </TouchableOpacity>
                </>
              );
            })()}

          </RNAnimated.View>
        </>
      )}

      <CartFAB />
    </GestureHandlerRootView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex:1, backgroundColor:'#09090E' },
  viewport: { flex:1, overflow:'hidden', backgroundColor:'#09090E', position:'relative' },

  // Canvas
  canvas: { width:MAP_W, height:MAP_H, backgroundColor:'#09090E', position:'absolute' },

  // Terrain
  lake: {
    position:'absolute',
    backgroundColor:'rgba(4,20,52,0.78)',
    borderBottomWidth:2,
    borderBottomColor:'rgba(60,140,220,0.18)',
  },
  lakeLabel: {
    position:'absolute', top:130, left:0, right:0,
    textAlign:'center',
    color:'rgba(80,160,255,0.2)',
    fontFamily:'monospace', fontSize:22, letterSpacing:8, fontWeight:'700',
  },
  zoneLabel: {
    position:'absolute',
    color:'rgba(255,255,255,0.18)',
    fontFamily:'monospace', fontSize:10, letterSpacing:2, fontWeight:'600',
  },

  // Parking
  parkingBay: {
    position:'absolute', left:80, top:1510, width:330, height:260,
    borderWidth:1, borderColor:'rgba(255,255,255,0.055)',
    backgroundColor:'rgba(10,10,20,0.5)',
  },
  parkLane: {
    position:'absolute', left:0, right:0, height:20,
    backgroundColor:'#15151f',
  },
  parkSlot: {
    position:'absolute', top:0, bottom:0, width:1,
    backgroundColor:'rgba(255,255,255,0.04)',
  },
  parkLabel: {
    position:'absolute', bottom:8, right:10,
    color:'rgba(255,255,255,0.15)', fontFamily:'monospace', fontSize:10, letterSpacing:2,
  },

  // Perimeter
  perimeter: {
    position:'absolute', left:120, top:380, width:1160, height:980,
    borderRadius:80, borderWidth:1.5, borderColor:'rgba(57,255,20,0.16)',
    backgroundColor:'rgba(57,255,20,0.012)',
  },
  perimeterCorner: {
    position:'absolute', width:14, height:14,
    borderColor:'rgba(57,255,20,0.4)', backgroundColor:'transparent',
    borderWidth:2,
  },

  // POIs
  poi: { position:'absolute', alignItems:'center' },
  poiBox: { borderWidth:1.5, alignItems:'center', justifyContent:'center', overflow:'hidden' },
  poiGlow: { ...StyleSheet.absoluteFillObject },
  poiTag: { marginTop:5, paddingHorizontal:8, paddingVertical:3, borderRadius:20, borderWidth:1, alignItems:'center' },
  poiTagTxt: { fontFamily:'monospace', fontSize:8.5, letterSpacing:0.8, fontWeight:'700' },
  poiTagTime: { fontFamily:'monospace', fontSize:7.5, letterSpacing:0.5, marginTop:1 },
  poiCrowdBadge: { position:'absolute', top:-3, right:-3, width:10, height:10, borderRadius:5, alignItems:'center', justifyContent:'center' },
  poiCrowdDot: { width:4, height:4, borderRadius:2 },

  // Friend markers
  friendWrap: { alignItems: 'center' },
  friendDot: {
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: SV.secondaryContainer,
    borderWidth: 2.5, borderColor: '#fff',
    shadowColor: SV.secondaryContainer, shadowOpacity: 0.9, shadowRadius: 10, shadowOffset: { width: 0, height: 0 },
  },
  friendLabel: {
    marginTop: 5, backgroundColor: '#09090E', borderWidth: 1,
    borderColor: `${SV.secondaryContainer}70`, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 10,
  },
  friendLabelTxt: {
    color: SV.secondaryContainer, fontFamily: 'monospace', fontSize: 8.5, letterSpacing: 1.2, fontWeight: '700',
  },

  // You Are Here
  yah: { alignItems:'center' },
  yahCenter: { alignItems:'center', justifyContent:'center' },
  yahRing: { position:'absolute', width:40, height:40, borderRadius:20, backgroundColor:'rgba(57,255,20,0.18)' },
  yahRing2: { position:'absolute', width:28, height:28, borderRadius:14, backgroundColor:'rgba(57,255,20,0.22)' },
  yahDot: { width:15, height:15, borderRadius:7.5, backgroundColor:SV.primaryContainer, borderWidth:2.5, borderColor:'#09090E', shadowColor:'#39ff14', shadowOffset:{width:0,height:0}, shadowOpacity:1, shadowRadius:12 },
  yahLabel: { marginTop:6, backgroundColor:'#09090E', borderWidth:1, borderColor:'rgba(57,255,20,0.45)', paddingHorizontal:7, paddingVertical:2, borderRadius:10 },
  yahLabelTxt: { color:SV.primaryContainer, fontFamily:'monospace', fontSize:8, letterSpacing:1.8, fontWeight:'700' },

  // Live strip
  liveStrip: {
    flexDirection:'row', alignItems:'center', gap:6,
    paddingHorizontal:14, paddingVertical:8,
    backgroundColor:'rgba(57,255,20,0.06)',
    borderBottomWidth:1, borderBottomColor:'rgba(57,255,20,0.14)',
  },
  liveStripTxt: { color:SV.onSurfaceVariant, fontFamily:'monospace', fontSize:11, letterSpacing:1 },
  liveStripArtist: { color:SV.primaryContainer, fontFamily:'monospace', fontSize:11, fontWeight:'800', letterSpacing:0.5 },
  liveStripSep: { color:SV.onSurfaceVariant, fontFamily:'monospace', fontSize:11 },
  liveStripBtn: { flexDirection:'row', alignItems:'center', gap:2, paddingHorizontal:10, paddingVertical:4, borderRadius:12, backgroundColor:'rgba(57,255,20,0.1)', borderWidth:1, borderColor:'rgba(57,255,20,0.2)' },
  liveStripBtnTxt: { color:SV.primaryContainer, fontFamily:'monospace', fontSize:10, letterSpacing:1 },

  // Filters
  filterRow: { position:'absolute', top:36, left:10, zIndex:20, flexDirection:'row', gap:6 },
  chip: { flexDirection:'row', alignItems:'center', gap:5, paddingHorizontal:12, paddingVertical:7, borderRadius:20, backgroundColor:'rgba(14,14,22,0.9)', borderWidth:1, borderColor:'rgba(255,255,255,0.14)' },
  chipActive: { backgroundColor:SV.primaryContainer, borderColor:SV.primaryContainer, ...neonShadow },
  chipTxt: { color:SV.onSurface, fontFamily:'monospace', fontSize:9.5, letterSpacing:0.5 },
  chipTxtActive: { color:'#000', fontWeight:'800' },

  // Controls
  controls: { position:'absolute', right:10, top:10, zIndex:20, backgroundColor:'rgba(14,14,22,0.92)', borderRadius:12, borderWidth:1, borderColor:'rgba(255,255,255,0.1)', overflow:'hidden' },
  ctrlBtn: { width:44, height:44, alignItems:'center', justifyContent:'center' },
  ctrlDivider: { height:1, backgroundColor:'rgba(255,255,255,0.08)', marginHorizontal:8 },
  compass: { width:44, height:44, alignItems:'center', justifyContent:'center', gap:2 },
  compassN: { color:SV.primaryContainer, fontFamily:'monospace', fontSize:10, fontWeight:'900', letterSpacing:1 },
  compassArrow: { width:1.5, height:10, backgroundColor:SV.primaryContainer, marginTop:-2 },

  // Legend
  legendToggleWrap: { position:'absolute', left:12, bottom:16, zIndex:20 },
  legendToggleBtn: { width:50, height:50, borderRadius:25, backgroundColor:'rgba(14,14,22,0.95)', borderWidth:1.5, borderColor:'rgba(255,255,255,0.18)', alignItems:'center', justifyContent:'center' },
  legend: {
    position:'absolute', bottom:62, left:0,
    backgroundColor:'rgba(14,14,22,0.97)', borderRadius:14, borderWidth:1.5, borderColor:'rgba(255,255,255,0.14)',
    padding:16, minWidth:190,
  },
  legendHeader: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:14 },
  legendTitle: { color:SV.onSurface, fontFamily:'monospace', fontSize:13, letterSpacing:2, fontWeight:'700' },
  legendRow: { flexDirection:'row', alignItems:'center', gap:12, marginBottom:11 },
  legendLabel: { color:SV.onSurfaceVariant, fontFamily:'monospace', fontSize:13, letterSpacing:0.5 },

  // Scale bar
  scalebar: { position:'absolute', right:10, bottom:16, zIndex:20, alignItems:'center' },
  scalebarLine: { width:70, height:3, backgroundColor:SV.onSurfaceVariant, borderRadius:2, marginBottom:4, borderLeftWidth:1.5, borderRightWidth:1.5, borderColor:SV.onSurface },
  scalebarTxt: { color:SV.outline, fontFamily:'monospace', fontSize:9, letterSpacing:0.5 },

  // Overlay
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor:'rgba(0,0,0,0.65)', zIndex:30 },

  // Bottom sheet
  sheet: {
    position:'absolute', bottom:0, left:0, right:0, zIndex:40,
    backgroundColor:'#101018', borderTopWidth:1, borderTopColor:'rgba(255,255,255,0.08)',
    borderTopLeftRadius:24, borderTopRightRadius:24, padding:20,
  },
  sheetHandle: { alignItems:'center', marginBottom:16 },
  handleBar: { width:38, height:4, backgroundColor:SV.surfaceVariant, borderRadius:2 },
  sheetHead: { flexDirection:'row', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 },
  stageName: { color:SV.onSurface, fontSize:22, fontWeight:'800', textTransform:'uppercase', letterSpacing:-0.5 },
  stageDesc: { color:SV.onSurfaceVariant, fontSize:13, marginTop:3, lineHeight:18 },
  typeIcon: { width:44, height:44, borderRadius:22, borderWidth:1, alignItems:'center', justifyContent:'center' },
  liveBadge: { flexDirection:'row', alignItems:'center', gap:6, marginBottom:6 },
  liveTxt: { fontFamily:'monospace', fontSize:10, letterSpacing:2, fontWeight:'700' },

  // Meta row (walk time + crowd)
  metaRow: { flexDirection:'row', gap:8, marginBottom:12, flexWrap:'wrap' },
  metaChip: { flexDirection:'row', alignItems:'center', gap:5, paddingHorizontal:10, paddingVertical:5, borderRadius:12, backgroundColor:SV.surfaceContainerHigh, borderWidth:1, borderColor:'rgba(255,255,255,0.08)' },
  metaTxt: { color:SV.onSurfaceVariant, fontFamily:'monospace', fontSize:11 },
  crowdBadge: { flexDirection:'row', alignItems:'center', gap:5, paddingHorizontal:10, paddingVertical:5, borderRadius:12, borderWidth:1 },
  crowdDot: { width:6, height:6, borderRadius:3 },
  crowdTxt: { fontFamily:'monospace', fontSize:11, fontWeight:'700', letterSpacing:0.5 },

  nowPlaying: { backgroundColor:SV.deepCharcoal, borderRadius:12, borderWidth:1, padding:14, marginBottom:12, flexDirection:'row', alignItems:'center' },
  npLabel: { fontFamily:'monospace', fontSize:10, letterSpacing:2, marginBottom:5, fontWeight:'700' },
  npArtist: { color:SV.onSurface, fontSize:18, fontWeight:'700' },
  npTime: { color:SV.onSurfaceVariant, fontFamily:'monospace', fontSize:11, marginTop:3 },
  eqIcon: { width:42, height:42, borderRadius:21, borderWidth:1.5, alignItems:'center', justifyContent:'center' },

  nextUp: { flexDirection:'row', alignItems:'center', gap:8, backgroundColor:SV.surfaceContainerLow, borderRadius:10, padding:12, marginBottom:14, borderWidth:1, borderColor:'rgba(255,255,255,0.06)' },
  nextUpLabel: { color:SV.outline, fontFamily:'monospace', fontSize:9, letterSpacing:2, marginRight:4 },
  nextUpArtist: { color:SV.onSurface, fontWeight:'700', fontSize:14, flex:1 },
  nextUpTime: { color:SV.onSurfaceVariant, fontFamily:'monospace', fontSize:11 },

  sheetActions: { flexDirection:'row', gap:12 },
  btnPrimary: { flex:1, flexDirection:'row', alignItems:'center', justifyContent:'center', gap:8, paddingVertical:13, borderRadius:10, ...neonShadow },
  btnPrimaryTxt: { color:SV.deepCharcoal, fontWeight:'800', fontSize:13, letterSpacing:1.5 },
  btnOutline: { flex:1, borderWidth:1.5, flexDirection:'row', alignItems:'center', justifyContent:'center', gap:8, paddingVertical:13, borderRadius:10 },
  btnOutlineTxt: { fontWeight:'800', fontSize:13, letterSpacing:1.5 },

  // Weather strip
  weatherStrip: {
    height: 0,
    overflow: 'visible',
    alignItems: 'center',
    zIndex: 25,
  },
  weatherPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 5,
    marginTop: 5,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(245,166,35,0.30)',
    borderRadius: 20,
    shadowColor: '#F5A623',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.20,
    shadowRadius: 7,
  },
  weatherTemp: {
    color: '#F5A623',
    fontFamily: 'monospace',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  weatherSep: {
    width: 1,
    height: 10,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  weatherCond: {
    color: SV.onSurfaceVariant,
    fontFamily: 'monospace',
    fontSize: 10,
    letterSpacing: 1.5,
  },
  weatherData: {
    color: SV.onSurfaceVariant,
    fontFamily: 'monospace',
    fontSize: 10,
    letterSpacing: 0.5,
  },
});
