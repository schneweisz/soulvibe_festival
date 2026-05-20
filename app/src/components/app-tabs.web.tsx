import { Tabs, TabList, TabTrigger, TabSlot, TabTriggerSlotProps, TabListProps } from 'expo-router/ui';
import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, View, StyleSheet, Text } from 'react-native';

import { SV, MaxContentWidth, Spacing } from '../constants/theme';

const NAV_ITEMS = [
  { name: 'home',    href: '/'       as const, label: 'HOME',   icon: 'home'       },
  { name: 'lineup',  href: '/lineup' as const, label: 'LINEUP', icon: 'event-note' },
  { name: 'map',     href: '/map'    as const, label: 'MAP',     icon: 'map'        },
  { name: 'gastro',  href: '/gastro' as const, label: 'GASTRO', icon: 'fastfood'   },
  { name: 'info',    href: '/info'   as const, label: 'INFO',   icon: 'info'       },
] as const;

// Hidden triggers let expo-router/ui resolve navigation to these screens
// even though they don't appear in the nav bar.
const HIDDEN_HREFS = [
  { name: 'profile', href: '/profile' as const },
  { name: 'cart',    href: '/cart'    as const },
  { name: 'wallet',  href: '/wallet'  as const },
  { name: 'auth',    href: '/auth'    as const },
  { name: 'explore', href: '/explore' as const },
] as const;

export default function AppTabs() {
  return (
    <Tabs>
      {/* paddingBottom reserves space above the fixed nav bar so content isn't hidden */}
      <TabSlot style={{ flex: 1, paddingBottom: 64 }} />
      <TabList asChild>
        <WebNavBar>
          {NAV_ITEMS.map(item => (
            <TabTrigger key={item.name} name={item.name} href={item.href} asChild>
              <NavButton icon={item.icon} label={item.label} />
            </TabTrigger>
          ))}
          {HIDDEN_HREFS.map(item => (
            <TabTrigger key={item.name} name={item.name} href={item.href} style={{ display: 'none' }} />
          ))}
        </WebNavBar>
      </TabList>
    </Tabs>
  );
}

export function NavButton({ children, isFocused, icon, label, ...props }: TabTriggerSlotProps & { icon?: string; label?: string }) {
  return (
    <Pressable {...props} style={({ pressed }) => [styles.navBtn, pressed && styles.pressed]}>
      <View style={[styles.navBtnInner, isFocused && styles.navBtnActive]}>
        <MaterialIcons
          name={(icon ?? 'home') as any}
          size={20}
          color={isFocused ? SV.primaryContainer : SV.onSurfaceVariant}
        />
        <Text style={[styles.navLabel, isFocused && styles.navLabelActive]}>
          {label ?? String(children)}
        </Text>
      </View>
    </Pressable>
  );
}

export function WebNavBar(props: TabListProps) {
  return (
    <View style={styles.navBarWrapper}>
      <View style={styles.navBar}>
        <View style={styles.navItems}>{props.children}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  navBarWrapper: {
    // 'fixed' anchors to the VIEWPORT bottom regardless of expo-router/ui's sidebar layout.
    // On narrow viewports expo-router/ui stacks vertically so 'absolute' worked on localhost;
    // on wider viewports (desktop/expo.dev) it switches to row/sidebar — 'fixed' is required.
    position: 'fixed' as any,
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 50,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.two,
    height: 64,
    backgroundColor: SV.surfaceContainerLowest,
    borderTopWidth: 1,
    borderTopColor: SV.outlineVariant,
  },
  navItems: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    gap: 0,
  },
  navBtn: { flex: 1, alignItems: 'center' },
  navBtnInner: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 6,
    width: '100%',
    borderRadius: 8,
  },
  navBtnActive: {
    backgroundColor: 'rgba(57,255,20,0.12)',
  },
  navLabel: {
    color: SV.onSurfaceVariant,
    fontFamily: 'monospace',
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  navLabelActive: {
    color: SV.primaryContainer,
    fontWeight: '700',
  },
  pressed: { opacity: 0.75 },
});
