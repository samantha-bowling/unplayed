
import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  useCallback,
} from 'react';
import {
  Session,
  User,
  AuthChangeEvent,
} from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

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
  TOKEN_REFRESHING = 'TOKEN_REFRESHING',
  TOKEN_REFRESH_ERROR = 'TOKEN_REFRESH_ERROR',
  PROFILE_LOADING = 'PROFILE_LOADING',
  PROFILE_LOADED = 'PROFILE_LOADED',
  PROFILE_ERROR = 'PROFILE_ERROR',
  LIBRARY_LOADING = 'LIBRARY_LOADING',
  LIBRARY_READY = 'LIBRARY_READY',
  LIBRARY_ERROR = 'LIBRARY_ERROR',
  LIBRARY_IMPORTING = 'LIBRARY_IMPORTING',
  LIBRARY_UPDATING = 'LIBRARY_UPDATING',
  AUTH_ERROR = 'AUTH_ERROR',
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
  library: any | null;
  lastError: AuthError | null;
  signInWithSteam: (redirectTo?: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  refreshSession: () => Promise<void>;
  clearAuthError: () => void;
  isLoading: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type AuthProviderProps = {
  children: React.ReactNode;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [authStatus, setAuthStatus] = useState<AuthStatus>(AuthStatus.LOADING);
  const [enhancedStatus, setEnhancedStatus] = useState<EnhancedAuthStatus>(EnhancedAuthStatus.SESSION_LOADING);
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [library, setLibrary] = useState<any | null>(null);
  const [lastError, setLastError] = useState<AuthError | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // Clear authentication errors
  const clearAuthError = useCallback(() => {
    setLastError(null);
  }, []);
  
  // Refresh session tokens if needed
  const refreshSession = useCallback(async () => {
    try {
      setEnhancedStatus(EnhancedAuthStatus.TOKEN_REFRESHING);
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('Session refresh error:', error);
        setLastError({
          code: 'token_refresh_failed',
          message: error.message || 'Failed to refresh authentication tokens',
          timestamp: Date.now()
        });
        setEnhancedStatus(EnhancedAuthStatus.TOKEN_REFRESH_ERROR);
        return;
      }
      
      if (data.session) {
        setSession(data.session);
        setUser(data.session.user);
        setEnhancedStatus(EnhancedAuthStatus.SESSION_FOUND);
        console.log('Session refreshed successfully');
      } else {
        setEnhancedStatus(EnhancedAuthStatus.SESSION_NOT_FOUND);
      }
    } catch (error) {
      console.error('Unexpected error during session refresh:', error);
      setLastError({
        code: 'session_refresh_error',
        message: String(error) || 'Unexpected error during session refresh',
        timestamp: Date.now()
      });
      setEnhancedStatus(EnhancedAuthStatus.TOKEN_REFRESH_ERROR);
    }
  }, []);
  
  const signInWithSteam = async (redirectTo?: string) => {
    try {
      setEnhancedStatus(EnhancedAuthStatus.SESSION_LOADING);
      setIsLoading(true);
      
      // Instead of using Supabase OAuth, directly call our Steam auth edge function
      const response = await fetch('/api/auth/steam/login' + 
        (redirectTo ? `?redirectTo=${encodeURIComponent(redirectTo)}` : ''));
      
      if (!response.ok) {
        console.error('Steam auth edge function error:', await response.text());
        setLastError({
          code: 'steam_login_failed',
          message: `Failed to initiate Steam sign-in (Status: ${response.status})`,
          timestamp: Date.now()
        });
        setEnhancedStatus(EnhancedAuthStatus.AUTH_ERROR);
        setIsLoading(false);
        return;
      }
      
      // Get the login URL from the edge function
      const { url } = await response.json();
      
      if (!url) {
        console.error('Steam login URL not provided by edge function');
        setLastError({
          code: 'invalid_steam_url',
          message: 'The authentication service did not provide a valid login URL',
          timestamp: Date.now()
        });
        setEnhancedStatus(EnhancedAuthStatus.AUTH_ERROR);
        setIsLoading(false);
        return;
      }
      
      console.log('Steam sign-in initiated, redirecting to:', url);
      
      // Redirect to the Steam OpenID login page
      window.location.href = url;
      
      // Note: The code execution stops here as the page will redirect
      // The rest of the authentication flow is handled after the redirect callback
      
    } catch (error) {
      console.error('Unexpected error during Steam sign-in:', error);
      setLastError({
        code: 'steam_sign_in_error',
        message: String(error) || 'Unexpected error during Steam sign-in',
        timestamp: Date.now()
      });
      setEnhancedStatus(EnhancedAuthStatus.AUTH_ERROR);
      setIsLoading(false);
    }
  };
  
  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setAuthStatus(AuthStatus.UNAUTHENTICATED);
      setEnhancedStatus(EnhancedAuthStatus.SESSION_NOT_FOUND);
      setSession(null);
      setUser(null);
      setProfile(null);
      setLibrary(null);
      setIsLoading(false);
      console.log('Signed out successfully');
    } catch (error) {
      console.error('Sign-out error:', error);
      setLastError({
        code: 'sign_out_failed',
        message: String(error) || 'Failed to sign out',
        timestamp: Date.now()
      });
    }
  };

  const getLibrary = useCallback(async (profileData: any) => {
    if (!profileData?.steam_id) {
      console.log("Can't load library: No Steam ID in profile");
      return;
    }
    
    try {
      console.log("Attempting to load game library...");
      setEnhancedStatus(EnhancedAuthStatus.LIBRARY_LOADING);
      
      // Load the library data
      const { data: libraryData, error: libraryError } = await supabase
        .from('user_games')
        .select('game_id, playtime_minutes, last_played_date, games(name, image_url)')
        .eq('user_id', user?.id);
        
      if (libraryError) {
        console.error("Error fetching library:", libraryError);
        setLastError({
          code: 'library_load_failed',
          message: libraryError.message || 'Failed to load game library',
          timestamp: Date.now()
        });
        setEnhancedStatus(EnhancedAuthStatus.LIBRARY_ERROR);
        return;
      }
      
      if (!libraryData) {
        console.warn("No library data found");
        setEnhancedStatus(EnhancedAuthStatus.LIBRARY_READY);
        return;
      }
      
      // Transform the data to include game details
      const gamesWithDetails = libraryData.map((item: any) => ({
        game_id: item.game_id,
        playtime_minutes: item.playtime_minutes,
        last_played_date: item.last_played_date,
        name: item.games?.name || 'Unknown Game',
        image_url: item.games?.image_url || null,
      }));
      
      console.log(`Library loaded successfully with ${gamesWithDetails.length} games`);
      setLibrary(gamesWithDetails);
      setEnhancedStatus(EnhancedAuthStatus.LIBRARY_READY);
      
    } catch (error) {
      console.error("Unhandled error loading library:", error);
      setLastError({
        code: 'library_load_error',
        message: String(error) || 'Unknown error loading game library',
        timestamp: Date.now()
      });
      setEnhancedStatus(EnhancedAuthStatus.LIBRARY_ERROR);
    }
  }, [user?.id]);

  const refreshProfile = useCallback(async () => {
    // Make sure we have a user
    if (!user) {
      console.log("Can't refresh profile: No user");
      return;
    }
    
    try {
      console.log("Attempting to refresh profile data...");
      setEnhancedStatus(EnhancedAuthStatus.PROFILE_LOADING);
      
      // Get the profile data
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();
        
      if (error) {
        console.error("Error fetching profile during refresh:", error);
        setLastError({
          code: 'profile_refresh_failed',
          message: error.message || 'Failed to refresh profile data',
          timestamp: Date.now()
        });
        setEnhancedStatus(EnhancedAuthStatus.PROFILE_ERROR);
        return;
      }
      
      if (!data) {
        console.error("No profile found during refresh");
        setLastError({
          code: 'profile_not_found',
          message: 'No profile data found for this user',
          timestamp: Date.now()
        });
        setEnhancedStatus(EnhancedAuthStatus.PROFILE_ERROR);
        return;
      }

      const refreshUserSession = useCallback(async () => {
        try {
          const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
          if (sessionError) {
            console.error('Failed to refresh session:', sessionError);
            return;
          }
      
          if (sessionData?.session) {
            setSession(sessionData.session);
            setUser(sessionData.session.user);
            setAuthStatus(AuthStatus.AUTHENTICATED);
            setEnhancedStatus(EnhancedAuthStatus.SESSION_FOUND);
      
            await refreshProfile();
          } else {
            console.warn('No session found during manual refresh');
          }
        } catch (err) {
          console.error('Unexpected error in refreshUserSession:', err);
        }
      }, [refreshProfile]);

      console.log("Profile refresh successful");
      setProfile(data);
      setEnhancedStatus(EnhancedAuthStatus.PROFILE_LOADED);
      
      // Attempt to get the library now that we have the profile
      try {
        await getLibrary(data);
      } catch (libError) {
        console.error("Error loading library during refresh:", libError);
        // Non-fatal error, we'll still set the profile as loaded
      }
      
    } catch (error) {
      console.error("Unhandled error in profile refresh:", error);
      setLastError({
        code: 'profile_refresh_error',
        message: String(error) || 'Unknown error during profile refresh',
        timestamp: Date.now()
      });
      setEnhancedStatus(EnhancedAuthStatus.PROFILE_ERROR);
    }
  }, [user, getLibrary]);
  
  useEffect(() => {
    // Initial load of session and user data
    const loadSession = async () => {
      setEnhancedStatus(EnhancedAuthStatus.SESSION_LOADING);
      setIsLoading(true);
      
      const { data: initialSession, error: initialError } = await supabase.auth.getSession();
      
      if (initialError) {
        console.error('Initial session load error:', initialError);
        setLastError({
          code: 'initial_session_load_failed',
          message: initialError.message || 'Failed to load initial session',
          timestamp: Date.now()
        });
        setAuthStatus(AuthStatus.UNAUTHENTICATED);
        setEnhancedStatus(EnhancedAuthStatus.SESSION_NOT_FOUND);
        setIsLoading(false);
        return;
      }
      
      if (initialSession?.session) {
        setSession(initialSession.session);
        setUser(initialSession.session.user);
        setAuthStatus(AuthStatus.AUTHENTICATED);
        setIsLoading(false);
        console.log('Initial session loaded successfully');
        
        // Load the profile data
        try {
          console.log("Loading profile data...");
          setEnhancedStatus(EnhancedAuthStatus.PROFILE_LOADING);
          
          const { data: profileData, error: profileError } = await supabase
            .from('users')
            .select('*')
            .eq('id', initialSession.session.user.id)
            .single();
            
          if (profileError) {
            console.error("Error fetching profile:", profileError);
            setLastError({
              code: 'profile_load_failed',
              message: profileError.message || 'Failed to load profile data',
              timestamp: Date.now()
            });
            setEnhancedStatus(EnhancedAuthStatus.PROFILE_ERROR);
            return;
          }
          
          if (!profileData) {
            console.warn("No profile data found");
            setEnhancedStatus(EnhancedAuthStatus.PROFILE_ERROR);
            return;
          }
          
          setProfile(profileData);
          setEnhancedStatus(EnhancedAuthStatus.PROFILE_LOADED);
          
          // Load the library data
          try {
            await getLibrary(profileData);
          } catch (libError) {
            console.error("Error loading library:", libError);
            // Non-fatal error, we'll still set the profile as loaded
          }
          
        } catch (error) {
          console.error("Unhandled error loading profile:", error);
          setLastError({
            code: 'profile_load_error',
            message: String(error) || 'Unknown error loading profile',
            timestamp: Date.now()
          });
          setEnhancedStatus(EnhancedAuthStatus.PROFILE_ERROR);
        }
        
      } else {
        console.log('No initial session found');
        setAuthStatus(AuthStatus.UNAUTHENTICATED);
        setEnhancedStatus(EnhancedAuthStatus.SESSION_NOT_FOUND);
        setIsLoading(false);
      }
    };
    
    loadSession();
    
    // Set up listener for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session) => {
        console.log(`Auth state change event: ${event}`);
        
        switch (event) {
          case 'INITIAL_SESSION':
          case 'SIGNED_IN':
            setAuthStatus(AuthStatus.AUTHENTICATED);
            setEnhancedStatus(EnhancedAuthStatus.SESSION_LOADING);
            setSession(session);
            setUser(session?.user || null);
            setIsLoading(false);
            
            if (session?.user) {
              try {
                console.log("Loading profile data after sign in...");
                setEnhancedStatus(EnhancedAuthStatus.PROFILE_LOADING);
                
                const { data: profileData, error: profileError } = await supabase
                  .from('users')
                  .select('*')
                  .eq('id', session.user.id)
                  .single();
                  
                if (profileError) {
                  console.error("Error fetching profile after sign in:", profileError);
                  setLastError({
                    code: 'profile_load_failed',
                    message: profileError.message || 'Failed to load profile data after sign in',
                    timestamp: Date.now()
                  });
                  setEnhancedStatus(EnhancedAuthStatus.PROFILE_ERROR);
                  return;
                }
                
                if (!profileData) {
                  console.warn("No profile data found after sign in");
                  setEnhancedStatus(EnhancedAuthStatus.PROFILE_ERROR);
                  return;
                }
                
                setProfile(profileData);
                setEnhancedStatus(EnhancedAuthStatus.PROFILE_LOADED);
                
                // Load the library data
                try {
                  await getLibrary(profileData);
                } catch (libError) {
                  console.error("Error loading library after sign in:", libError);
                  // Non-fatal error, we'll still set the profile as loaded
                }
                
              } catch (error) {
                console.error("Unhandled error loading profile after sign in:", error);
                setLastError({
                  code: 'profile_load_error',
                  message: String(error) || 'Unknown error loading profile after sign in',
                  timestamp: Date.now()
                });
                setEnhancedStatus(EnhancedAuthStatus.PROFILE_ERROR);
              }
            }
            break;
            
          case 'SIGNED_OUT':
            setAuthStatus(AuthStatus.UNAUTHENTICATED);
            setEnhancedStatus(EnhancedAuthStatus.SESSION_NOT_FOUND);
            setSession(null);
            setUser(null);
            setProfile(null);
            setLibrary(null);
            setIsLoading(false);
            break;
            
          case 'TOKEN_REFRESHED':
            setSession(session);
            setUser(session?.user || null);
            break;
            
          case 'USER_UPDATED':
            setUser(session?.user || null);
            break;
            
          default:
            console.warn('Unhandled auth event:', event);
        }
      }
    );
    
    return () => {
      subscription?.unsubscribe();
    };
  }, [getLibrary]);

  return (
    <AuthContext.Provider value={{
      authStatus,
      enhancedStatus,
      session,
      user,
      profile,
      library,
      lastError,
      signInWithSteam,
      signOut,
      refreshProfile,
      refreshSession,
      refreshUserSession,
      clearAuthError,
      isLoading,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
