import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#000000',
    background: '#ffffff',
    backgroundElement: '#F0F0F3',
    backgroundSelected: '#E0E1E6',
    textSecondary: '#60646C',
  },
  dark: {
    text: '#ffffff',
    background: '#000000',
    backgroundElement: '#212225',
    backgroundSelected: '#2E3135',
    textSecondary: '#B0B4BA',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

/** SoulVibe Festival 2026 — Cyber-Underground design system */
export const SV = {
  // Backgrounds
  background: '#131313',
  surface: '#131313',
  surfaceContainer: '#201f1f',
  surfaceContainerHigh: '#2a2a2a',
  surfaceContainerLow: '#1c1b1b',
  surfaceContainerLowest: '#0e0e0e',
  surfaceContainerHighest: '#353534',
  surfaceVariant: '#353534',
  surfaceBright: '#3a3939',
  deepCharcoal: '#121212',

  // Text
  onSurface: '#e5e2e1',
  onSurfaceVariant: '#baccb0',
  onBackground: '#e5e2e1',

  // Primary — Neon Green (Darkened for better contrast/less strain)
  primaryContainer: '#2cc90f',
  primaryFixed: '#5ce640',
  primaryFixedDim: '#20b300',
  onPrimaryContainer: '#0d5900',
  onPrimaryFixed: '#011a00',

  // Secondary — Electric Purple
  secondaryContainer: '#d05bff',
  secondaryFixed: '#f9d8ff',
  secondaryFixedDim: '#ecb1ff',
  onSecondaryContainer: '#480063',

  // Tertiary — Cyan
  tertiaryContainer: '#55f2ff',
  tertiaryFixed: '#7df4ff',
  tertiaryFixedDim: '#00dbe9',

  // Outline / Border
  outlineVariant: '#3c4b35',
  outline: '#85967c',

  // Status
  error: '#ffb4ab',
  onError: '#690005',
  errorContainer: '#93000a',

  // Glass / Overlay
  white10: 'rgba(255, 255, 255, 0.10)',
  white5: 'rgba(255, 255, 255, 0.05)',
  surfaceGlass: 'rgba(255, 255, 255, 0.05)',

  // Glows
  neonGlow: 'rgba(44, 201, 15, 0.4)',
  purpleGlow: 'rgba(191, 0, 255, 0.4)',
  cyanGlow: 'rgba(85, 242, 255, 0.4)',
} as const;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;

/** Neon green glow shadow (iOS / Android elevation combo) */
export const neonShadow = {
  shadowColor: '#2cc90f',
  shadowOffset: { width: 0, height: 0 },
  shadowOpacity: 0.5,
  shadowRadius: 12,
  elevation: 8,
};
