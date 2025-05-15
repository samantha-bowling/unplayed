
// src/context/AuthContext.tsx
import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  useCallback,
} from 'react';
import { Session, User, AuthChangeEvent } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { getRedirectUrl, signInWithProvider as baseSignInWithProvider } from '@/utils/auth/signInWithProvider';

export enum AuthStatus {
  LOADING = 'LOADING',
  AUTHENTICATED = 'AUTHENTICATED',
  UNAUTHENTICATED = 'UNAUTHENTICATED',
}

export enum EnhancedAuthStatus {
  INITIAL = 'INITIAL',
  SESSION_LOADING = 'SESSION_LOADING',
  SESSION_NOT_FOUND = 'SESSION_NOT_FOUND',
  SESSION_FOUND = 'SESSION_FOUND',
  PROFILE_LOADING = 'PROFILE_LOADING',
  PROFILE_LOADED = 'PROFILE_LOADED',
  PROFILE_ERROR = 'PROFILE_ERROR',
  AUTH_ERROR = 'AUTH_ERROR',
  LIBRARY_IMPORTING = 'LIBRARY_IMPORTING',
  TOKEN_REFRESH_ERROR = 'TOKEN_REFRESH_ERROR',
  LIBRARY_ERROR = 'LIBRARY_ERROR',
}

export type AuthError = {
  code: string;
  message: string;
  timestamp: number;
  details?: any;
};

