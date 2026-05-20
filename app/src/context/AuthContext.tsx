import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../utils/supabase';

type AuthContextType = {
  session: Session | null;
  user: User | null;
  profile: { username: string | null; points: number; balance: number } | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  profile: null,
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<{ username: string | null; points: number; balance: number } | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('username, points, balance')
        .eq('id', userId)
        .single();

      if (!error && data) {
        setProfile(data);
      } else {
        // No row yet — create one so every screen can rely on a profile existing
        // Create a minimal profile row — only columns guaranteed to exist
        const { data: created } = await supabase
          .from('profiles')
          .upsert({ id: userId, balance: 0, points: 0 }, { onConflict: 'id' })
          .select('username, points, balance')
          .single();
        setProfile(created ?? null);
      }
    } catch (e) {
      console.error('Error fetching profile:', e);
      setProfile(null);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  useEffect(() => {
    // Resolve the initial session once — this is the source of truth for loading=false
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) await fetchProfile(session.user.id);
      setLoading(false);          // ← only here, never in onAuthStateChange
    });

    // React to real auth events (sign-in, sign-out, token refresh)
    // INITIAL_SESSION is redundant with getSession above — skip it to avoid
    // a brief session=null flash that causes spurious redirects.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'INITIAL_SESSION') return;
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
      // Do NOT call setLoading(false) here — keeps loading true until getSession resolves
    });

    return () => { subscription.unsubscribe(); };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ session, user, profile, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
