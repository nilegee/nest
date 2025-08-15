/**
 * Supabase client configuration
 * Creates and exports a configured Supabase client instance
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './env.js';

// Create Supabase client with session memory storage (no localStorage persistence)
// This allows OAuth callbacks to work while keeping sessions temporary
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false,
    storage: {
      getItem: (key) => {
        if (typeof window !== 'undefined') {
          return window.sessionStorage.getItem(key);
        }
        return null;
      },
      setItem: (key, value) => {
        if (typeof window !== 'undefined') {
          window.sessionStorage.setItem(key, value);
        }
      },
      removeItem: (key) => {
        if (typeof window !== 'undefined') {
          window.sessionStorage.removeItem(key);
        }
      }
    },
    autoRefreshToken: false,
    detectSessionInUrl: true
  }
});

// Clock-skew guard to silence GoTrue warning and proceed
export async function getFreshSession() {
  try {
    const { data } = await supabase.auth.getSession();
    return data.session ?? null;
  } catch {
    return null; // don't crash app due to skew; UI will handle unauth state
  }
}