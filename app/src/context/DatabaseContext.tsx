import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../utils/supabase';
import { useAuth } from './AuthContext';

export interface Profile {
  username: string | null;
  points: number;
  balance: number;
  friends: string[] | null;
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

type DatabaseContextType = {
  profile: Profile | null;
  tickets: Ticket[];
  transactions: Transaction[];
  favourites: Favourite[];
  friends: Friend[];
  loading: boolean;
  refreshAll: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  refreshTickets: () => Promise<void>;
  refreshTransactions: () => Promise<void>;
  refreshFavourites: () => Promise<void>;
  refreshFriends: () => Promise<void>;
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
  const [loading, setLoading] = useState(false);

  const fetchProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('username, points, balance, friends')
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

  const refreshAll = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const profileData = await fetchProfile(user.id);
    const promises: Promise<any>[] = [
      fetchTickets(user.id),
      fetchTransactions(user.id),
      fetchFavourites(user.id)
    ];
    
    if (profileData?.friends) {
      promises.push(fetchFriends(profileData.friends));
    } else {
      setFriends([]);
    }

    await Promise.all(promises);
    setLoading(false);
  }, [user, fetchProfile, fetchTickets, fetchTransactions, fetchFavourites, fetchFriends]);

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
    }
  }, [session, refreshAll]);

  return (
    <DatabaseContext.Provider value={{
      profile,
      tickets,
      transactions,
      favourites,
      friends,
      loading,
      refreshAll,
      refreshProfile,
      refreshTickets,
      refreshTransactions,
      refreshFavourites,
      refreshFriends,
      updateUsername,
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