type AuthContextType = {
  authStatus: AuthStatus;
  enhancedStatus: EnhancedAuthStatus;
  session: Session | null;
  user: User | null;
  profile: any | null;
  lastError: AuthError | null;
  signInWithProvider: (provider: 'discord' | 'twitch', options?: { redirectTo?: string }) => Promise<void>;
  signInWithEmail: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<any>; // Return the profile for better chaining
  refreshSession: () => Promise<void>;
  clearAuthError: () => void;
  isLoading: boolean;
  isAuthReady: boolean;
  isAuthBootComplete: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [authStatus, setAuthStatus] = useState(AuthStatus.LOADING);
  const [enhancedStatus, setEnhancedStatus] = useState(EnhancedAuthStatus.INITIAL);
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [lastError, setLastError] = useState<AuthError | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isAuthBootComplete, setIsAuthBootComplete] = useState(false);

  const clearAuthError = useCallback(() => setLastError(null), []);

  const refreshSession = async () => {
    try {
      console.log('🔄 Refreshing session...');
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.error('🔄 Failed to refresh session:', error.message);
        setLastError({
          code: 'session_refresh_error',
          message: error.message,
          timestamp: Date.now(),
        });
        throw error;
      }
      
      if (!data.session) {
        console.warn('🔄 No session found during refresh');
        return;
      }
      
      console.log('🔄 Session refreshed successfully');
      setSession(data.session);
      setUser(data.session.user);
      return data.session;
    } catch (error: any) {
      console.error('🔄 Failed to refresh session:', error.message);
      setLastError({
        code: 'session_refresh_error',
        message: error.message,
        timestamp: Date.now(),
      });
    }
  };

  const signInWithProvider = async (
    provider: 'discord' | 'twitch',
    options?: { redirectTo?: string }
  ) => {
    try {
      setIsLoading(true);
      await baseSignInWithProvider(provider, options?.redirectTo);
    } catch (error: any) {
      toast.error(`Login with ${provider} failed: ${error.message}`);
      setLastError({
        code: 'oauth_error',
        message: error.message,
        timestamp: Date.now(),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithEmail = async (email: string) => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signInWithOtp({ email });
      if (error) throw error;
    } catch (error: any) {
      toast.error(`Magic link login failed: ${error.message}`);
      setLastError({
        code: 'email_login_error',
        message: error.message,
        timestamp: Date.now(),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setAuthStatus(AuthStatus.UNAUTHENTICATED);
      setSession(null);
      setUser(null);
      setProfile(null);
    } catch (error: any) {
      toast.error(`Sign out failed: ${error.message}`);
      setLastError({
        code: 'sign_out_failed',
        message: error.message,
        timestamp: Date.now(),
      });
    }
  };

  const refreshProfile = useCallback(async () => {
    if (!user) return null;
    try {
      setEnhancedStatus(EnhancedAuthStatus.PROFILE_LOADING);
      const { data, error } = await supabase.from('users').select('*').eq('id', user.id).single();

      if (error) {
        console.error('Failed to load profile:', error.message);
        setProfile(null);
        setEnhancedStatus(EnhancedAuthStatus.PROFILE_ERROR);
        return null;
      }

      setProfile(data);
      setEnhancedStatus(EnhancedAuthStatus.PROFILE_LOADED);
      return data;
    } catch (error: any) {
      console.error('Failed to load profile:', error.message);
      setLastError({
        code: 'profile_refresh_error',
        message: error.message,
        timestamp: Date.now(),
      });
      setEnhancedStatus(EnhancedAuthStatus.PROFILE_ERROR);
      return null;
    }
  }, [user]);

  useEffect(() => {
    const loadSession = async () => {
      setIsLoading(true);
      console.log('👋 Auth boot: Starting session load...');

      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.error('👋 Auth boot: Error loading session:', error.message);
          setLastError({
            code: 'session_load_error',
            message: error.message,
            timestamp: Date.now(),
          });
          setAuthStatus(AuthStatus.UNAUTHENTICATED);
          setEnhancedStatus(EnhancedAuthStatus.SESSION_NOT_FOUND);
          setIsLoading(false);
          setIsAuthReady(true);
          setIsAuthBootComplete(true);
          return;
        }

        if (!data.session) {
          console.log('👋 Auth boot: No session found');
          setAuthStatus(AuthStatus.UNAUTHENTICATED);
          setEnhancedStatus(EnhancedAuthStatus.SESSION_NOT_FOUND);
          setIsLoading(false);
          setIsAuthReady(true);
          setIsAuthBootComplete(true);
          return;
        }

        console.log('👋 Auth boot: Session found');
        setSession(data.session);
        setUser(data.session.user);
        setAuthStatus(AuthStatus.AUTHENTICATED);
        setEnhancedStatus(EnhancedAuthStatus.SESSION_FOUND);
        
        try {
          await refreshProfile();
        } catch (profileError) {
          console.error('👋 Auth boot: Error loading profile:', profileError);
        }
        
        setIsLoading(false);
        setIsAuthReady(true);
        setIsAuthBootComplete(true);
      } catch (error: any) {
        console.error('👋 Auth boot: Critical error:', error.message);
        setLastError({
          code: 'auth_boot_error',
          message: error.message,
          timestamp: Date.now(),
        });
        setAuthStatus(AuthStatus.UNAUTHENTICATED);
        setEnhancedStatus(EnhancedAuthStatus.AUTH_ERROR);
        setIsLoading(false);
        setIsAuthReady(true);
        setIsAuthBootComplete(true);
      }
    };

    loadSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session) => {
        console.log('🔑 Auth state change:', event, session ? 'session exists' : 'no session');
        
        if (['INITIAL_SESSION', 'SIGNED_IN'].includes(event)) {
          setAuthStatus(AuthStatus.AUTHENTICATED);
          setSession(session);
          setUser(session?.user || null);
          
          // Don't call refreshProfile directly in the callback - could cause deadlocks
          // Use setTimeout to defer execution to the next event loop tick
          if (session?.user) {
            setTimeout(() => {
              refreshProfile().catch(err => {
                console.error('Error refreshing profile after auth state change:', err);
              });
            }, 0);
          }
        }
        
        if (event === 'SIGNED_OUT') {
          setAuthStatus(AuthStatus.UNAUTHENTICATED);
          setSession(null);
          setUser(null);
          setProfile(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [refreshProfile]);

  // Remove token cleanup function entirely - let Supabase handle this
  // The premature cleanup was causing issues with token processing

  return (
    <AuthContext.Provider
      value={{
        authStatus,
        enhancedStatus,
        session,
        user,
        profile,
        lastError,
        signInWithProvider,
        signInWithEmail,
        signOut,
        refreshProfile,
        refreshSession,
        clearAuthError,
        isLoading,
        isAuthReady,
        isAuthBootComplete,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
