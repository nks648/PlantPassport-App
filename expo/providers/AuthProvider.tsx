import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import * as Crypto from 'expo-crypto';
import createContextHook from '@nkzw/create-context-hook';
import {
  ACCESS_TOKEN_KEY,
  REFRESH_TOKEN_KEY,
  getToken,
  setToken,
  deleteToken,
} from '@/lib/authTokens';

const AUTH_URL = (process.env.EXPO_PUBLIC_RORK_AUTH_URL ?? '').trim();
const APP_KEY = (process.env.EXPO_PUBLIC_RORK_APP_KEY ?? '').trim();
const PROJECT_ID = (process.env.EXPO_PUBLIC_PROJECT_ID ?? '').trim();

export type AuthProviderName = 'google' | 'apple';

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  picture?: string;
}

const B64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

function base64UrlFromBytes(bytes: Uint8Array): string {
  let result = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const b0 = bytes[i];
    const b1 = i + 1 < bytes.length ? bytes[i + 1] : 0;
    const b2 = i + 2 < bytes.length ? bytes[i + 2] : 0;
    result += B64_CHARS[b0 >> 2];
    result += B64_CHARS[((b0 & 3) << 4) | (b1 >> 4)];
    result += i + 1 < bytes.length ? B64_CHARS[((b1 & 15) << 2) | (b2 >> 6)] : '';
    result += i + 2 < bytes.length ? B64_CHARS[b2 & 63] : '';
  }
  return result.replace(/\+/g, '-').replace(/\//g, '_');
}

function base64UrlDecodeToString(input: string): string {
  let b64 = input.replace(/-/g, '+').replace(/_/g, '/');
  while (b64.length % 4 !== 0) b64 += '=';
  const lookup: Record<string, number> = {};
  for (let i = 0; i < B64_CHARS.length; i++) lookup[B64_CHARS[i]] = i;
  const clean = b64.replace(/=+$/, '');
  const bytes: number[] = [];
  for (let i = 0; i < clean.length; i += 4) {
    const c0 = lookup[clean[i]];
    const c1 = lookup[clean[i + 1]];
    const c2 = lookup[clean[i + 2]];
    const c3 = lookup[clean[i + 3]];
    bytes.push((c0 << 2) | (c1 >> 4));
    if (clean[i + 2] !== undefined) bytes.push(((c1 & 15) << 4) | (c2 >> 2));
    if (clean[i + 3] !== undefined) bytes.push(((c2 & 3) << 6) | c3);
  }
  try {
    return new TextDecoder().decode(new Uint8Array(bytes));
  } catch {
    return String.fromCharCode(...bytes);
  }
}

async function generateCodeVerifier(): Promise<string> {
  const bytes = await Crypto.getRandomBytesAsync(32);
  return base64UrlFromBytes(bytes);
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const hashBase64 = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    verifier,
    { encoding: Crypto.CryptoEncoding.BASE64 },
  );
  return hashBase64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** Decode the JWT payload to extract user info and check expiration. */
function userFromToken(token: string): AuthUser | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(base64UrlDecodeToString(parts[1]));
    if (payload.exp && payload.exp * 1000 < Date.now()) return null;
    return {
      id: payload.sub,
      email: payload.email ?? '',
      name: payload.name,
      picture: payload.picture,
    };
  } catch {
    return null;
  }
}

