import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SV, neonShadow } from '@/constants/theme';
import { CartFAB, ScreenHeader } from '@/components/screen-header';

type Filter = 'ALL EATS' | 'STREET FOOD' | 'DRINKS' | 'VEGAN' | 'GLUTEN-FREE' | 'DAIRY-FREE';

interface Stall {
  id: string;
  name: string;
  price: string;
  desc: string;
  tags: string[];
  featured: string;
  type: ('food' | 'drink')[];
  vegan?: boolean;
  gf?: boolean;
  df?: boolean;
  image: string;
  hot?: boolean;
}

const STALLS: Stall[] = [
  {
    id: 'trapgrill', name: 'TrapGrill', price: '$$$', type: ['food'],
    desc: 'Heavy-hitting smash burgers and loaded fries. The ultimate post-rave fuel station.',
    tags: ['GF OPTION'], featured: '808 Smash Burger', gf: true, hot: true,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDMbBvRWe6vd2cWBpuEvMAmXeL4yuMRR-L6A3sknt57mXp60xlPuf0Aid8L-3SlEijitK2OXH7Nbmmy8KW5rnxMIXUHAUiLtpDDXStQ2mqjyHgsveLx4FF3ahm16otNbZfazgpzw-hsh_v3_Ob1imYe2so1KO7k8ck1dNx5EWwYX1ELECB9VQri1cnkJoe--57moY0YeP8sMynBNhWSp2tW7-xd8FusDc2RWppvuEsYFS3Ly-JxzjKIiZ9n_aisSWAyHxoItW3GTUja',
  },
  {
    id: 'wiredpizza', name: 'Wired Pizza', price: '$$', type: ['food'],
    desc: 'Wood-fired slices with controversial, high-energy toppings. Fast and chaotic.',
    tags: ['VEGAN OPTION'], featured: 'Hi-Hat Pepperoni', vegan: true,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDZN6G2TtWe2kFVeyAx60VIJGuyXzmpkSwzQguaLznw08xNryEgxhmhY3zE0Jct5pjoIrFd_6N20S74ywFDIszevmK8-kosgfTibWIkZSI2Kd_j80kwFLyqB4ZdciBT5o6uQE-uvtWWLPIG9LKv_fttQGR3nwUEC7_1_oi4HZ5aDmpQWbYMV-04awYI-_ldG4dphISnYeen_JrLS1Vztv1vuXKbh6JiwFVP3mZDDw3WsA09_QGtSCwK7PLi8RDKES8prLV3P3QmSDGo',
  },
  {
    id: 'munchies', name: 'Munchies Spot', price: '$', type: ['food'],
    desc: 'Loaded fries, mac & cheese bites, and pure carb energy. 100% plant-based.',
    tags: ['100% VEGAN', 'GF'], featured: 'Techno Truffle Fries', vegan: true, gf: true,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBsv1FSFOE3Fy7ywyG26gFO7dyZhxrJiravwnwdB-htfJxDdUBOr0quTck0HZAlgO31e1byb_tZnqkc2Yg9XkkUjvM5yrQHqOg739lnE6qS7CUY7SxSgZUHpBCbGV5sRlYzusqVKeXyJdL29V3ISL550JCs8hX0OJIadZ8i4etZ2I02e1iuOf3Rzb14nZcMhtOa-X_gyyzszR74tYvtuCzV1bWoFZncDoJ4eDfz-mjGVq2IpuICL4YEg5bdZmZVDa6PWRrqGSxhzSSq',
  },
  {
    id: 'loopbar', name: 'The Loop Bar', price: '$$', type: ['drink'],
    desc: 'Industrial-strength cocktails and hydration stations. Keep the loop running.',
    tags: ['DRINKS'], featured: 'BPM Vodka Redbull',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuByoUx75ycGDpCbcJ4H_wcQJavwWTD1oIHpHsSmYFSyj_u6p2VuSaLXIwBM_0vo-81d3hnVklvbjI4NsMvlOfdjqXfy7neTeSEKf3gKHLpJW9O5uFwKnvevMZb2btdawRYDC51iwmlS22ldPZJTWUO5XakeXUX8crdwhCJ4dW7DbvjN-KwVfhW5--3Wb5bx2t0pgZD7i8D9dezemgE47lhYR8mz7ShpP5SkHYaWhFrLJgvKu9LBWEkPogyIZLa5Hk_xzagx_cprjY54',
  },
];

