import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

export const ACCESS_TOKEN_KEY = 'access_token';
export const REFRESH_TOKEN_KEY = 'refresh_token';

const memoryStore: Record<string, string> = {};

/** Read a stored auth token. Uses SecureStore on native, localStorage on web, with an in-memory fallback. */
export async function getToken(key: string): Promise<string | null> {
  try {
    if (Platform.OS === 'web') {
      if (typeof localStorage !== 'undefined') return localStorage.getItem(key);
      return memoryStore[key] ?? null;
    }
    return await SecureStore.getItemAsync(key);
  } catch (e) {
    console.log('[authTokens] getToken error:', e instanceof Error ? e.message : String(e));
    return memoryStore[key] ?? null;
  }
}

/** Persist an auth token securely. */
export async function setToken(key: string, value: string): Promise<void> {
  try {
    memoryStore[key] = value;
    if (Platform.OS === 'web') {
      if (typeof localStorage !== 'undefined') localStorage.setItem(key, value);
      return;
    }
    await SecureStore.setItemAsync(key, value);
  } catch (e) {
    console.log('[authTokens] setToken error:', e instanceof Error ? e.message : String(e));
  }
}

/** Remove a stored auth token. */
export async function deleteToken(key: string): Promise<void> {
  try {
    delete memoryStore[key];
    if (Platform.OS === 'web') {
      if (typeof localStorage !== 'undefined') localStorage.removeItem(key);
      return;
    }
    await SecureStore.deleteItemAsync(key);
  } catch (e) {
    console.log('[authTokens] deleteToken error:', e instanceof Error ? e.message : String(e));
  }
}
