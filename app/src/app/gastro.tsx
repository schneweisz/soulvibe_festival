import { MaterialIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SV, neonShadow } from '@/constants/theme';
import { CartFAB, ScreenHeader } from '@/components/screen-header';

interface MenuItem {
  id: string;
  name: string;
  desc: string;
  price: number;
}

interface Vendor {
  id: string;
  name: string;
  badge: string;
  desc: string;
  accentColor: string;
  icon: string;
  items: MenuItem[];
}

const VENDORS: Vendor[] = [
  {
    id: 'trapgrill',
    name: 'TrapGrill',
    badge: 'GRILL & MEAT',
    desc: 'Juicy street-food smash burgers and loaded energy-boosters.',
    accentColor: SV.primaryContainer,
    icon: 'outdoor-grill',
    items: [
      { id: 'tg1', name: '808 Smash Burger', desc: 'Double patty, cheddar, secret hot BBQ sauce', price: 4100 },
      { id: 'tg2', name: 'Moshpit Fries', desc: 'French fries, warm cheddar sauce, pulled pork', price: 2400 },
      { id: 'tg3', name: "Lil' Spicy Wings", desc: 'Hot, sticky-glazed crispy chicken wings', price: 2900 },
    ],
  },
  {
    id: 'wiredpizza',
    name: 'Wired Pizza',
    badge: 'PIZZA CORNER',
    desc: 'Authentic, thin-crust Neapolitan pizza slices.',
    accentColor: SV.secondaryContainer,
    icon: 'local-pizza',
    items: [
      { id: 'wp1', name: 'Hi-Hat Pepperoni', desc: 'Spicy Italian salami, mozzarella, chili oil', price: 1800 },
      { id: 'wp2', name: 'Synth-Veggie', desc: 'Goat cheese, cherry tomatoes, fresh basil', price: 1700 },
      { id: 'wp3', name: 'Bassline BBQ', desc: 'Spicy ground beef, red onion, smoky BBQ', price: 1900 },
    ],
  },
  {
    id: 'loopbar',
    name: 'The Loop Bar',
    badge: 'DRINKS & SHOTS',
    desc: 'Glowing neon cocktails and quick shots for a non-stop night.',
    accentColor: SV.tertiaryContainer,
    icon: 'local-bar',
    items: [
      { id: 'lb1', name: 'Acid Lemonade', desc: 'Neon-green gin-tonic with green apple & lime', price: 2900 },
      { id: 'lb2', name: 'Reverb Rum', desc: 'Spiced dark rum, ginger beer, lime juice & ice', price: 3100 },
      { id: 'lb3', name: 'Sub-Bass Shot', desc: 'Electric purple blueberry gin shooter', price: 1500 },
    ],
  },
  {
    id: 'munchies',
    name: 'Munchies Spot',
    badge: 'SWEETS & CRAVES',
    desc: 'Sweet delights and rich desserts for early morning cravings.',
    accentColor: SV.primaryFixed,
    icon: 'cake',
    items: [
      { id: 'ms1', name: 'Liquid Gold Gofri', desc: 'Warm waffle, salted caramel, crushed hazelnuts, whipped cream', price: 1950 },
      { id: 'ms2', name: 'Melted Drop Palacsinta', desc: 'Huge crepe stuffed with Nutella, banana slices & powdered sugar', price: 1650 },
    ],
  },
];

type CartState = Record<string, number>;

