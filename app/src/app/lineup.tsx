import { MaterialIcons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
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

type DayIdx = 0 | 1 | 2;
type StageFilter = "ALL" | "SUBURBIA" | "BASEMENT" | "GRID";

interface ArtistEntry {
  day: DayIdx;
  name: string;
  time: string;
  stage: "suburbia" | "basement" | "grid";
  favorite: boolean;
  live?: boolean;
  description?: string;
  imageUrl?: string;
}

const ARTISTS: ArtistEntry[] = [
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
    imageUrl:
      "data:image/jpeg;base64,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",
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

const DAYS_DATA: { key: DayIdx; en: string; hu: string; sub: string }[] = [
  { key: 0, en: "FRIDAY", hu: "PÉNTEK", sub: "JUL 18" },
  { key: 1, en: "SATURDAY", hu: "SZOMBAT", sub: "JUL 19" },
  { key: 2, en: "SUNDAY", hu: "VASÁRNAP", sub: "JUL 20" },
];

const STAGE_CHIPS_DATA: { key: StageFilter; en: string; hu: string }[] = [
  { key: "ALL", en: "ALL", hu: "MIND" },
  { key: "SUBURBIA", en: "SubUrbia", hu: "SubUrbia" },
  { key: "BASEMENT", en: "The Basement", hu: "The Basement" },
  { key: "GRID", en: "The Grid", hu: "The Grid" },
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

export default function LineupScreen() {
  const { lang } = useLanguage();
  const [day, setDay] = useState<DayIdx>(0);
  const [stage, setStage] = useState<StageFilter>("ALL");
  const [loading, setLoading] = useState(true);
  const [expandedArtist, setExpandedArtist] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 1500);
    return () => clearTimeout(t);
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
  const [favs, setFavs] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    ARTISTS.forEach((a) => {
      if (a.favorite) init[a.name] = true;
    });
    return init;
  });

  const acts = ARTISTS.filter((a) => {
    if (a.day !== day) return false;
    if (stage !== "ALL" && a.stage.toUpperCase() !== stage) return false;
    return true;
  });

  const toggleFav = (name: string) =>
    setFavs((f) => ({ ...f, [name]: !f[name] }));

  const toggleExpand = (name: string) =>
    setExpandedArtist((prev) => (prev === name ? null : name));

  return (
    <View style={styles.root}>
      <ScreenHeader />

      {/* Day tabs */}
      <View style={styles.dayBar}>
        {DAYS.map((d) => (
          <TouchableOpacity
            key={d.key}
            style={[styles.dayTab, d.key === day && styles.dayTabActive]}
            onPress={() => setDay(d.key)}
            activeOpacity={0.75}
          >
            <Text
              style={[styles.dayLabel, d.key === day && styles.dayLabelActive]}
            >
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
        contentContainerStyle={styles.chipContent}
      >
        {STAGE_CHIPS.map((s) => (
          <TouchableOpacity
            key={s.key}
            style={[styles.chip, s.key === stage && styles.chipActive]}
            onPress={() => setStage(s.key)}
            activeOpacity={0.75}
          >
            <Text
              style={[
                styles.chipText,
                s.key === stage && styles.chipTextActive,
              ]}
            >
              {s.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Artist list */}
      <ScrollView
        style={styles.list}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      >
        {loading
          ? // ── Skeleton placeholder ──────────────────────────────────────────
            Array.from({ length: 7 }).map((_, i) => (
              <SkeletonLineupRow key={i} />
            ))
          : // ── Real content ──────────────────────────────────────────────────
            acts.map((act, i) => {
              const isExpanded = expandedArtist === act.name;
              return (
                <View
                  key={`${act.name}-${i}`}
                  style={[styles.row, act.live && styles.rowLive]}
                >
                  <View
                    style={[
                      styles.stagePill,
                      { backgroundColor: STAGE_COLOR[act.stage] },
                    ]}
                  />
                  <TouchableOpacity
                    style={styles.rowBody}
                    activeOpacity={0.9}
                    onPress={() => toggleExpand(act.name)}
                  >
                    <View style={styles.rowTop}>
                      <Text
                        style={[
                          styles.artistName,
                          favs[act.name] && styles.artistNameFav,
                        ]}
                        numberOfLines={1}
                      >
                        {act.name}
                      </Text>
                      <TouchableOpacity
                        onPress={() => toggleFav(act.name)}
                        hitSlop={10}
                        style={styles.favBtn}
                      >
                        <MaterialIcons
                          name={favs[act.name] ? "favorite" : "favorite-border"}
                          size={18}
                          color={
                            favs[act.name]
                              ? SV.primaryContainer
                              : SV.surfaceVariant
                          }
                        />
                      </TouchableOpacity>
                    </View>

                    <View style={styles.rowMeta}>
                      {act.live ? (
                        <>
                          <AudioBars color={STAGE_COLOR[act.stage]} />
                          <Text
                            style={[
                              styles.liveTag,
                              { color: STAGE_COLOR[act.stage] },
                            ]}
                          >
                            LIVE
                          </Text>
                          <View style={styles.dot} />
                        </>
                      ) : (
                        <MaterialIcons
                          name="schedule"
                          size={11}
                          color={SV.onSurfaceVariant}
                        />
                      )}
                      <Text style={styles.timeText}>{act.time}</Text>
                      {stage === "ALL" && (
                        <>
                          <View style={styles.dot} />
                          <Text
                            style={[
                              styles.stageText,
                              { color: STAGE_COLOR[act.stage] },
                            ]}
                          >
                            {STAGE_LABEL[act.stage]}
                          </Text>
                        </>
                      )}
                      <MaterialIcons
                        name={
                          isExpanded
                            ? "keyboard-arrow-up"
                            : "keyboard-arrow-down"
                        }
                        size={16}
                        color={SV.surfaceVariant}
                        style={{ marginLeft: "auto" }}
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
                          {act.imageUrl && (
                            <Image
                              source={{ uri: act.imageUrl }}
                              style={styles.artistImage}
                              contentFit="cover"
                              transition={500}
                            />
                          )}
                          <Text style={styles.descriptionText}>
                            {act.description}
                          </Text>
                        </View>
                      </Animated.View>
                    )}
                  </TouchableOpacity>
                </View>
              );
            })}

        <View style={{ height: 120 }} />
      </ScrollView>

      <CartFAB />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#07070c" },

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
