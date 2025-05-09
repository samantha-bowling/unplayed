
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

type UserProfile = {
  id: string;
  steam_id: string;
  steam_name: string;
  steam_avatar: string;
  last_sync: string | null;
};

type AuthContextType = {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  isLoading: boolean;
  authStatus: AuthStatus;
  signInWithSteam: (redirectTo?: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_STORAGE_REDIRECT_KEY = 'unplayed_auth_redirect';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authStatus, setAuthStatus] = useState<AuthStatus>(AuthStatus.LOADING);
  const [authError, setAuthError] = useState<Error | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  // Function to fetch user profile
  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching user profile:', error);
        return null;
      }

      return data as UserProfile;
    } catch (error) {
      console.error('Error in profile fetch:', error);
      return null;
    }
  };

  // Public method to manually refresh profile data
  const refreshProfile = async () => {
    if (!user) return;
    
    try {
      const profileData = await fetchProfile(user.id);
      if (profileData) {
        setProfile(profileData);
      }
    } catch (error) {
      console.error('Error refreshing profile:', error);
      toast({
        title: 'Profile Refresh Failed',
        description: 'Could not update your profile information.',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    // Check for access_token and refresh_token in URL params (from Steam auth redirect)
    const handleTokensFromUrl = async () => {
      const url = new URL(window.location.href);
      const accessToken = url.searchParams.get('access_token');
      const refreshToken = url.searchParams.get('refresh_token');

      if (accessToken && refreshToken) {
        try {
          setAuthStatus(AuthStatus.LOADING);
          
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) {
            throw error;
          }
          
          if (data.session) {
            setSession(data.session);
            setUser(data.session.user);
            setAuthStatus(AuthStatus.AUTHENTICATED);
            
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
          console.error('Error setting session:', error);
          setAuthStatus(AuthStatus.ERROR);
          setAuthError(error as Error);
          
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
    setAuthStatus(AuthStatus.LOADING);
    
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        console.log('Auth state change:', event);
        setSession(newSession);
        setUser(newSession?.user ?? null);
        
        if (newSession) {
          setAuthStatus(AuthStatus.AUTHENTICATED);
        } else {
          setAuthStatus(AuthStatus.UNAUTHENTICATED);
        }
        
        // For debugging
        if (event === 'SIGNED_OUT') {
          console.log('User signed out');
        } else if (event === 'SIGNED_IN') {
          console.log('User signed in');
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session: existingSession }, error }) => {
      setSession(existingSession);
      setUser(existingSession?.user ?? null);
      
      if (error) {
        console.error('Error getting session:', error);
        setAuthStatus(AuthStatus.ERROR);
        setAuthError(error);
      } else if (existingSession) {
        setAuthStatus(AuthStatus.AUTHENTICATED);
      } else {
        setAuthStatus(AuthStatus.UNAUTHENTICATED);
      }
      
      setIsLoading(false);
    });

    return () => {
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
        console.error('Error fetching profile after auth:', error);
      }
    };

    getProfile();
  }, [user]);

  // Initialize Steam auth flow
  const signInWithSteam = async (redirectTo?: string) => {
    try {
      setIsLoading(true);
      
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
      console.error('Steam auth error:', error);
      setIsLoading(false);
      
      toast({
        title: 'Authentication Error',
        description: 'Failed to initialize Steam login. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      
      // Clear any stored redirects
      localStorage.removeItem(LOCAL_STORAGE_REDIRECT_KEY);
      
      setAuthStatus(AuthStatus.UNAUTHENTICATED);
      navigate('/');
      
      toast({
        title: 'Signed Out',
        description: 'You have been successfully signed out.',
      });
    } catch (error) {
      console.error('Sign out error:', error);
      
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
        signInWithSteam,
        signOut,
        refreshProfile,
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
