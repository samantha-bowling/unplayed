
// src/context/auth/provider.tsx
import React, { createContext, useState, useEffect, useMemo, useCallback } from 'react';
import { Session, User, AuthChangeEvent } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { getSessionFlag, removeSessionFlag, setSessionFlag } from '@/utils/auth-session-flags';
import { AuthContextType, AuthStatus, EnhancedAuthStatus, AppAuthState, AuthError } from './types';
import { isStableState, isAuthenticatedState, isProfileLoadingState } from './state-machine';
import { fetchUserProfile } from './profile';
import { signInWithProvider, signInWithEmail, signOut, refreshSession } from './actions';

// Create the context with undefined default
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

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
    isStableState(appAuthState), 
    [appAuthState]
  );

  const clearAuthError = useCallback(() => setLastError(null), []);

  // Wrap the refreshSession action with component state
  const handleRefreshSession = useCallback(async (): Promise<Session | null> => {
    return refreshSession(setEnhancedStatus, setSession, setUser, setLastError);
  }, []);

  // Wrap the refreshProfile action with component state
  const handleRefreshProfile = useCallback(async () => {
    if (!user) return null;
    
    setProfileRefreshAttempts(prev => prev + 1);
    const profileData = await fetchUserProfile(
      user, 
      setProfile, 
      setLastError, 
      profileRefreshAttempts, 
      setEnhancedStatus
    );
    
    // Reset refresh attempts counter on success
    if (profileData) {
      setProfileRefreshAttempts(0);
    }
    
    // Set flag that we have a just logged in user with a profile
    if (profileData && getSessionFlag('JUST_LOGGED_IN')) {
      console.log('Setting just logged in with profile flag');
    }
    
    return profileData;
  }, [user, profileRefreshAttempts]);

  // Wrap the signInWithProvider action with component state
  const handleSignInWithProvider = useCallback((
    provider: 'discord' | 'twitch',
    options?: { redirectTo?: string }
  ) => {
    return signInWithProvider(provider, options, setIsLoading, setLastError);
  }, []);

  // Wrap the signInWithEmail action with component state
  const handleSignInWithEmail = useCallback((email: string) => {
    return signInWithEmail(email, setIsLoading, setLastError);
  }, []);

  // Wrap the signOut action with component state
  const handleSignOut = useCallback(async () => {
    return signOut(setAuthStatus, setAppAuthState, setSession, setUser, setProfile);
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
        if (!isAuthenticatedState(appAuthState) && !isProfileLoadingState(appAuthState)) {
          console.log('[AuthContext] Transitioning to AUTHENTICATED state (no profile)');
          setAppAuthState('AUTHENTICATED');
          
          // Initiate profile loading
          setAppAuthState('PROFILE_LOADING');
          handleRefreshProfile().finally(() => {
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
  }, [user, profile, isProfileComplete, isSteamLinked, isAuthReady, appAuthState, handleRefreshProfile]);

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
            await handleRefreshProfile();
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
              
              handleRefreshProfile()
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
  }, [handleRefreshProfile, appAuthState]);

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
    signInWithProvider: handleSignInWithProvider,
    signInWithEmail: handleSignInWithEmail,
    signOut: handleSignOut,
    refreshProfile: handleRefreshProfile,
    refreshSession: handleRefreshSession,
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
    handleSignInWithProvider,
    handleSignInWithEmail,
    handleSignOut,
    handleRefreshProfile,
    handleRefreshSession,
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
