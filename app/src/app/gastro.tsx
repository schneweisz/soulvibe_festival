import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SV, neonShadow } from '../constants/theme';
import { CartFAB, ScreenHeader } from '../components/screen-header';
import { useLanguage } from '../context/LanguageContext';
import { SkeletonGastroSection } from '../components/skeleton';
import { useCart } from '../context/CartContext';

type L10n = { en: string; hu: string };

interface MenuItem {
  id: string;
  name: string;
  desc: L10n;
  price: number;
  image: string;
  allergens?: string[];
}

interface Vendor {
  id: string;
  name: string;
  badge: L10n;
  desc: L10n;
  accentColor: string;
  icon: string;
  items: MenuItem[];
}

const VENDORS: Vendor[] = [
  {
    id: 'trapgrill',
    name: 'TrapGrill',
    badge: { en: 'GRILL & MEAT', hu: 'GRILL & HÚS' },
    desc: {
      en: 'Juicy street-food smash burgers and loaded energy-boosters.',
      hu: 'Szaftos utcai smash burgerek és felturbózott energiabombák.',
    },
    accentColor: SV.primaryContainer,
    icon: 'outdoor-grill',
    items: [
      {
        id: 'tg1',
        name: '808 Smash Burger',
        desc: { en: 'Double patty, cheddar, secret hot BBQ sauce', hu: 'Dupla húspogácsa, cheddar sajt, titkos BBQ szósz' },
        price: 4100,
        image: 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?q=80&w=300&auto=format&fit=crop',
        allergens: ['GLUTEN', 'DAIRY', 'EGG'],
      },
      {
        id: 'tg2',
        name: 'Moshpit Fries',
        desc: { en: 'French fries, warm cheddar sauce, pulled pork', hu: 'Sült burgonya, meleg cheddar szósz, húzott sertéshús' },
        price: 2400,
        image: 'https://images.unsplash.com/photo-1585109649139-366815a0d713?q=80&w=300&auto=format&fit=crop',
        allergens: ['GLUTEN', 'DAIRY', 'PORK'],
      },
      {
        id: 'tg3',
        name: 'Spicy Wings',
        desc: { en: 'Hot, sticky-glazed crispy chicken wings', hu: 'Forró, ragacsos mázas ropogós csirkeszárnyak' },
        price: 2900,
        image: 'https://images.unsplash.com/photo-1527477396000-e27163b481c2?q=80&w=300&auto=format&fit=crop',
        allergens: ['GLUTEN', 'EGG'],
      },
    ],
  },
  {
    id: 'wiredpizza',
    name: 'Wired Pizza',
    badge: { en: 'PIZZA CORNER', hu: 'PIZZA SAROK' },
    desc: {
      en: 'Authentic, thin-crust Neapolitan pizza slices.',
      hu: 'Autentikus, vékony tésztájú nápolyi pizzaszeletek.',
    },
    accentColor: SV.secondaryContainer,
    icon: 'local-pizza',
    items: [
      {
        id: 'wp1',
        name: 'Hi-Hat Pepperoni',
        desc: { en: 'Spicy Italian salami, mozzarella, chili oil', hu: 'Csípős olasz szalámi, mozzarella, chili olaj' },
        price: 1800,
        image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=300&auto=format&fit=crop',
        allergens: ['GLUTEN', 'DAIRY', 'PORK'],
      },
      {
        id: 'wp2',
        name: 'Synth-Veggie',
        desc: { en: 'Goat cheese, cherry tomatoes, fresh basil', hu: 'Kecskesajt, koktélparadicsom, friss bazsalikom' },
        price: 1700,
        image: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?q=80&w=300&auto=format&fit=crop',
        allergens: ['GLUTEN', 'DAIRY'],
      },
      {
        id: 'wp3',
        name: 'Bassline BBQ',
        desc: { en: 'Spicy ground beef, red onion, smoky BBQ', hu: 'Fűszeres darált marha, vöröshagyma, füstös BBQ' },
        price: 1900,
        image: 'https://images.unsplash.com/photo-1541745537411-b8046dc6d66c?q=80&w=300&auto=format&fit=crop',
        allergens: ['GLUTEN', 'DAIRY'],
      },
    ],
  },
  {
    id: 'loopbar',
    name: 'The Loop Bar',
    badge: { en: 'DRINKS & SHOTS', hu: 'ITALOK & SHOTOK' },
    desc: {
      en: 'Glowing neon cocktails and quick shots for a non-stop night.',
      hu: 'Neonfényes koktélok és gyors shotok egy megállás nélküli éjszakához.',
    },
    accentColor: SV.tertiaryContainer,
    icon: 'local-bar',
    items: [
      {
        id: 'lb1',
        name: 'Acid Lemonade',
        desc: { en: 'Neon-green gin-tonic with green apple & lime', hu: 'Neonfényes gin-tonic zöld almával és lime-mal' },
        price: 2900,
        image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?q=80&w=300&auto=format&fit=crop',
        allergens: ['ALCOHOL'],
      },
      {
        id: 'lb2',
        name: 'Reverb Rum',
        desc: { en: 'Spiced dark rum, ginger beer, lime juice & ice', hu: 'Fűszeres dark rum, gyömbérsör, lime lé & jég' },
        price: 3100,
        image: 'https://images.unsplash.com/photo-1470337458703-46ad1756a187?q=80&w=300&auto=format&fit=crop',
        allergens: ['ALCOHOL', 'GLUTEN'],
      },
      {
        id: 'lb3',
        name: 'Sub-Bass Shot',
        desc: { en: 'Electric purple blueberry gin shooter', hu: 'Elektromos lila áfonya gin shooter' },
        price: 1500,
        image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?q=80&w=300&auto=format&fit=crop',
        allergens: ['ALCOHOL'],
      },
      {
        id: 'lb4',
        name: 'Techno Water',
        desc: { en: 'Ultra-purified mineral water in a glowing bottle', hu: 'Ultra-tisztított ásványvíz világító üvegben' },
        price: 800,
        image: 'https://images.unsplash.com/photo-1523362628745-0c100150b504?q=80&w=300&auto=format&fit=crop',
      },
    ],
  },
  {
    id: 'munchies',
    name: 'Munchies Spot',
    badge: { en: 'SWEETS & CRAVES', hu: 'ÉDESSÉGEK & VÁGYAK' },
    desc: {
      en: 'Sweet delights and rich desserts for early morning cravings.',
      hu: 'Édes finomságok és gazdag desszertek hajnali sóvárgásokhoz.',
    },
    accentColor: SV.primaryFixed,
    icon: 'cake',
    items: [
      {
        id: 'ms1',
        name: 'Gofri',
        desc: { en: 'Warm waffle, salted caramel, crushed hazelnuts, whipped cream', hu: 'Meleg gofri, sós karamell, törött mogyoró, tejszínhab' },
        price: 1950,
        image: 'https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?q=80&w=300&auto=format&fit=crop',
        allergens: ['GLUTEN', 'DAIRY', 'EGG', 'NUTS'],
      },
      {
        id: 'ms2',
        name: 'Melted Drop Palacsinta',
        desc: { en: 'Huge crepe stuffed with Nutella, banana slices & powdered sugar', hu: 'Hatalmas palacsinta Nutellával, banánszeletekkel és porcukorral töltve' },
        price: 1650,
        image: 'https://images.unsplash.com/photo-1519676867240-f03562e64548?q=80&w=300&auto=format&fit=crop',
        allergens: ['GLUTEN', 'DAIRY', 'EGG', 'NUTS'],
      },
    ],
  },
];

