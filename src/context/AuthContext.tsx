
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate, useLocation } from 'react-router-dom';

// Auth status enum for more descriptive state management
export enum AuthStatus {
  LOADING = 'loading',
  AUTHENTICATED = 'authenticated',
  UNAUTHENTICATED = 'unauthenticated',
  ERROR = 'error'
}

// Enhanced auth status for more granular reporting
export enum EnhancedAuthStatus {
  INITIAL = 'initial',
  SESSION_LOADING = 'session_loading',
  SESSION_FOUND = 'session_found',
  SESSION_NOT_FOUND = 'session_not_found',
  PROFILE_LOADING = 'profile_loading',
  PROFILE_LOADED = 'profile_loaded',
  PROFILE_ERROR = 'profile_error',
  TOKEN_REFRESH_ERROR = 'token_refresh_error',
  AUTH_ERROR = 'auth_error'
}

type UserProfile = {
  id: string;
  steam_id: string;
  steam_name: string;
  steam_avatar: string;
  last_sync: string | null;
};

export type AuthError = {
  code: string;
  message: string;
  details?: any;
  recoverable?: boolean;
  timestamp: number;
};

type AuthContextType = {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  isLoading: boolean;
  authStatus: AuthStatus;
  enhancedStatus: EnhancedAuthStatus;
  lastError: AuthError | null;
  signInWithSteam: (redirectTo?: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  clearAuthError: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_STORAGE_REDIRECT_KEY = 'unplayed_auth_redirect';
const DEBUG_AUTH = process.env.NODE_ENV === 'development';

// Log auth events in development only
const logAuthEvent = (event: string, data?: any) => {
  if (DEBUG_AUTH) {
    console.debug(`[Auth] ${event}`, data || '');
  }
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authStatus, setAuthStatus] = useState<AuthStatus>(AuthStatus.LOADING);
  const [enhancedStatus, setEnhancedStatus] = useState<EnhancedAuthStatus>(EnhancedAuthStatus.INITIAL);
  const [lastError, setLastError] = useState<AuthError | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Clear the last auth error
  const clearAuthError = () => {
    setLastError(null);
  };

  // Record an auth error with proper structure
  const recordAuthError = (code: string, message: string, details?: any, recoverable: boolean = false) => {
    const error: AuthError = {
      code,
      message,
      details,
      recoverable,
      timestamp: Date.now()
    };
    
    logAuthEvent('Error recorded', error);
    setLastError(error);
    return error;
  };

  // Function to fetch user profile with retry logic
  const fetchProfile = async (userId: string, retryCount = 0): Promise<UserProfile | null> => {
    try {
      logAuthEvent('Fetching profile', { userId, retryCount });
      setEnhancedStatus(EnhancedAuthStatus.PROFILE_LOADING);
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        // If we get an error on fetch, retry a limited number of times
        if (retryCount < 3) {
          logAuthEvent('Profile fetch error, retrying', { error, retryCount });
          await new Promise(resolve => setTimeout(resolve, 500 * Math.pow(2, retryCount)));
          return fetchProfile(userId, retryCount + 1);
        }
        
        logAuthEvent('Profile fetch failed after retries', error);
        setEnhancedStatus(EnhancedAuthStatus.PROFILE_ERROR);
        recordAuthError('profile_fetch_error', 'Error fetching user profile', error, true);
        return null;
      }

      if (data) {
        logAuthEvent('Profile fetched successfully', { steamName: data.steam_name });
        setEnhancedStatus(EnhancedAuthStatus.PROFILE_LOADED);
        return data as UserProfile;
      } else {
        logAuthEvent('Profile not found');
        setEnhancedStatus(EnhancedAuthStatus.PROFILE_ERROR);
        recordAuthError('profile_not_found', 'User profile not found', null, true);
        return null;
      }
    } catch (error) {
      logAuthEvent('Exception in profile fetch', error);
      setEnhancedStatus(EnhancedAuthStatus.PROFILE_ERROR);
      recordAuthError('profile_exception', 'Exception while fetching profile', error, true);
      return null;
    }
  };

  // Public method to manually refresh profile data
  const refreshProfile = async () => {
    if (!user) return;
    
    try {
      logAuthEvent('Manual profile refresh', { userId: user.id });
      const profileData = await fetchProfile(user.id);
      if (profileData) {
        setProfile(profileData);
        return profileData;
      }
    } catch (error) {
      logAuthEvent('Manual profile refresh failed', error);
      toast({
        title: 'Profile Refresh Failed',
        description: 'Could not update your profile information.',
        variant: 'destructive',
      });
    }
    return null;
  };

  useEffect(() => {
    // Handle tokens in URL from auth callback
    const handleTokensFromUrl = async () => {
      const url = new URL(window.location.href);
      const accessToken = url.searchParams.get('access_token');
      const refreshToken = url.searchParams.get('refresh_token');

      if (accessToken && refreshToken) {
        try {
          logAuthEvent('Processing tokens from URL');
          setAuthStatus(AuthStatus.LOADING);
          setEnhancedStatus(EnhancedAuthStatus.SESSION_LOADING);
          
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) {
            throw error;
          }
          
          if (data.session) {
            logAuthEvent('Session established from URL tokens');
            setSession(data.session);
            setUser(data.session.user);
            setAuthStatus(AuthStatus.AUTHENTICATED);
            setEnhancedStatus(EnhancedAuthStatus.SESSION_FOUND);
            
            // Try to get stored redirect path
            const storedRedirect = localStorage.getItem(LOCAL_STORAGE_REDIRECT_KEY);
            if (storedRedirect) {
              localStorage.removeItem(LOCAL_STORAGE_REDIRECT_KEY);
              navigate(storedRedirect, { replace: true });
            } else {
              // Remove tokens from URL to prevent sharing sensitive data
              window.history.replaceState({}, document.title, '/');
            }
            
            toast({
              title: 'Sign In Successful',
              description: 'Welcome to Unplayed.wtf!',
            });
          }
        } catch (error) {
          logAuthEvent('Error setting session from URL tokens', error);
          setAuthStatus(AuthStatus.ERROR);
          setEnhancedStatus(EnhancedAuthStatus.AUTH_ERROR);
          recordAuthError('token_processing_error', 'Failed to process authentication tokens', error);
          
          toast({
            title: 'Authentication Error',
            description: 'Failed to complete authentication.',
            variant: 'destructive',
          });
        } finally {
          // Remove tokens from URL regardless of outcome
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      }
    };

    handleTokensFromUrl();
  }, [navigate, toast]);

  useEffect(() => {
    logAuthEvent('Setting up auth state management');
    setEnhancedStatus(EnhancedAuthStatus.SESSION_LOADING);
    
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        logAuthEvent('Auth state change', { event, userId: newSession?.user?.id });
        
        // Use setTimeout to prevent potential auth deadlocks
        setTimeout(() => {
          setSession(newSession);
          setUser(newSession?.user ?? null);
          
          if (newSession) {
            setAuthStatus(AuthStatus.AUTHENTICATED);
            setEnhancedStatus(EnhancedAuthStatus.SESSION_FOUND);
          } else {
            setAuthStatus(AuthStatus.UNAUTHENTICATED);
            setEnhancedStatus(EnhancedAuthStatus.SESSION_NOT_FOUND);
            setProfile(null);
          }
        }, 0);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session: existingSession }, error }) => {
      if (error) {
        logAuthEvent('Error getting session', error);
        setAuthStatus(AuthStatus.ERROR);
        setEnhancedStatus(EnhancedAuthStatus.AUTH_ERROR);
        recordAuthError('session_retrieval_error', 'Error retrieving session', error);
      } else if (existingSession) {
        logAuthEvent('Existing session found', { userId: existingSession.user.id });
        setSession(existingSession);
        setUser(existingSession.user);
        setAuthStatus(AuthStatus.AUTHENTICATED);
        setEnhancedStatus(EnhancedAuthStatus.SESSION_FOUND);
      } else {
        logAuthEvent('No existing session found');
        setAuthStatus(AuthStatus.UNAUTHENTICATED);
        setEnhancedStatus(EnhancedAuthStatus.SESSION_NOT_FOUND);
      }
      
      setIsLoading(false);
    });

    return () => {
      logAuthEvent('Unsubscribing from auth state changes');
      subscription.unsubscribe();
    };
  }, []);

  // Fetch user profile when user is authenticated
  useEffect(() => {
    if (!user) {
      setProfile(null);
      return;
    }

    const getProfile = async () => {
      try {
        const profileData = await fetchProfile(user.id);
        if (profileData) {
          setProfile(profileData);
        }
      } catch (error) {
        logAuthEvent('Error fetching profile after auth', error);
      }
    };

    getProfile();
  }, [user]);

  // Initialize Steam auth flow
  const signInWithSteam = async (redirectTo?: string) => {
    try {
      setIsLoading(true);
      logAuthEvent('Initiating Steam sign in', { redirectTo });
      
      // Store the redirect path if provided
      if (redirectTo) {
        localStorage.setItem(LOCAL_STORAGE_REDIRECT_KEY, redirectTo);
      } else if (location.pathname !== '/' && location.pathname !== '/auth') {
        // Store current path for return after auth
        localStorage.setItem(LOCAL_STORAGE_REDIRECT_KEY, location.pathname + location.search);
      }
      
      // Get login URL from our edge function
      const queryParams = redirectTo ? `?redirectTo=${encodeURIComponent(redirectTo)}` : '';
      const response = await fetch(`https://gwmygthanyycveyqqspr.supabase.co/functions/v1/steam-auth/login${queryParams}`);
      
      if (!response.ok) {
        throw new Error(`Failed to get Steam login URL: ${response.status} ${response.statusText}`);
      }
      
      const { url, error } = await response.json();
      
      if (error) {
        throw new Error(`Steam auth error: ${error.message || JSON.stringify(error)}`);
      }
      
      if (url) {
        // Show a loading toast before redirecting
        toast({
          title: 'Redirecting to Steam',
          description: 'Please wait while we connect to Steam...',
        });
        
        window.location.href = url;
      } else {
        throw new Error('Failed to get Steam login URL');
      }
    } catch (error) {
      logAuthEvent('Steam auth error', error);
      setIsLoading(false);
      
      const authError = recordAuthError(
        'steam_auth_error', 
        'Failed to initialize Steam login', 
        error
      );
      
      toast({
        title: 'Authentication Error',
        description: 'Failed to initialize Steam login. Please try again.',
        variant: 'destructive',
      });
      
      return Promise.reject(authError);
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      logAuthEvent('Signing out');
      await supabase.auth.signOut();
      
      // Clear any stored redirects
      localStorage.removeItem(LOCAL_STORAGE_REDIRECT_KEY);
      
      setAuthStatus(AuthStatus.UNAUTHENTICATED);
      setEnhancedStatus(EnhancedAuthStatus.SESSION_NOT_FOUND);
      navigate('/');
      
      toast({
        title: 'Signed Out',
        description: 'You have been successfully signed out.',
      });
    } catch (error) {
      logAuthEvent('Sign out error', error);
      recordAuthError('signout_error', 'Failed to sign out', error, true);
      
      toast({
        title: 'Sign Out Error',
        description: 'Failed to sign out. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        profile,
        isLoading,
        authStatus,
        enhancedStatus,
        lastError,
        signInWithSteam,
        signOut,
        refreshProfile,
        clearAuthError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Convenience hook for getting current auth status
export const useAuthStatus = () => {
  const { authStatus } = useAuth();
  return authStatus;
};

// New hook for getting enhanced auth status
export const useEnhancedAuthStatus = () => {
  const { enhancedStatus, lastError } = useAuth();
  return { enhancedStatus, lastError };
};
