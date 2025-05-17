
// src/context/AuthContext.tsx
import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  useCallback,
  useMemo,
} from 'react';
import { Session, User, AuthChangeEvent } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { signInWithProvider as baseSignInWithProvider } from '@/utils/auth/signInWithProvider';
import { getSessionFlag, removeSessionFlag, setSessionFlag, isAuthInProgress } from '@/utils/auth-session-flags';

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
  LIBRARY_READY = 'LIBRARY_READY',
  LIBRARY_UPDATING = 'LIBRARY_UPDATING',
  LIBRARY_LOADING = 'LIBRARY_LOADING',
  TOKEN_REFRESHING = 'TOKEN_REFRESHING',
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
  signInWithProvider: (provider: 'discord' | 'twitch' | 'steam', options?: { redirectTo?: string }) => Promise<void>;
  signInWithEmail: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<any>;
  refreshSession: () => Promise<Session | null>;
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
  const [profileRefreshAttempts, setProfileRefreshAttempts] = useState(0);

  const clearAuthError = useCallback(() => setLastError(null), []);

  const refreshSession = useCallback(async (): Promise<Session | null> => {
    try {
      console.log('🔄 Refreshing session...');
      setEnhancedStatus(EnhancedAuthStatus.TOKEN_REFRESHING);
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('🔄 Failed to refresh session:', error.message);
        setLastError({
          code: 'session_refresh_error',
          message: error.message,
          timestamp: Date.now(),
        });
        setEnhancedStatus(EnhancedAuthStatus.TOKEN_REFRESH_ERROR);
        throw error;
      }
      
      if (!data.session) {
        console.warn('🔄 No session found during refresh');
        setEnhancedStatus(EnhancedAuthStatus.SESSION_NOT_FOUND);
        return null;
      }
      
      console.log('🔄 Session refreshed successfully');
      setSession(data.session);
      setUser(data.session.user);
      setEnhancedStatus(EnhancedAuthStatus.SESSION_FOUND);
      return data.session;
    } catch (error: any) {
      console.error('🔄 Failed to refresh session:', error.message);
      setLastError({
        code: 'session_refresh_error',
        message: error.message,
        timestamp: Date.now(),
      });
      setEnhancedStatus(EnhancedAuthStatus.TOKEN_REFRESH_ERROR);
      return null;
    }
  }, []);

  const signInWithProvider = useCallback(async (
    provider: 'discord' | 'twitch' | 'steam',
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
  }, []);

  const signInWithEmail = useCallback(async (email: string) => {
    try {
      setIsLoading(true);
      setSessionFlag('AUTH_STARTED');
      
      const { error } = await supabase.auth.signInWithOtp({ email });
      
      if (error) throw error;
      
      toast.success('Check your email for a magic link!');
    } catch (error: any) {
      toast.error(`Magic link login failed: ${error.message}`);
      setLastError({
        code: 'email_login_error',
        message: error.message,
        timestamp: Date.now(),
      });
      removeSessionFlag('AUTH_STARTED');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      setAuthStatus(AuthStatus.UNAUTHENTICATED);
      setSession(null);
      setUser(null);
      setProfile(null);
      removeSessionFlag('JUST_LOGGED_IN');
      
      toast.info('You have been signed out');
    } catch (error: any) {
      toast.error(`Sign out failed: ${error.message}`);
      setLastError({
        code: 'sign_out_failed',
        message: error.message,
        timestamp: Date.now(),
      });
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!user) return null;
    
    try {
      setEnhancedStatus(EnhancedAuthStatus.PROFILE_LOADING);
      setProfileRefreshAttempts(prev => prev + 1);
      
      console.log(`Refreshing profile for user ${user.id} (attempt ${profileRefreshAttempts + 1})`);
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Failed to load profile:', error.message);
        setProfile(null);
        setEnhancedStatus(EnhancedAuthStatus.PROFILE_ERROR);
        return null;
      }

      console.log('Profile refreshed successfully:', data ? 'found' : 'not found');
      
      // Store the result - might be null if user doesn't exist in users table yet
      setProfile(data);
      setEnhancedStatus(data ? EnhancedAuthStatus.PROFILE_LOADED : EnhancedAuthStatus.PROFILE_ERROR);
      
      // Set flag that we have a just logged in user with a profile
      if (data && getSessionFlag('JUST_LOGGED_IN')) {
        console.log('Setting just logged in with profile flag');
      }
      
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
  }, [user, profileRefreshAttempts]);

  // Clear the just logged in flag when component unmounts
  useEffect(() => {
    return () => {
      try {
        console.log('AuthProvider unmounting, cleaning up session flags');
        removeSessionFlag('AUTH_IN_PROGRESS');
      } catch (error) {
        console.error('Error clearing auth flags on unmount:', error);
      }
    };
  }, []);

  // Setup auth state change listener and initial session check
  useEffect(() => {
    const loadSession = async () => {
      setIsLoading(true);
      setEnhancedStatus(EnhancedAuthStatus.SESSION_LOADING);
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

        // Load profile in a non-blocking way
        setTimeout(async () => {
          try {
            await refreshProfile();
          } catch (profileError) {
            console.error('👋 Auth boot: Error loading profile:', profileError);
          }
        }, 0);

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

    // Set up the auth state change listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session) => {
        console.log('🔑 Auth state change:', event, session ? 'session exists' : 'no session');

        if (["INITIAL_SESSION", "SIGNED_IN"].includes(event)) {
          setAuthStatus(AuthStatus.AUTHENTICATED);
          setSession(session);
          setUser(session?.user || null);

          if (session?.user) {
            // Only set justLoggedIn flag on first sign in
            if (event === "SIGNED_IN") {
              setSessionFlag('JUST_LOGGED_IN');
            }
            
            // Refresh profile after short delay to avoid blocking the auth state change
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
          removeSessionFlag('JUST_LOGGED_IN');
          removeSessionFlag('AUTH_IN_PROGRESS');
          removeSessionFlag('AUTH_STARTED');
        }
      }
    );

    // Then load the session
    loadSession();

    return () => {
      subscription.unsubscribe();
    };
  }, [refreshProfile]);

  // Create a stable context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
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
  }), [
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
  ]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
