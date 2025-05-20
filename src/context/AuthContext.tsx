// src/context/AuthContext.tsx
import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  useCallback,
} from 'react';
import { Session, User, Provider } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AuthState, AuthStorage, forceSignOut } from '@/utils/auth-service';

// The application uses a simplified auth state model with just three core states
// Keep for backward compatibility - we'll gradually migrate to AuthState from auth-service
export enum AuthStatus {
  LOADING = 'LOADING',
  AUTHENTICATED = 'AUTHENTICATED',
  UNAUTHENTICATED = 'UNAUTHENTICATED',
}

export type AuthError = {
  code: string;
  message: string;
};

type SteamUser = {
  steamId: string;
  personaName: string;
  avatar: string;
};

type AuthContextType = {
  status: AuthStatus;
  session: Session | null;
  user: User | null;
  profile: any | null;
  error: AuthError | null;
  signInWithProvider: (provider: Provider | 'steam', options?: { redirectTo?: string }) => Promise<void>;
  signInWithEmail: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: (forceRefresh?: boolean) => Promise<any>;
  clearError: () => void;
  isLoading: boolean;
  // Steam session properties merged in
  steamUser: SteamUser | null;
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Track the last time we refreshed the profile to avoid excessive refreshes
let lastProfileRefresh = 0;
const PROFILE_REFRESH_COOLDOWN = 2000; // 2 seconds cooldown

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [status, setStatus] = useState<AuthStatus>(AuthStatus.LOADING);
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [error, setError] = useState<AuthError | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [steamUser, setSteamUser] = useState<SteamUser | null>(null);

  const clearError = useCallback(() => setError(null), []);

  // Load steam user from localStorage on component mount
  useEffect(() => {
    const steamId = localStorage.getItem("steamId");
    const personaName = localStorage.getItem("personaName");
    const avatar = localStorage.getItem("avatar");

    if (steamId && personaName && avatar) {
      setSteamUser({ steamId, personaName, avatar });
    }
  }, []);

  // Profile refresh function with enhanced forceRefresh parameter
  const refreshProfile = useCallback(async (forceRefresh = false) => {
    if (!user) return null;
    
    // If forceRefresh is true, bypass the cooldown check
    const now = Date.now();
    if (!forceRefresh && now - lastProfileRefresh < PROFILE_REFRESH_COOLDOWN) {
      console.log('[Auth] Profile refresh skipped (cooldown active)');
      return profile; // Return existing profile during cooldown
    }
    
    try {
      setIsLoading(true);
      lastProfileRefresh = now;
      
      console.log(`[Auth] Refreshing profile for user ${user.id}, force=${forceRefresh}`);
      
      const { data, error: err } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (err) {
        console.error('Failed to load profile:', err.message);
        setError({
          code: 'profile_error',
          message: err.message
        });
        return null;
      }

      console.log('Profile refreshed successfully:', data ? 'found' : 'not found');
      setProfile(data);
      return data;
    } catch (err: any) {
      console.error('Failed to load profile:', err.message);
      setError({
        code: 'profile_error',
        message: err.message
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user, profile]);

  // Consolidated signInWithProvider function that includes the logic from src/utils/auth/signInWithProvider.ts
  const signInWithProvider = useCallback(async (
    provider: Provider | 'steam',
    options?: { redirectTo?: string }
  ) => {
    try {
      setIsLoading(true);
      clearError();
      setStatus(AuthStatus.LOADING);
      
      // Update auth state
      AuthStorage.setAuthState(AuthState.LOADING);
      
      // Set safety flag with expiration
      AuthStorage.setAuthFlag('AUTH_IN_PROGRESS', 'true', 5 * 60 * 1000); // 5 minutes max
      
      if (provider === 'steam') {
        // Handle Steam auth - redirect directly to auth/callback
        const uid = user?.id;
        if (!uid) {
          throw new Error('You must be logged in to link a Steam account');
        }
        
        const redirectTo = options?.redirectTo || `${window.location.origin}/auth/callback`;
        const steamAuthUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/steam-auth?uid=${uid}&redirectTo=${encodeURIComponent(redirectTo)}`;
        
        console.log(`[Auth] Initiating Steam linking for user ${uid}`);
        window.location.href = steamAuthUrl;
        return;
      }
      
      // For non-Steam providers, use Supabase OAuth
      const normalizedRedirectTo = options?.redirectTo || `${window.location.origin}/auth/callback`;
      console.log(`[Auth] Using redirect URL for ${provider}: ${normalizedRedirectTo}`);
      
      const { error: err, data } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: normalizedRedirectTo,
          scopes: provider === 'discord' ? 'identify email' : undefined,
        }
      });
      
      if (err) {
        console.error(`[Auth] ${provider} sign in error:`, err);
        // Update auth state
        AuthStorage.setAuthState(AuthState.UNAUTHENTICATED);
        // Clear auth flags
        AuthStorage.removeAuthFlag('AUTH_IN_PROGRESS');
        throw err;
      }
      
      console.log(`[Auth] ${provider} sign in initiated`, data);
      
    } catch (err: any) {
      toast.error(`Login with ${provider} failed: ${err.message}`);
      setError({
        code: 'oauth_error',
        message: err.message,
      });
      setStatus(AuthStatus.UNAUTHENTICATED);
      // Update auth state in storage
      AuthStorage.setAuthState(AuthState.UNAUTHENTICATED);
      // Clear auth flags
      AuthStorage.removeAuthFlag('AUTH_IN_PROGRESS');
    } finally {
      setIsLoading(false);
    }
  }, [clearError, user?.id]);

  // Sign in with email (magic link)
  const signInWithEmail = useCallback(async (email: string) => {
    try {
      setIsLoading(true);
      clearError();
      setStatus(AuthStatus.LOADING);
      
      // Update auth state
      AuthStorage.setAuthState(AuthState.LOADING);
      
      const { error: err } = await supabase.auth.signInWithOtp({ email });
      
      if (err) throw err;
      
      toast.success('Check your email for a magic link!');
    } catch (err: any) {
      toast.error(`Magic link login failed: ${err.message}`);
      setError({
        code: 'email_login_error',
        message: err.message,
      });
      setStatus(AuthStatus.UNAUTHENTICATED);
      // Update auth state in storage
      AuthStorage.setAuthState(AuthState.UNAUTHENTICATED);
    } finally {
      setIsLoading(false);
    }
  }, [clearError]);

  // Sign out
  const signOut = useCallback(async () => {
    try {
      setIsLoading(true);
      await supabase.auth.signOut();
      
      // Clear auth state and data
      setStatus(AuthStatus.UNAUTHENTICATED);
      setSession(null);
      setUser(null);
      setProfile(null);
      
      // Clear auth state in storage
      AuthStorage.clearAuthData();
      
      // Clear Steam user data on logout
      setSteamUser(null);
      localStorage.removeItem("steamId");
      localStorage.removeItem("personaName");
      localStorage.removeItem("avatar");
      
      toast.info('You have been signed out');
    } catch (err: any) {
      toast.error(`Sign out failed: ${err.message}`);
      setError({
        code: 'sign_out_error',
        message: err.message,
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Authentication state management using the simplified three-state system
  useEffect(() => {
    // Set up the auth state change listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.log('🔑 Auth state change:', event, currentSession ? 'session exists' : 'no session');

        if (currentSession) {
          setStatus(AuthStatus.AUTHENTICATED);
          setSession(currentSession);
          setUser(currentSession.user);
          // Update auth state in storage
          AuthStorage.setAuthState(AuthState.AUTHENTICATED);
          
          // If we just signed in, refresh the profile
          if (event === 'SIGNED_IN') {
            // Use setTimeout to avoid potential deadlock with Supabase
            setTimeout(() => {
              refreshProfile(true);
            }, 0);
          }
        } else {
          setStatus(AuthStatus.UNAUTHENTICATED);
          setSession(null);
          setUser(null);
          setProfile(null);
          // Update auth state in storage
          AuthStorage.setAuthState(AuthState.UNAUTHENTICATED);
        }
      }
    );

    // Then load the session
    const loadSession = async () => {
      setIsLoading(true);
      try {
        const { data, error: err } = await supabase.auth.getSession();
        
        if (err) {
          console.error('Error loading session:', err.message);
          setError({
            code: 'session_load_error',
            message: err.message,
          });
          setStatus(AuthStatus.UNAUTHENTICATED);
          // Update auth state in storage
          AuthStorage.setAuthState(AuthState.UNAUTHENTICATED);
        } else if (!data.session) {
          console.log('No session found');
          setStatus(AuthStatus.UNAUTHENTICATED);
          // Update auth state in storage
          AuthStorage.setAuthState(AuthState.UNAUTHENTICATED);
        } else {
          console.log('Session found');
          setStatus(AuthStatus.AUTHENTICATED);
          setSession(data.session);
          setUser(data.session.user);
          // Update auth state in storage
          AuthStorage.setAuthState(AuthState.AUTHENTICATED);
          
          // Check for user profile only upon initial session load
          refreshProfile();
        }
      } catch (err: any) {
        console.error('Critical error:', err.message);
        setError({
          code: 'auth_error',
          message: err.message,
        });
        setStatus(AuthStatus.UNAUTHENTICATED);
        // Update auth state in storage
        AuthStorage.setAuthState(AuthState.UNAUTHENTICATED);
      } finally {
        setIsLoading(false);
      }
    };

    loadSession();

    return () => {
      subscription.unsubscribe();
    };
  }, [refreshProfile]);

  const contextValue = {
    status,
    session,
    user,
    profile,
    error,
    signInWithProvider,
    signInWithEmail,
    signOut,
    refreshProfile,
    clearError,
    isLoading,
    steamUser,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    console.error('[Auth] useAuth() called outside of AuthProvider context');
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};
