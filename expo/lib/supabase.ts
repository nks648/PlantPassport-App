import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

let _supabase: SupabaseClient | null = null;

function isConfigured(): boolean {
  return Boolean(SUPABASE_URL) && Boolean(SUPABASE_ANON_KEY);
}

export function getSupabase(): SupabaseClient {
  if (!isConfigured()) {
    console.warn('[Supabase] Missing SUPABASE_URL or SUPABASE_ANON_KEY — client not initialized');
    throw new Error('Supabase is not configured. Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to your environment.');
  }
  if (!_supabase) {
    console.log('[Supabase] Initializing client with URL:', SUPABASE_URL);
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
}

let _supabaseSafe: SupabaseClient | null = null;

function getSupabaseSafe(): SupabaseClient | null {
  if (!isConfigured()) {
    return null;
  }
  try {
    if (!_supabaseSafe) {
      _supabaseSafe = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
          storage: AsyncStorage,
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: Platform.OS === 'web',
        },
      });
    }
    return _supabaseSafe;
  } catch {
    console.warn('[Supabase] Failed to initialize client');
    return null;
  }
}

export const supabase = getSupabaseSafe();

export { SUPABASE_URL };
