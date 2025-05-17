
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

// Enhanced app auth state with transitional states
export type AppAuthState = 
  | 'ANONYMOUS'               // No user authenticated
  | 'AUTHENTICATED'           // User authenticated but profile not loaded
  | 'AUTH_TRANSITIONING'      // In the middle of an auth state change
  | 'PROFILE_LOADING'         // Profile is being loaded
  | 'ONBOARDING'              // User authenticated, profile exists but not complete
  | 'ONBOARDING_STEAM_LINK'   // Explicitly in the Steam linking phase
  | 'READY'                   // User fully authenticated with complete profile
  | 'ERROR';                  // Error state

export type AuthError = {
  code: string;
  message: string;
  timestamp: number;
  details?: any;
};

type AuthContextType = {
  authStatus: AuthStatus;
  enhancedStatus: EnhancedAuthStatus;
  appAuthState: AppAuthState;    // New explicit app state
  authIsStable: boolean;         // Derived property for UI stability checks
  session: Session | null;
  user: User | null;
  profile: any | null;
  lastError: AuthError | null;
  signInWithProvider: (provider: 'discord' | 'twitch', options?: { redirectTo?: string }) => Promise<void>;
  signInWithEmail: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<any>;
  refreshSession: () => Promise<Session | null>;
  clearAuthError: () => void;
  isLoading: boolean;
  isAuthReady: boolean;
  isAuthBootComplete: boolean;
  isSteamLinked: boolean;        // New property
  isProfileComplete: boolean;    // New property
};

// Create the context with a default value that's obviously not valid
// but allows for safer component tree structures
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Log when the context is created - helpful for debugging
console.log('AuthContext created');

// Maximum number of profile refresh attempts to prevent infinite loops
const MAX_REFRESH_ATTEMPTS = 5;