export default function GastroScreen() {
  const { lang } = useLanguage();
  const { items: cartItems, addToCart, removeFromCart, cartCount } = useCart();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 1500);
    return () => clearTimeout(t);
  }, []);

  const add = (item: MenuItem) => {
    addToCart({
      id: item.id,
      name: item.name,
      price: item.price,
      image: item.image,
    });
  };

  const remove = (id: string) => {
    removeFromCart(id);
  };

  return (
    <View style={styles.root}>
      <ScreenHeader />

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Page header */}
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>
            {lang === 'hu' ? 'GASZTRONÓMIA' : 'GOURMET FUEL'}
          </Text>
          <Text style={styles.pageSubtitle}>
            {lang === 'hu'
              ? 'Felturbózott utcai ételek és kézműves italok a lüktetés fenntartásához.'
              : 'High-octane street food and craft drinks to keep the pulse going.'}
          </Text>
        </View>

        {/* Vendor sections */}
        {loading ? (
          <>
            <SkeletonGastroSection />
            <SkeletonGastroSection />
          </>
        ) : null}

        {!loading && VENDORS.map(vendor => (
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
                  {vendor.badge[lang]}
                </Text>
              </View>
            </View>
            <Text style={styles.vendorDesc}>{vendor.desc[lang]}</Text>

            {/* Menu item cards */}
            {vendor.items.map(item => {
              const qty = cartItems.find(i => i.id === item.id)?.qty ?? 0;
              return (
                <View key={item.id} style={styles.menuCard}>
                  <View style={styles.menuCardRow}>
                    <Image
                      source={item.image}
                      style={[styles.menuItemImage, { borderColor: vendor.accentColor + '40' }]}
                      contentFit="cover"
                      transition={300}
                    />
                    <View style={styles.menuItemInfo}>
                      <Text style={styles.menuItemName}>{item.name}</Text>
                      <Text style={styles.menuItemDesc} numberOfLines={2}>
                        {item.desc[lang]}
                      </Text>
                      <Text style={[styles.menuItemPrice, { color: vendor.accentColor }]}>
                        {item.price.toLocaleString('hu-HU')} Ft
                      </Text>
                      {item.allergens && item.allergens.length > 0 && (
                        <View style={styles.allergenRow}>
                          {item.allergens.map(a => (
                            <View key={a} style={styles.allergenPill}>
                              <Text style={styles.allergenText}>{a}</Text>
                            </View>
                          ))}
                        </View>
                      )}
                    </View>

                    {qty === 0 ? (
                      <TouchableOpacity
                        style={[styles.getBtn, { backgroundColor: vendor.accentColor }]}
                        onPress={() => add(item)}
                        hitSlop={6}>
                        <Text style={styles.getBtnText}>
                          {lang === 'hu' ? '+ Kérem' : '+ Get'}
                        </Text>
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
                          onPress={() => add(item)}
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

      <CartFAB count={cartCount} />
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
    padding: 12,
    marginBottom: 10,
  },
  menuCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuItemImage: {
    width: 64,
    height: 64,
    borderRadius: 8,
    backgroundColor: '#1a1a2e',
    borderWidth: 1,
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

  // ── Allergens ──────────────────────────────────────────────────────────────
  allergenRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 6,
  },
  allergenPill: {
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  allergenText: {
    color: SV.onSurfaceVariant,
    fontFamily: 'monospace',
    fontSize: 9,
    letterSpacing: 0.4,
  },

  // ── Get button / stepper ───────────────────────────────────────────────────
  getBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 60,
  },
  getBtnText: {
    color: '#000',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stepBtn: {
    width: 28,
    height: 28,
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
