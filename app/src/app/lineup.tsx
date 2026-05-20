import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SV, neonShadow } from '@/constants/theme';
import { CartFAB, ScreenHeader } from '@/components/screen-header';
import { useLanguage } from '@/context/LanguageContext';
import { AudioBars } from '@/components/audio-bars';
import { SkeletonLineupRow } from '@/components/skeleton';
import { supabase } from '../utils/supabase';

type DayIdx = 0 | 1 | 2;
type StageFilter = 'ALL' | 'SUBURBIA' | 'BASEMENT' | 'GRID' | 'FAVOURITES';

interface ArtistEntry {
  id: string;          // unique appointment ID: "d{day}-{stage}-{startTime}"
  day: DayIdx;
  name: string;
  time: string;
  stage: 'suburbia' | 'basement' | 'grid';
  favorite: boolean;
  live?: boolean;
}

// Generate a stable, unique ID for each appointment slot.
// Using day + stage + start-time means one artist performing twice on different
// stages/days gets two separate, independently favouritable IDs.
function makeId(day: DayIdx, stage: string, time: string) {
  return `d${day}-${stage}-${time.split(' ')[0].replace(':', '')}`;
}

const ARTISTS_RAW: Omit<ArtistEntry, 'id'>[] = [
  // ── FRIDAY (Day 0) ──────────────────────────────────────────────────────────
  { day: 0, name: 'AKC Kendo', time: '14:00 - 15:30', stage: 'suburbia', favorite: false },
  { day: 0, name: 'Lmen Prala', time: '15:45 - 17:00', stage: 'suburbia', favorite: false },
  { day: 0, name: 'Pogány Induló x Ótvar Pestis', time: '17:15 - 18:30', stage: 'suburbia', favorite: false },
  { day: 0, name: 'T. Danny', time: '18:45 - 20:15', stage: 'suburbia', favorite: false },
  { day: 0, name: 'DESH', time: '20:30 - 22:00', stage: 'suburbia', favorite: false },
  { day: 0, name: 'CENTRAL CEE (UK)', time: '22:30 - 00:00', stage: 'suburbia', favorite: true },
  { day: 0, name: 'DJ Next Level (Trap & Bass After)', time: '00:00 - 02:00', stage: 'suburbia', favorite: false },

  { day: 0, name: 'IFJÚ BACI', time: '14:30 - 16:00', stage: 'basement', favorite: false },
  { day: 0, name: 'Sisi', time: '16:15 - 17:45', stage: 'basement', favorite: false },
  { day: 0, name: 'Gege / Mikee Mykanic', time: '18:00 - 19:30', stage: 'basement', favorite: false },
  { day: 0, name: 'AKC Misi', time: '19:45 - 21:15', stage: 'basement', favorite: false },
  { day: 0, name: 'LIL FRAKK x KAPITÁNY MÁTÉ', time: '21:30 - 23:00', stage: 'basement', favorite: false },
  { day: 0, name: 'Slow Village', time: '23:15 - 01:00', stage: 'basement', favorite: false },

  { day: 0, name: 'Shabaam', time: '20:00 - 22:00', stage: 'grid', favorite: false },
  { day: 0, name: 'SanFranciscoBeat', time: '22:00 - 00:00', stage: 'grid', favorite: false },
  { day: 0, name: 'SNTNS (Svetec & Nils)', time: '00:00 - 02:00', stage: 'grid', favorite: false },
  { day: 0, name: 'KOBOSIL (DE)', time: '02:00 - 04:00', stage: 'grid', favorite: true, live: true },
  { day: 0, name: 'HotX', time: '04:00 - 06:00', stage: 'grid', favorite: false },

  // ── SATURDAY (Day 1) ────────────────────────────────────────────────────────
  { day: 1, name: 'KKevin', time: '14:00 - 15:15', stage: 'suburbia', favorite: false },
  { day: 1, name: 'Yamina', time: '15:30 - 16:45', stage: 'suburbia', favorite: false },
  { day: 1, name: 'Bruno x Spacc', time: '17:00 - 18:30', stage: 'suburbia', favorite: false },
  { day: 1, name: 'Manual', time: '18:45 - 20:15', stage: 'suburbia', favorite: false },
  { day: 1, name: 'Dzsúdló', time: '20:30 - 22:00', stage: 'suburbia', favorite: false },
  { day: 1, name: 'AZAHRIAH', time: '22:30 - 00:00', stage: 'suburbia', favorite: true, live: true },
  { day: 1, name: 'METRO BOOMIN (US) DJ Set', time: '00:00 - 01:15', stage: 'suburbia', favorite: true },
  { day: 1, name: 'FRED AGAIN.. (UK) DJ SET', time: '01:15 - 02:45', stage: 'suburbia', favorite: true },

  { day: 1, name: 'Mulató Aztékok', time: '14:30 - 16:00', stage: 'basement', favorite: false },
  { day: 1, name: '6300', time: '16:15 - 17:45', stage: 'basement', favorite: false },
  { day: 1, name: 'Beton.Hofi', time: '18:00 - 19:45', stage: 'basement', favorite: false },
  { day: 1, name: 'Krúbi', time: '20:00 - 21:30', stage: 'basement', favorite: false },
  { day: 1, name: 'slowmkae x Co Lee', time: '21:45 - 23:15', stage: 'basement', favorite: false },
  { day: 1, name: 'NKS (Nem Közölhető Sáv)', time: '23:30 - 01:30', stage: 'basement', favorite: false },

  { day: 1, name: 'Bernathy (Live)', time: '20:00 - 22:00', stage: 'grid', favorite: false },
  { day: 1, name: 'Mateo & Spirit', time: '22:00 - 00:00', stage: 'grid', favorite: false },
  { day: 1, name: 'Sasha Carassi', time: '00:00 - 02:00', stage: 'grid', favorite: false },
  { day: 1, name: 'CHARLOTTE DE WITTE (BE)', time: '02:00 - 04:00', stage: 'grid', favorite: true, live: true },
  { day: 1, name: 'Sikztah', time: '04:00 - 06:00', stage: 'grid', favorite: false },

  // ── SUNDAY (Day 2) ──────────────────────────────────────────────────────────
  { day: 2, name: 'Metzker Viktória', time: '14:00 - 15:15', stage: 'suburbia', favorite: false },
  { day: 2, name: 'GwM', time: '15:30 - 16:45', stage: 'suburbia', favorite: false },
  { day: 2, name: 'VALMAR', time: '17:00 - 18:30', stage: 'suburbia', favorite: false },
  { day: 2, name: 'Lil Frakk (Main Stage Set)', time: '18:45 - 20:15', stage: 'suburbia', favorite: false },
  { day: 2, name: 'BSW', time: '20:30 - 22:00', stage: 'suburbia', favorite: false },
  { day: 2, name: 'TRAVIS SCOTT (US)', time: '22:30 - 00:00', stage: 'suburbia', favorite: true, live: true },
  { day: 2, name: 'OBLATI x ONTHELOW All-Stars', time: '00:00 - 02:00', stage: 'suburbia', favorite: false },

  { day: 2, name: 'LIL VIBE', time: '14:30 - 16:00', stage: 'basement', favorite: false },
  { day: 2, name: 'Tirpa', time: '16:15 - 17:45', stage: 'basement', favorite: false },
  { day: 2, name: 'Scarlxrd (UK)', time: '18:00 - 19:30', stage: 'basement', favorite: false },
  { day: 2, name: 'Killakikitt', time: '19:45 - 21:15', stage: 'basement', favorite: false },
  { day: 2, name: 'AKC Kendo x Nasiimov', time: '21:30 - 23:00', stage: 'basement', favorite: false },
  { day: 2, name: 'Hősök', time: '23:15 - 01:00', stage: 'basement', favorite: false },

  { day: 2, name: 'Polarize', time: '20:00 - 22:00', stage: 'grid', favorite: false },
  { day: 2, name: 'Jay Lumen', time: '22:00 - 00:00', stage: 'grid', favorite: false },
  { day: 2, name: 'Amelie Lens (BE)', time: '00:00 - 02:00', stage: 'grid', favorite: true },
  { day: 2, name: 'I HATE MODELS (FR)', time: '02:00 - 04:00', stage: 'grid', favorite: true },
  { day: 2, name: 'ZSOMAC (The Closing Set)', time: '04:00 - 06:00', stage: 'grid', favorite: false },
];

