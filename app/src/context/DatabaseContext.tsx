import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../utils/supabase';
import { useAuth } from './AuthContext';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

export interface Profile {
  username: string | null;
  points: number;
  balance: number;
  friends: string[] | null;
  expo_push_token?: string | null;
}

export interface Ticket {
  id: string;
  ticket_id: string;
  type: string;
  name: string;
  description: string;
  is_used: boolean;
  created_at: string;
}

export interface Transaction {
  id: string;
  type: 'credit' | 'debit';
  label: string;
  amount: number;
  created_at: string;
}

export interface Favourite {
  artist_name: string;
}

export interface Friend {
  id: string;
  username: string | null;
}

export interface LockerReservation {
  id: string;
  hub_name: string;
  slot_number: number;
  pin_code: string;
  reserved_at: string;
}

export interface FriendRequest {
  id: string;
  sender_id: string;
  sender_username: string | null;
  receiver_id: string;
  receiver_username: string | null;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
}

type DatabaseContextType = {
  profile: Profile | null;
  tickets: Ticket[];
  transactions: Transaction[];
  favourites: Favourite[];
  friends: Friend[];
  pendingRequests: FriendRequest[];
  outgoingRequests: FriendRequest[];
  locker: LockerReservation | null;
  loading: boolean;
  refreshAll: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  refreshTickets: () => Promise<void>;
  refreshTransactions: () => Promise<void>;
  refreshFavourites: () => Promise<void>;
  refreshFriends: () => Promise<void>;
  refreshRequests: () => Promise<void>;
  refreshLocker: () => Promise<void>;
  updateUsername: (newUsername: string) => Promise<boolean>;
  sendFriendRequest: (username: string) => Promise<{ success: boolean; error?: string }>;
  acceptFriendRequest: (requestId: string) => Promise<{ success: boolean; error?: string }>;
  rejectFriendRequest: (requestId: string) => Promise<{ success: boolean; error?: string }>;
  cancelFriendRequest: (requestId: string) => Promise<{ success: boolean; error?: string }>;
  removeFriend: (friendId: string) => Promise<{ success: boolean; error?: string }>;
};

const DatabaseContext = createContext<DatabaseContextType | undefined>(undefined);

