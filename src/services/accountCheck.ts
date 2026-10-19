import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { apiClient } from './apiClient';

// Authorized demo accounts list
const DEMO_EMAILS = new Set([
  'sadia.sakharkar@cumminscollege.in',
  'worker@setu.org',
]);

/**
 * Checks if an email is registered in Supabase Auth, remote database, or authorized demo accounts.
 * Queries Supabase RPC, backend API, and local demo accounts safely without exposing secrets.
 * Returns true if account exists, false otherwise.
 */
export async function checkEmailIsRegistered(email: string): Promise<boolean> {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
    return false;
  }

  // 1. Instant check for authorized demo profiles
  if (DEMO_EMAILS.has(cleanEmail)) {
    return true;
  }

  // 2. Try Supabase RPC if configured (SECURITY DEFINER checks auth.users & profiles)
  if (supabase && isSupabaseConfigured) {
    try {
      const { data, error } = await supabase.rpc('check_email_registered', {
        email_to_check: cleanEmail,
      });
      if (!error && typeof data === 'boolean') {
        return data;
      }
    } catch {
      // Supabase RPC function might not be installed yet, proceed to backend check
    }
  }

  // 3. Try backend API check-account endpoint
  try {
    const res = await apiClient.post('/auth/check-account', { email: cleanEmail });
    if (res.data && typeof res.data.exists === 'boolean') {
      return res.data.exists;
    }
  } catch {
    // Backend API unreachable or offline
  }

  // 4. Try querying profiles table directly via Supabase client (if readable)
  if (supabase && isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .ilike('email', cleanEmail)
        .maybeSingle();
      if (!error && data?.id) {
        return true;
      }
    } catch {
      // Ignore
    }
  }

  return false;
}
