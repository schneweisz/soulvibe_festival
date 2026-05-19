@AGENTS.md

# SoulVibe Festival 2026 — Expo App

Hackathon project converting Google Stitch HTML designs into a working React Native mobile app.
Event: **Zamárdi, July 18–20 2026**.

## Tech stack

| Piece | Version |
|---|---|
| Expo | 54 |
| expo-router | ~6.0.23 |
| React / React Native | 19.1.0 / 0.81.5 |
| react-native-reanimated | ~4.1.1 |
| react-native-gesture-handler | ~2.28.0 |
| @expo/vector-icons | ^15.0.3 (MaterialIcons) |
| TypeScript | ~5.9.2 |

Dev command: `expo start` from `soulvibe_festival/app/`.

## File tree (src/)

```
src/
  app/
    _layout.tsx      — root layout: providers + AppTabs
    index.tsx        — Home (countdown, Next Up, System Log)
    lineup.tsx       — Lineup & Schedule (day/stage tabs, timeline, favourites)
    map.tsx          — Festival Map (POIs, bottom sheet, filter chips)
    gastro.tsx       — Food & Drinks (stall cards, filter chips, add-to-cart)
    info.tsx         — Info & Sponsors (hours, FAQ accordion, partners grid)
    profile.tsx      — User Profile (ticket, pulse points, wallet, my lineup)
    cart.tsx         — Cart / Checkout (items, summary, QR generation)
    wallet.tsx       — Wallet Top-Up (amount selection, Apple Pay)
    explore.tsx      — Legacy redirect → /lineup
  components/
    app-tabs.tsx     — Tabs shell (5 visible + 4 hidden tabs)
    app-tabs.web.tsx — Web variant
    menu-drawer.tsx  — Side-drawer + MenuProvider + useMenu() hook
    screen-header.tsx
    animated-icon.tsx / animated-icon.web.tsx — splash overlay
    themed-text.tsx / themed-view.tsx
    hint-row.tsx
    external-link.tsx
    web-badge.tsx
    ui/collapsible.tsx
  constants/
    theme.ts         — SV tokens, Fonts, Spacing, neonShadow, BottomTabInset
  context/
    LanguageContext.tsx  — lang: 'en'|'hu', useLanguage()
  hooks/
    use-color-scheme.ts / .web.ts
    use-theme.ts
  global.css
```

## Navigation

**5 visible bottom tabs** (MaterialIcons): Home · Lineup · Map · Gastro · Info  
**Hidden tabs** (navigated via `router.push`): `/profile`, `/cart`, `/wallet`, `/explore`

Hidden tabs use `href: null` in `app-tabs.tsx` — this removes the flex slot entirely (do NOT use `tabBarButton: () => null` which leaves a gap).

Menu drawer (`menu-drawer.tsx`) overlays the whole screen. Trigger via `useMenu().openMenu()`.

## Design system (`src/constants/theme.ts`)

Import: `import { SV, neonShadow, Spacing, BottomTabInset } from '@/constants/theme';`

**Key SV tokens**

| Token | Value | Use |
|---|---|---|
| `SV.background` | `#131313` | screen bg |
| `SV.deepCharcoal` | `#121212` | drawer, card bg |
| `SV.surfaceContainer` | `#201f1f` | elevated cards |
| `SV.surfaceContainerHigh` | `#2a2a2a` | pressed state |
| `SV.onSurface` | `#e5e2e1` | primary text |
| `SV.onSurfaceVariant` | `#baccb0` | secondary text |
| `SV.primaryContainer` | `#39ff14` | neon green accent |
| `SV.primaryFixedDim` | `#2ae500` | dimmer green |
| `SV.secondaryContainer` | `#d05bff` | electric purple |
| `SV.tertiaryContainer` | `#55f2ff` | cyan |
| `SV.outlineVariant` | `#3c4b35` | borders |
| `SV.neonGlow` | `rgba(57,255,20,0.4)` | green shadow |
| `SV.surfaceGlass` | `rgba(255,255,255,0.05)` | glass overlay |

**neonShadow** — apply to glowing elements:
```ts
shadowColor: '#39ff14', shadowOffset:{width:0,height:0},
shadowOpacity:0.5, shadowRadius:12, elevation:8
```

**Spacing**: half=2, one=4, two=8, three=16, four=24, five=32, six=64

**BottomTabInset**: ios=50, android=80 (pad scrollable content)

**Fonts** (`Platform.select`): monospace for all UI labels (cyber look).

## Providers (root layout)

```
LanguageProvider          — en/hu toggle
  ThemeProvider           — react-navigation SoulVibeDarkTheme
    MenuProvider          — side-drawer state
      AnimatedSplashOverlay
      AppTabs
```

## Language / i18n

```ts
const { lang } = useLanguage();          // 'en' | 'hu'
const t = (en: string, hu: string) => lang === 'hu' ? hu : en;
```

All user-visible strings should go through `t()`. Tab labels already use it; apply consistently in new screens.

## Coding conventions

- All screens: `backgroundColor: SV.background`, `flex: 1`
- Section headers: monospace font, letterSpacing, `textTransform: 'uppercase'`
- Active/selected accent: `SV.primaryContainer` (#39ff14) with a glow shadow
- Cards: `SV.surfaceContainer` bg, `borderRadius: 12`, subtle `borderColor: SV.outlineVariant`
- Import alias `@/` maps to `src/` (configured in tsconfig)
- Use `StyleSheet.create` for all styles (no inline objects in JSX)
- `router.push('/route')` for hidden-tab navigation

## Reference HTML designs

`stitch_soulvibe_festival_app/<screen>/code.html` — original Stitch output (reference only, do not edit).
Design doc: `stitch_soulvibe_festival_app/cyber_underground/DESIGN.md`
Lineup data: `soulvibe_festival/soulvibe_lineup.md`
PRD: `soulvibe_festival_2026_prd.md`
Team: `soulvibe_festival/csapat.md`
