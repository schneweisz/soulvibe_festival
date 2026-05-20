@AGENTS.md

# SoulVibe Festival 2026 — Expo App

Hackathon project. Event: **Zamárdi, July 18–20 2026**.

## Tech stack

| Piece | Version |
|---|---|
| Expo | 54 |
| expo-router | ~6.0.23 |
| React / React Native | 19.1.0 / 0.81.5 |
| react-native-reanimated | ~4.1.1 |
| react-native-gesture-handler | ~2.28.0 |
| @supabase/supabase-js | ^2.106.0 |
| @expo/vector-icons | ^15.0.3 (MaterialIcons) |
| TypeScript | ~5.9.2 |

Dev command: `expo start` from `soulvibe_festival/app/`.

## File tree (src/)

```
src/
  app/
    _layout.tsx      — root layout: providers + AppTabs (NO Stack wrapper)
    index.tsx        — Home (countdown, Next Up, System Log)
    lineup.tsx       — Lineup, Schedule, Favourites timeline
    map.tsx          — Festival Map (pan/pinch, POIs, locate, friends)
    gastro.tsx       — Food & Drinks (stall cards, filter, cart)
    info.tsx         — Info & Sponsors
    auth.tsx         — Login / Register (Supabase auth)
    profile.tsx      — User profile, friends, transactions, favourite lineup
    cart.tsx         — Cart / Checkout
    wallet.tsx       — Wallet top-up flow (DB-backed)
    explore.tsx      — Legacy redirect → /lineup
  components/
    app-tabs.tsx     — 5 visible + 5 hidden tabs (href:null)
    app-tabs.web.tsx — Web tab variant (Tabs/TabSlot/TabTrigger from expo-router/ui)
    menu-drawer.tsx  — Side-drawer + MenuProvider + useMenu() hook
    screen-header.tsx
    glitch-text.tsx  — Reanimated glitch title effect (cyan/magenta ghost layers)
    audio-bars.tsx   — 4-bar visualizer with bottom-anchor translateY compensation
    skeleton.tsx     — Pulse opacity skeleton rows
    animated-icon.tsx / animated-icon.web.tsx — splash overlay
    themed-text.tsx / themed-view.tsx
    hint-row.tsx / external-link.tsx / web-badge.tsx
    ui/collapsible.tsx
  constants/
    theme.ts         — SV tokens, Fonts, Spacing, neonShadow, BottomTabInset
  context/
    AuthContext.tsx  — session, user, profile, signOut, refreshProfile
    LanguageContext.tsx — lang: 'en'|'hu', useLanguage()
  utils/
    supabase.ts      — Supabase client (AsyncStorage session)
    supabase.web.ts  — Web variant: noop WebSocket for SSR
  hooks/
    use-color-scheme.ts / .web.ts
    use-theme.ts
  global.css
```

## Navigation

**5 visible bottom tabs**: Home · Lineup · Map · Gastro · Info
**5 hidden tabs** (`href: null`): `/auth`, `/profile`, `/cart`, `/wallet`, `/explore`

`href: null` removes the flex slot entirely — do NOT use `tabBarButton: () => null` (leaves a gap).

Root `_layout.tsx` renders `<AppTabs />` directly, no `<Stack>` wrapper.

Navigate to hidden tabs: `router.push('/profile')` etc.

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

**neonShadow**: `shadowColor:'#39ff14', shadowOffset:{width:0,height:0}, shadowOpacity:0.5, shadowRadius:12, elevation:8`

**Spacing**: half=2, one=4, two=8, three=16, four=24, five=32, six=64

**BottomTabInset**: ios=50, android=80 (pad scrollable content)

**Fonts**: monospace for all UI labels (Platform.select).

## Supabase

Client: `src/utils/supabase.ts` (uses `react-native-url-polyfill` + AsyncStorage).
Web client: `src/utils/supabase.web.ts` — passes a noop WebSocket class for SSR to avoid 422.

**Tables**:
- `profiles` — `id` (uuid FK auth.users), `username`, `email`, `balance`, `points`, `position` (jsonb `{cx,cy}`), `friends` (uuid[])
- `favourites` — `id`, `user_id`, `act_id` (text), `act_name`, `stage`, `day`, `start_time`, `end_time`
- `transactions` — `id`, `user_id`, `type`, `amount`, `description`, `created_at`

**RPC functions**:
- `add_friend_bidirectional(p_user_id, p_friend_id)` — uses `COALESCE(friends, '{}')` to avoid NULL issue