export default function GastroScreen() {
  const [cart, setCart] = useState<CartState>({});

  const add = (id: string) => setCart(c => ({ ...c, [id]: (c[id] ?? 0) + 1 }));
  const remove = (id: string) =>
    setCart(c => {
      const next = { ...c };
      if ((next[id] ?? 0) <= 1) delete next[id];
      else next[id]--;
      return next;
    });

  const cartCount = Object.values(cart).reduce((a, b) => a + b, 0);

  return (
    <View style={styles.root}>
      <ScreenHeader />

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Page header */}
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>GOURMET FUEL</Text>
          <Text style={styles.pageSubtitle}>
            High-octane street food and craft drinks to keep the pulse going.
          </Text>
        </View>

        {/* Vendor sections */}
        {VENDORS.map(vendor => (
          <View key={vendor.id} style={styles.vendorSection}>
            {/* Vendor header */}
            <View style={styles.vendorHeader}>
              <View style={styles.vendorNameRow}>
                <MaterialIcons
                  name={vendor.icon as any}
                  size={18}
                  color={vendor.accentColor}
                />
                <Text style={styles.vendorName}>{vendor.name}</Text>
              </View>
              <View style={[styles.badge, { borderColor: vendor.accentColor }]}>
                <Text style={[styles.badgeText, { color: vendor.accentColor }]}>
                  {vendor.badge}
                </Text>
              </View>
            </View>
            <Text style={styles.vendorDesc}>{vendor.desc}</Text>

            {/* Menu item cards */}
            {vendor.items.map(item => {
              const qty = cart[item.id] ?? 0;
              return (
                <View key={item.id} style={styles.menuCard}>
                  <View style={styles.menuCardRow}>
                    <View style={styles.menuItemInfo}>
                      <Text style={styles.menuItemName}>{item.name}</Text>
                      <Text style={styles.menuItemDesc} numberOfLines={2}>
                        {item.desc}
                      </Text>
                      <Text style={[styles.menuItemPrice, { color: vendor.accentColor }]}>
                        {item.price.toLocaleString('hu-HU')} Ft
                      </Text>
                    </View>

                    {qty === 0 ? (
                      <TouchableOpacity
                        style={[styles.getBtn, { backgroundColor: vendor.accentColor }]}
                        onPress={() => add(item.id)}
                        hitSlop={6}>
                        <Text style={styles.getBtnText}>+ Get</Text>
                      </TouchableOpacity>
                    ) : (
                      <View style={styles.stepper}>
                        <TouchableOpacity
                          style={[styles.stepBtn, { borderColor: vendor.accentColor }]}
                          onPress={() => remove(item.id)}
                          hitSlop={6}>
                          <MaterialIcons name="remove" size={14} color={vendor.accentColor} />
                        </TouchableOpacity>
                        <Text style={[styles.stepQty, { color: vendor.accentColor }]}>{qty}</Text>
                        <TouchableOpacity
                          style={[styles.stepBtn, { backgroundColor: vendor.accentColor }]}
                          onPress={() => add(item.id)}
                          hitSlop={6}>
                          <MaterialIcons name="add" size={14} color="#000" />
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        ))}

        <View style={{ height: 120 }} />
      </ScrollView>

      <CartFAB count={cartCount + 2} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#07070c' },
  scroll: { flex: 1 },

  // ── Page header ────────────────────────────────────────────────────────────
  pageHeader: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
  },
  pageTitle: {
    color: SV.onSurface,
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.5,
    textTransform: 'uppercase',
  },
  pageSubtitle: {
    color: SV.onSurfaceVariant,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 4,
  },

  // ── Vendor section ─────────────────────────────────────────────────────────
  vendorSection: {
    marginHorizontal: 16,
    marginBottom: 28,
  },

  vendorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  vendorNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  vendorName: {
    color: SV.onSurface,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  badgeText: {
    fontFamily: 'monospace',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  vendorDesc: {
    color: SV.onSurfaceVariant,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 14,
  },

  // ── Menu item card ─────────────────────────────────────────────────────────
  menuCard: {
    backgroundColor: '#0e0e18',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    padding: 14,
    marginBottom: 10,
  },
  menuCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuItemInfo: { flex: 1 },
  menuItemName: {
    color: SV.onSurface,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 3,
  },
  menuItemDesc: {
    color: SV.onSurfaceVariant,
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 6,
  },
  menuItemPrice: {
    fontFamily: 'monospace',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  // ── Get button / stepper ───────────────────────────────────────────────────
  getBtn: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  getBtnText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stepBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepQty: {
    fontFamily: 'monospace',
    fontSize: 14,
    fontWeight: '800',
    minWidth: 18,
    textAlign: 'center',
  },
});
