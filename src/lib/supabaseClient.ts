import { createClient, SupabaseClient, User } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== 'https://your-project-id.supabase.co' &&
  !supabaseUrl.includes('placeholder')
);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

/**
 * Retrieves current active Supabase session access token.
 * Returns null if Supabase is unconfigured or user is not logged in.
 */
export async function getAuthToken(): Promise<string | null> {
  if (!supabase) return null;
  try {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token || null;
  } catch (err) {
    console.warn('[Supabase] Failed to retrieve access token:', err);
    return null;
  }
}

/**
 * Retrieves the currently authenticated Supabase user, or null if unauthenticated.
 */
export async function getActiveUser(): Promise<User | null> {
  if (!supabase) return null;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) return user;
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user ?? null;
  } catch {
    return null;
  }
}

/**
 * Ensures that a linked profile row exists in public.profiles for the authenticated user.
 * This guarantees that all foreign keys (transactions, services, bookings, health items, etc.)
 * succeed without failing constraint checks.
 */
export async function ensureUserProfile(user: User): Promise<boolean> {
  if (!supabase || !user) return false;
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();

    if (!data && !error) {
      const defaultName =
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        (user.email ? user.email.split('@')[0] : 'Setu Worker');

      const { error: insertErr } = await supabase.from('profiles').upsert(
        {
          id: user.id,
          full_name: defaultName,
          email: user.email || null,
          phone_number: user.phone || null,
          city_key: 'cities.pune',
          work_type: 'driver',
          skills: '',
          custom_skills: '',
          experience_years: 1,
          availability: 'anytime',
          pay_min: 400,
          pay_max: 700,
          savings_goal: 5000,
          weekly_save_goal: 350,
          preferred_language: 'en',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      );
      if (insertErr) {
        console.warn('[ensureUserProfile] Profile initialization notice:', insertErr);
        return false;
      }
    }
    return true;
  } catch (err) {
    console.warn('[ensureUserProfile] Profile check notice:', err);
    return false;
  }
}

/**
 * Returns Authorization header with Bearer token if user is logged in.
 */
export async function getAuthHeaders(): Promise<Record<string, string>> {
  const token = await getAuthToken();
  if (!token) return {};
  return {
    Authorization: `Bearer ${token}`,
  };
}
