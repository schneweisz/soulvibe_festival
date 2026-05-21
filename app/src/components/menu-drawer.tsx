import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, usePathname } from 'expo-router';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { SV, neonShadow } from '../constants/theme';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useDatabase } from '../context/DatabaseContext';
import { getRank } from '../utils/rank';

const DRAWER_WIDTH = Math.min(Dimensions.get('window').width * 0.82, 320);
const DURATION_IN = 300;
const DURATION_OUT = 200;

// ─── Context ────────────────────────────────────────────────────────────────

type MenuCtx = { openMenu: () => void; closeMenu: () => void };
const MenuContext = createContext<MenuCtx>({ openMenu: () => {}, closeMenu: () => {} });
export function useMenu() {
  return useContext(MenuContext);
}

// ─── Menu items ─────────────────────────────────────────────────────────────

type NavItem = { en: string; hu: string; icon: string; href: string };

const NAV_ITEMS: NavItem[] = [
  { en: 'HOME', hu: 'FŐOLDAL', icon: 'home', href: '/' },
  { en: 'LINEUP', hu: 'PROGRAM', icon: 'event-note', href: '/lineup' },
  { en: 'MAP', hu: 'TÉRKÉP', icon: 'map', href: '/map' },
  { en: 'GASTRO', hu: 'GASZTRO', icon: 'fastfood', href: '/gastro' },
  { en: 'INFO', hu: 'INFO', icon: 'info', href: '/info' },
];

const SECONDARY_ITEMS: NavItem[] = [
  { en: 'MY TICKET', hu: 'JEGYEM', icon: 'confirmation-number', href: '/ticket_shop' },
  { en: 'WALLET', hu: 'PÉNZTÁRCA', icon: 'account-balance-wallet', href: '/wallet' },
  { en: 'CART', hu: 'KOSÁR', icon: 'shopping-cart', href: '/cart' },
];

// ─── Animated list item ──────────────────────────────────────────────────────

function MenuItem({
  icon, label, href, active, delay, onPress,
}: {
  icon: string; label: string; href: string; active: boolean; delay: number; onPress: () => void;
}) {
  const anim = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 220,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, []);

  const handlePressIn = () =>
    Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, speed: 40 }).start();
  const handlePressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 40 }).start();

  return (
    <Animated.View
      style={{
        opacity: anim,
        transform: [
          { translateX: anim.interpolate({ inputRange: [0, 1], outputRange: [-24, 0] }) },
          { scale },
        ],
      }}>
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
        style={[styles.menuItem, active && styles.menuItemActive]}>
        {active && <View style={styles.menuItemAccent} />}
        <MaterialIcons
          name={icon as any}
          size={22}
          color={active ? SV.primaryContainer : SV.onSurfaceVariant}
        />
        <Text style={[styles.menuItemLabel, active && styles.menuItemLabelActive]}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}

// ─── Drawer ──────────────────────────────────────────────────────────────────

