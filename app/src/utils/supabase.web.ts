import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabasePublishableKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Custom storage adapter for Web to prevent SSR "window is not defined" errors
const webStorage = {
  getItem: (key: string) => {
    if (typeof window === 'undefined') return null;
    return window.localStorage.getItem(key);
  },
  setItem: (key: string, value: string) => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(key, value);
  },
  removeItem: (key: string) => {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(key);
  },
};

export const supabase = createClient(supabaseUrl!, supabasePublishableKey!, {
  auth: {
    storage: webStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
  // Disable realtime on web — avoids WebSocket init during SSR (Node.js 20
  // has no native WebSocket) and is unnecessary for this mobile-first app.
  realtime: {
    transport: typeof WebSocket !== 'undefined' ? WebSocket : (class NoopWS {
      constructor() {}
      close() {}
    } as any),
  },
});
