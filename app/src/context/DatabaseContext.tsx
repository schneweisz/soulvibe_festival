import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../utils/supabase';
import { useAuth } from './AuthContext';
import * as Notifications from 'expo-notifications';
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
  loading: boolean;
  refreshAll: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  refreshTickets: () => Promise<void>;
  refreshTransactions: () => Promise<void>;
  refreshFavourites: () => Promise<void>;
  refreshFriends: () => Promise<void>;
  updateUsername: (newUsername: string) => Promise<boolean>;
  sendFriendRequest: (username: string) => Promise<{ success: boolean; error?: string }>;
  acceptFriendRequest: (requestId: string) => Promise<{ success: boolean; error?: string }>;
  rejectFriendRequest: (requestId: string) => Promise<{ success: boolean; error?: string }>;
  removeFriend: (friendId: string) => Promise<{ success: boolean; error?: string }>;
  locker: LockerReservation | null;
  refreshLocker: () => Promise<void>;
  updateUsername: (username: string) => Promise<boolean>;
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
  const [locker, setLocker] = useState<LockerReservation | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('username, points, balance, friends, expo_push_token')
      .eq('id', userId)
      .single();

    if (!error && data) {
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

    if (!error && data) {
      setTickets(data);
    }
  }, []);

  const fetchTransactions = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (!error && data) {
      setTransactions(data);
    }
  }, []);

  const fetchFavourites = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('favourites')
      .select('artist_name')
      .eq('user_id', userId);

    if (!error && data) {
      setFavourites(data);
    }
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

    if (!error && data) {
      setFriends(data);
    }
  }, []);

  const fetchPendingRequests = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('friend_requests')
      .select(`
        id,
        sender_id,
        receiver_id,
        status,
        created_at,
        profiles!friend_requests_sender_id_fkey(username)
      `)
      .eq('receiver_id', userId)
      .eq('status', 'pending');

    if (!error && data) {
      const formatted = data.map((r: any) => ({
        id: r.id,
        sender_id: r.sender_id,
        sender_username: r.profiles?.username,
        receiver_id: r.receiver_id,
        status: r.status,
        created_at: r.created_at
      }));
      setPendingRequests(formatted);
    }
  }, []);

  const sendFriendRequest = async (targetUsername: string) => {
    if (!user) return { success: false, error: 'Not authenticated (user missing)' };
    if (!profile) return { success: false, error: 'Profile not loaded (please restart app)' };
    const name = targetUsername.trim();
    
    try {
      // 1. Find target user (case-insensitive match using .ilike)
      const { data: target, error: findErr } = await supabase
        .from('profiles')
        .select('id, username, expo_push_token')
        .ilike('username', name)
        .maybeSingle();

      if (findErr) return { success: false, error: `Database error: ${findErr.message}` };
      if (!target) return { success: false, error: 'User not found' };
      if (target.id === user.id) return { success: false, error: 'Cannot add yourself' };
      if (profile.friends?.includes(target.id)) return { success: false, error: 'Already friends' };

      // 2. Create request
      const { error: reqErr } = await supabase
        .from('friend_requests')
        .insert({
          sender_id: user.id,
          receiver_id: target.id,
          status: 'pending'
        });

      if (reqErr) {
        console.error('Friend request insertion error:', reqErr);
        return { success: false, error: `Request failed: ${reqErr.message}` };
      }

      // 3. Send push notification if possible
      if (target.expo_push_token && Platform.OS !== 'web') {
        await fetch('https://exp.host/--/api/v2/push/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: target.expo_push_token,
            title: 'New Friend Request! 🤘',
            body: `${profile.username} wants to connect with you on SoulVibe.`,
            data: { type: 'friend_request' },
          }),
        });
      }

      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  };

  const acceptFriendRequest = async (requestId: string) => {
    if (!user) return { success: false, error: 'Not authenticated' };
    try {
      // Use RPC for atomic bidirectional add
      const { data: request } = await supabase
        .from('friend_requests')
        .select('sender_id')
        .eq('id', requestId)
        .single();

      if (!request) return { success: false, error: 'Request not found' };

      const { error: rpcErr } = await supabase.rpc('add_friend_bidirectional', {
        friend_id: request.sender_id,
        requester_id: user.id,
      });

      if (rpcErr) return { success: false, error: rpcErr.message };

      // Update request status
      await supabase
        .from('friend_requests')
        .update({ status: 'accepted' })
        .eq('id', requestId);

      await refreshAll();
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  };

  const rejectFriendRequest = async (requestId: string) => {
    const { error } = await supabase
      .from('friend_requests')
      .update({ status: 'rejected' })
      .eq('id', requestId);
    
    if (error) return { success: false, error: error.message };
    await fetchPendingRequests(user!.id);
    return { success: true };
  };

  const removeFriend = async (friendId: string) => {
    if (!user || !profile?.friends) return { success: false, error: 'Not authenticated' };
    try {
      const newIds = profile.friends.filter(id => id !== friendId);
      const { error } = await supabase
        .from('profiles')
        .update({ friends: newIds })
        .eq('id', user.id);
      
      if (error) return { success: false, error: error.message };
      
      // Also remove from other person's list (bidirectional cleanup)
      const { data: other } = await supabase.from('profiles').select('friends').eq('id', friendId).single();
      if (other) {
        const otherNewIds = (other.friends || []).filter((id: string) => id !== user.id);
        await supabase.from('profiles').update({ friends: otherNewIds }).eq('id', friendId);
      }

      await refreshAll();
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  };

  const refreshAll = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const profileData = await fetchProfile(user.id);
    const promises: Promise<any>[] = [
      fetchTickets(user.id),
      fetchTransactions(user.id),
      fetchFavourites(user.id),
      fetchPendingRequests(user.id),
      fetchLocker(user.id),
    ];
    
    if (profileData?.friends) {
      promises.push(fetchFriends(profileData.friends));
    } else {
      setFriends([]);
    }

    await Promise.all(promises);
    setLoading(false);
  }, [user, fetchProfile, fetchTickets, fetchTransactions, fetchFavourites, fetchFriends, fetchPendingRequests]);

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
    if (profile?.friends) await fetchFriends(profile.friends);
  }, [profile, fetchFriends]);

  const fetchLocker = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from('lockers')
      .select('id, hub_name, slot_number, pin_code, reserved_at')
      .eq('user_id', userId)
      .eq('status', 'occupied')
      .maybeSingle();
    setLocker(data ?? null);
  }, []);

  const refreshLocker = useCallback(async () => {
    if (user) await fetchLocker(user.id);
  }, [user, fetchLocker]);

  const updateUsername = useCallback(async (newUsername: string): Promise<boolean> => {
    if (!user) return false;
    const { error } = await supabase
      .from('profiles')
      .update({ username: newUsername })
      .eq('id', user.id);
    if (!error) {
      setProfile(prev => prev ? { ...prev, username: newUsername } : null);
    }
    return !error;
  }, [user]);

  useEffect(() => {
    if (session?.user) {
      refreshAll();
    } else {
      setProfile(null);
      setTickets([]);
      setTransactions([]);
      setFavourites([]);
      setFriends([]);
      setPendingRequests([]);
      setLocker(null);
    }
  }, [session, refreshAll]);

  return (
    <DatabaseContext.Provider value={{
      profile,
      tickets,
      transactions,
      favourites,
      friends,
      pendingRequests,
      loading,
      refreshAll,
      refreshProfile,
      refreshTickets,
      refreshTransactions,
      refreshFavourites,
      refreshFriends,
      updateUsername,
      locker,
      refreshLocker,
      sendFriendRequest,
      acceptFriendRequest,
      rejectFriendRequest,
      removeFriend
    }}>
      {children}
    </DatabaseContext.Provider>
  );
};

export const useDatabase = () => {
  const context = useContext(DatabaseContext);
  if (context === undefined) {
    throw new Error('useDatabase must be used within a DatabaseProvider');
  }
  return context;
};