function Drawer({ onClose }: { onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const { lang } = useLanguage();
  const { session } = useAuth();
  const { profile, tickets } = useDatabase();
  const t = (en: string, hu: string) => lang === 'hu' ? hu : en;
  const translateX = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  const hasTicket = tickets.length > 0;
  const rank = getRank(profile?.points || 0);
  const username = profile?.username
    ?? (session?.user?.email ? session.user.email.split('@')[0].toUpperCase() : null)
    ?? t('GUEST', 'VENDÉG');
  const avatarUri = session?.user?.email
    ? `https://api.dicebear.com/7.x/avataaars/png?seed=${encodeURIComponent(session.user.email)}`
    : null;

  // Dynamically calculate the ticket href and label
  const ticketHref = session ? (hasTicket ? '/profile?openTicket=true' : '/ticket_shop') : '/auth';
  const ticketLabelEn = hasTicket ? 'MY TICKET' : 'BUY TICKET';
  const ticketLabelHu = hasTicket ? 'JEGYEM' : 'JEGYVÁSÁRLÁS';
  
  const secondaryItems: NavItem[] = [
    { en: ticketLabelEn, hu: ticketLabelHu, icon: 'confirmation-number', href: ticketHref },
    { en: 'WALLET', hu: 'PÉNZTÁRCA', icon: 'account-balance-wallet', href: '/wallet' },
    { en: 'CART', hu: 'KOSÁR', icon: 'shopping-cart', href: '/cart' },
  ];

  useEffect(() => {
    Animated.parallel([
      Animated.spring(translateX, {
        toValue: 0,
        damping: 28,
        stiffness: 280,
        useNativeDriver: true,
      }),
      Animated.timing(overlayOpacity, {
        toValue: 1,
        duration: DURATION_IN,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const close = useCallback(() => {
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: -DRAWER_WIDTH,
        duration: DURATION_OUT,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: DURATION_OUT,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start(onClose);
  }, [onClose]);

  const navigate = (href: string) => {
    close();
    setTimeout(() => router.push(href as any), DURATION_OUT + 20);
  };

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* Overlay */}
      <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={close} />
      </Animated.View>

      {/* Drawer panel */}
      <Animated.View
        style={[
          styles.drawer,
          { transform: [{ translateX }], paddingTop: insets.top + 16 },
        ]}>
        {/* Header */}
        <View style={styles.drawerHeader}>
          <Image
            source={require('../../assets/images/soulvibe2026.png')}
            style={styles.drawerLogo}
            contentFit="contain"
          />
          <TouchableOpacity onPress={close} style={styles.closeBtn} hitSlop={12}>
            <MaterialIcons name="close" size={22} color={SV.onSurfaceVariant} />
          </TouchableOpacity>
        </View>

        {/* Profile card */}
        <Pressable style={styles.profileCard} onPress={() => navigate(session ? '/profile' : '/auth')}>
          <View style={styles.profileAvatar}>
            {avatarUri ? (
              <Image
                source={{ uri: avatarUri }}
                style={styles.profileAvatarImg}
                contentFit="cover"
              />
            ) : (
              <MaterialIcons name="person" size={28} color={SV.primaryContainer} />
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.profileName} numberOfLines={1}>{username}</Text>
            <Text style={styles.profileLevel}>
              {session ? `PULSE LEVEL: ${rank.name}` : t('TAP TO SIGN IN', 'BEJELENTKEZÉS')}
            </Text>
          </View>
          {session && (
            <View style={styles.profileBadge}>
              <Text style={styles.profileBadgeText}>VIP</Text>
            </View>
          )}
        </Pressable>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Primary nav */}
        {NAV_ITEMS.map((item, i) => (
          <MenuItem
            key={item.href}
            icon={item.icon}
            label={lang === 'hu' ? item.hu : item.en}
            href={item.href}
            active={pathname === item.href}
            delay={40 + i * 35}
            onPress={() => navigate(item.href)}
          />
        ))}

        {/* Divider */}
        <View style={styles.divider} />

        {/* Secondary nav */}
        {secondaryItems.map((item, i) => (
          <MenuItem
            key={item.href}
            icon={item.icon}
            label={lang === 'hu' ? item.hu : item.en}
            href={item.href}
            active={pathname === item.href}
            delay={220 + i * 35}
            onPress={() => navigate(item.href)}
          />
        ))}

        {/* Version footer */}
        <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
          <Text style={styles.footerText}>ZAMÁRDI // JUL 18–20 2026</Text>
          <View style={styles.footerDot} />
          <Text style={styles.footerText}>v1.0.0</Text>
        </View>
      </Animated.View>
    </View>
  );
}

// ─── Provider (wrap root layout with this) ───────────────────────────────────

export function MenuProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const openMenu = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setOpen(true);
  }, []);
  const closeMenu = useCallback(() => setOpen(false), []);

  return (
    <MenuContext.Provider value={{ openMenu, closeMenu }}>
      {children}
      {open && <Drawer onClose={closeMenu} />}
    </MenuContext.Provider>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.65)',
    zIndex: 200,
  },

  drawer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: DRAWER_WIDTH,
    backgroundColor: SV.deepCharcoal,
    borderRightWidth: 1,
    borderRightColor: SV.outlineVariant,
    zIndex: 210,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 4, height: 0 }, shadowOpacity: 0.4, shadowRadius: 12 },
      android: { elevation: 24 },
    }),
  },

  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  drawerLogo: {
    flex: 1,
    height: 25,
  },
  closeBtn: {
    width: 36,
    height: 36,
    backgroundColor: SV.surfaceContainerHigh,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },

  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 12,
    marginBottom: 8,
    backgroundColor: SV.surfaceContainerHigh,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(57,255,20,0.15)',
  },
  profileAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: SV.surfaceContainer,
    alignItems: 'center',
    overflow: 'hidden',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: SV.primaryContainer,
  },
  profileAvatarImg: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  profileName: {
    color: SV.primaryFixedDim,
    fontFamily: 'monospace',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  profileLevel: {
    color: SV.onSurfaceVariant,
    fontFamily: 'monospace',
    fontSize: 10,
    marginTop: 2,
    letterSpacing: 0.5,
  },
  profileBadge: {
    backgroundColor: 'rgba(57,255,20,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(57,255,20,0.4)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  profileBadgeText: {
    color: SV.primaryContainer,
    fontFamily: 'monospace',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },

  divider: {
    height: 1,
    backgroundColor: SV.outlineVariant,
    marginHorizontal: 12,
    marginVertical: 8,
  },

  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginHorizontal: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
  },
  menuItemActive: {
    backgroundColor: 'rgba(57,255,20,0.08)',
  },
  menuItemAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: SV.primaryContainer,
    borderRadius: 2,
  },
  menuItemLabel: {
    color: SV.onSurfaceVariant,
    fontFamily: 'monospace',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 1.5,
  },
  menuItemLabelActive: {
    color: SV.primaryContainer,
  },

  footer: {
    marginTop: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  footerText: {
    color: SV.outline,
    fontFamily: 'monospace',
    fontSize: 10,
    letterSpacing: 0.5,
  },
  footerDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: SV.outline,
  },
});

