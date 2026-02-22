import React, { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import { Session } from '@supabase/supabase-js';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { makeRedirectUri } from 'expo-auth-session';
import createContextHook from '@nkzw/create-context-hook';
import { supabase, SUPABASE_URL } from '@/lib/supabase';

if (Platform.OS !== 'web') {
  WebBrowser.maybeCompleteAuthSession();
}

interface AuthState {
  session: Session | null;
  isLoading: boolean;
  isAuthenticating: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signOut: () => Promise<void>;
}

export const [AuthProvider, useAuth] = createContextHook<AuthState>(() => {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      console.log('[Auth] Initial session:', currentSession ? 'exists' : 'none');
      setSession(currentSession);
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      console.log('[Auth] State changed:', _event, newSession ? 'session exists' : 'no session');
      setSession(newSession);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithOAuth = async (provider: 'google' | 'apple') => {
    try {
      setIsAuthenticating(true);
      console.log(`[Auth] Starting ${provider} sign in`);

      if (Platform.OS === 'web') {
        const { error } = await supabase.auth.signInWithOAuth({
          provider,
          options: {
            redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
          },
        });
        if (error) throw error;
        return;
      }

      const redirectUrl = Linking.createURL('auth/callback');
      console.log('[Auth] Redirect URL:', redirectUrl);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true,
        },
      });

      if (error) throw error;
      if (!data?.url) throw new Error('No auth URL returned');

      console.log('[Auth] Opening auth URL for provider:', provider);
      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);
      console.log('[Auth] Auth result type:', result.type);

      if (result.type === 'success' && result.url) {
        const url = result.url;
        console.log('[Auth] Callback URL:', url);

        let paramsString = '';
        if (url.includes('#')) {
          paramsString = url.split('#')[1];
        } else if (url.includes('?')) {
          paramsString = url.split('?')[1];
        }

        const params = new URLSearchParams(paramsString);
        const access_token = params.get('access_token');
        const refresh_token = params.get('refresh_token');

        console.log('[Auth] Got tokens:', { access_token: !!access_token, refresh_token: !!refresh_token });

        if (access_token && refresh_token) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token,
            refresh_token,
          });
          if (sessionError) {
            console.error('[Auth] Set session error:', sessionError.message);
            throw sessionError;
          }
          console.log('[Auth] Session set successfully');
        } else {
          const code = params.get('code');
          if (code) {
            console.log('[Auth] Got auth code, exchanging for session');
            const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
            if (exchangeError) {
              console.error('[Auth] Code exchange error:', exchangeError.message);
              throw exchangeError;
            }
            console.log('[Auth] Code exchange successful');
          } else {
            console.warn('[Auth] No tokens or code found in callback URL');
          }
        }
      } else {
        console.log('[Auth] Auth session dismissed or failed:', result.type);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[Auth] ${provider} sign in error:`, message);
      throw error;
    } finally {
      setIsAuthenticating(false);
    }
  };

  const signInWithGoogle = async () => signInWithOAuth('google');
  const signInWithApple = async () => signInWithOAuth('apple');

  const signOut = async () => {
    try {
      console.log('[Auth] Signing out');
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('[Auth] Sign out error:', error.message);
        throw error;
      }
      console.log('[Auth] Signed out successfully');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('[Auth] Sign out error:', message);
    }
  };

  return {
    session,
    isLoading,
    isAuthenticating,
    signInWithGoogle,
    signInWithApple,
    signOut,
  };
});
