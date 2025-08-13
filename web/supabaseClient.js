/**
 * Supabase client configuration
 * Creates and exports a configured Supabase client instance
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './env.js';

// Create Supabase client with no session persistence
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false,
    storage: undefined
  }
});