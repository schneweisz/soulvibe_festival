import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import React, { useEffect, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SV, neonShadow } from '../constants/theme';
import { ScreenHeader } from '../components/screen-header';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../utils/supabase';

const SERVICE_FEE = 200;

export default function CartScreen() {
  const { items, removeFromCart, clearCart } = useCart();
  const { session } = useAuth();
  const [paid, setPaid] = useState(false);
  const [balance, setBalance] = useState<number | null>(null);
  const [processing, setProcessing] = useState(false);

  const subtotal = items.reduce((acc, i) => acc + i.price * i.qty, 0);
  const total = items.length > 0 ? subtotal + SERVICE_FEE : 0;

  const userId = session?.user?.id;

  // Fetch user balance
  useEffect(() => {
    (async () => {
      if (userId) {
        const { data } = await supabase
          .from('profiles')
          .select('balance')
          .eq('id', userId)
          .single();
        if (data) setBalance(data.balance);
      }
    })();
  }, [userId]);

  const handlePayment = async () => {
    if (!userId || balance === null) return;
    if (balance < total) {
      Alert.alert('INSUFFICIENT FUNDS', 'Please top up your wallet to complete this order.');
      return;
    }

    setProcessing(true);
    const newBalance = balance - total;

    // Deduct balance
    const { error: profileErr } = await supabase
      .from('profiles')
      .update({ balance: newBalance })
      .eq('id', userId);

    if (profileErr) {
      Alert.alert('Payment Error', profileErr.message);
      setProcessing(false);
      return;
    }

    // Insert transaction
    await supabase
      .from('transactions')
      .insert([{
        user_id: userId,
        amount: -total,
        type: 'debit',
        label: 'Gastro App Order'
      }]);
      
    // Log Pulse Points for purchasing
    await supabase
      .from('pulse_logs')
      .insert([{
        user_id: userId,
        points_change: 15,
        reason: 'Gastro Purchase'
      }]);
      
    // 1. Fetch current points and update
    const { data: profileData } = await supabase
      .from('profiles')
      .select('points')
      .eq('id', userId)
      .single();
    
    const currentPoints = profileData?.points ?? 0;
    const newPoints = currentPoints + 15; // Award 15 points for ordering

    await supabase
      .from('profiles')
      .update({ points: newPoints })
      .eq('id', userId);

    setBalance(newBalance);
    setPaid(true);
    setProcessing(false);
  };

  return (
    <View style={styles.root}>
      <ScreenHeader showBack />

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Cart Items */}
        <View style={styles.itemsSection}>
          {items.length === 0 && !paid ? (
            <Text style={{ color: SV.outline, textAlign: 'center', marginTop: 40, fontFamily: 'monospace' }}>
              CART IS EMPTY
            </Text>
          ) : (
            items.map(item => (
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
                {!paid && (
                  <TouchableOpacity onPress={() => removeFromCart(item.id)} hitSlop={8} style={styles.removeBtn}>
                    <MaterialIcons name="close" size={20} color={SV.outline} />
                  </TouchableOpacity>
                )}
              </View>
            ))
          )}
        </View>

        {/* Summary */}
        {items.length > 0 && (
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
            {balance !== null && !paid && (
              <>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>WALLET BALANCE</Text>
                  <Text style={[styles.summaryValue, balance < total ? { color: '#FF6B6B' } : { color: SV.primaryContainer }]}>
                    {balance.toLocaleString()} HUF
                  </Text>
                </View>
              </>
            )}
          </View>
        )}

        {/* QR / Payment area (simulated post-payment state) */}
        {paid && (
          <View style={styles.qrSection}>
            <View style={styles.qrLiveRow}>
              <View style={styles.qrLiveDot} />
              <Text style={styles.qrLiveText}>LIVE STATUS</Text>
            </View>
            <Text style={styles.qrTitle}>PICKUP TICKET</Text>
            <Text style={styles.qrDesc}>Scan this code at the <Text style={{ color: SV.primaryFixedDim, fontWeight: '700' }}>Vendor</Text> stand.</Text>
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
      {items.length > 0 && !paid ? (
        <View style={styles.payArea}>
          <TouchableOpacity 
            style={[styles.payBtn, (balance === null || balance < total) && styles.payBtnDisabled]} 
            onPress={handlePayment}
            disabled={balance === null || balance < total || processing}>
            {processing ? (
              <ActivityIndicator color={SV.deepCharcoal} />
            ) : (
              <>
                <MaterialIcons name="qr-code" size={20} color={SV.deepCharcoal} />
                <Text style={styles.payBtnText}>
                  {balance !== null && balance < total ? 'INSUFFICIENT FUNDS' : 'FIZETÉS ÉS QR KÓD GENERÁLÁSA'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      ) : paid ? (
        <View style={styles.payArea}>
          <TouchableOpacity style={styles.doneBtn} onPress={() => { setPaid(false); clearCart(); router.replace('/gastro'); }}>
            <Text style={styles.doneBtnText}>BACK TO GASTRO</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: SV.deepCharcoal },
  scroll: { flex: 1 },
  itemsSection: { padding: 16, gap: 10 },
  cartItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: SV.deepCharcoal, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12, padding: 12,
  },
  itemImage: { width: 52, height: 52, borderRadius: 8, backgroundColor: SV.surfaceContainerHigh },
  itemName: { color: SV.onSurface, fontSize: 14, fontWeight: '700', marginBottom: 4 },
  itemMeta: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  qtyBadge: { backgroundColor: SV.surfaceContainerHigh, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  qtyText: { color: SV.onSurfaceVariant, fontFamily: 'monospace', fontSize: 12 },
  itemPrice: { color: SV.primaryFixedDim, fontFamily: 'monospace', fontSize: 13 },
  removeBtn: { padding: 6 },
  summaryBox: {
    marginHorizontal: 16, backgroundColor: SV.deepCharcoal, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14, padding: 16, gap: 12,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryLabel: { color: SV.onSurfaceVariant, fontSize: 12, textTransform: 'uppercase', fontFamily: 'monospace', letterSpacing: 1 },
  summaryValue: { color: SV.onSurface, fontFamily: 'monospace', fontSize: 13 },
  summaryDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.06)' },
  totalLabel: { color: SV.onSurface, fontSize: 14, fontWeight: '700', textTransform: 'uppercase', fontFamily: 'monospace', letterSpacing: 1 },
  totalValue: { color: SV.primaryContainer, fontSize: 22, fontWeight: '900', ...neonShadow },
  qrSection: {
    marginHorizontal: 16, marginTop: 20, borderWidth: 1, borderColor: 'rgba(57,255,20,0.25)',
    borderRadius: 14, backgroundColor: SV.deepCharcoal, padding: 20, alignItems: 'center',
  },
  qrLiveRow: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-end', marginBottom: 12 },
  qrLiveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: SV.primaryContainer, ...neonShadow },
  qrLiveText: { color: SV.primaryContainer, fontFamily: 'monospace', fontSize: 11, letterSpacing: 1 },
  qrTitle: { color: SV.onSurface, fontSize: 14, fontWeight: '700', textTransform: 'uppercase', fontFamily: 'monospace', letterSpacing: 1.5, alignSelf: 'flex-start', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)', paddingBottom: 10, marginBottom: 14, width: '100%' },
  qrDesc: { color: SV.onSurfaceVariant, fontSize: 14, lineHeight: 21, textAlign: 'center', marginBottom: 20, maxWidth: 260 },
  qrBox: {
    width: 180, height: 180, backgroundColor: SV.surfaceContainerHigh, borderRadius: 12,
    borderWidth: 1, borderColor: SV.primaryContainer, alignItems: 'center', justifyContent: 'center', marginBottom: 14, ...neonShadow,
  },
  orderIdBadge: { borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20 },
  orderIdText: { color: SV.onSurfaceVariant, fontFamily: 'monospace', fontSize: 12, letterSpacing: 2 },
  payArea: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: SV.deepCharcoal, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)', padding: 16,
  },
  payBtn: {
    backgroundColor: SV.primaryContainer, borderRadius: 10, paddingVertical: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, ...neonShadow,
  },
  payBtnDisabled: { backgroundColor: SV.surfaceVariant, shadowOpacity: 0 },
  payBtnText: { color: SV.deepCharcoal, fontWeight: '800', fontSize: 13, letterSpacing: 1.5, textTransform: 'uppercase' },
  doneBtn: {
    borderWidth: 1.5, borderColor: SV.primaryContainer, borderRadius: 10, paddingVertical: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  doneBtnText: { color: SV.primaryContainer, fontWeight: '800', fontSize: 13, letterSpacing: 1.5, textTransform: 'uppercase' },
});
