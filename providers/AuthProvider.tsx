import React, { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import { Session } from '@supabase/supabase-js';
import * as WebBrowser from 'expo-web-browser';
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
            redirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        return;
      }

      const redirectUrl = makeRedirectUri();
      console.log('[Auth] Redirect URL:', redirectUrl);

      const authUrl = `${SUPABASE_URL}/auth/v1/authorize?provider=${provider}&redirect_to=${encodeURIComponent(redirectUrl)}`;
      console.log('[Auth] Opening auth URL for provider:', provider);

      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUrl);
      console.log('[Auth] Auth result type:', result.type);

      if (result.type === 'success' && result.url) {
        const url = result.url;
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
          const { error } = await supabase.auth.setSession({
            access_token,
            refresh_token,
          });
          if (error) {
            console.error('[Auth] Set session error:', error.message);
            throw error;
          }
          console.log('[Auth] Session set successfully');
        }
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
