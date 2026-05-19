import 'expo-sqlite/localStorage/install';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://qkseikqrbtshekmntoce.supabase.co/rest/v1/!";
const supabasePublishableKey = "sb_publishable_IC_iTOL4KwqRrA4nKDQwBw_cycZqxFQ!";

export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    storage: localStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
