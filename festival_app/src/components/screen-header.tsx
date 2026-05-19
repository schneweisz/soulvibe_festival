import { MaterialIcons } from '@expo/vector-icons';
import { router, Link } from 'expo-router';
import React, { useRef } from 'react';
import { Animated, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SV, neonShadow } from '@/constants/theme';
import { useMenu } from '@/components/menu-drawer';

interface ScreenHeaderProps {
  /** True to show a ← back button instead of the hamburger menu */
  showBack?: boolean;
  /** Cart item count shown on the cart icon badge (hide badge when 0) */
  cartCount?: number;
  /** Override right icon; defaults to account-circle (→ /profile) */
  rightIcon?: React.ReactNode;
}

/** Scale-spring press animation wrapper */
function PressableIcon({
  onPress,
  children,
  hitSlop = 12,
  ...props
}: {
  onPress?: (e?: any) => void;
  children: React.ReactNode;
  hitSlop?: number;
  [key: string]: any;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const pressIn = () =>
    Animated.spring(scale, { toValue: 0.88, useNativeDriver: true, speed: 50, bounciness: 4 }).start();
  const pressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 50, bounciness: 4 }).start();

  return (
    <Pressable
      {...props}
      onPress={onPress}
      onPressIn={pressIn}
      onPressOut={pressOut}
      hitSlop={hitSlop}
      style={styles.iconBtn}>
      <Animated.View style={{ transform: [{ scale }] }}>{children}</Animated.View>
    </Pressable>
  );
}

export function ScreenHeader({ showBack, cartCount, rightIcon }: ScreenHeaderProps) {
  const { openMenu } = useMenu();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.header, { paddingTop: Math.max(insets.top, 8) }]}>
      {showBack ? (
        <PressableIcon onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color={SV.primaryContainer} />
        </PressableIcon>
      ) : (
        <PressableIcon onPress={openMenu}>
          <MaterialIcons name="menu" size={24} color={SV.onSurfaceVariant} />
        </PressableIcon>
      )}

      <Text style={styles.title}>SOULVIBE 2026</Text>

      {rightIcon ?? (
        <Link href="/profile" asChild>
          <PressableIcon>
            <MaterialIcons name="account-circle" size={24} color={SV.onSurfaceVariant} />
          </PressableIcon>
        </Link>
      )}
    </View>
  );
}

/** Floating cart FAB — place as absolute child near the bottom of each screen */
export function CartFAB({ count = 2 }: { count?: number }) {
  const scale = useRef(new Animated.Value(1)).current;

  const pressIn = () =>
    Animated.spring(scale, { toValue: 0.9, useNativeDriver: true, speed: 50 }).start();
  const pressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 40, bounciness: 8 }).start();

  return (
    <Animated.View style={[styles.fab, { transform: [{ scale }] }]}>
      <Link href="/cart" asChild>
        <Pressable
          onPressIn={pressIn}
          onPressOut={pressOut}
          style={styles.fabInner}>
          <MaterialIcons name="shopping-cart" size={26} color={SV.deepCharcoal} />
          {count > 0 && (
            <View style={styles.fabBadge}>
              <Text style={styles.fabBadgeText}>{count}</Text>
            </View>
          )}
        </Pressable>
      </Link>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: SV.surfaceContainerLowest,
    borderBottomWidth: 1,
    borderBottomColor: SV.outlineVariant,
    shadowColor: '#39ff14',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 12,
  },
  title: {
    color: SV.primaryFixedDim,
    fontFamily: 'monospace',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
    textShadowColor: 'rgba(42,229,0,0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  iconBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
  },

  fab: {
    // Web: 'fixed' anchors to viewport so the FAB sits just above the bottom nav
    // regardless of scroll or sidebar layout. Native: 'absolute' inside screen View.
    position: Platform.OS === 'web' ? ('fixed' as any) : 'absolute',
    right: 20,
    bottom: Platform.OS === 'web' ? 72 : 84,
    zIndex: 100,
    elevation: 20,
  },
  fabInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: SV.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#39ff14',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 14,
    elevation: 20,
  },
  fabBadge: {
    position: 'absolute',
    top: -3,
    right: -3,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: SV.error,
    borderWidth: 2,
    borderColor: SV.deepCharcoal,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  fabBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
  },
});