// Debug mode for development
const isDevMode = import.meta.env.DEV;

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  console.log('AuthProvider mounting'); // Debug log for component lifecycle
  
  const [authStatus, setAuthStatus] = useState(AuthStatus.LOADING);
  const [enhancedStatus, setEnhancedStatus] = useState(EnhancedAuthStatus.INITIAL);
  const [appAuthState, setAppAuthState] = useState<AppAuthState>('ANONYMOUS');
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [lastError, setLastError] = useState<AuthError | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isAuthBootComplete, setIsAuthBootComplete] = useState(false);
  const [profileRefreshAttempts, setProfileRefreshAttempts] = useState(0);
  
  // Derived state properties
  const isSteamLinked = useMemo(() => 
    Boolean(profile?.steam_id), 
    [profile?.steam_id]
  );
  
  const isProfileComplete = useMemo(() => 
    Boolean(profile?.onboarding_complete), 
    [profile?.onboarding_complete]
  );
  
  // New derived state indicating if the auth state is stable for UI rendering
  const authIsStable = useMemo(() => 
    appAuthState === 'READY' || 
    appAuthState === 'ONBOARDING' || 
    appAuthState === 'ANONYMOUS', 
    [appAuthState]
  );

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

  // Enhanced refreshProfile with retry limits and exponential backoff
  const refreshProfile = useCallback(async () => {
    if (!user) return null;
    
    try {
      setEnhancedStatus(EnhancedAuthStatus.PROFILE_LOADING);
      
      // Track retry attempts globally
      if (profileRefreshAttempts >= MAX_REFRESH_ATTEMPTS) {
        console.warn(`[Auth] Max profile refresh attempts (${MAX_REFRESH_ATTEMPTS}) reached for user ${user.id}`);
        setEnhancedStatus(EnhancedAuthStatus.PROFILE_ERROR);
        setAppAuthState('ERROR');
        setLastError({
          code: 'profile_refresh_max_retries',
          message: `Maximum profile refresh attempts reached (${MAX_REFRESH_ATTEMPTS})`,
          timestamp: Date.now(),
        });
        return null;
      }
      
      setProfileRefreshAttempts(prev => prev + 1);
      
      console.log(`Refreshing profile for user ${user.id} (attempt ${profileRefreshAttempts + 1})`);
      
      // Calculate backoff delay based on attempt number (exponential backoff)
      const backoffDelay = Math.min(100 * Math.pow(2, profileRefreshAttempts), 3000);
      if (profileRefreshAttempts > 0) {
        console.log(`[Auth] Using backoff delay of ${backoffDelay}ms for profile refresh`);
        await new Promise(resolve => setTimeout(resolve, backoffDelay));
      }
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Failed to load profile:', error.message);
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
      
      // Reset refresh attempts counter on success
      if (data) {
        setProfileRefreshAttempts(0);
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

  const signInWithProvider = useCallback(async (
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
      setAppAuthState('ANONYMOUS');
      setSession(null);
      setUser(null);
      setProfile(null);
      removeSessionFlag('JUST_LOGGED_IN');
      removeSessionFlag('AUTH_IN_PROGRESS');
      removeSessionFlag('AUTH_STARTED');
      
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

  // Centralized Auth State Machine - This is a key improvement
  // All state transitions are now in one place for clarity and debugging
  useEffect(() => {
    if (!isAuthReady) return;
    
    console.log('[AuthContext] Evaluating app auth state:', {
      user: !!user,
      profile: !!profile,
      isProfileComplete,
      isSteamLinked,
      currentState: appAuthState
    });
    
    try {
      // Don't transition out of error state automatically
      if (appAuthState === 'ERROR') return;
      
      // No user means anonymous state
      if (!user) {
        if (appAuthState !== 'ANONYMOUS') {
          console.log('[AuthContext] Transitioning to ANONYMOUS state');
          setAppAuthState('ANONYMOUS');
        }
        return;
      }
      
      // If we're loading the profile, stay in that state
      if (appAuthState === 'PROFILE_LOADING') return;
      
      // User authenticated but no profile yet
      if (user && !profile) {
        if (appAuthState !== 'AUTHENTICATED') {
          console.log('[AuthContext] Transitioning to AUTHENTICATED state (no profile)');
          setAppAuthState('AUTHENTICATED');
          
          // Initiate profile loading
          setAppAuthState('PROFILE_LOADING');
          refreshProfile().finally(() => {
            // Will re-evaluate state based on profile result
            if (appAuthState === 'PROFILE_LOADING') {
              setAppAuthState('AUTHENTICATED');
            }
          });
        }
        return;
      }
      
      // User with profile but onboarding not complete
      if (user && profile && !profile.onboarding_complete) {
        if (appAuthState !== 'ONBOARDING' && appAuthState !== 'ONBOARDING_STEAM_LINK') {
          console.log('[AuthContext] Transitioning to ONBOARDING state');
          setAppAuthState('ONBOARDING');
        }
        return;
      }
      
      // Special case for Steam linking phase during onboarding
      if (user && profile && !profile.steam_id && profile.onboarding_complete === false) {
        if (appAuthState !== 'ONBOARDING_STEAM_LINK') {
          console.log('[AuthContext] Transitioning to ONBOARDING_STEAM_LINK state');
          setAppAuthState('ONBOARDING_STEAM_LINK');
        }
        return;
      }
      
      // User with complete profile - fully ready
      if (user && profile && profile.onboarding_complete) {
        if (appAuthState !== 'READY') {
          console.log('[AuthContext] Transitioning to READY state');
          setAppAuthState('READY');
        }
        return;
      }
    } catch (err) {
      console.error('[AuthContext] Error in auth state evaluation:', err);
      setAppAuthState('ERROR');
      setLastError({
        code: 'auth_state_error',
        message: err instanceof Error ? err.message : 'Unknown auth state error',
        timestamp: Date.now()
      });
    }
  }, [user, profile, isProfileComplete, isSteamLinked, isAuthReady, appAuthState, refreshProfile]);

  // Export state to window object in dev mode
  useEffect(() => {
    if (isDevMode) {
      // Adding debug object to window
      window.__UNPLAYED_DEBUG__ = {
        authUser: user?.id,
        appAuthState,
        profileId: profile?.id,
        isProfileComplete,
        isSteamLinked,
        profileRefreshAttempts,
        authIsStable,
        isAuthReady,
        isAuthBootComplete
      };
      
      // Optional: log state changes to console
      console.log('[AuthContext Debug]', window.__UNPLAYED_DEBUG__);
    }
  }, [
    user, 
    appAuthState, 
    profile, 
    isProfileComplete, 
    isSteamLinked, 
    profileRefreshAttempts, 
    authIsStable, 
    isAuthReady, 
    isAuthBootComplete
  ]);

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
    console.log('AuthProvider initializing - setting up auth listeners');

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
          setAppAuthState('ANONYMOUS');
          setEnhancedStatus(EnhancedAuthStatus.SESSION_NOT_FOUND);
          setIsLoading(false);
          setIsAuthReady(true);
          setIsAuthBootComplete(true);
          return;
        }

        if (!data.session) {
          console.log('👋 Auth boot: No session found');
          setAuthStatus(AuthStatus.UNAUTHENTICATED);
          setAppAuthState('ANONYMOUS');
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
        setAppAuthState('AUTHENTICATED'); // Initial state, will be updated when profile is loaded
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
        setAppAuthState('ANONYMOUS');
        setEnhancedStatus(EnhancedAuthStatus.AUTH_ERROR);
        setIsLoading(false);
        setIsAuthReady(true);
        setIsAuthBootComplete(true);
      }
    };

    // Set up the auth state change listener first to prevent missing events
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event: AuthChangeEvent, session) => {
        console.log('🔑 Auth state change:', event, session ? 'session exists' : 'no session');

        if (["INITIAL_SESSION", "SIGNED_IN"].includes(event)) {
          setAuthStatus(AuthStatus.AUTHENTICATED);
          setAppAuthState('AUTH_TRANSITIONING');  // Use transitional state during auth changes
          setSession(session);
          setUser(session?.user || null);

          if (session?.user) {
            // Only set justLoggedIn flag on first sign in
            if (event === "SIGNED_IN") {
              setSessionFlag('JUST_LOGGED_IN');
            }
            
            // Refresh profile after short delay to avoid blocking the auth state change
            setTimeout(() => {
              // Transition to profile loading state explicitly 
              setAppAuthState('PROFILE_LOADING');
              
              refreshProfile()
                .catch(err => {
                  console.error('Error refreshing profile after auth state change:', err);
                  // State machine will handle the state transition based on the results
                })
                .finally(() => {
                  // If we're still in PROFILE_LOADING, transition back to AUTHENTICATED
                  // The state machine will then handle the appropriate transition
                  if (appAuthState === 'PROFILE_LOADING') {
                    setAppAuthState('AUTHENTICATED');
                  }
                });
            }, 0);
          }
        }

        if (event === 'SIGNED_OUT') {
          setAuthStatus(AuthStatus.UNAUTHENTICATED);
          setAppAuthState('ANONYMOUS');
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
    appAuthState,
    authIsStable,
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
    isSteamLinked,
    isProfileComplete,
  }), [
    authStatus,
    enhancedStatus,
    appAuthState,
    authIsStable,
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
    isSteamLinked,
    isProfileComplete,
  ]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  
  // Add detailed information to the error to help debugging
  if (!context) {
    console.error('[Auth] useAuth() called outside of AuthProvider context. Check component hierarchy.');
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};
