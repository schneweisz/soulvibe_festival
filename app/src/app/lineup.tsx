import { MaterialIcons } from "@expo/vector-icons";
import { useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Dimensions,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { Image } from "expo-image";
import { SV, neonShadow } from "@/constants/theme";
import { CartFAB, ScreenHeader } from "@/components/screen-header";
import { useLanguage } from "@/context/LanguageContext";
import { AudioBars } from "@/components/audio-bars";
import { SkeletonLineupRow } from "@/components/skeleton";
import { supabase } from '../utils/supabase';
import * as Haptics from 'expo-haptics';

type DayIdx = 0 | 1 | 2;
type StageFilter = "ALL" | "SUBURBIA" | "BASEMENT" | "GRID" | 'FAVOURITES';

interface ArtistEntry {
  id: string;          // unique appointment ID: "d{day}-{stage}-{startTime}"
  day: DayIdx;
  name: string;
  time: string;
  stage: "suburbia" | "basement" | "grid";
  favorite: boolean;
  live?: boolean;
  description?: string;
  imageUrl?: string;
}

// Generate a stable, unique ID for each appointment slot.
// Using day + stage + start-time means one artist performing twice on different
// stages/days gets two separate, independently favouritable IDs.
function makeId(day: DayIdx, stage: string, time: string) {
  return `d${day}-${stage}-${time.split(' ')[0].replace(':', '')}`;
}

const ARTISTS_RAW: Omit<ArtistEntry, 'id'>[] = [
  // ── FRIDAY (Day 0) ──────────────────────────────────────────────────────────
  {
    day: 0,
    name: "AKC Kretta",
    time: "14:00 - 15:30",
    stage: "suburbia",
    favorite: false,
    description:
      "Rising star of the Hungarian trap scene with high-octane energy and futuristic soundscapes.",
    imageUrl:
      "https://i.scdn.co/image/ab6761610000e5ebc13193611c2e508288d29e95",
  },
  {
    day: 0,
    name: "Lmen Prala",
    time: "15:45 - 17:00",
    stage: "suburbia",
    favorite: false,
    description:
      "The unapologetic voice of the streets, known for hard-hitting lyrics and a raw, authentic flow.",
    imageUrl:
      "https://cdn-hfhml.nitrocdn.com/SgcalPnvLecYLTVtMvgFFkFwjiPtAiMV/assets/images/optimized/rev-1beaf96/www.rap.hu/wp-content/uploads/2019/02/LMEN-PRALA.jpg",
  },
  {
    day: 0,
    name: "Pogány Induló x Ótvar Pestis",
    time: "17:15 - 18:30",
    stage: "suburbia",
    favorite: false,
    description:
      "Underground Hungarian hip-hop pioneers bringing rebellious energy and cultural storytelling to the main stage.",
    imageUrl: "https://i.ytimg.com/vi/-KTHTXn7aZk/maxresdefault.jpg",
  },
  {
    day: 0,
    name: "T. Danny",
    time: "18:45 - 20:15",
    stage: "suburbia",
    favorite: false,
    description:
      "Trap innovator with punchy beats and infectious hooks that define modern Hungarian hip-hop.",
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/en/a/a3/Lordvoldemort.jpg",
  },
  {
    day: 0,
    name: "DESH",
    time: "20:30 - 22:00",
    stage: "suburbia",
    favorite: false,
    description:
      "Bold trap producer bringing cinematic production and hard-hitting flows to SoulVibe.",
    imageUrl:
      "https://m.blog.hu/re/recorder/image/filmrecorder/recorder_desh_20230904_097.jpg",
  },
  {
    day: 0,
    name: "CENTRAL CEE (UK)",
    time: "22:30 - 00:00",
    stage: "suburbia",
    favorite: true,
    description:
      "UK drill icon and global superstar bringing the London sound to the SoulVibe main stage.",
    imageUrl:
      "https://cdn-p.smehost.net/sites/a6700d2fbaf642099802a57af8b10fe6/wp-content/uploads/2025/01/Central-Cee-PR-image-2-.jpg",
  },
  {
    day: 0,
    name: "DJ Next Level (Trap & Bass After)",
    time: "00:00 - 02:00",
    stage: "suburbia",
    favorite: false,
    description:
      "High-energy DJ taking the festival into the night with trap bangers and bass-heavy remixes.",
    imageUrl: "https://i1.sndcdn.com/artworks-000340310622-tpdu5n-t240x240.jpg",
  },

  {
    day: 0,
    name: "IFJÚ BACI",
    time: "14:30 - 16:00",
    stage: "basement",
    favorite: false,
    description:
      "Underground trap warrior with hypnotic beats and raw lyrical delivery from Budapest's streets.",
  },
  {
    day: 0,
    name: "Sisi",
    time: "16:15 - 17:45",
    stage: "basement",
    favorite: false,
    description:
      "Fresh Hungarian rapper with smooth flows and contemporary trap production on the Basement stage.",
    imageUrl: "https://marieclaire.hu/uploads/2023/10/sissi-480x320.jpg",
  },
  {
    day: 0,
    name: "Gege / Mikee Mykanic",
    time: "18:00 - 19:30",
    stage: "basement",
    favorite: false,
    description:
      "Versatile underground artists blending trap, cloud rap, and experimental beats.",
    imageUrl:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT20_cY43bSNS9x_bQqQXwlpYWUqdDMGpmZIA&s",
  },
  {
    day: 0,
    name: "AKC Misi",
    time: "19:45 - 21:15",
    stage: "basement",
    favorite: false,
    description:
      "Rising trap producer crafting moody soundscapes and genre-bending productions for the underground.",
    imageUrl: "https://m.blog.hu/re/recorder/file/akc-misi.jpg",
  },
  {
    day: 0,
    name: "LIL FRAKK x KAPITÁNY MÁTÉ X RESS",
    time: "21:30 - 23:00",
    stage: "basement",
    favorite: false,
    description:
      "Explosive collaboration featuring innovative trap production and charismatic Hungarian lyrics.",
    imageUrl: "https://m.blog.hu/re/recorder/image/filmrecorder/ress_1.jpg",
  },
  {
    day: 0,
    name: "Slow Village",
    time: "23:15 - 01:00",
    stage: "basement",
    favorite: false,
    description:
      "Atmospheric electronic producer creating meditative soundscapes as the night deepens.",
    imageUrl:
      "https://m.blog.hu/re/recorder/image//slow_village_image_retus_final_a.JPG",
  },

  {
    day: 0,
    name: "Shabaam",
    time: "20:00 - 22:00",
    stage: "grid",
    favorite: false,
    description:
      "Techno pioneer bringing dark, industrial vibes to The Grid with hypnotic grooves.",
    imageUrl:
      "https://geo-media.beatport.com/image_size/590x404/413d18d4-6ebe-429b-82a6-c52ce3ebdbc9.jpg",
  },
  {
    day: 0,
    name: "SanFranciscoBeat",
    time: "22:00 - 00:00",
    stage: "grid",
    favorite: false,
    description:
      "Experimental electronic artist merging broken beats and ambient textures on the techno stage.",
    imageUrl:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRSVHSO9MmKM6xXEu74P6r7C7u25I1Os2jiOg&s",
  },
  {
    day: 0,
    name: "SNTNS (Svetec & Nils)",
    time: "00:00 - 02:00",
    stage: "grid",
    favorite: false,
    description:
      "Minimalist techno duo crafting precise, stripped-down industrial sounds with raw energy.",
    imageUrl:
      "https://i1.sndcdn.com/avatars-NEBEvdsmYEzsSrzs-J6bEpA-t1080x1080.jpg",
  },
  {
    day: 0,
    name: "KOBOSIL (DE)",
    time: "02:00 - 04:00",
    stage: "grid",
    favorite: true,
    live: true,
    description:
      "Berghain resident and techno visionary pushing the boundaries of dark industrial sound.",
    imageUrl:
      "https://i.scdn.co/image/ab676161000051743e28af20164a0e7d062f32ed",
  },
  {
    day: 0,
    name: "HotX",
    time: "04:00 - 06:00",
    stage: "grid",
    favorite: false,
    description:
      "Closing set specialist delivering peak-time techno and pulsating beats into the early morning.",
    imageUrl:
      "https://lh6.googleusercontent.com/proxy/ZVETL3ikqUfnU5RqpeHWycEGqvIHKqyNLWivwJIaT0aTVkgzNQHolWOth7oQfgslBxpdxtgoJd09INEz4sWrHQdAmU6438MpopgsKWc",
  },

  // ── SATURDAY (Day 1) ────────────────────────────────────────────────────────
  {
    day: 1,
    name: "KKevin",
    time: "14:00 - 15:15",
    stage: "suburbia",
    favorite: false,
    description:
      "Rising Hungarian hip-hop talent bringing energetic flows and contemporary trap beats.",
    imageUrl:
      "https://i.scdn.co/image/ab6761610000e5eb56eabd0d536ce7a81a15b62d",
  },
  {
    day: 1,
    name: "Yamina",
    time: "15:30 - 16:45",
    stage: "suburbia",
    favorite: false,
    description:
      "Vocalist bringing soulful and atmospheric trap-pop elements to the main stage.",
    imageUrl: "https://pics.radio1.hu/images/yamina_1300x1300.jpg",
  },
  {
    day: 1,
    name: "Bruno x Spacc",
    time: "17:00 - 18:30",
    stage: "suburbia",
    favorite: false,
    description:
      "Collaborative project merging trap production with melodic sensibilities and experimental flows.",
    imageUrl:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRzq0VyQhqmQYTQP_xF1sKQqPbSw7wwvRvcbQ&s",
  },
  {
    day: 1,
    name: "Manuel",
    time: "18:45 - 20:15",
    stage: "suburbia",
    favorite: false,
    description:
      "Producer and performer crafting intricate trap arrangements with Hungarian cultural elements.",
    imageUrl:
      "https://i.scdn.co/image/ab6761610000e5ebd5dbaf6de7c9679149bcee87",
  },
  {
    day: 1,
    name: "Dzsúdló",
    time: "20:30 - 22:00",
    stage: "suburbia",
    favorite: false,
    description:
      "Charismatic rapper taking the stage before the international headliners with infectious energy.",
    imageUrl:
      "https://images.genius.com/918cebae5c13274c4f74585f730fa5a3.963x963x1.jpg",
  },
  {
    day: 1,
    name: "AZAHRIAH",
    time: "22:30 - 00:00",
    stage: "suburbia",
    favorite: true,
    live: true,
    description:
      "The biggest breakthrough artist of the decade, blending pop, reggaeton, and Hungarian folk.",
    imageUrl:
      "https://i.scdn.co/image/ab6761610000e5eb6c7e50cb7df8f1e9125a154b",
  },
  {
    day: 1,
    name: "METRO BOOMIN (US) DJ Set",
    time: "00:00 - 01:15",
    stage: "suburbia",
    favorite: true,
    description:
      "The architect of modern trap music, delivering a cinematic DJ set of his chart-topping hits.",
    imageUrl:
      "https://i.scdn.co/image/ab6761610000e5eb28f1e72b31e756ea3f3a51e7",
  },
  {
    day: 1,
    name: "FRED AGAIN.. (UK) DJ SET",
    time: "01:15 - 02:45",
    stage: "suburbia",
    favorite: true,
    description:
      "Electronic music’s most emotional and exciting innovator, creating a shared human experience.",
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Fred_Again_2025_%28cropped%29.jpg/960px-Fred_Again_2025_%28cropped%29.jpg",
  },

  {
    day: 1,
    name: "Mulató Aztékok",
    time: "14:30 - 16:00",
    stage: "basement",
    favorite: false,
    description:
      "Electrifying Hungarian punk-rap fusion bringing raw energy and rebellious spirit to the basement.",
    imageUrl:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSvthoMN1vaJ-oZ3Yke2SCDmrhR6bLmZ4en9g&s",
  },
  {
    day: 1,
    name: "Pamkutya",
    time: "16:15 - 17:45",
    stage: "basement",
    favorite: false,
    description:
      "Hungary’s most popular YouTube collective brings their viral music parodies and massive hits to life in a spectacular, high-energy live show.",
    imageUrl: "https://atempo.sk/images/hirek/2025/pamkutya-koncert2.jpg",
  },
  {
    day: 1,
    name: "Beton.Hofi",
    time: "18:00 - 19:45",
    stage: "basement",
    favorite: false,
    description:
      "Experimental producer crafting dystopian soundscapes with industrial beats and dark aesthetics.",
    imageUrl:
      "https://i.scdn.co/image/ab6761610000e5ebc33a32c07f9362477f7203a8",
  },
  {
    day: 1,
    name: "Krúbi",
    time: "20:00 - 21:30",
    stage: "basement",
    favorite: false,
    description:
      "Lo-fi and psychedelic hip-hop artist creating dreamy, introspective soundscapes.",
    imageUrl:
      "https://pestibolcsesz.elte.hu/wp-content/uploads/2021/09/krubi.jpg",
  },
  {
    day: 1,
    name: "Co Lee",
    time: "21:45 - 23:15",
    stage: "basement",
    favorite: false,
    description:
      "Innovative collaboration merging slow-motion trap with ethereal electronic textures.",
    imageUrl:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ-hjPf70KZBE9ibd6cYO_YFunMmnBiIMF-0w&s",
  },
  {
    day: 1,
    name: "NKS",
    time: "23:30 - 01:30",
    stage: "basement",
    favorite: false,
    description:
      "Dark, abstract hip-hop group pushing boundaries with unconventional production and surreal lyrics.",
    imageUrl:
      "https://telekom-spots-prod.s3.eu-central-1.amazonaws.com/NKS_Kriminal_Beats_32d0dddf81.jpg",
  },

  {
    day: 1,
    name: "Bernathy (Live)",
    time: "20:00 - 22:00",
    stage: "grid",
    favorite: false,
    description:
      "Live electronic musician delivering hypnotic, meditative techno compositions on The Grid.",
    imageUrl:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTSAYkZEmt3msME0KnuPeuhoa1IptGaXTzhLg&s",
  },
  {
    day: 1,
    name: "Mateo & Spirit",
    time: "22:00 - 00:00",
    stage: "grid",
    favorite: false,
    description:
      "Techno duo delivering driving beats and immersive industrial soundscapes.",
    imageUrl:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT7RioCXJD-K5d0c-KXz4P6vDP5AGYLa5lxjQ&s",
  },
  {
    day: 1,
    name: "Sasha Carassi",
    time: "00:00 - 02:00",
    stage: "grid",
    favorite: false,
    description:
      "Italian techno master bringing powerful, peak-time grooves to the dancefloor.",
    imageUrl:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSgwVuqmL0Q_bQnr3nq3I04yHiLN305Ik8uZQ&s",
  },
  {
    day: 1,
    name: "Sikztah",
    time: "04:00 - 06:00",
    stage: "grid",
    favorite: false,
    description:
      "Closing techno specialist delivering relentless beats and industrial energy into the sunrise.",
    imageUrl:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRMf6Cj0un87uiQ9y3dmlcckj1FoKEEG6mrWg&s",
  },

  // ── SUNDAY (Day 2) ──────────────────────────────────────────────────────────
  {
    day: 2,
    name: "Metzker Viktória",
    time: "14:00 - 15:15",
    stage: "suburbia",
    favorite: false,
    description:
      "Hungarian R&B vocalist bringing smooth, soulful vibes to the closing festival day.",
    imageUrl: "https://pics.radio1.hu/images/metzker-viktoria-2026.jpg",
  },
  {
    day: 2,
    name: "GwM",
    time: "15:30 - 16:45",
    stage: "suburbia",
    favorite: false,
    description:
      "Eclectic artist blending trap, soul, and underground aesthetics with introspective lyricism.",
    imageUrl:
      "https://i.scdn.co/image/ab6761610000e5eb0f8ecc7f67eb89c77132e8dc",
  },
  {
    day: 2,
    name: "VALMAR",
    time: "17:00 - 18:30",
    stage: "suburbia",
    favorite: false,
    description:
      "Veteran Hungarian rapper bringing boom-bap production and legendary storytelling to the stage.",
    imageUrl:
      "https://i.scdn.co/image/ab6761610000e5ebc3e6309de5ad64834476700c",
  },
  {
    day: 2,
    name: "Lil Frakk (Main Stage Set)",
    time: "18:45 - 20:15",
    stage: "suburbia",
    favorite: false,
    description:
      "Viral sensation delivering an upgraded main stage performance with explosive trap bangers.",
    imageUrl:
      "https://koncertsziget.hu/concert_admin/images/performers/936/9603.jpg",
  },
  {
    day: 2,
    name: "BSW",
    time: "20:30 - 22:00",
    stage: "suburbia",
    favorite: false,
    description:
      "Rising hip-hop artist bringing fresh sounds and infectious energy before the closing headliner.",
    imageUrl:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcShZtxCjqWIxGi9A4xtfKFnu8HTskygG1XrcA&s",
  },
  {
    day: 2,
    name: "ONTHELOW All-Stars",
    time: "00:00 - 02:00",
    stage: "suburbia",
    favorite: false,
    description:
      "Festival finale showcase featuring collectives bringing diverse underground styles and legacy sets.",
    imageUrl:
      "https://storage.refresher.hu/article/edc627fa4cc95f60ee96.jpg?is=600x600&s=4b5cc9e2449a0e7142f57051aec7de65bc34196ac2142f6ed5ca9c0a6c0f57dd",
  },
  {
    day: 2,
    name: "TRAVIS SCOTT",
    time: "22:30 - 00:00",
    stage: "suburbia",
    favorite: true,
    live: true,
    description:
      "The ultimate rager. Cactus Jack brings the highest energy and a mind-blowing visual spectacle.",
    imageUrl:
      "https://i.scdn.co/image/ab6761610000e5eb19c2790744c792d05570bb71",
  },
  {
    day: 2,
    name: "LIL VIBE",
    time: "14:30 - 16:00",
    stage: "basement",
    favorite: false,
    description:
      "Young trap artist bringing vibrant energy and contemporary beats to Sunday's basement.",
    imageUrl:
      "https://p16-common-sign.tiktokcdn-eu.com/tos-no1a-avt-0068c001-no/f6fd032eee1a5392ab78bb314ec0d12c~tplv-tiktokx-cropcenter:1080:1080.jpeg?dr=10399&refresh_token=444eb3fc&x-expires=1779436800&x-signature=384wlAkVxFsDjSCC9feA0lS1oZM%3D&t=4d5b0474&ps=13740610&shp=a5d48078&shcp=81f88b70&idc=no1a",
  },
  {
    day: 2,
    name: "Tirpa",
    time: "16:15 - 17:45",
    stage: "basement",
    favorite: false,
    description:
      "Experimental producer creating innovative trap and electronic fusion sounds.",
    imageUrl:
      "https://images.genius.com/76acd756a4cf7ac053e2c14d8fa933d9.599x599x1.jpg",
  },
  {
    day: 2,
    name: "Scarlxrd (UK)",
    time: "18:00 - 19:30",
    stage: "basement",
    favorite: false,
    description:
      "UK heavy metal-trap crossover artist bringing aggressive energy and distorted visuals.",
    imageUrl:
      "https://i.scdn.co/image/ab67616d00001e02e0d5cee5ea08c1cf24eb58a4",
  },
  {
    day: 2,
    name: "Killakikitt",
    time: "19:45 - 21:15",
    stage: "basement",
    favorite: false,
    description:
      "Underground artist crafting dark, introspective trap productions with atmospheric depth.",
    imageUrl:
      "https://www.beasteemerch.com/shop_ordered/80055/pic/Kategoriakep/KILLA_1x1_670.jpg",
  },
  {
    day: 2,
    name: "Nasiimov",
    time: "21:30 - 23:00",
    stage: "basement",
    favorite: false,
    description:
      "One of the most unique talents in Hungarian underground trap, blending Libyan roots with catchy melodies and powerful vocals.",
    imageUrl:
      "https://telekom-spots-prod.s3.eu-central-1.amazonaws.com/Jqk_M1_P8t_400x400_0b8923632e.jpg",
  },
  {
    day: 2,
    name: "Hősök",
    time: "23:15 - 01:00",
    stage: "basement",
    favorite: false,
    description:
      "A cornerstone of Hungarian hip-hop for over twenty years, delivering legendary boom-bap beats and honest, generation-defining rap anthems.",
    imageUrl:
      "https://www.a38.hu/storage/app/uploads/public/5ac/ee3/89c/thumb_2592_1200_0_0_0_auto.jpg",
  },

  {
    day: 2,
    name: "Polarize",
    time: "20:00 - 22:00",
    stage: "grid",
    favorite: false,
    description:
      "Techno innovator bringing polarizing, high-intensity industrial sounds to the final Grid night.",
    imageUrl: "https://i1.sndcdn.com/artworks-000188696093-s3dey1-t500x500.jpg",
  },
  {
    day: 2,
    name: "Jay Lumen",
    time: "22:00 - 00:00",
    stage: "grid",
    favorite: false,
    description:
      "Hungarian techno master delivering powerful, hypnotic grooves on the dancefloor.",
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/0/0d/Jay_Lumen.jpg?utm_source=en.wikipedia.org&utm_campaign=index&utm_content=original",
  },
  {
    day: 2,
    name: "Amelie Lens (BE)",
    time: "00:00 - 02:00",
    stage: "grid",
    favorite: true,
    description:
      "Techno titan and Lenske label head, delivering high-energy acid and industrial beats.",
    imageUrl:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTV65pVL7CiEgdvMZ54BPRZvyOKrWr9AO5rrQ&s",
  },
  {
    day: 2,
    name: "I HATE MODELS (FR)",
    time: "02:00 - 04:00",
    stage: "grid",
    favorite: true,
    description:
      "Emotional, nostalgic, yet hard-hitting techno that defies labels and captures the soul.",
    imageUrl:
      "https://weraveyou.com/wp-content/uploads/2024/12/I-Hate-Models-scaled.jpg",
  },
  {
    day: 2,
    name: "ZSOMAC (The Closing Set)",
    time: "04:00 - 06:00",
    stage: "grid",
    favorite: false,
    description:
      "Festival legend bringing an epic closing techno set as the sun rises over SoulVibe 2026.",
    imageUrl:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSLy84zaActyVyQ14jtO8d0N5KheCOlnW8uKw&s",
  },
];

// Attach stable IDs to every slot
const ARTISTS: ArtistEntry[] = ARTISTS_RAW.map(a => ({
  ...a,
  id: makeId(a.day, a.stage, a.time),
}));

const DAYS_DATA: { key: DayIdx; en: string; hu: string; sub: string }[] = [
  { key: 0, en: "FRIDAY", hu: "PÉNTEK", sub: "JUL 18" },
  { key: 1, en: "SATURDAY", hu: "SZOMBAT", sub: "JUL 19" },
  { key: 2, en: "SUNDAY", hu: "VASÁRNAP", sub: "JUL 20" },
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
  suburbia: "SubUrbia Stage",
  basement: "The Basement",
  grid: "The Grid",
};
const STAGE_LABEL_HU: Record<string, string> = {
  suburbia: "SubUrbia",
  basement: "The Basement",
  grid: "The Grid",
};

// ─── Timeline helpers ─────────────────────────────────────────────────────────

const DAY_SHORT  = ['FRI', 'SAT', 'SUN'];
const PX_PER_MIN = 1.6;   // pixels per minute of festival time
const TIME_COL_W = 52;    // left column: timestamps
const RAIL_COL_W = 22;    // centre column: green line + dots
const LINE_W     = 2;
const DOT_D      = 10;
const TOP_PAD    = 20;    // space above the first act

function getStartTime(time: string) { return time.split(' - ')[0]; }

/** Minutes from midnight, with 0–6 AM treated as next-day (e.g. 02:00 → 26 h). */
function parseStartMin(time: string) {
  const [h, m] = getStartTime(time).split(':').map(Number);
  return (h < 7 ? h + 24 : h) * 60 + m;
}

function getEndMin(time: string) {
  const parts = time.split(' - ');
  if (parts.length < 2) return parseStartMin(time) + 90;
  const [h, m] = parts[1].split(':').map(Number);
  return (h < 7 ? h + 24 : h) * 60 + m;
}

/**
 * Assigns each act to a column (0, 1, …) so overlapping acts end up
 * in adjacent columns and can be rendered side-by-side.
 */
function assignColumns(dayActs: ArtistEntry[]): Map<string, number> {
  const sorted = [...dayActs].sort((a, b) => parseStartMin(a.time) - parseStartMin(b.time));
  const cols: { endMin: number }[] = [];
  const result = new Map<string, number>();
  for (const act of sorted) {
    const start = parseStartMin(act.time);
    let col = cols.findIndex(c => c.endMin <= start);
    if (col === -1) { col = cols.length; cols.push({ endMin: 0 }); }
    cols[col].endMin = getEndMin(act.time);
    result.set(act.id, col);
  }
  return result;
}

// buildGroups is kept for the "exactly same start time" grouping used elsewhere,
// but the proportional timeline no longer needs it.
type TimeGroup = { day: DayIdx; startTime: string; startMin: number; acts: ArtistEntry[] };

// ─── Timeline card (absolute-positioned, height driven by parent) ─────────────

function TimelineCard({ act, favs, onFav, stageName }: {
  act: ArtistEntry; favs: Record<string, boolean>;
  onFav: (a: ArtistEntry) => void; stageName: string;
}) {
  const color = STAGE_COLOR[act.stage];
  return (
    <View style={[tl.card, act.live && { borderColor: `${color}50` }]}>
      <View style={[tl.cardAccent, { backgroundColor: color }]} />
      <View style={tl.cardInner}>
        <View style={tl.cardHeader}>
          {act.live ? (
            <View style={tl.livePill}>
              <AudioBars color={color} />
              <Text style={[tl.liveLabel, { color }]}>LIVE</Text>
            </View>
          ) : (
            <Text style={tl.endTimeLabel}>
              {'→ ' + (act.time.split(' - ')[1] ?? '')}
            </Text>
          )}
          <TouchableOpacity onPress={() => onFav(act)} hitSlop={10}>
            <MaterialIcons
              name={favs[act.id] ? 'favorite' : 'favorite-border'}
              size={15}
              color={favs[act.id] ? '#FF6B9D' : SV.surfaceVariant}
            />
          </TouchableOpacity>
        </View>
        <Text style={[tl.cardName, act.live && { color }]}>{act.name}</Text>
        <View style={tl.cardMeta}>
          <View style={[tl.stageDot, { backgroundColor: color }]} />
          <Text style={tl.cardStageName} numberOfLines={1}>{stageName}</Text>
        </View>
      </View>
    </View>
  );
}

// ─── Proportional favourites timeline ────────────────────────────────────────
//
// Each act is placed at a vertical position proportional to its start time
// relative to the earliest favourite. Overlapping acts are assigned side-by-side
// columns via a greedy sweep-line algorithm so their time offsets are visible.

function FavTimeline({ acts, favs, onFav, stageLabel, lang }: {
  acts: ArtistEntry[]; favs: Record<string, boolean>;
  onFav: (a: ArtistEntry) => void;
  stageLabel: Record<string, string>; lang: string;
}) {
  const { width: SW } = Dimensions.get('window');

  if (acts.length === 0) {
    return (
      <View style={tl.empty}>
        <MaterialIcons name="favorite-border" size={44} color={SV.surfaceVariant} />
        <Text style={tl.emptyTitle}>{lang === 'hu' ? 'Még nincs kedvenc' : 'No favourites yet'}</Text>
        <Text style={tl.emptySub}>{lang === 'hu' ? 'Nyomj a ♡ ikonra bármelyik előadónál.' : 'Tap ♡ next to any artist in the list.'}</Text>
      </View>
    );
  }

  // ── Group by day so different days don't interfere with each other ──────────
  const dayMap = new Map<DayIdx, ArtistEntry[]>();
  for (const act of acts) {
    if (!dayMap.has(act.day)) dayMap.set(act.day, []);
    dayMap.get(act.day)!.push(act);
  }
  const days = ([0, 1, 2] as DayIdx[]).filter(d => dayMap.has(d));

  const RIGHT_PAD = 14;
  const CARD_GAP  = 6;

  return (
    <ScrollView style={tl.scroll} showsVerticalScrollIndicator={false}>
      {days.map(day => {
        const dayActs = dayMap.get(day)!;

        // Column assignment (greedy, within this day)
        const colMap   = assignColumns(dayActs);
        const numCols  = Math.max(1, Math.max(...[...colMap.values()]) + 1);
        const cardsW   = SW - TIME_COL_W - RAIL_COL_W - RIGHT_PAD;
        const colW     = (cardsW - CARD_GAP * (numCols - 1)) / numCols;

        // Time bounds for this day
        const firstMin = Math.min(...dayActs.map(a => parseStartMin(a.time)));
        const lastEnd  = Math.max(...dayActs.map(a => getEndMin(a.time)));
        const totalH   = (lastEnd - firstMin) * PX_PER_MIN + TOP_PAD + 32;

        // Live act → NOW line
        const liveAct = dayActs.find(a => a.live);
        const nowY    = liveAct
          ? (parseStartMin(liveAct.time) - firstMin) * PX_PER_MIN + TOP_PAD
          : null;

        // Deduplicate time labels (same minute = same y position)
        const shownMins = new Set<number>();

        return (
          <View key={day}>
            {/* Day header */}
            <View style={tl.dayHeader}>
              <View style={tl.dayHeaderLine} />
              <Text style={tl.dayHeaderText}>{DAY_SHORT[day]} · {['JUL 18', 'JUL 19', 'JUL 20'][day]}</Text>
              <View style={tl.dayHeaderLine} />
            </View>

            {/* Proportional canvas for this day */}
            <View style={{ height: totalH, marginRight: RIGHT_PAD }}>

              {/* Continuous green rail line */}
              <View style={[tl.railLine, {
                left: TIME_COL_W + (RAIL_COL_W - LINE_W) / 2,
                top: TOP_PAD,
                height: (lastEnd - firstMin) * PX_PER_MIN,
              }]} />

              {/* NOW red line */}
              {nowY != null && (
                <View style={[tl.nowLine, { top: nowY }]}>
                  <View style={tl.nowLineDot} />
                  <View style={tl.nowLineBar} />
                  <Text style={tl.nowLineText}>NOW</Text>
                </View>
              )}

              {/* Acts */}
              {dayActs.map(act => {
                const startMin = parseStartMin(act.time);
                const endMin   = getEndMin(act.time);
                const top      = (startMin - firstMin) * PX_PER_MIN + TOP_PAD;
                const cardH    = Math.max(72, (endMin - startMin) * PX_PER_MIN);
                const col      = colMap.get(act.id) ?? 0;
                const cardLeft = TIME_COL_W + RAIL_COL_W + col * (colW + CARD_GAP);

                const showLabel = !shownMins.has(startMin);
                if (showLabel) shownMins.add(startMin);

                return (
                  <React.Fragment key={act.id}>
                    {/* Timestamp label */}
                    {showLabel && (
                      <View style={[tl.timeLabel, { top: top - 2 }]}>
                        <Text style={tl.slotTime}>{getStartTime(act.time)}</Text>
                        <Text style={tl.slotDay}>{DAY_SHORT[act.day]}</Text>
                      </View>
                    )}

                    {/* Rail dot */}
                    {showLabel && (
                      <View style={[tl.railDot, {
                        top: top + 7,
                        left: TIME_COL_W + (RAIL_COL_W - DOT_D) / 2,
                        ...(act.live && { shadowOpacity: 1, shadowRadius: 10 }),
                      }]} />
                    )}

                    {/* Card */}
                    <View style={{
                      position: 'absolute', top, left: cardLeft,
                      width: colW, height: cardH,
                    }}>
                      <TimelineCard
                        act={act} favs={favs} onFav={onFav}
                        stageName={stageLabel[act.stage]}
                      />
                    </View>
                  </React.Fragment>
                );
              })}

            </View>
          </View>
        );
      })}
      <View style={{ height: 120 }} />
    </ScrollView>
  );
}

// ─── Timeline styles ──────────────────────────────────────────────────────────

const tl = StyleSheet.create({
  scroll: { flex: 1 },

  // Empty state
  empty:      { alignItems: 'center', paddingVertical: 60, gap: 12, paddingHorizontal: 32 },
  emptyTitle: { color: SV.onSurfaceVariant, fontSize: 16, fontWeight: '700' },
  emptySub:   { color: SV.outline, fontFamily: 'monospace', fontSize: 12, textAlign: 'center' },

  // Day header
  dayHeader:     { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 14, marginTop: 16, marginBottom: 4 },
  dayHeaderLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.08)' },
  dayHeaderText: { color: SV.onSurfaceVariant, fontFamily: 'monospace', fontSize: 10, fontWeight: '700', letterSpacing: 2 },

  // Green rail line (absolute, full-height strip)
  railLine: {
    position: 'absolute', width: LINE_W,
    backgroundColor: SV.primaryContainer, opacity: 0.45,
  },

  // Dot on rail
  railDot: {
    position: 'absolute',
    width: DOT_D, height: DOT_D, borderRadius: DOT_D / 2,
    backgroundColor: SV.primaryContainer,
    borderWidth: 2, borderColor: '#07070c',
    shadowColor: '#39ff14', shadowOpacity: 0.7, shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
    zIndex: 2,
  },

  // Timestamp label (absolute)
  timeLabel: {
    position: 'absolute', width: TIME_COL_W,
    alignItems: 'flex-end', paddingRight: 8,
  },
  slotTime: { color: SV.onSurface, fontFamily: 'monospace', fontSize: 12, fontWeight: '800' },
  slotDay:  { color: SV.outline, fontFamily: 'monospace', fontSize: 8, letterSpacing: 1.2 },

  // NOW line
  nowLine: {
    position: 'absolute', left: TIME_COL_W,
    flexDirection: 'row', alignItems: 'center', zIndex: 10,
  },
  nowLineDot: {
    width: 14, height: 14, borderRadius: 7,
    backgroundColor: '#FF4444', marginLeft: (RAIL_COL_W - 14) / 2,
    shadowColor: '#FF4444', shadowOpacity: 0.9, shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
  },
  nowLineBar: { flex: 1, height: 2, backgroundColor: '#FF4444', opacity: 0.7, marginLeft: 4 },
  nowLineText: {
    color: '#FF4444', fontFamily: 'monospace', fontSize: 9, fontWeight: '900',
    letterSpacing: 2, marginLeft: 6,
  },

  // Card
  card: {
    flex: 1, backgroundColor: '#0e0e18', borderRadius: 10,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', overflow: 'hidden',
  },
  cardAccent:    { height: 2.5 },
  cardInner:     { flex: 1, padding: 9 },
  cardHeader:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  livePill:      { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(57,255,20,0.08)', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 7 },
  liveLabel:     { fontFamily: 'monospace', fontSize: 8, fontWeight: '900', letterSpacing: 1.5 },
  endTimeLabel:  { color: SV.outline, fontFamily: 'monospace', fontSize: 8, letterSpacing: 0.5 },
  cardName:      { color: SV.onSurface, fontSize: 12, fontWeight: '700', lineHeight: 16, flex: 1 },
  cardMeta:      { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  stageDot:      { width: 5, height: 5, borderRadius: 2.5 },
  cardStageName: { color: SV.onSurfaceVariant, fontFamily: 'monospace', fontSize: 8, letterSpacing: 0.4, flex: 1 },
});

// ─── Memoised list helpers ────────────────────────────────────────────────────

function SkeletonList() {
  return <>{Array.from({ length: 7 }).map((_, i) => <SkeletonLineupRow key={i} />)}</>;
}

const ArtistRow = React.memo(function ArtistRow({ act, isExpanded, isFav, showStageLabel, stageLabel, onToggleExpand, onToggleFav }: {
  act: ArtistEntry; isExpanded: boolean; isFav: boolean; showStageLabel: boolean;
  stageLabel: Record<string, string>;
  onToggleExpand: (name: string) => void; onToggleFav: (act: ArtistEntry) => void;
}) {
  const color = STAGE_COLOR[act.stage];
  return (
    <View style={[styles.row, act.live && styles.rowLive]}>
      <View style={[styles.stagePill, { backgroundColor: color }]} />
      <TouchableOpacity
        style={styles.rowBody}
        activeOpacity={0.9}
        onPress={() => onToggleExpand(act.name)}
      >
        <View style={styles.rowTop}>
          <Text style={[styles.artistName, isFav && styles.artistNameFav]} numberOfLines={1}>
            {act.name}
          </Text>
          <TouchableOpacity onPress={() => onToggleFav(act)} hitSlop={10} style={styles.favBtn}>
            <MaterialIcons
              name={isFav ? 'favorite' : 'favorite-border'}
              size={18}
              color={isFav ? SV.primaryContainer : SV.surfaceVariant}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.rowMeta}>
          {act.live ? (
            <>
              <AudioBars color={color} />
              <Text style={[styles.liveTag, { color }]}>LIVE</Text>
              <View style={styles.dot} />
            </>
          ) : (
            <MaterialIcons name="schedule" size={11} color={SV.onSurfaceVariant} />
          )}
          <Text style={styles.timeText}>{act.time}</Text>
          {showStageLabel && (
            <>
              <View style={styles.dot} />
              <Text style={[styles.stageText, { color }]}>{stageLabel[act.stage]}</Text>
            </>
          )}
          <MaterialIcons
            name={isExpanded ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
            size={16}
            color={SV.surfaceVariant}
            style={{ marginLeft: 'auto' }}
          />
        </View>

        {isExpanded && act.description && (
          <Animated.View
            entering={FadeIn.duration(300)}
            exiting={FadeOut.duration(200)}
            style={styles.dropdown}
          >
            <View style={styles.dropdownDivider} />
            <View style={styles.dropdownContent}>
              {act.imageUrl ? (
                <Image
                  source={{ uri: act.imageUrl }}
                  style={styles.artistImage}
                  contentFit="cover"
                  transition={500}
                />
              ) : null}
              <Text style={styles.descriptionText}>{act.description}</Text>
            </View>
          </Animated.View>
        )}
      </TouchableOpacity>
    </View>
  );
});

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function LineupScreen() {
  const { lang } = useLanguage();
  const { filter: filterParam } = useLocalSearchParams<{ filter?: string }>();

  const [day,     setDay]     = useState<DayIdx>(0);
  const [stage,   setStage]   = useState<StageFilter>("ALL");
  const [loading, setLoading] = useState(true);
  const [expandedArtist, setExpandedArtist] = useState<string | null>(null);
  const [favs,           setFavs]          = useState<Record<string, boolean>>({});
  const [userId,         setUserId]         = useState<string | null>(null);
  const [favStageFilter, setFavStageFilter] = useState<'ALL'|'SUBURBIA'|'BASEMENT'|'GRID'>('ALL');

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
      setLoading(false);
    })();
  }, []);

  const DAYS = DAYS_DATA.map((d) => ({
    ...d,
    label: lang === "hu" ? d.hu : d.en,
  }));
  const STAGE_CHIPS = STAGE_CHIPS_DATA.map((s) => ({
    ...s,
    label: lang === "hu" ? s.hu : s.en,
  }));
  const STAGE_LABEL = lang === "hu" ? STAGE_LABEL_HU : STAGE_LABEL_EN;

  const favActs = useMemo(
    () => ARTISTS.filter(a => favs[a.id]).filter(a =>
      favStageFilter === 'ALL' || a.stage.toUpperCase() === favStageFilter),
    [favs, favStageFilter],
  );

  const acts = useMemo(
    () => stage === 'FAVOURITES'
      ? favActs
      : ARTISTS.filter(a =>
          a.day === day && (stage === 'ALL' || a.stage.toUpperCase() === stage)),
    [stage, day, favActs],
  );

  const toggleExpand = useCallback((name: string) =>
    setExpandedArtist(prev => prev === name ? null : name), []);

  const toggleFav = useCallback(async (act: ArtistEntry) => {
    const next = !favs[act.id];
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setFavs(f => ({ ...f, [act.id]: next }));

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    if (next) {
      await supabase.from('favourites').insert({
        user_id:        session.user.id,
        appointment_id: act.id,
        artist_name:    act.name,
      });
    } else {
      await supabase
        .from('favourites')
        .delete()
        .eq('user_id', session.user.id)
        .eq('appointment_id', act.id);
    }
  }, [favs]);

  const renderActItem = useCallback(({ item: act }: { item: ArtistEntry }) => (
    <ArtistRow
      act={act}
      isExpanded={expandedArtist === act.name}
      isFav={!!favs[act.id]}
      showStageLabel={stage === 'ALL'}
      stageLabel={STAGE_LABEL}
      onToggleExpand={toggleExpand}
      onToggleFav={toggleFav}
    />
  ), [expandedArtist, favs, stage, STAGE_LABEL, toggleExpand, toggleFav]);

  const favCount = Object.values(favs).filter(Boolean).length;
  const isFavMode = stage === 'FAVOURITES';

  return (
    <View style={styles.root}>
      <ScreenHeader />

      {/* ── Accessible Favourites button ── */}
      <TouchableOpacity
        style={[styles.favsBtn, isFavMode && styles.favsBtnActive]}
        onPress={() => setStage(s => s === 'FAVOURITES' ? 'ALL' : 'FAVOURITES')}
        activeOpacity={0.8}>
        <MaterialIcons name="favorite" size={16} color={isFavMode ? '#09090E' : '#FF6B9D'} />
        <Text style={[styles.favsBtnText, isFavMode && styles.favsBtnTextActive]}>
          {lang === 'hu' ? 'KEDVENCEIM' : 'MY FAVOURITES'}
        </Text>
        {favCount > 0 && (
          <View style={[styles.favsBadge, isFavMode && styles.favsBadgeActive]}>
            <Text style={[styles.favsBadgeText, isFavMode && { color: '#FF6B9D' }]}>{favCount}</Text>
          </View>
        )}
        {isFavMode && (
          <MaterialIcons name="close" size={14} color="#09090E" style={{ marginLeft: 'auto' }} />
        )}
      </TouchableOpacity>

      {/* ── Favourites timeline ── */}
      {isFavMode && (
        <>
          {/* Stage filter chips inside favourites */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false}
            style={styles.chipScroll} contentContainerStyle={styles.chipContent}>
            {(['ALL', 'SUBURBIA', 'BASEMENT', 'GRID'] as const).map(s => (
              <TouchableOpacity key={s}
                style={[styles.chip, favStageFilter === s && styles.chipActive, { flexDirection: 'row', alignItems: 'center', gap: 6 }]}
                onPress={() => setFavStageFilter(s)} activeOpacity={0.75}>
                {s !== 'ALL' && (
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: STAGE_COLOR[s.toLowerCase()] }} />
                )}
                <Text style={[styles.chipText, favStageFilter === s && styles.chipTextActive, { marginTop: 0 }]}>
                  {s === 'ALL' ? (lang === 'hu' ? 'MIND' : 'ALL') :
                   s === 'SUBURBIA' ? 'SubUrbia' :
                   s === 'BASEMENT' ? 'Basement' : 'The Grid'}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <FavTimeline
            acts={acts}
            favs={favs}
            onFav={toggleFav}
            stageLabel={STAGE_LABEL}
            lang={lang}
          />
        </>
      )}

      {/* ── Normal list (day tabs + stage chips + rows) ── */}
      {!isFavMode && <>
        <View style={styles.dayBar}>
          {DAYS.map((d) => (
            <TouchableOpacity
              key={d.key}
              style={[styles.dayTab, d.key === day && styles.dayTabActive]}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setDay(d.key); }}
              activeOpacity={0.75}
            >
              <Text style={[styles.dayLabel, d.key === day && styles.dayLabelActive]}>{d.label}</Text>
              <Text style={[styles.daySub, d.key === day && styles.daySubActive]}>{d.sub}</Text>
              {d.key === day && <View style={styles.dayIndicator} />}
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          style={styles.chipScroll} contentContainerStyle={styles.chipContent}>
          {STAGE_CHIPS.filter(s => s.key !== 'FAVOURITES').map((s) => (
            <TouchableOpacity key={s.key}
              style={[styles.chip, s.key === stage && styles.chipActive]}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setStage(s.key); }} activeOpacity={0.75}>
              <Text style={[styles.chipText, s.key === stage && styles.chipTextActive]}>{s.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <FlatList
          style={styles.list}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          data={loading ? [] : acts}
          keyExtractor={(act) => act.id}
          renderItem={renderActItem}
          ListHeaderComponent={loading ? <SkeletonList /> : null}
          ListFooterComponent={<View style={{ height: 120 }} />}
          initialNumToRender={10}
          windowSize={5}
          maxToRenderPerBatch={5}
        />
      </>}

      <CartFAB />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#07070c" },

  // ── Favourites access button ──────────────────────────────────────────────
  favsBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: 14, marginVertical: 10,
    paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12,
    backgroundColor: 'rgba(255,107,157,0.1)',
    borderWidth: 1.5, borderColor: 'rgba(255,107,157,0.35)',
  },
  favsBtnActive: { backgroundColor: '#FF6B9D', borderColor: '#FF6B9D' },
  favsBtnText:       { color: '#FF6B9D', fontFamily: 'monospace', fontSize: 13, fontWeight: '800', letterSpacing: 1, flex: 1 },
  favsBtnTextActive: { color: '#09090E' },
  favsBadge:         { backgroundColor: 'rgba(255,107,157,0.25)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  favsBadgeActive:   { backgroundColor: 'rgba(0,0,0,0.15)' },
  favsBadgeText:     { color: '#FF6B9D', fontFamily: 'monospace', fontSize: 11, fontWeight: '800' },

  // ── Day bar ────────────────────────────────────────────────────────────────
  dayBar: {
    flexDirection: "row",
    backgroundColor: "#0c0c14",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  dayTab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    position: "relative",
  },
  dayTabActive: {},
  dayLabel: {
    color: SV.onSurfaceVariant,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.8,
    fontFamily: "monospace",
  },
  dayLabelActive: { color: SV.primaryContainer },
  daySub: {
    color: SV.surfaceVariant,
    fontSize: 10,
    fontFamily: "monospace",
    marginTop: 1,
  },
  daySubActive: { color: "rgba(57,255,20,0.6)" },
  dayIndicator: {
    position: "absolute",
    bottom: 0,
    left: 16,
    right: 16,
    height: 2,
    backgroundColor: SV.primaryContainer,
    borderRadius: 1,
  },

  // ── Stage chips ────────────────────────────────────────────────────────────
  chipScroll: { maxHeight: 50, backgroundColor: "#07070c" },
  chipContent: {
    paddingHorizontal: 16,
    gap: 8,
    alignItems: "center",
    paddingVertical: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "#0c0c14",
  },
  chipActive: {
    backgroundColor: "rgba(57,255,20,0.12)",
    borderColor: "rgba(57,255,20,0.4)",
    ...neonShadow,
  },
  chipFav: { borderColor: 'rgba(255,107,157,0.3)', flexDirection: 'row', alignItems: 'center', gap: 4 },
  chipFavActive: { backgroundColor: 'rgba(255,107,157,0.18)', borderColor: '#FF6B9D', shadowColor: '#FF6B9D', shadowOpacity: 0.4, shadowRadius: 8, shadowOffset: { width: 0, height: 0 }, elevation: 6 },
  emptyFavs: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyFavsTitle: { color: SV.onSurfaceVariant, fontSize: 16, fontWeight: '700' },
  emptyFavsSub: { color: SV.outline, fontFamily: 'monospace', fontSize: 12, textAlign: 'center', paddingHorizontal: 40 },
  chipText: {
    color: SV.onSurfaceVariant,
    fontFamily: "monospace",
    fontSize: 11,
    letterSpacing: 0.5,
  },
  chipTextActive: { color: SV.primaryContainer, fontWeight: "700" },

  // ── List ───────────────────────────────────────────────────────────────────
  list: { flex: 1 },
  listContent: { paddingHorizontal: 16, paddingTop: 12 },

  row: {
    flexDirection: "row",
    backgroundColor: "#0c0c14",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    marginBottom: 8,
    overflow: "hidden",
  },
  rowLive: {
    borderColor: "rgba(57,255,20,0.22)",
    backgroundColor: "rgba(57,255,20,0.04)",
  },
  liveTag: {
    fontFamily: "monospace",
    fontSize: 10,
    fontWeight: "800",
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  artistName: {
    color: SV.onSurface,
    fontSize: 15,
    fontWeight: "700",
    flex: 1,
    marginRight: 8,
  },
  artistNameFav: { color: SV.primaryFixedDim },
  favBtn: { padding: 2 },

  rowMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  timeText: {
    color: SV.onSurfaceVariant,
    fontFamily: "monospace",
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
    fontFamily: "monospace",
    fontSize: 11,
    letterSpacing: 0.3,
  },

  // ── Dropdown ────────────────────────────────────────────────────────────────
  dropdown: {
    marginTop: 12,
  },
  dropdownDivider: {
    height: 1,
    backgroundColor: "rgba(57,255,20,0.06)",
    marginBottom: 12,
  },
  dropdownContent: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
  },
  artistImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: "rgba(57,255,20,0.6)",
    shadowColor: "rgba(57,255,20,0.8)",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },
  descriptionText: {
    flex: 1,
    color: SV.onSurface,
    fontSize: 12,
    lineHeight: 18,
    fontFamily: "monospace",
    fontWeight: "500",
  },
});