const FILTER_ICONS: Record<Filter, string> = {
  'ALL EATS': 'restaurant',
  'STREET FOOD': 'local-pizza',
  'DRINKS': 'local-bar',
  'VEGAN': 'eco',
  'GLUTEN-FREE': 'spa',
  'DAIRY-FREE': 'water-drop',
};

export default function GastroScreen() {
  const [filter, setFilter] = useState<Filter>('ALL EATS');
  const [cart, setCart] = useState<Record<string, number>>({});

  const addToCart = (id: string) => setCart(c => ({ ...c, [id]: (c[id] ?? 0) + 1 }));
  const cartCount = Object.values(cart).reduce((a, b) => a + b, 0);

  const filtered = STALLS.filter(s => {
    if (filter === 'ALL EATS') return true;
    if (filter === 'STREET FOOD') return s.type.includes('food');
    if (filter === 'DRINKS') return s.type.includes('drink');
    if (filter === 'VEGAN') return s.vegan;
    if (filter === 'GLUTEN-FREE') return s.gf;
    if (filter === 'DAIRY-FREE') return s.df;
    return true;
  });

  return (
    <View style={styles.root}>
      <ScreenHeader />

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Title */}
        <View style={styles.titleBlock}>
          <Text style={styles.pageTitle}>GASTRO</Text>
          <Text style={styles.pageSubtitle}>Fuel up. High-octane street food and craft drinks to keep the pulse going.</Text>
        </View>

        {/* Filter Chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterContent}>
          {(Object.keys(FILTER_ICONS) as Filter[]).map(f => (
            <TouchableOpacity key={f} onPress={() => setFilter(f)} style={[styles.filterChip, f === filter && styles.filterChipActive]}>
              <MaterialIcons name={FILTER_ICONS[f] as any} size={14} color={f === filter ? SV.onPrimaryFixed : SV.onSurface} />
              <Text style={[styles.filterText, f === filter && styles.filterTextActive]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Stall Cards */}
        {filtered.map(stall => (
          <View key={stall.id} style={styles.stallCard}>
            <View style={styles.stallImageWrap}>
              <Image source={{ uri: stall.image }} style={styles.stallImage} />
              {stall.hot && (
                <View style={styles.hotBadge}>
                  <View style={styles.hotDot} />
                  <Text style={styles.hotText}>HIGH DEMAND</Text>
                </View>
              )}
            </View>
            <View style={styles.stallBody}>
              <View style={styles.stallTitleRow}>
                <Text style={styles.stallName}>{stall.name}</Text>
                <Text style={styles.stallPrice}>{stall.price}</Text>
              </View>
              <Text style={styles.stallDesc}>{stall.desc}</Text>
              <View style={styles.tagRow}>
                {stall.tags.map(t => (
                  <View key={t} style={styles.tag}><Text style={styles.tagText}>{t}</Text></View>
                ))}
              </View>
              <View style={styles.featuredRow}>
                <Text style={styles.featuredLabel}>FEATURED DROP</Text>
                <View style={styles.featuredItem}>
                  <Text style={styles.featuredItemName}>{stall.featured}</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.addBtn} onPress={() => addToCart(stall.id)}>
                <Text style={styles.addBtnText}>ADD TO CART</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        <View style={{ height: 120 }} />
      </ScrollView>

      <CartFAB count={cartCount + 2} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: SV.background },

  header: {
    height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, backgroundColor: SV.surfaceGlass,
    borderBottomWidth: 1, borderBottomColor: SV.white10, ...neonShadow,
  },
  headerTitle: { color: SV.primaryFixedDim, fontFamily: 'monospace', fontSize: 17, fontWeight: '800', letterSpacing: -0.5, textTransform: 'uppercase' },

  scroll: { flex: 1 },

  titleBlock: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 8 },
  pageTitle: { color: SV.onSurface, fontSize: 36, fontWeight: '900', letterSpacing: -1, textTransform: 'uppercase' },
  pageSubtitle: { color: SV.onSurfaceVariant, fontSize: 16, lineHeight: 24, marginTop: 6, maxWidth: 320 },

  filterScroll: { maxHeight: 56 },
  filterContent: { paddingHorizontal: 20, gap: 8, alignItems: 'center', paddingVertical: 8 },
  filterChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: SV.surfaceContainerHigh, borderWidth: 1, borderColor: SV.outlineVariant,
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
  },
  filterChipActive: { backgroundColor: SV.primaryContainer, borderColor: SV.primaryContainer, ...neonShadow },
  filterText: { color: SV.onSurface, fontFamily: 'monospace', fontSize: 11, letterSpacing: 0.8 },
  filterTextActive: { color: SV.onPrimaryFixed, fontWeight: '700' },

  stallCard: {
    marginHorizontal: 20, marginBottom: 16, borderRadius: 12, overflow: 'hidden',
    backgroundColor: 'rgba(18,18,18,0.85)', borderTopWidth: 1, borderLeftWidth: 1, borderColor: SV.white10,
  },
  stallImageWrap: { height: 180, backgroundColor: SV.surfaceContainerHigh, position: 'relative' },
  stallImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  hotBadge: {
    position: 'absolute', top: 12, left: 12,
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(57,255,20,0.2)', borderWidth: 1, borderColor: SV.primaryContainer,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
  },
  hotDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: SV.primaryContainer },
  hotText: { color: SV.primaryFixedDim, fontFamily: 'monospace', fontSize: 11, letterSpacing: 1 },

  stallBody: { padding: 16 },
  stallTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  stallName: { color: SV.onSurface, fontSize: 18, fontWeight: '700', textTransform: 'uppercase' },
  stallPrice: { color: SV.onSurfaceVariant, fontSize: 14 },
  stallDesc: { color: SV.onSurfaceVariant, fontSize: 14, lineHeight: 20, marginBottom: 10 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  tag: {
    backgroundColor: SV.surfaceContainerHigh, borderWidth: 1, borderColor: SV.outlineVariant,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12,
  },
  tagText: { color: SV.onSurface, fontFamily: 'monospace', fontSize: 10, letterSpacing: 0.8 },

  featuredRow: { borderTopWidth: 1, borderTopColor: SV.outlineVariant, borderStyle: 'dashed', paddingTop: 10, marginBottom: 12 },
  featuredLabel: { color: SV.primaryFixedDim, fontFamily: 'monospace', fontSize: 10, letterSpacing: 1.5, marginBottom: 6 },
  featuredItem: { backgroundColor: SV.surfaceContainer, padding: 10, borderRadius: 8 },
  featuredItemName: { color: SV.onSurface, fontSize: 15, fontWeight: '700' },

  addBtn: {
    backgroundColor: SV.primaryContainer, paddingVertical: 12, borderRadius: 2, alignItems: 'center', ...neonShadow,
  },
  addBtnText: { color: SV.onPrimaryFixed, fontWeight: '800', fontSize: 13, letterSpacing: 1.5, textTransform: 'uppercase' },

  fab: {
    position: 'absolute', right: 20, bottom: 88,
    width: 56, height: 56, borderRadius: 28, backgroundColor: SV.primaryContainer,
    alignItems: 'center', justifyContent: 'center', ...neonShadow,
  },
  fabBadge: {
    position: 'absolute', top: -4, right: -4, width: 20, height: 20, borderRadius: 10,
    backgroundColor: SV.secondaryContainer, borderWidth: 2, borderColor: SV.deepCharcoal,
    alignItems: 'center', justifyContent: 'center',
  },
  fabBadgeText: { color: SV.onPrimaryFixed, fontSize: 10, fontWeight: '700' },
});
