import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState, useRef, useEffect } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { SV, neonShadow } from '@/constants/theme';
import { ScreenHeader } from '@/components/screen-header';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '../utils/supabase';

// ─── Constants ────────────────────────────────────────────────────────────────

type TicketType = 'BASE' | 'VIP' | 'PLUTO';
type Duration = '1-DAY' | '3-DAY';

interface TicketOption {
  type: TicketType;
  duration: Duration;
  price: number;
  perks: string[];
  color: string;
  glow: string;
}

const TICKET_OPTIONS: TicketOption[] = [
  {
    type: 'BASE',
    duration: '1-DAY',
    price: 19900,
    perks: ['Standard Entry', 'All Stages', 'Cashless Payment'],
    color: SV.primaryContainer,
    glow: SV.neonGlow,
  },
  {
    type: 'BASE',
    duration: '3-DAY',
    price: 49900,
    perks: ['Full Weekend', 'Standard Entry', 'All Stages'],
    color: SV.primaryContainer,
    glow: SV.neonGlow,
  },
  {
    type: 'VIP',
    duration: '1-DAY',
    price: 39900,
    perks: ['Fast Track', 'VIP Lounges', 'Private Bars', 'Premium View'],
    color: SV.secondaryContainer,
    glow: SV.purpleGlow,
  },
  {
    type: 'VIP',
    duration: '3-DAY',
    price: 99900,
    perks: ['3-Day Fast Track', 'Exclusive Gift', 'All VIP Areas', 'Backstage Access*'],
    color: SV.secondaryContainer,
    glow: SV.purpleGlow,
  },
  {
    type: 'PLUTO',
    duration: '1-DAY',
    price: 59900,
    perks: ['All VIP Perks', 'Artist Meet*', 'Open Bar (Select)', 'Pluto Lounge'],
    color: SV.tertiaryContainer,
    glow: SV.cyanGlow,
  },
  {
    type: 'PLUTO',
    duration: '3-DAY',
    price: 149900,
    perks: ['Ultimate Access', 'Helicopter Transfer*', 'Private Host', 'All In'],
    color: SV.tertiaryContainer,
    glow: SV.cyanGlow,
  },
];

// ─── Purchase Success Overlay ────────────────────────────────────────────────