// Attach stable IDs to every slot
const ARTISTS: ArtistEntry[] = ARTISTS_RAW.map(a => ({
  ...a,
  id: makeId(a.day, a.stage, a.time),
}));

const DAYS_DATA: { key: DayIdx; en: string; hu: string; sub: string }[] = [
  { key: 0, en: 'FRIDAY', hu: 'PÉNTEK', sub: 'JUL 18' },
  { key: 1, en: 'SATURDAY', hu: 'SZOMBAT', sub: 'JUL 19' },
  { key: 2, en: 'SUNDAY', hu: 'VASÁRNAP', sub: 'JUL 20' },
];

const STAGE_CHIPS_DATA: { key: StageFilter; en: string; hu: string; icon?: string }[] = [
  { key: 'ALL',        en: 'ALL',          hu: 'MIND',      },
  { key: 'SUBURBIA',   en: 'SubUrbia',     hu: 'SubUrbia',  },
  { key: 'BASEMENT',   en: 'The Basement', hu: 'Basement',  },
  { key: 'GRID',       en: 'The Grid',     hu: 'The Grid',  },
  { key: 'FAVOURITES', en: 'Favourites',   hu: 'Kedvencek', icon: 'favorite' },
];

const STAGE_COLOR: Record<string, string> = {
  suburbia: SV.primaryContainer,
  basement: SV.onSurfaceVariant,
  grid: SV.secondaryContainer,
};

