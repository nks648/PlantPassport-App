import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

const SUPABASE_URL = (process.env.EXPO_PUBLIC_SUPABASE_URL || '').trim();
const SUPABASE_ANON_KEY = (process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '').trim();

function isValidUrl(url: string): boolean {
  if (!url) return false;
  if (!url.match(/^https?:\/\//i)) return false;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

function isConfigured(): boolean {
  return isValidUrl(SUPABASE_URL) && Boolean(SUPABASE_ANON_KEY);
}

let _supabase: SupabaseClient | null = null;

function getSupabaseSafe(): SupabaseClient | null {
  if (!isConfigured()) {
    return null;
  }
  try {
    if (!_supabase) {
      _supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
          storage: AsyncStorage,
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: Platform.OS === 'web',
        },
      });
    }
    return _supabase;
  } catch (e) {
    console.warn('[Supabase] Failed to initialize client:', e instanceof Error ? e.message : String(e));
    return null;
  }
}

let _supabaseInstance: SupabaseClient | null = null;

try {
  _supabaseInstance = getSupabaseSafe();
} catch (e) {
  console.warn('[Supabase] Unexpected error during initialization:', e instanceof Error ? e.message : String(e));
  _supabaseInstance = null;
}

export const supabase: SupabaseClient | null = _supabaseInstance;

export { SUPABASE_URL };
