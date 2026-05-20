import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../utils/supabase';

type Profile = {
  username: string | null;
  email: string | null;
  balance: number;
  points: number;
};

type AuthContextType = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
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
  const [user,    setUser]    = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch the profile row. If it doesn't exist yet (trigger may not have fired
  // for existing accounts), create it with all required columns.
  const fetchProfile = async (userId: string, userEmail: string | undefined) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('username, email, balance, points')
      .eq('id', userId)
      .single();

    if (!error && data) {
      setProfile(data);
      return;
    }

    // Row missing — create it (covers accounts created before the trigger existed).
    // Position is stored as canvas pixel coordinates {cx, cy} so all clients
    // display it identically without any GPS→canvas conversion.
    const cx = 220 + Math.random() * (1180 - 220);
    const cy = 420 + Math.random() * (1280 - 420);

    await supabase.from('profiles').insert({
      id:       userId,
      username: userEmail ? userEmail.split('@')[0].toUpperCase() : null,
      email:    userEmail ?? null,
      balance:  0,
      points:   0,
      position: { cx, cy },
      friends:  [],
    });

    const { data: created } = await supabase
      .from('profiles')
      .select('username, email, balance, points')
      .eq('id', userId)
      .single();
    setProfile(created ?? null);
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id, user.email ?? undefined);
  };

  useEffect(() => {
    // Resolve the initial session — sets loading=false once done
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) await fetchProfile(session.user.id, session.user.email ?? undefined);
      setLoading(false);
    });

    // React to sign-in / sign-out / token refresh
    // Skip INITIAL_SESSION (handled above) to avoid a brief null-session flash
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'INITIAL_SESSION') return;
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchProfile(session.user.id, session.user.email ?? undefined);
      } else {
        setProfile(null);
      }
    });

    return () => { subscription.unsubscribe(); };
  }, []);

  const signOut = async () => {
    // Clear state immediately so any screen that checks `session` won't
    // redirect back to profile before onAuthStateChange fires.
    setSession(null);
    setUser(null);
    setProfile(null);
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