const STAGE_LABEL_EN: Record<string, string> = {
  suburbia: 'SubUrbia Stage',
  basement: 'The Basement',
  grid: 'The Grid',
};
const STAGE_LABEL_HU: Record<string, string> = {
  suburbia: 'SubUrbia',
  basement: 'The Basement',
  grid: 'The Grid',
};

export default function LineupScreen() {
  const { lang } = useLanguage();
  const { filter: filterParam } = useLocalSearchParams<{ filter?: string }>();

  const [day,     setDay]     = useState<DayIdx>(0);
  const [stage,   setStage]   = useState<StageFilter>('ALL');
  const [loading, setLoading] = useState(true);
  const [favs,    setFavs]    = useState<Record<string, boolean>>({});
  const [userId,  setUserId]  = useState<string | null>(null);

  // Activate Favourites filter if navigated with ?filter=favourites
  useEffect(() => {
    if (filterParam === 'favourites') setStage('FAVOURITES');
  }, [filterParam]);

  // Load favourites from DB + skeleton delay
  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUserId(session.user.id);
        const { data } = await supabase
          .from('favourites')
          .select('appointment_id')
          .eq('user_id', session.user.id);
        // Key by appointment_id so each slot is independently favouritable
        const map: Record<string, boolean> = {};
        (data ?? []).forEach(r => { map[r.appointment_id] = true; });
        setFavs(map);
      }
      // Logged out → empty favs (no hardcoded defaults)
      setTimeout(() => setLoading(false), 800);
    })();
  }, []);

  const DAYS = DAYS_DATA.map(d => ({ ...d, label: lang === 'hu' ? d.hu : d.en }));
  const STAGE_CHIPS = STAGE_CHIPS_DATA.map(s => ({ ...s, label: lang === 'hu' ? s.hu : s.en }));
  const STAGE_LABEL = lang === 'hu' ? STAGE_LABEL_HU : STAGE_LABEL_EN;

  // FAVOURITES mode: show all favs across all days; otherwise filter by day+stage
  const acts = stage === 'FAVOURITES'
    ? ARTISTS.filter(a => favs[a.id])
    : ARTISTS.filter(a => {
        if (a.day !== day) return false;
        if (stage !== 'ALL' && a.stage.toUpperCase() !== stage) return false;
        return true;
      });

  const toggleFav = async (act: ArtistEntry) => {
    const next = !favs[act.id];
    setFavs(f => ({ ...f, [act.id]: next }));

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    if (next) {
      await supabase.from('favourites').insert({
        user_id:        session.user.id,
        appointment_id: act.id,
        artist_name:    act.name,   // stored for profile display without needing a join
      });
    } else {
      await supabase
        .from('favourites')
        .delete()
        .eq('user_id', session.user.id)
        .eq('appointment_id', act.id);
    }
  };

  return (
    <View style={styles.root}>
      <ScreenHeader />

      {/* Day tabs */}
      <View style={styles.dayBar}>
        {DAYS.map(d => (
          <TouchableOpacity
            key={d.key}
            style={[styles.dayTab, d.key === day && styles.dayTabActive]}
            onPress={() => setDay(d.key)}
            activeOpacity={0.75}>
            <Text style={[styles.dayLabel, d.key === day && styles.dayLabelActive]}>
              {d.label}
            </Text>
            <Text style={[styles.daySub, d.key === day && styles.daySubActive]}>
              {d.sub}
            </Text>
            {d.key === day && <View style={styles.dayIndicator} />}
          </TouchableOpacity>
        ))}
      </View>

      {/* Stage filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipScroll}
        contentContainerStyle={styles.chipContent}>
        {STAGE_CHIPS.map(s => (
          <TouchableOpacity
            key={s.key}
            style={[styles.chip, s.key === stage && styles.chipActive, s.key === 'FAVOURITES' && styles.chipFav, s.key === 'FAVOURITES' && s.key === stage && styles.chipFavActive]}
            onPress={() => setStage(s.key)}
            activeOpacity={0.75}>
            {s.icon ? (
              <MaterialIcons name={s.icon as any} size={12} color={s.key === stage ? '#fff' : '#FF6B9D'} />
            ) : null}
            <Text style={[styles.chipText, s.key === stage && styles.chipTextActive]}>
              {s.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Artist list */}
      <ScrollView
        style={styles.list}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}>

        {loading ? (
          Array.from({ length: 7 }).map((_, i) => <SkeletonLineupRow key={i} />)
        ) : acts.length === 0 && stage === 'FAVOURITES' ? (
          <View style={styles.emptyFavs}>
            <MaterialIcons name="favorite-border" size={40} color={SV.surfaceVariant} />
            <Text style={styles.emptyFavsTitle}>{lang === 'hu' ? 'Még nincs kedvenc' : 'No favourites yet'}</Text>
            <Text style={styles.emptyFavsSub}>{lang === 'hu' ? 'Nyomj a szív ikonra a fellépők mellett.' : 'Tap the heart icon next to any artist.'}</Text>
          </View>
        ) : (
          // ── Real content ──────────────────────────────────────────────────
          acts.map((act, i) => (
            <View key={`${act.name}-${i}`} style={[styles.row, act.live && styles.rowLive]}>
              <View style={[styles.stagePill, { backgroundColor: STAGE_COLOR[act.stage] }]} />
              <View style={styles.rowBody}>
                <View style={styles.rowTop}>
                  <Text
                    style={[styles.artistName, favs[act.id] && styles.artistNameFav]}
                    numberOfLines={1}>
                    {act.name}
                  </Text>
                  <TouchableOpacity onPress={() => toggleFav(act)} hitSlop={10} style={styles.favBtn}>
                    <MaterialIcons
                      name={favs[act.id] ? 'favorite' : 'favorite-border'}
                      size={18}
                      color={favs[act.id] ? SV.primaryContainer : SV.surfaceVariant}
                    />
                  </TouchableOpacity>
                </View>

                <View style={styles.rowMeta}>
                  {act.live ? (
                    <>
                      <AudioBars color={STAGE_COLOR[act.stage]} />
                      <Text style={[styles.liveTag, { color: STAGE_COLOR[act.stage] }]}>LIVE</Text>
                      <View style={styles.dot} />
                    </>
                  ) : (
                    <MaterialIcons name="schedule" size={11} color={SV.onSurfaceVariant} />
                  )}
                  <Text style={styles.timeText}>{act.time}</Text>
                  {(stage === 'ALL' || stage === 'FAVOURITES') && (
                    <>
                      <View style={styles.dot} />
                      <Text style={[styles.stageText, { color: STAGE_COLOR[act.stage] }]}>
                        {stage === 'FAVOURITES'
                          ? `${DAYS_DATA[act.day].en.slice(0, 3)} · ${STAGE_LABEL[act.stage]}`
                          : STAGE_LABEL[act.stage]}
                      </Text>
                    </>
                  )}
                </View>
              </View>
            </View>
          ))
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      <CartFAB />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#07070c' },

  // ── Day bar ────────────────────────────────────────────────────────────────
  dayBar: {
    flexDirection: 'row',
    backgroundColor: '#0c0c14',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  dayTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    position: 'relative',
  },
  dayTabActive: {},
  dayLabel: {
    color: SV.onSurfaceVariant,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    fontFamily: 'monospace',
  },
  dayLabelActive: { color: SV.primaryContainer },
  daySub: {
    color: SV.surfaceVariant,
    fontSize: 10,
    fontFamily: 'monospace',
    marginTop: 1,
  },
  daySubActive: { color: 'rgba(57,255,20,0.6)' },
  dayIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 16,
    right: 16,
    height: 2,
    backgroundColor: SV.primaryContainer,
    borderRadius: 1,
  },

  // ── Stage chips ────────────────────────────────────────────────────────────
  chipScroll: { maxHeight: 50, backgroundColor: '#07070c' },
  chipContent: {
    paddingHorizontal: 16,
    gap: 8,
    alignItems: 'center',
    paddingVertical: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: '#0c0c14',
  },
  chipActive: {
    backgroundColor: 'rgba(57,255,20,0.12)',
    borderColor: 'rgba(57,255,20,0.4)',
    ...neonShadow,
  },
  chipFav: { borderColor: 'rgba(255,107,157,0.3)', flexDirection: 'row', alignItems: 'center', gap: 4 },
  chipFavActive: { backgroundColor: 'rgba(255,107,157,0.18)', borderColor: '#FF6B9D', shadowColor: '#FF6B9D', shadowOpacity: 0.4, shadowRadius: 8, shadowOffset: { width: 0, height: 0 }, elevation: 6 },
  emptyFavs: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyFavsTitle: { color: SV.onSurfaceVariant, fontSize: 16, fontWeight: '700' },
  emptyFavsSub: { color: SV.outline, fontFamily: 'monospace', fontSize: 12, textAlign: 'center', paddingHorizontal: 40 },
  chipText: {
    color: SV.onSurfaceVariant,
    fontFamily: 'monospace',
    fontSize: 11,
    letterSpacing: 0.5,
  },
  chipTextActive: { color: SV.primaryContainer, fontWeight: '700' },

  // ── List ───────────────────────────────────────────────────────────────────
  list: { flex: 1 },
  listContent: { paddingHorizontal: 16, paddingTop: 12 },

  row: {
    flexDirection: 'row',
    backgroundColor: '#0c0c14',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    marginBottom: 8,
    overflow: 'hidden',
  },
  rowLive: {
    borderColor: 'rgba(57,255,20,0.22)',
    backgroundColor: 'rgba(57,255,20,0.04)',
  },
  liveTag: {
    fontFamily: 'monospace',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  stagePill: {
    width: 3,
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
  },
  rowBody: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  artistName: {
    color: SV.onSurface,
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
    marginRight: 8,
  },
  artistNameFav: { color: SV.primaryFixedDim },
  favBtn: { padding: 2 },

  rowMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  timeText: {
    color: SV.onSurfaceVariant,
    fontFamily: 'monospace',
    fontSize: 11,
    letterSpacing: 0.3,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: SV.surfaceVariant,
  },
  stageText: {
    fontFamily: 'monospace',
    fontSize: 11,
    letterSpacing: 0.3,
  },
});
