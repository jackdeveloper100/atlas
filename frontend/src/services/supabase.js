/**
 * Supabase Client (Frontend)
 * 
 * CRITICAL: This client uses the ANON KEY which enforces RLS policies.
 * This is safe to expose in the browser.
 * 
 * NEVER use the service-role key in frontend code.
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing required environment variables: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY'
  );
}

// Frontend Supabase client with anon key (RLS enforced)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});
