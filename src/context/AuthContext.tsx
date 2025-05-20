
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

// The application uses a simplified auth state model with just three core states
export enum AuthStatus {
  LOADING = 'LOADING',
  AUTHENTICATED = 'AUTHENTICATED',
  UNAUTHENTICATED = 'UNAUTHENTICATED',
}

export type AuthError = {
  code: string;
  message: string;
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
  refreshProfile: () => Promise<any>;
  clearError: () => void;
  isLoading: boolean;
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [status, setStatus] = useState<AuthStatus>(AuthStatus.LOADING);
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [error, setError] = useState<AuthError | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const clearError = useCallback(() => setError(null), []);

  // Profile refresh function
  const refreshProfile = useCallback(async () => {
    if (!user) return null;
    
    try {
      setIsLoading(true);
      
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
  }, [user]);

  // Sign in with provider (Discord, Twitch, Steam)
  const signInWithProvider = useCallback(async (
    provider: Provider | 'steam',
    options?: { redirectTo?: string }
  ) => {
    try {
      setIsLoading(true);
      clearError();
      setStatus(AuthStatus.LOADING);
      
      if (provider === 'steam') {
        // Handle Steam auth separately since it's not directly supported by Supabase auth
        const uid = user?.id;
        if (!uid) {
          throw new Error('You must be logged in to link a Steam account');
        }
        
        const redirectTo = options?.redirectTo || `${window.location.origin}/auth/callback`;
        const steamAuthUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/steam-auth?uid=${uid}&redirectTo=${encodeURIComponent(redirectTo)}`;
        
        window.location.href = steamAuthUrl;
        return;
      }
      
      const { error: err } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: options?.redirectTo || `${window.location.origin}/auth/callback`,
          scopes: provider === 'discord' ? 'identify email' : undefined,
        }
      });
      
      if (err) throw err;
    } catch (err: any) {
      toast.error(`Login with ${provider} failed: ${err.message}`);
      setError({
        code: 'oauth_error',
        message: err.message,
      });
      setStatus(AuthStatus.UNAUTHENTICATED);
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
    } finally {
      setIsLoading(false);
    }
  }, [clearError]);

  // Sign out
  const signOut = useCallback(async () => {
    try {
      setIsLoading(true);
      await supabase.auth.signOut();
      setStatus(AuthStatus.UNAUTHENTICATED);
      setSession(null);
      setUser(null);
      setProfile(null);
      
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
        } else {
          setStatus(AuthStatus.UNAUTHENTICATED);
          setSession(null);
          setUser(null);
          setProfile(null);
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
        } else if (!data.session) {
          console.log('No session found');
          setStatus(AuthStatus.UNAUTHENTICATED);
        } else {
          console.log('Session found');
          setStatus(AuthStatus.AUTHENTICATED);
          setSession(data.session);
          setUser(data.session.user);
          
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
