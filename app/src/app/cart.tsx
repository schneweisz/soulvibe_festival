import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SV, neonShadow } from '@/constants/theme';
import { ScreenHeader } from '@/components/screen-header';

interface CartItem {
  id: string;
  name: string;
  qty: number;
  price: number;
  image: string;
}

const INITIAL_ITEMS: CartItem[] = [
  { 
    id: '1', 
    name: '808 Smash Burger', 
    qty: 1, 
    price: 3500,
    image: 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?q=80&w=300&auto=format&fit=crop'
  },
  { 
    id: '2', 
    name: 'Acid Lemonade', 
    qty: 2, 
    price: 1500,
    image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?q=80&w=300&auto=format&fit=crop'
  },
  { 
    id: '3', 
    name: 'Techno Water', 
    qty: 1, 
    price: 800,
    image: 'https://images.unsplash.com/photo-1523362628745-0c100150b504?q=80&w=300&auto=format&fit=crop'
  },
];

const SERVICE_FEE = 200;

export default function CartScreen() {
  const [items, setItems] = useState<CartItem[]>(INITIAL_ITEMS);
  const [paid, setPaid] = useState(false);

  const removeItem = (id: string) => setItems(it => it.filter(i => i.id !== id));
  const subtotal = items.reduce((acc, i) => acc + i.price * i.qty, 0);
  const total = subtotal + SERVICE_FEE;

  return (
    <View style={styles.root}>
      <ScreenHeader showBack />

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Cart Items */}
        <View style={styles.itemsSection}>
          {items.map(item => (
            <View key={item.id} style={styles.cartItem}>
              <Image
                source={item.image}
                style={styles.itemImage}
                contentFit="cover"
                transition={300}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.itemName}>{item.name}</Text>
                <View style={styles.itemMeta}>
                  <View style={styles.qtyBadge}><Text style={styles.qtyText}>x{item.qty}</Text></View>
                  <Text style={styles.itemPrice}>{(item.price * item.qty).toLocaleString()} HUF</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => removeItem(item.id)} hitSlop={8} style={styles.removeBtn}>
                <MaterialIcons name="close" size={20} color={SV.outline} />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Summary */}
        <View style={styles.summaryBox}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>RÉSZÖSSZEG</Text>
            <Text style={styles.summaryValue}>{subtotal.toLocaleString()} HUF</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>KEZELÉSI KÖLTSÉG</Text>
            <Text style={styles.summaryValue}>{SERVICE_FEE} HUF</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>ÖSSZESEN</Text>
            <Text style={styles.totalValue}>{total.toLocaleString()} HUF</Text>
          </View>
        </View>

        {/* QR / Payment area (simulated post-payment state) */}
        {paid && (
          <View style={styles.qrSection}>
            <View style={styles.qrLiveRow}>
              <View style={styles.qrLiveDot} />
              <Text style={styles.qrLiveText}>LIVE STATUS</Text>
            </View>
            <Text style={styles.qrTitle}>PICKUP TICKET</Text>
            <Text style={styles.qrDesc}>Scan this code at the <Text style={{ color: SV.primaryFixedDim, fontWeight: '700' }}>TrapGrill</Text> stand located in Sector 4.</Text>
            <View style={styles.qrBox}>
              <MaterialIcons name="qr-code-2" size={120} color={SV.onSurface} />
            </View>
            <View style={styles.orderIdBadge}>
              <Text style={styles.orderIdText}>ORD-992X</Text>
            </View>
          </View>
        )}

        <View style={{ height: 160 }} />
      </ScrollView>

      {/* Pay Button */}
      {!paid ? (
        <View style={styles.payArea}>
          <TouchableOpacity style={styles.payBtn} onPress={() => setPaid(true)}>
            <MaterialIcons name="qr-code" size={20} color={SV.deepCharcoal} />
            <Text style={styles.payBtnText}>FIZETÉS ÉS QR KÓD GENERÁLÁSA</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.payArea}>
          <TouchableOpacity style={styles.doneBtn} onPress={() => { router.back(); }}>
            <Text style={styles.doneBtnText}>BACK TO GASTRO</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: SV.deepCharcoal },

  header: {
    height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, backgroundColor: SV.surfaceGlass,
    borderBottomWidth: 1, borderBottomColor: SV.white10, ...neonShadow,
  },
  headerTitle: { color: SV.primaryFixedDim, fontFamily: 'monospace', fontSize: 17, fontWeight: '800', letterSpacing: -0.5, textTransform: 'uppercase' },

  scroll: { flex: 1 },

  itemsSection: { padding: 20, gap: 10 },
  cartItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: SV.surfaceGlass, borderTopWidth: 1, borderLeftWidth: 1, borderColor: SV.white10,
    borderRadius: 8, padding: 12, ...neonShadow,
  },
  itemImage: {
    width: 50, height: 50, borderRadius: 6,
    backgroundColor: SV.surfaceContainerHigh,
  },
  itemName: { color: SV.onSurface, fontSize: 16, fontWeight: '700', textTransform: 'uppercase', marginBottom: 4 },
  itemMeta: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  qtyBadge: { backgroundColor: SV.surfaceContainerHigh, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
  qtyText: { color: SV.onSurfaceVariant, fontFamily: 'monospace', fontSize: 12 },
  itemPrice: { color: SV.primaryFixedDim, fontFamily: 'monospace', fontSize: 13 },
  removeBtn: { padding: 4 },

  summaryBox: {
    marginHorizontal: 20, backgroundColor: SV.surfaceContainerLow, borderWidth: 1, borderColor: SV.outlineVariant,
    borderRadius: 12, padding: 16, gap: 10,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryLabel: { color: SV.onSurfaceVariant, fontSize: 14, textTransform: 'uppercase', fontFamily: 'monospace', letterSpacing: 0.5 },
  summaryValue: { color: SV.onSurface, fontFamily: 'monospace', fontSize: 13 },
  summaryDivider: { height: 1, backgroundColor: SV.surfaceVariant },
  totalLabel: { color: SV.primaryFixedDim, fontSize: 17, fontWeight: '700', textTransform: 'uppercase' },
  totalValue: { color: SV.primaryContainer, fontSize: 22, fontWeight: '900', ...neonShadow },

  qrSection: {
    marginHorizontal: 20, marginTop: 20, borderWidth: 1, borderColor: SV.outlineVariant,
    borderRadius: 12, backgroundColor: SV.deepCharcoal, padding: 20, alignItems: 'center',
  },
  qrLiveRow: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-end', marginBottom: 12 },
  qrLiveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: SV.primaryContainer, ...neonShadow },
  qrLiveText: { color: SV.primaryContainer, fontFamily: 'monospace', fontSize: 11, letterSpacing: 1 },
  qrTitle: { color: SV.onSurface, fontSize: 16, fontWeight: '700', textTransform: 'uppercase', alignSelf: 'flex-start', borderBottomWidth: 1, borderBottomColor: SV.outlineVariant, paddingBottom: 10, marginBottom: 14, width: '100%' },
  qrDesc: { color: SV.onSurfaceVariant, fontSize: 14, lineHeight: 20, textAlign: 'center', marginBottom: 20, maxWidth: 260 },
  qrBox: {
    width: 180, height: 180, backgroundColor: SV.surfaceVariant, borderRadius: 8,
    borderWidth: 1, borderColor: SV.white10, alignItems: 'center', justifyContent: 'center', marginBottom: 14,
  },
  orderIdBadge: { borderWidth: 1, borderColor: SV.outline, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 2 },
  orderIdText: { color: SV.onSurfaceVariant, fontFamily: 'monospace', fontSize: 13, letterSpacing: 2 },

  payArea: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: SV.deepCharcoal, borderTopWidth: 1, borderTopColor: SV.white10, padding: 16,
  },
  payBtn: {
    backgroundColor: SV.primaryContainer, borderRadius: 8, paddingVertical: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, ...neonShadow,
  },
  payBtnText: { color: SV.onPrimaryFixed, fontWeight: '800', fontSize: 14, letterSpacing: 1, textTransform: 'uppercase' },
  doneBtn: {
    borderWidth: 1, borderColor: SV.primaryContainer, borderRadius: 8, paddingVertical: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  doneBtnText: { color: SV.primaryContainer, fontWeight: '800', fontSize: 14, letterSpacing: 1, textTransform: 'uppercase' },
});