function SuccessOverlay({ ticket, onClose }: { ticket: TicketOption; onClose: () => void }) {
  const scale = useRef(new Animated.Value(0.6)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, damping: 14, stiffness: 200 }),
      Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[styles.overlay, { opacity }]}>
      <Animated.View style={[styles.successCard, { transform: [{ scale }] }]}>
        <View style={[styles.checkCircle, { borderColor: ticket.color }]}>
          <MaterialIcons name="confirmation-number" size={36} color={ticket.color} />
        </View>
        <Text style={[styles.successTitle, { color: ticket.color }]}>ACCESS GRANTED</Text>
        <Text style={styles.successTicketName}>{ticket.type} {ticket.duration} PASS</Text>
        
        <View style={styles.divider} />
        
        <View style={styles.ticketStub}>
          <Text style={styles.stubLabel}>TICKET ID</Text>
          <Text style={styles.stubValue}>SV26-{Math.random().toString(36).toUpperCase().slice(-8)}</Text>
        </View>

        <TouchableOpacity 
          style={[styles.doneBtn, { backgroundColor: ticket.color }]} 
          onPress={onClose}
        >
          <Text style={styles.doneBtnTxt}>VIEW IN PROFILE</Text>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function TicketShopScreen() {
  const { lang } = useLanguage();
  const { session, profile, refreshProfile } = useAuth();
  const [selectedType, setSelectedType] = useState<TicketType>('BASE');
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [purchasedTicket, setPurchasedTicket] = useState<TicketOption | null>(null);

  const t = (en: string, hu: string) => lang === 'hu' ? hu : en;

  const currentOptions = TICKET_OPTIONS.filter(o => o.type === selectedType);
  const balance = profile?.balance ?? 0;

  const handlePurchase = async (option: TicketOption) => {
    if (!session) {
      router.push('/auth');
      return;
    }

    if (balance < option.price) {
      Alert.alert(
        t('INSUFFICIENT BALANCE', 'KEVÉS EGYENLEG'),
        t('Please top up your wallet to purchase this ticket.', 'Kérjük, töltsd fel az egyenleged a vásárláshoz.'),
        [
          { text: t('TOP UP', 'FELTÖLTÉS'), onPress: () => router.push('/wallet') },
          { text: t('CANCEL', 'MÉGSE'), style: 'cancel' }
        ]
      );
      return;
    }

    setIsPurchasing(true);

    try {
      const newBalance = balance - option.price;
      const { error: updateErr } = await supabase
        .from('profiles')
        .update({ balance: newBalance })
        .eq('id', session.user.id);

      if (updateErr) throw updateErr;

      await supabase.from('transactions').insert([{
        user_id: session.user.id,
        amount: option.price,
        type: 'debit',
        label: `Ticket: ${option.type} ${option.duration}`,
      }]);

      await refreshProfile();
      setPurchasedTicket(option);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setIsPurchasing(false);
    }
  };

  return (
    <View style={styles.root}>
      <ScreenHeader showBack />

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{t('TICKET SHOP', 'JEGYVÁSÁRLÁS')}</Text>
          <Text style={styles.subtitle}>{t('SECURE YOUR ENTRY TO THE PULSE', 'BIZTOSÍTSD HELYED A PULZUSBAN')}</Text>
        </View>

        {/* Type Selector */}
        <View style={styles.typeSelector}>
          {(['BASE', 'VIP', 'PLUTO'] as TicketType[]).map(type => (
            <TouchableOpacity
              key={type}
              style={[
                styles.typeBtn,
                selectedType === type && styles.typeBtnActive,
                selectedType === type && { borderColor: TICKET_OPTIONS.find(o => o.type === type)?.color }
              ]}
              onPress={() => setSelectedType(type)}
            >
              <Text style={[
                styles.typeBtnText,
                selectedType === type && { color: TICKET_OPTIONS.find(o => o.type === type)?.color }
              ]}>{type}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Balance Row */}
        <View style={styles.balanceRow}>
          <Text style={styles.balanceLabel}>{t('YOUR BALANCE:', 'EGYENLEGED:')}</Text>
          <Text style={styles.balanceValue}>{balance.toLocaleString()} HUF</Text>
        </View>

        {/* Ticket Cards */}
        <View style={styles.cardsContainer}>
          {currentOptions.map((option, idx) => (
            <View key={idx} style={[styles.ticketCard, { borderColor: option.color }]}>
              <View style={[styles.cardHeader, { backgroundColor: option.color + '20' }]}>
                <View>
                  <Text style={[styles.cardType, { color: option.color }]}>{option.type}</Text>
                  <Text style={styles.cardDuration}>{option.duration} PASS</Text>
                </View>
                <Text style={styles.cardPrice}>{option.price.toLocaleString()} HUF</Text>
              </View>

              <View style={styles.perksList}>
                {option.perks.map((perk, i) => (
                  <View key={i} style={styles.perkItem}>
                    <MaterialIcons name="check" size={16} color={option.color} />
                    <Text style={styles.perkText}>{perk}</Text>
                  </View>
                ))}
              </View>

              <TouchableOpacity
                style={[styles.buyBtn, { backgroundColor: option.color }]}
                onPress={() => handlePurchase(option)}
                disabled={isPurchasing}
              >
                {isPurchasing ? (
                  <ActivityIndicator color={SV.deepCharcoal} />
                ) : (
                  <>
                    <Text style={styles.buyBtnText}>{t('BUY NOW', 'VÁSÁRLÁS')}</Text>
                    <MaterialIcons name="arrow-forward" size={18} color={SV.deepCharcoal} />
                  </>
                )}
              </TouchableOpacity>
            </View>
          ))}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {purchasedTicket && (
        <SuccessOverlay 
          ticket={purchasedTicket} 
          onClose={() => {
            setPurchasedTicket(null);
            router.push('/profile');
          }} 
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: SV.background },
  scroll: { flex: 1 },
  header: { padding: 20, paddingTop: 10 },
  title: { color: SV.onSurface, fontSize: 28, fontWeight: '900', textTransform: 'uppercase' },
  subtitle: { color: SV.onSurfaceVariant, fontSize: 13, marginTop: 4, letterSpacing: 0.5 },

  typeSelector: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: SV.outlineVariant,
    backgroundColor: SV.deepCharcoal,
  },
  typeBtnActive: {
    backgroundColor: SV.surfaceContainerHigh,
  },
  typeBtnText: {
    color: SV.onSurfaceVariant,
    fontWeight: '800',
    fontFamily: 'monospace',
    fontSize: 13,
  },

  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: SV.surfaceContainerLow,
    marginHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: SV.white5,
    marginBottom: 20,
  },
  balanceLabel: { color: SV.onSurfaceVariant, fontSize: 12, fontWeight: '600' },
  balanceValue: { color: SV.primaryContainer, fontWeight: '800', fontFamily: 'monospace' },

  cardsContainer: { paddingHorizontal: 20, gap: 20 },
  ticketCard: {
    backgroundColor: SV.deepCharcoal,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    ...neonShadow,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: SV.white5,
  },
  cardType: { fontSize: 24, fontWeight: '900', letterSpacing: 1 },
  cardDuration: { color: SV.onSurface, fontSize: 12, fontWeight: '700', marginTop: 2 },
  cardPrice: { color: SV.onSurface, fontSize: 18, fontWeight: '800', fontFamily: 'monospace' },

  perksList: { padding: 20, gap: 10 },
  perkItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  perkText: { color: SV.onSurfaceVariant, fontSize: 14 },

  buyBtn: {
    margin: 20,
    marginTop: 0,
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buyBtnText: { color: SV.deepCharcoal, fontWeight: '900', fontSize: 15, letterSpacing: 1 },

  // Overlay
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    paddingHorizontal: 20,
  },
  successCard: {
    backgroundColor: SV.deepCharcoal,
    borderRadius: 24,
    padding: 30,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: SV.white10,
  },
  checkCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  successTitle: { fontSize: 20, fontWeight: '900', letterSpacing: 2, marginBottom: 10 },
  successTicketName: { color: SV.onSurface, fontSize: 16, fontWeight: '700' },
  divider: { height: 1, backgroundColor: SV.white5, width: '100%', marginVertical: 20 },
  ticketStub: { alignItems: 'center', gap: 4, marginBottom: 30 },
  stubLabel: { color: SV.onSurfaceVariant, fontSize: 10, letterSpacing: 2, fontWeight: '700' },
  stubValue: { color: SV.onSurface, fontFamily: 'monospace', fontSize: 16, fontWeight: '700' },
  doneBtn: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  doneBtnTxt: { color: SV.deepCharcoal, fontWeight: '900', letterSpacing: 1 },
});
