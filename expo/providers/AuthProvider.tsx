import React, { useState, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import createContextHook from '@nkzw/create-context-hook';
import { supabase } from '@/lib/supabase';

interface AuthState {
  session: Session | null;
  isLoading: boolean;
  isAuthenticating: boolean;
  signInAnonymously: () => Promise<void>;
  signOut: () => Promise<void>;
}

export const [AuthProvider, useAuth] = createContextHook<AuthState>(() => {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);

  useEffect(() => {
    let subscription: { unsubscribe: () => void } | null = null;

    const init = async () => {
      if (!supabase) {
        console.log('[Auth] Supabase not configured, skipping auth');
        setIsLoading(false);
        return;
      }

      try {
        console.log('[Auth] Getting initial session...');
        const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 5000));
        const sessionPromise = supabase.auth.getSession().then(({ data }) => data.session);
        const currentSession = await Promise.race([sessionPromise, timeoutPromise]);
        console.log('[Auth] Initial session:', currentSession ? 'exists' : 'none');
        setSession(currentSession);
      } catch (e) {
        console.log('[Auth] Error getting session:', e);
      } finally {
        setIsLoading(false);
      }

      try {
        const { data } = supabase.auth.onAuthStateChange((_event, newSession) => {
          console.log('[Auth] State changed:', _event, newSession ? 'session exists' : 'no session');
          setSession(newSession);
        });
        subscription = data.subscription;
      } catch (e) {
        console.log('[Auth] Error setting up auth listener:', e);
      }
    };

    init();

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const signInAnonymously = async () => {
    if (!supabase) {
      console.log('[Auth] Supabase not configured, skipping sign in');
      return;
    }
    try {
      setIsAuthenticating(true);
      console.log('[Auth] Starting anonymous sign in');

      const { data, error } = await supabase.auth.signInAnonymously();

      if (error) {
        console.error('[Auth] Anonymous sign in error:', error.message);
        throw error;
      }

      console.log('[Auth] Anonymous sign in successful, user:', data.user?.id);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('[Auth] Anonymous sign in error:', message);
      throw error;
    } finally {
      setIsAuthenticating(false);
    }
  };

  const signOut = async () => {
    if (!supabase) return;
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
    signInAnonymously,
    signOut,
  };
});