**Trigger**: `handle_new_user()` — fires on `auth.users` INSERT, creates `profiles` row with `{cx,cy}` canvas position, balance=0, points=0.

**RLS**: `favourites` needs both `FOR ALL USING (user_id = auth.uid())` AND `FOR INSERT WITH CHECK (user_id = auth.uid())` + `GRANT INSERT`.

## AuthContext (`src/context/AuthContext.tsx`)

```ts
type Profile = { username, email, balance, points }
useAuth() → { session, user, profile, loading, signOut, refreshProfile }
```

- Initial session resolved via `getSession()` (avoids INITIAL_SESSION double-fire in `onAuthStateChange`)
- `signOut()` clears state immediately before `supabase.auth.signOut()` (prevents redirect race)
- `fetchProfile()` creates the row client-side if the DB trigger hasn't fired yet (canvas `{cx,cy}` coords)
- Profile does NOT include `position` in the select — map.tsx queries it separately

## Map (`src/app/map.tsx`)

**Canvas dimensions**: `MAP_W = 1400`, `MAP_H = 1850`

**Position system**: Canvas pixel coordinates `{cx, cy}` stored in `profiles.position`.

**Scale-aware centering** (React Native scales around element's own centre):
```ts
function centreOn(cx: number, cy: number, S: number) {
  const tx = SW / 2 + MAP_W / 2 * (S - 1) - cx * S;
  const ty = SH / 2 + MAP_H / 2 * (S - 1) - cy * S;
  return { tx, ty };
}
```
Old formula `tx = SW/2 - cx` only correct at S=1. Used in `recenter()`, auto-center useEffect, and `focusPOI()`.

**Locate button**: queries `profiles.position.cx/cy`, falls back to GPS→canvas for legacy `{lat,lon}` rows.

## Lineup / Favourites (`src/app/lineup.tsx`)

```ts
const PX_PER_MIN = 1.6;   // pixels per minute in timeline
const TIME_COL_W = 52;    // left timestamp column width
const RAIL_COL_W = 22;    // side-by-side collision column width
```

- `assignColumns(dayActs)` — greedy sweep-line, returns `Map<actId, colIndex>` for collision-free side-by-side layout
- `FavTimeline` — groups by day, absolute positioning, NOW line, stage sub-filter chips
- Favourites stored in Supabase `favourites` table (one row per act per user)
- Each act needs a stable `id` — currently `${act.name}-${act.stage}-${act.day}`

## Build / CI

**`metro.config.js`** — custom `resolveRequest`:
```js
if (moduleName.startsWith('@/'))
  return context.resolveRequest(context, path.join(SRC, moduleName.slice(2)), platform);
```
Also stubs otel modules via `OTEL_STUB`.

**`babel.config.js`**: `{ presets: ['babel-preset-expo'] }` — no path aliases here (Metro handles it).

**`scripts/patch-supabase.js`** (postinstall) — replaces `otelModulePromise = import(...)` with `Promise.resolve(null)` in supabase-js dist to fix Hermes dynamic import error.

**`eas update --auto --non-interactive`** used in CI.

## Providers (root layout)

```
AuthProvider
  LanguageProvider
    CartProvider
      ThemeProvider (SoulVibeDarkTheme)
        MenuProvider
          AnimatedSplashOverlay
          AppTabs
```

## Language / i18n

```ts
const { lang } = useLanguage();          // 'en' | 'hu'
const t = (en: string, hu: string) => lang === 'hu' ? hu : en;
```

## Coding conventions

- All screens: `backgroundColor: SV.background`, `flex: 1`
- Section headers: monospace, letterSpacing, `textTransform: 'uppercase'`
- Active accent: `SV.primaryContainer` (#39ff14) with neonShadow
- Cards: `SV.surfaceContainer` bg, `borderRadius: 12`, `borderColor: SV.outlineVariant`
- Import alias `@/` → `src/` (tsconfig + metro resolveRequest)
- `StyleSheet.create` for all styles — no inline objects in JSX
- `router.push('/route')` for hidden-tab navigation; `router.replace` for auth redirects

## Reference files

- Lineup data: `soulvibe_festival/soulvibe_lineup.md`
- Original HTML designs: `stitch_soulvibe_festival_app/<screen>/code.html` (reference only)
- Design doc: `stitch_soulvibe_festival_app/cyber_underground/DESIGN.md`
- PRD: `soulvibe_festival_2026_prd.md`
- Team: `soulvibe_festival/csapat.md`