export const [AuthProvider, useAuth] = createContextHook(() => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSigningIn, setIsSigningIn] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const codeVerifierRef = useRef<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const signOut = useCallback(async () => {
    await deleteToken(ACCESS_TOKEN_KEY);
    await deleteToken(REFRESH_TOKEN_KEY);
    setUser(null);
  }, []);

  const refreshToken = useCallback(async () => {
    const storedRefreshToken = await getToken(REFRESH_TOKEN_KEY);
    if (!storedRefreshToken) {
      setUser(null);
      return;
    }
    try {
      const response = await fetch(`${AUTH_URL}/oauth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ app_key: APP_KEY, refresh_token: storedRefreshToken }),
      });
      if (!response.ok) {
        await signOut();
        return;
      }
      const { access_token } = await response.json();
      await setToken(ACCESS_TOKEN_KEY, access_token);
      setUser(userFromToken(access_token));
    } catch (e) {
      console.log('[Auth] Refresh failed:', e instanceof Error ? e.message : String(e));
      setUser(null);
    }
  }, [signOut]);

  const exchangeCode = useCallback(async (code: string) => {
    const verifier = codeVerifierRef.current;
    if (!verifier) return;
    codeVerifierRef.current = null;

    const response = await fetch(`${AUTH_URL}/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ app_key: APP_KEY, code, code_verifier: verifier }),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      const message = body.error || `Sign in failed (${response.status})`;
      console.error('[Auth] Token exchange failed:', response.status, body);
      setError(message);
      return;
    }

    const { access_token, refresh_token, user: userData } = await response.json();
    await setToken(ACCESS_TOKEN_KEY, access_token);
    if (refresh_token) await setToken(REFRESH_TOKEN_KEY, refresh_token);
    setUser(userData ?? userFromToken(access_token));
  }, []);

  const checkAuth = useCallback(async () => {
    try {
      const accessToken = await getToken(ACCESS_TOKEN_KEY);
      if (!accessToken) {
        const storedRefresh = await getToken(REFRESH_TOKEN_KEY);
        if (storedRefresh) await refreshToken();
        return;
      }
      const decoded = userFromToken(accessToken);
      if (decoded) {
        setUser(decoded);
      } else {
        await refreshToken();
      }
    } catch (e) {
      console.log('[Auth] checkAuth error:', e instanceof Error ? e.message : String(e));
    } finally {
      setIsLoading(false);
    }
  }, [refreshToken]);

  const handleDeepLink = useCallback(async (event: { url: string }) => {
    try {
      const url = new URL(event.url);
      if (url.pathname === '/auth/callback' || url.hostname === 'auth') {
        const code = url.searchParams.get('code');
        if (code) await exchangeCode(code);
      }
    } catch (e) {
      console.log('[Auth] Deep link handling failed:', e instanceof Error ? e.message : String(e));
    }
  }, [exchangeCode]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    const subscription = Linking.addEventListener('url', handleDeepLink);
    return () => subscription.remove();
  }, [handleDeepLink]);

  const signIn = useCallback(async (provider: AuthProviderName) => {
    if (!AUTH_URL || !APP_KEY) {
      setError('Sign in is not configured yet.');
      return;
    }
    setIsSigningIn(true);
    setError(null);
    try {
      const verifier = await generateCodeVerifier();
      const challenge = await generateCodeChallenge(verifier);
      codeVerifierRef.current = verifier;

      const isWeb = Platform.OS === 'web';
      const env = isWeb ? 'preview' : 'native';

      const response = await fetch(`${AUTH_URL}/oauth/initiate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          app_key: APP_KEY,
          provider,
          code_challenge: challenge,
          target: 'rn',
          env,
          app_path: 'expo',
        }),
      });

      if (!response.ok) {
        codeVerifierRef.current = null;
        const body = await response.json().catch(() => ({}));
        const message = body.error || `Sign in failed (${response.status})`;
        console.error('[Auth] Initiate failed:', response.status, body);
        setError(message);
        return;
      }

      const { auth_url } = await response.json();

      if (isWeb) {
        const popup = window.open(auth_url, '_blank', 'width=500,height=650');
        await new Promise<void>((resolve, reject) => {
          const onMessage = (e: MessageEvent) => {
            if (e.data?.type !== 'rork_auth_callback') return;
            window.removeEventListener('message', onMessage);
            clearInterval(pollTimer);
            const code = e.data.code;
            if (code) exchangeCode(code).then(resolve, reject);
            else reject(new Error('No code received'));
          };
          window.addEventListener('message', onMessage);
          const pollTimer = setInterval(() => {
            if (popup?.closed) {
              clearInterval(pollTimer);
              window.removeEventListener('message', onMessage);
              codeVerifierRef.current = null;
              resolve();
            }
          }, 500);
        });
      } else {
        const result = await WebBrowser.openAuthSessionAsync(
          auth_url,
          `rork-${PROJECT_ID}://auth/callback`,
        );
        if (result.type === 'success') {
          const url = new URL(result.url);
          const code = url.searchParams.get('code');
          if (code) await exchangeCode(code);
        }
      }
    } catch (e) {
      console.error('[Auth] Sign in failed:', e instanceof Error ? e.message : String(e));
      setError(e instanceof Error ? e.message : 'Sign in failed');
    } finally {
      setIsSigningIn(false);
    }
  }, [exchangeCode]);

  return {
    user,
    isAuthenticated: user !== null,
    isLoading,
    isSigningIn,
    error,
    signIn,
    signOut,
    clearError,
  };
});