export const DatabaseProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, session } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [favourites, setFavourites] = useState<Favourite[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<FriendRequest[]>([]);
  const [locker, setLocker] = useState<LockerReservation | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('username, points, balance, friends, expo_push_token')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching profile:', error.message);
    } else if (data) {
      setProfile(data);
    }
    return data;
  }, []);

  const fetchTickets = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .eq('profile_id', userId)
      .order('created_at', { ascending: false });

    if (!error && data) setTickets(data);
  }, []);

  const fetchTransactions = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (!error && data) setTransactions(data);
  }, []);

  const fetchFavourites = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('favourites')
      .select('artist_name')
      .eq('user_id', userId);

    if (!error && data) setFavourites(data);
  }, []);

  const fetchFriends = useCallback(async (friendIds: string[]) => {
    if (!friendIds || friendIds.length === 0) {
      setFriends([]);
      return;
    }
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username')
      .in('id', friendIds);

    if (!error && data) setFriends(data);
  }, []);

  const fetchRequests = useCallback(async (userId: string) => {
    // Fetch INCOMING
    const { data: incoming, error: inErr } = await supabase
      .from('friend_requests')
      .select(`
        id, sender_id, receiver_id, status, created_at,
        profiles!friend_requests_sender_id_fkey(username)
      `)
      .eq('receiver_id', userId)
      .eq('status', 'pending');

    if (!inErr && incoming) {
      setPendingRequests(incoming.map((r: any) => ({
        id: r.id,
        sender_id: r.sender_id,
        sender_username: r.profiles?.username,
        receiver_id: r.receiver_id,
        receiver_username: null,
        status: r.status,
        created_at: r.created_at
      })));
    } else {
        setPendingRequests([]);
    }

    // Fetch OUTGOING
    const { data: outgoing, error: outErr } = await supabase
      .from('friend_requests')
      .select(`
        id, sender_id, receiver_id, status, created_at,
        profiles!friend_requests_receiver_id_fkey(username)
      `)
      .eq('sender_id', userId)
      .eq('status', 'pending');

    if (!outErr && outgoing) {
      setOutgoingRequests(outgoing.map((r: any) => ({
        id: r.id,
        sender_id: r.sender_id,
        sender_username: null,
        receiver_id: r.receiver_id,
        receiver_username: r.profiles?.username,
        status: r.status,
        created_at: r.created_at
      })));
    } else {
        setOutgoingRequests([]);
    }
  }, []);

  const fetchLocker = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from('lockers')
      .select('id, hub_name, slot_number, pin_code, reserved_at')
      .eq('user_id', userId)
      .eq('status', 'occupied')
      .maybeSingle();
    setLocker(data ?? null);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) await fetchProfile(user.id);
  }, [user, fetchProfile]);

  const refreshTickets = useCallback(async () => {
    if (user) await fetchTickets(user.id);
  }, [user, fetchTickets]);

  const refreshTransactions = useCallback(async () => {
    if (user) await fetchTransactions(user.id);
  }, [user, fetchTransactions]);

  const refreshFavourites = useCallback(async () => {
    if (user) await fetchFavourites(user.id);
  }, [user, fetchFavourites]);

  const refreshFriends = useCallback(async () => {
    const { data } = await supabase.from('profiles').select('friends').eq('id', user?.id).single();
    if (data?.friends) await fetchFriends(data.friends);
    else setFriends([]);
  }, [user, fetchFriends]);

  const refreshRequests = useCallback(async () => {
    if (user) await fetchRequests(user.id);
  }, [user, fetchRequests]);

  const refreshLocker = useCallback(async () => {
    if (user) await fetchLocker(user.id);
  }, [user, fetchLocker]);

  const refreshAll = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    await fetchProfile(user.id);
    await Promise.all([
        fetchTickets(user.id), 
        fetchTransactions(user.id), 
        fetchFavourites(user.id), 
        fetchRequests(user.id),
        fetchLocker(user.id)
    ]);
    const { data: current } = await supabase.from('profiles').select('friends').eq('id', user.id).single();
    if (current?.friends) await fetchFriends(current.friends);
    else setFriends([]);
    setLoading(false);
  }, [user, fetchProfile, fetchTickets, fetchTransactions, fetchFavourites, fetchFriends, fetchRequests, fetchLocker]);

  const registerForPushNotificationsAsync = async (userId: string) => {
    if (Platform.OS === 'web') return;
    if (!Device.isDevice) return;

    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#39FF14',
        });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') return;

    const projectId = 
      Constants.expoConfig?.extra?.eas?.projectId ?? 
      Constants.easConfig?.projectId ?? 
      '20aeddd4-0061-4461-8ad0-447d23988d8b';

    try {
        const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
        if (token) {
          await supabase.from('profiles').update({ expo_push_token: token }).eq('id', userId);
        }
    } catch (e) {
        console.error('Error getting push token:', e);
    }
  };

  const sendFriendRequest = async (targetUsername: string) => {
    if (!user) return { success: false, error: 'Not authenticated' };
    if (!profile) return { success: false, error: 'Profile not loaded' };
    const name = targetUsername.trim();
    
    try {
      const { data: target } = await supabase.from('profiles').select('id, username, expo_push_token').ilike('username', name).maybeSingle();
      if (!target) return { success: false, error: 'User not found' };
      if (target.id === user.id) return { success: false, error: 'Cannot add yourself' };
      if (profile.friends?.includes(target.id)) return { success: false, error: 'Already friends' };
      if (outgoingRequests.some(r => r.receiver_id === target.id)) return { success: false, error: 'Request already sent' };

      const { error: reqErr } = await supabase.from('friend_requests').insert({ sender_id: user.id, receiver_id: target.id, status: 'pending' });
      if (reqErr) return { success: false, error: `Request failed: ${reqErr.message}` };

      if (target.expo_push_token) {
        await fetch('https://exp.host/--/api/v2/push/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: target.expo_push_token,
            title: '🤘 Barátkérés / Friend Request!',
            body: `${profile.username} bejelölt a SoulVibe-on.`,
            data: { type: 'friend_request' },
            sound: 'default',
          }),
        }).catch(e => console.log('Push error:', e));
      }

      await refreshRequests();
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  };

  const acceptFriendRequest = async (requestId: string) => {
    if (!user) return { success: false, error: 'Not authenticated' };
    try {
      const { data: request } = await supabase.from('friend_requests').select('sender_id').eq('id', requestId).single();
      if (!request) return { success: false, error: 'Request not found' };

      const { error: rpcErr } = await supabase.rpc('add_friend_bidirectional', { friend_id: request.sender_id, requester_id: user.id });
      if (rpcErr) return { success: false, error: rpcErr.message };

      await supabase.from('friend_requests').delete().eq('id', requestId);
      await refreshAll();
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  };

  const rejectFriendRequest = async (requestId: string) => {
    const { error } = await supabase.from('friend_requests').delete().eq('id', requestId);
    if (error) return { success: false, error: error.message };
    await refreshRequests();
    return { success: true };
  };

  const cancelFriendRequest = async (requestId: string) => {
    const { error } = await supabase.from('friend_requests').delete().eq('id', requestId);
    if (error) return { success: false, error: error.message };
    await refreshRequests();
    return { success: true };
  };

  const removeFriend = async (friendId: string) => {
    if (!user) return { success: false, error: 'Not authenticated' };
    try {
      setLoading(true);
      const { error: rpcErr } = await supabase.rpc('remove_friend_bidirectional', { friend_id: friendId, user_id: user.id });
      if (rpcErr) throw rpcErr;
      await supabase.from('friend_requests').delete().or(`and(sender_id.eq.${user.id},receiver_id.eq.${friendId}),and(sender_id.eq.${friendId},receiver_id.eq.${user.id})`);
      await refreshAll();
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message };
    } finally {
      setLoading(false);
    }
  };

  const updateUsername = useCallback(async (newUsername: string): Promise<boolean> => {
    if (!user) return false;
    const { error } = await supabase.from('profiles').update({ username: newUsername }).eq('id', user.id);
    if (!error) setProfile(prev => prev ? { ...prev, username: newUsername } : null);
    return !error;
  }, [user]);

  // REALTIME SUBSCRIPTIONS
  useEffect(() => {
    if (!user) return;

    const profileSub = supabase
      .channel(`profile:${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` }, () => {
        refreshAll();
      })
      .subscribe();

    const requestSub = supabase
      .channel(`requests:${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'friend_requests' }, async (payload) => {
          const newRec = payload.new as any;
          const oldRec = payload.old as any;
          const isSender = newRec?.sender_id === user.id || oldRec?.sender_id === user.id;
          const isReceiver = newRec?.receiver_id === user.id || oldRec?.receiver_id === user.id;

          if (isSender || isReceiver) {
              refreshRequests();
              if (payload.eventType === 'INSERT' && newRec?.receiver_id === user.id) {
                if (Platform.OS !== 'web') {
                  // Small delay to ensure the OS doesn't drop the immediate notification
                  setTimeout(async () => {
                    await Notifications.scheduleNotificationAsync({
                      content: {
                        title: '🤘 Új barátkérés! / New Friend Request!',
                        body: 'Valaki bejelölt téged a SoulVibe-on. Nyisd meg a profilodat!',
                        data: { screen: 'profile' },
                        sound: 'default',
                      },
                      trigger: null,
                    });
                  }, 500);
                }
              }
              if (payload.eventType === 'DELETE' || newRec?.status === 'accepted') {
                  refreshAll();
              }
          }
      })
      .subscribe();

    return () => {
      profileSub.unsubscribe();
      requestSub.unsubscribe();
    };
  }, [user, refreshAll, refreshRequests]);

  useEffect(() => {
    if (session?.user) {
        refreshAll();
        registerForPushNotificationsAsync(session.user.id);
    } else {
      setProfile(null); setTickets([]); setTransactions([]); setFavourites([]); setFriends([]); setPendingRequests([]); setOutgoingRequests([]); setLocker(null);
    }
  }, [session, refreshAll]);

  return (
    <DatabaseContext.Provider value={{
      profile, tickets, transactions, favourites, friends, pendingRequests, outgoingRequests, locker, loading,
      refreshAll, refreshProfile, refreshTickets, refreshTransactions, refreshFavourites, refreshFriends, refreshRequests, refreshLocker,
      updateUsername, sendFriendRequest, acceptFriendRequest, rejectFriendRequest, cancelFriendRequest, removeFriend
    }}>
      {children}
    </DatabaseContext.Provider>
  );
};

export const useDatabase = () => {
  const context = useContext(DatabaseContext);
  if (context === undefined) throw new Error('useDatabase must be used within a DatabaseProvider');
  return context;
};
