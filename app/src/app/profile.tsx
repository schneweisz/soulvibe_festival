import { MaterialIcons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { SV, neonShadow } from '../constants/theme';
import { CartFAB, ScreenHeader } from '../components/screen-header';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../utils/supabase';
import { ThemedView } from '../components/themed-view';
import { useDatabase } from '../context/DatabaseContext';
import { getRank } from '../utils/rank';

export default function ProfileScreen() {
  const { lang, setLang } = useLanguage();
  const { session, loading: authLoading, signOut } = useAuth();
  const {
    profile,
    tickets,
    transactions,
    favourites,
    friends,
    loading: dbLoading,
    refreshAll,
    refreshFriends,
    updateUsername,
  } = useDatabase();

  const [friendInput, setFriendInput] = useState('');
  const [addingFriend, setAddingFriend] = useState(false);
  const [friendError, setFriendError] = useState<string | null>(null);
  const [editingUsername, setEditingUsername] = useState(false);
  const [usernameInput, setUsernameInput] = useState('');
  const [savingUsername, setSavingUsername] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const rank = getRank(profile?.points || 0);
  const progressPercent = rank.next ? ((profile?.points || 0) / rank.next) * 100 : 100;

  useEffect(() => {
    if (profile) {
      setUsernameInput(profile.username ?? '');
    }
  }, [profile]);

  // Refresh all data when the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      refreshAll();
    }, [refreshAll])
  );

  async function handleSignOut() {
    try {
      await signOut();
      router.push('/auth');
    } catch (error: any) {
      Alert.alert('Error signing out', error.message);
    }
  }

  async function saveUsername() {
    const trimmed = usernameInput.trim();
    if (!trimmed) return;
    setSavingUsername(true);
    const ok = await updateUsername(trimmed);
    setSavingUsername(false);
    if (!ok) {
      Alert.alert('Error', 'Could not save username. Try again.');
    } else {
      setEditingUsername(false);
    }
  }

  function startEditing() {
    setEditingUsername(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  function cancelEditing() {
    setUsernameInput(profile?.username ?? '');
    setEditingUsername(false);
  }

  async function addFriend() {
    const name = friendInput.trim().toUpperCase();
    if (!name || !session) return;
    setAddingFriend(true);
    setFriendError(null);
    try {
      const { data: found, error: findErr } = await supabase
        .from('profiles')
        .select('id, username')
        .eq('username', name)
        .maybeSingle();

      if (findErr) {
        setFriendError(`${findErr.message} (${findErr.code})`);
        return;
      }
      if (!found) {
        setFriendError(lang === 'hu' ? 'Felhasználó nem található.' : 'User not found.');
        return;
      }
      if (found.id === session.user.id) {
        setFriendError(lang === 'hu' ? 'Önmagát nem adhatja hozzá.' : 'Cannot add yourself.');
        return;
      }
      if (friends.some(f => f.id === found.id)) {
        setFriendError(lang === 'hu' ? 'Már barát.' : 'Already a friend.');
        return;
      }

      const { error: rpcErr } = await supabase.rpc('add_friend_bidirectional', {
        friend_id:    found.id,
        requester_id: session.user.id,
      });

      if (rpcErr) {
        setFriendError(`${rpcErr.message} (${rpcErr.code})`);
      } else {
        await refreshFriends();
        setFriendInput('');
      }
    } catch (e: any) {
      setFriendError(e?.message ?? 'Unknown error');
    } finally {
      setAddingFriend(false);
    }
  }

  async function removeFriend(friendId: string) {
    if (!profile?.friends || !session) return;
    const newIds = profile.friends.filter(id => id !== friendId);
    const { error } = await supabase.from('profiles').update({ friends: newIds }).eq('id', session.user.id);
    if (!error) {
      await refreshFriends();
    }
  }

  const displayName = profile?.username ?? 'RAVER';

  if (authLoading || !session) {
    return (
      <ThemedView style={styles.center}>
        <ActivityIndicator size="large" color={SV.primaryContainer} />
        <Text style={styles.loadingText}>SCANNING BIOMETRICS...</Text>
      </ThemedView>
    );
  }

  return (
    <View style={styles.root}>
      <ScreenHeader showBack />

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Profile Hero */}
        <View style={styles.profileHero}>
          <View style={styles.heroGlass} />
          <Image
            source={{ uri: `https://api.dicebear.com/7.x/avataaars/svg?seed=${session?.user?.email ?? 'raver'}` }}
            style={styles.avatar}
          />
          {editingUsername ? (
            <View style={styles.usernameEditRow}>
              <TextInput
                ref={inputRef}
                style={styles.usernameInput}
                value={usernameInput}
                onChangeText={setUsernameInput}
                autoCapitalize="characters"
                maxLength={20}
                returnKeyType="done"
                onSubmitEditing={saveUsername}
                placeholderTextColor={SV.surfaceVariant}
              />
              <TouchableOpacity style={styles.usernameAction} onPress={saveUsername} disabled={savingUsername}>
                {savingUsername
                  ? <ActivityIndicator size="small" color={SV.primaryContainer} />
                  : <MaterialIcons name="check" size={20} color={SV.primaryContainer} />}
              </TouchableOpacity>
              <TouchableOpacity style={styles.usernameAction} onPress={cancelEditing}>
                <MaterialIcons name="close" size={20} color={SV.onSurfaceVariant} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.usernameRow} onPress={startEditing} activeOpacity={0.7}>
              <Text style={styles.username}>{displayName}</Text>
              <MaterialIcons name="edit" size={16} color={SV.onSurfaceVariant} style={{ marginLeft: 8 }} />
            </TouchableOpacity>
          )}
          <View style={styles.badgeRow}>
            <View style={styles.badgePrimary}>
              <Text style={styles.badgePrimaryText}>PULSE LEVEL: {rank.name}</Text>
            </View>
            <View style={styles.badgeSecondary}>
              <MaterialIcons name="check-circle" size={12} color={SV.secondaryFixedDim} />
              <Text style={styles.badgeSecondaryText}>VIBE CHECKED</Text>
            </View>
          </View>
        </View>

        {/* Language Selector */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.cardTitle}>
              {lang === 'hu' ? 'ALKALMAZAS NYELVE' : 'APP LANGUAGE'}
            </Text>
            <MaterialIcons name="translate" size={20} color={SV.onSurfaceVariant} />
          </View>
          <View style={styles.langRow}>
            <TouchableOpacity
              style={[styles.langBtn, lang === 'hu' && styles.langBtnActive]}
              onPress={() => setLang('hu')}
              activeOpacity={0.75}>
              <Image
                source={{ uri: 'https://flagcdn.com/w80/hu.png' }}
                style={styles.langBtnFlag}
              />
              <Text style={[styles.langBtnLabel, lang === 'hu' && styles.langBtnLabelActive]}>
                Magyar
              </Text>
              {lang === 'hu' && (
                <MaterialIcons name="check" size={16} color={SV.primaryContainer} />
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.langBtn, lang === 'en' && styles.langBtnActive]}
              onPress={() => setLang('en')}
              activeOpacity={0.75}>
              <Image
                source={{ uri: 'https://flagcdn.com/w80/gb.png' }}
                style={styles.langBtnFlag}
              />
              <Text style={[styles.langBtnLabel, lang === 'en' && styles.langBtnLabelActive]}>
                English
              </Text>
              {lang === 'en' && (
                <MaterialIcons name="check" size={16} color={SV.primaryContainer} />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Active Pass */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.cardTitle}>
              {lang === 'hu' ? 'AKTIV BERLET' : 'ACTIVE PASS'}
            </Text>
            <MaterialIcons name="confirmation-number" size={20} color={SV.primaryContainer} />
          </View>
          
          {tickets.length > 0 ? (
            tickets.map((ticket, idx) => {
              if (idx > 0) return null;
              const ticketName = ticket.name.toUpperCase();
              const themeColor = ticketName.includes('VIP') ? SV.secondaryContainer : ticketName.includes('PLUTO') ? SV.tertiaryContainer : SV.primaryContainer;
              const themeFixed = ticketName.includes('VIP') ? SV.secondaryFixedDim : ticketName.includes('PLUTO') ? SV.tertiaryFixedDim : SV.primaryFixedDim;
              
              return (
                <View key={ticket.id} style={[styles.ticketBox, { borderColor: themeColor }]}>
                  <View style={styles.ticketGlow} />
                  <View style={styles.ticketHeader}>
                    <View>
                      <Text style={[styles.ticketName, { color: themeFixed }]}>
                        {ticketName}
                      </Text>
                      <Text style={styles.ticketId}>ID: {ticket.ticket_id}</Text>
                    </View>
                    <View style={styles.liveBadge}>
                      <View style={styles.liveDot} />
                      <Text style={styles.liveText}>{ticket.is_used ? 'USED' : 'VALID'}</Text>
                    </View>
                  </View>
                  <View style={styles.ticketActions}>
                    <TouchableOpacity style={[styles.showQrBtn, { backgroundColor: themeColor }]}>
                      <Text style={styles.showQrText}>
                        {lang === 'hu' ? 'QR MEGMUTATASA' : 'SHOW QR'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          ) : (
            <View style={styles.ticketBox}>
              <View style={styles.ticketGlow} />
              <View style={styles.ticketHeader}>
                <View>
                  <Text style={styles.ticketName}>
                    {lang === 'hu' ? 'NINCS AKTÍV JEGY' : 'NO ACTIVE TICKET'}
                  </Text>
                </View>
              </View>
              <View style={styles.ticketActions}>
                <TouchableOpacity style={styles.showQrBtn} onPress={() => router.push('/ticket_shop')}>
                  <Text style={styles.showQrText}>
                    {lang === 'hu' ? 'VÁSÁRLÁS' : 'BUY TICKET'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Pulse Points */}
        <View style={styles.card}>
          <Text style={styles.pulseLabel}>
            {lang === 'hu' ? 'Pulse Pontok' : 'Pulse Points'}
          </Text>
          <View style={styles.pulseRow}>
            <Text style={styles.pulseValue}>{profile?.points?.toLocaleString() || '0'}</Text>
            <Text style={styles.pulsePts}>PTS</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
          </View>
          <View style={styles.progressLabels}>
            <Text style={styles.progressLabel}>
              {lang === 'hu' ? `${rank.level}. Szint: ${rank.name}` : `Lvl ${rank.level}: ${rank.name}`}
            </Text>
            {rank.next ? (
              <Text style={styles.progressLabel}>
                {lang === 'hu' ? `${rank.next - (profile?.points || 0)} a ${rank.level + 1}. szintig` : `${rank.next - (profile?.points || 0)} to Lvl ${rank.level + 1}`}
              </Text>
            ) : (
              <Text style={styles.progressLabel}>
                {lang === 'hu' ? 'MAX SZINT ELÉRVE' : 'MAX LEVEL REACHED'}
              </Text>
            )}
          </View>
        </View>

        {/* Wallet */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.cardTitle}>
              {lang === 'hu' ? 'KARSZALAG EGYENLEG' : 'WALLET BALANCE'}
            </Text>
            <MaterialIcons name="account-balance-wallet" size={20} color={SV.primaryContainer} />
          </View>
          <View style={styles.walletRow}>
            <View style={styles.walletAmountRow}>
              <Text style={styles.walletAmount}>{profile?.balance?.toLocaleString() || '0'}</Text>
              <Text style={styles.walletCurrency}>HUF</Text>
            </View>
            <TouchableOpacity style={styles.topUpBtn} onPress={() => router.push('/wallet')}>
              <Text style={styles.topUpText}>
                {lang === 'hu' ? 'FELTOLTES' : 'TOP UP'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Transactions */}
        {transactions.length > 0 && (
          <View style={styles.card}>
            <View style={styles.cardTitleRow}>
              <Text style={styles.cardTitle}>
                {lang === 'hu' ? 'LEGUTÓBBI TRANZAKCIÓK' : 'RECENT TRANSACTIONS'}
              </Text>
              <MaterialIcons name="receipt-long" size={20} color={SV.onSurfaceVariant} />
            </View>
            {transactions.slice(0, 5).map((tx, i) => {
              const d = new Date(tx.created_at);
              const timeStr = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
              const isToday = new Date().toDateString() === d.toDateString();
              const dateStr = isToday ? lang === 'hu' ? 'MA' : 'TODAY' : d.toLocaleDateString(lang === 'hu' ? 'hu-HU' : 'en-GB', { day: 'numeric', month: 'short' });
              return (
                <View key={tx.id} style={[styles.txRow, i === 4 && { borderBottomWidth: 0 }]}>
                  <View style={[styles.txDot, { backgroundColor: tx.type === 'credit' ? SV.primaryContainer : SV.secondaryContainer }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.txLabel}>{tx.label}</Text>
                    <Text style={styles.txTime}>{timeStr} · {dateStr}</Text>
                  </View>
                  <Text style={[styles.txAmount, tx.type === 'credit' ? styles.txCredit : styles.txDebit]}>
                    {tx.type === 'credit' ? '+' : '-'}{tx.amount.toLocaleString()} Ft
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        {/* My Lineup — shows favourited artists */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.cardTitle}>
              {lang === 'hu' ? 'SAJÁT PROGRAMOM' : 'MY LINEUP'}
            </Text>
            <MaterialIcons name="favorite" size={20} color="#FF6B9D" />
          </View>
          {favourites.length === 0 ? (
            <Text style={{ color: SV.onSurfaceVariant, fontFamily: 'monospace', fontSize: 12, marginBottom: 12 }}>
              {lang === 'hu' ? 'Még nincs kedvenc előadód. Nyomj a ♡ ikonra a programban.' : 'No favourites yet. Tap ♡ next to any artist in Lineup.'}
            </Text>
          ) : (
            favourites.slice(0, 3).map(f => (
              <View key={f.artist_name} style={styles.favRow}>
                <MaterialIcons name="favorite" size={14} color="#FF6B9D" />
                <Text style={styles.favArtist}>{f.artist_name}</Text>
              </View>
            ))
          )}
          <TouchableOpacity
            style={styles.viewFavsBtn}
            onPress={() => router.push('/lineup?filter=favourites' as any)}
            activeOpacity={0.8}>
            <MaterialIcons name="favorite" size={15} color="#FF6B9D" />
            <Text style={styles.viewFavsBtnText}>
              {lang === 'hu' ? 'ÖSSZES KEDVENC' : 'VIEW FAVOURITES'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Friends */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.cardTitle}>{lang === 'hu' ? 'BARÁTOK' : 'FRIENDS'}</Text>
            <MaterialIcons name="people" size={20} color={SV.tertiaryContainer} />
          </View>

          <View style={styles.friendInputRow}>
            <TextInput
              style={styles.friendInput}
              placeholder={lang === 'hu' ? 'Felhasználónév...' : 'Username...'}
              placeholderTextColor={SV.surfaceVariant}
              value={friendInput}
              onChangeText={t => { setFriendInput(t); setFriendError(null); }}
              autoCapitalize="characters"
              maxLength={20}
              returnKeyType="done"
              onSubmitEditing={addFriend}
            />
            <TouchableOpacity style={styles.friendAddBtn} onPress={addFriend} disabled={addingFriend}>
              {addingFriend
                ? <ActivityIndicator size="small" color={SV.tertiaryContainer} />
                : <MaterialIcons name="person-add" size={20} color={SV.tertiaryContainer} />}
            </TouchableOpacity>
          </View>
          {friendError ? (
            <Text style={styles.friendError}>{friendError}</Text>
          ) : null}

          {friends.length === 0 ? (
            <Text style={styles.friendEmpty}>
              {lang === 'hu'
                ? 'Még nincs barátod. Keress felhasználónév alapján.'
                : 'No friends yet. Search by username above.'}
            </Text>
          ) : (
            friends.map(f => (
              <View key={f.id} style={styles.friendRow}>
                <MaterialIcons name="location-on" size={14} color={SV.tertiaryContainer} />
                <Text style={styles.friendName}>{f.username ?? f.id.slice(0, 8)}</Text>
                <TouchableOpacity onPress={() => removeFriend(f.id)} hitSlop={10} style={{ marginLeft: 'auto' }}>
                  <MaterialIcons name="person-remove" size={18} color={SV.error} />
                </TouchableOpacity>
              </View>
            ))
          )}

          <TouchableOpacity
            style={styles.viewMapBtn}
            onPress={() => router.push('/map')}
            activeOpacity={0.8}>
            <MaterialIcons name="map" size={15} color={SV.tertiaryContainer} />
            <Text style={styles.viewMapBtnText}>
              {lang === 'hu' ? 'BARÁTOK A TÉRKÉPEN' : 'VIEW FRIENDS ON MAP'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Settings / Logout */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.cardTitle}>SYSTEM</Text>
            <MaterialIcons name="settings" size={20} color={SV.outline} />
          </View>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleSignOut}>
            <MaterialIcons name="logout" size={20} color={SV.error} />
            <Text style={styles.logoutText}>DISCONNECT FROM GRID</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <CartFAB />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: SV.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: SV.background },
  loadingText: { color: SV.primaryContainer, fontFamily: 'monospace', marginTop: 20, letterSpacing: 2 },
  scroll: { flex: 1 },
  profileHero: {
    alignItems: 'center', paddingVertical: 32, marginHorizontal: 16, marginTop: 20,
    backgroundColor: SV.deepCharcoal, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 16, overflow: 'hidden',
  },
  heroGlass: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(57,255,20,0.03)' },
  avatar: { width: 100, height: 100, borderRadius: 50, borderWidth: 2, borderColor: SV.primaryContainer, marginBottom: 12, ...neonShadow },
  username: { color: SV.primaryFixedDim, fontSize: 22, fontWeight: '900', letterSpacing: -0.5, textTransform: 'uppercase' },
  usernameRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  usernameEditRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10,
    backgroundColor: SV.surfaceContainerHigh, borderRadius: 10, borderWidth: 1,
    borderColor: SV.primaryContainer, paddingHorizontal: 12, paddingVertical: 6,
  },
  usernameInput: {
    color: SV.primaryFixedDim, fontSize: 18, fontWeight: '800', letterSpacing: 0.5,
    textTransform: 'uppercase', flex: 1, minWidth: 80,
  },
  usernameAction: { padding: 4 },
  badgeRow: { flexDirection: 'row', gap: 8 },
  badgePrimary: { backgroundColor: SV.surfaceContainerHigh, borderWidth: 1, borderColor: 'rgba(57,255,20,0.3)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgePrimaryText: { color: SV.primaryContainer, fontFamily: 'monospace', fontSize: 11, letterSpacing: 0.5 },
  badgeSecondary: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: SV.surfaceContainerHigh, borderWidth: 1, borderColor: 'rgba(236,177,255,0.3)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeSecondaryText: { color: SV.secondaryFixedDim, fontFamily: 'monospace', fontSize: 11 },
  card: {
    marginHorizontal: 16, marginTop: 14,
    backgroundColor: SV.deepCharcoal, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14, padding: 16, overflow: 'hidden',
  },
  cardTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, borderBottomWidth: 1, borderBottomColor: SV.surfaceVariant, paddingBottom: 8 },
  cardTitle: { color: SV.onSurface, fontWeight: '700', fontSize: 14, letterSpacing: 1.5, textTransform: 'uppercase' },
  langRow: { flexDirection: 'row', gap: 10 },
  langBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: SV.surfaceContainerHigh, borderWidth: 1, borderColor: SV.outlineVariant,
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10,
  },
  langBtnActive: { borderColor: SV.primaryContainer, backgroundColor: SV.surfaceContainerHighest },
  langBtnFlag: { width: 24, height: 18, marginRight: 8, borderRadius: 2 },
  langBtnLabel: { flex: 1, color: SV.onSurfaceVariant, fontSize: 13 },
  langBtnLabelActive: { color: SV.onSurface, fontWeight: '700' },
  ticketBox: {
    backgroundColor: SV.surfaceContainerHighest, borderRadius: 10, padding: 14,
    borderWidth: 1, borderColor: SV.primaryContainer, overflow: 'hidden', ...neonShadow,
  },
  ticketGlow: { position: 'absolute', right: -20, top: -20, width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(57,255,20,0.08)' },
  ticketHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  ticketName: { color: SV.primaryFixedDim, fontSize: 17, fontWeight: '800', letterSpacing: -0.5, marginBottom: 4 },
  ticketId: { color: SV.onSurfaceVariant, fontFamily: 'monospace', fontSize: 11 },
  liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(57,255,20,0.15)', borderWidth: 1, borderColor: 'rgba(57,255,20,0.5)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: SV.primaryContainer },
  liveText: { color: SV.primaryContainer, fontFamily: 'monospace', fontSize: 10, letterSpacing: 1 },
  ticketActions: { flexDirection: 'row', gap: 8 },
  showQrBtn: { flex: 1, backgroundColor: SV.primaryContainer, paddingVertical: 8, borderRadius: 2, alignItems: 'center' },
  showQrText: { color: SV.deepCharcoal, fontWeight: '800', fontSize: 13, letterSpacing: 1 },
  pulseLabel: { color: SV.onSurfaceVariant, fontFamily: 'monospace', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', textAlign: 'center', marginBottom: 4 },
  pulseRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6, justifyContent: 'center', marginBottom: 10 },
  pulseValue: { color: SV.primaryContainer, fontSize: 40, fontWeight: '900', textShadowColor: 'rgba(57,255,20,0.6)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 8 },
  pulsePts: { color: SV.primaryFixedDim, fontFamily: 'monospace', fontSize: 14, fontWeight: '700' },
  progressBar: { height: 8, backgroundColor: SV.surfaceVariant, borderRadius: 4, overflow: 'hidden', marginBottom: 6 },
  progressFill: { height: '100%', backgroundColor: SV.primaryContainer, ...neonShadow },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  progressLabel: { color: SV.onSurfaceVariant, fontFamily: 'monospace', fontSize: 10, letterSpacing: 0.5 },
  walletRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 },
  walletAmountRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  walletAmount: { color: SV.primaryContainer, fontSize: 36, fontWeight: '900', textShadowColor: 'rgba(57,255,20,0.6)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 8 },
  walletCurrency: { color: SV.primaryFixedDim, fontFamily: 'monospace', fontSize: 14, fontWeight: '700' },
  topUpBtn: { backgroundColor: 'rgba(57,255,20,0.15)', borderWidth: 1, borderColor: SV.primaryContainer, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  topUpText: { color: SV.primaryContainer, fontFamily: 'monospace', fontSize: 12, letterSpacing: 1 },
  favRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  favArtist: { color: SV.onSurface, fontSize: 14, fontWeight: '600', flex: 1 },
  viewFavsBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 12, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,107,157,0.35)', backgroundColor: 'rgba(255,107,157,0.08)' },
  viewFavsBtnText: { color: '#FF6B9D', fontFamily: 'monospace', fontSize: 12, fontWeight: '700', letterSpacing: 1 },
  friendInputRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  friendInput: { flex: 1, backgroundColor: SV.surfaceContainerHigh, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 12, paddingVertical: 9, color: SV.onSurface, fontFamily: 'monospace', fontSize: 13 },
  friendAddBtn: { width: 40, height: 40, backgroundColor: SV.surfaceContainerHigh, borderRadius: 8, borderWidth: 1, borderColor: `${SV.tertiaryContainer}40`, alignItems: 'center', justifyContent: 'center' },
  friendError: { color: '#FF6B6B', fontFamily: 'monospace', fontSize: 11, marginBottom: 8 },
  friendEmpty: { color: SV.onSurfaceVariant, fontFamily: 'monospace', fontSize: 12, marginTop: 4, marginBottom: 8 },
  friendRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  friendName: { color: SV.onSurface, fontSize: 14, fontWeight: '600', flex: 1 },
  viewMapBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 12, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: `${SV.tertiaryContainer}40`, backgroundColor: `${SV.tertiaryContainer}10` },
  viewMapBtnText: { color: SV.tertiaryContainer, fontFamily: 'monospace', fontSize: 12, fontWeight: '700', letterSpacing: 1 },
  txRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  txDot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  txLabel: { color: SV.onSurface, fontSize: 14, fontWeight: '600' },
  txTime: { color: SV.onSurfaceVariant, fontFamily: 'monospace', fontSize: 10, marginTop: 2 },
  txAmount: { fontFamily: 'monospace', fontSize: 13, fontWeight: '700' },
  txCredit: { color: SV.primaryContainer },
  txDebit: { color: SV.secondaryContainer },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  logoutText: { color: SV.error, fontFamily: 'monospace', fontSize: 13, fontWeight: '700', letterSpacing: 1 },
  authBtn: {
    backgroundColor: 'rgba(57,255,20,0.1)',
    borderWidth: 1,
    borderColor: SV.primaryContainer,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 4,
    ...neonShadow,
  },
  authBtnText: {
    color: SV.primaryContainer,
    fontFamily: 'monospace',
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 2,
  },
});
