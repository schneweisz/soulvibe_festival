import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../utils/supabase';
import { useAuth } from './AuthContext';

export interface Profile {
  username: string | null;
  points: number;
  balance: number;
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

type DatabaseContextType = {
  profile: Profile | null;
  tickets: Ticket[];
  transactions: Transaction[];
  loading: boolean;
  refreshAll: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  refreshTickets: () => Promise<void>;
  refreshTransactions: () => Promise<void>;
};

const DatabaseContext = createContext<DatabaseContextType | undefined>(undefined);

export const DatabaseProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, session } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('username, points, balance')
      .eq('id', userId)
      .single();

    if (!error && data) {
      setProfile(data);
    }
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

  const refreshAll = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    await Promise.all([
      fetchProfile(user.id),
      fetchTickets(user.id),
      fetchTransactions(user.id)
    ]);
    setLoading(false);
  }, [user, fetchProfile, fetchTickets, fetchTransactions]);

  const refreshProfile = useCallback(async () => {
    if (user) await fetchProfile(user.id);
  }, [user, fetchProfile]);

  const refreshTickets = useCallback(async () => {
    if (user) await fetchTickets(user.id);
  }, [user, fetchTickets]);

  const refreshTransactions = useCallback(async () => {
    if (user) await fetchTransactions(user.id);
  }, [user, fetchTransactions]);

  useEffect(() => {
    if (session?.user) {
      refreshAll();
    } else {
      setProfile(null);
      setTickets([]);
      setTransactions([]);
    }
  }, [session, refreshAll]);

  return (
    <DatabaseContext.Provider value={{
      profile,
      tickets,
      transactions,
      loading,
      refreshAll,
      refreshProfile,
      refreshTickets,
      refreshTransactions
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
