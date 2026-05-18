import { Tabs, TabList, TabTrigger, TabSlot, TabTriggerSlotProps, TabListProps } from 'expo-router/ui';
import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, View, StyleSheet, Text } from 'react-native';

import { SV, MaxContentWidth, Spacing } from '@/constants/theme';

const NAV_ITEMS = [
  { name: 'home', href: '/' as const, label: 'HOME', icon: 'home' },
  { name: 'lineup', href: '/lineup' as const, label: 'LINEUP', icon: 'event-note' },
  { name: 'map', href: '/map' as const, label: 'MAP', icon: 'map' },
  { name: 'gastro', href: '/gastro' as const, label: 'GASTRO', icon: 'fastfood' },
  { name: 'info', href: '/info' as const, label: 'INFO', icon: 'info' },
] as const;

export default function AppTabs() {
  return (
    <Tabs>
      <TabSlot style={{ height: '100%' }} />
      <TabList asChild>
        <WebNavBar>
          {NAV_ITEMS.map(item => (
            <TabTrigger key={item.name} name={item.name} href={item.href} asChild>
              <NavButton icon={item.icon} label={item.label} />
            </TabTrigger>
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
    position: 'absolute',
    bottom: 0,
    width: '100%',
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
