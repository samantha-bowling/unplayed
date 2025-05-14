
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
import { callUpsertUser } from '@/utils/auth/callUpsertUser';

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
  refreshProfile: () => Promise<void>;
  refreshSession: () => Promise<void>;
  clearAuthError: () => void;
  isLoading: boolean;
  isAuthReady: boolean;
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

  const clearAuthError = useCallback(() => setLastError(null), []);

  const refreshSession = async () => {
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error || !data.session) throw error;
      setSession(data.session);
      setUser(data.session.user);
      await refreshProfile();
    } catch (error: any) {
      console.error('🔁 Failed to refresh session:', error.message);
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
    if (!user) return;
    try {
      setEnhancedStatus(EnhancedAuthStatus.PROFILE_LOADING);
      let { data, error } = await supabase.from('users').select('*').eq('id', user.id).single();

      if (!data || error?.code === 'PGRST116') {
        console.warn('[refreshProfile] No profile found. Attempting upsert...');
        await callUpsertUser();
        const retry = await supabase.from('users').select('*').eq('id', user.id).single();
        data = retry.data;
        error = retry.error;
      }

      if (error) throw error;
      setProfile(data);
      setEnhancedStatus(EnhancedAuthStatus.PROFILE_LOADED);
    } catch (error: any) {
      toast.error(`Failed to load profile: ${error.message}`);
      setLastError({
        code: 'profile_refresh_error',
        message: error.message,
        timestamp: Date.now(),
      });
      setEnhancedStatus(EnhancedAuthStatus.PROFILE_ERROR);
    }
  }, [user]);

  useEffect(() => {
    const loadSession = async () => {
      setIsLoading(true);
      const { data, error } = await supabase.auth.getSession();
      if (error || !data.session) {
        setAuthStatus(AuthStatus.UNAUTHENTICATED);
        setEnhancedStatus(EnhancedAuthStatus.SESSION_NOT_FOUND);
        setIsLoading(false);
        setIsAuthReady(true);
        return;
      }
      setSession(data.session);
      setUser(data.session.user);
      setAuthStatus(AuthStatus.AUTHENTICATED);
      setEnhancedStatus(EnhancedAuthStatus.SESSION_FOUND);
      await refreshProfile();
      setIsLoading(false);
      setIsAuthReady(true);
    };

    loadSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session) => {
        if (['INITIAL_SESSION', 'SIGNED_IN'].includes(event)) {
          setAuthStatus(AuthStatus.AUTHENTICATED);
          setSession(session);
          setUser(session?.user || null);
          await refreshProfile();
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

  useEffect(() => {
    const cleanup = setTimeout(() => {
      if (window.location.hash.includes('access_token')) {
        window.history.replaceState(null, '', window.location.pathname);
        console.log('🧹 Cleaned up #access_token from URL');
      }
    }, 500);

    return () => clearTimeout(cleanup);
  }, []);

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
