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
} from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export enum AuthStatus {
  LOADING = 'LOADING',
  AUTHENTICATED = 'AUTHENTICATED',
  UNAUTHENTICATED = 'UNAUTHENTICATED',
}

export enum EnhancedAuthStatus {
  SESSION_LOADING = 'SESSION_LOADING',
  SESSION_NOT_FOUND = 'SESSION_NOT_FOUND',
  TOKEN_REFRESHING = 'TOKEN_REFRESHING',
  TOKEN_REFRESH_ERROR = 'TOKEN_REFRESH_ERROR',
  PROFILE_LOADING = 'PROFILE_LOADING',
  PROFILE_LOADED = 'PROFILE_LOADED',
  PROFILE_ERROR = 'PROFILE_ERROR',
  LIBRARY_LOADING = 'LIBRARY_LOADING',
  LIBRARY_READY = 'LIBRARY_READY',
  LIBRARY_ERROR = 'LIBRARY_ERROR',
}

type AuthContextType = {
  authStatus: AuthStatus;
  enhancedStatus: EnhancedAuthStatus;
  session: Session | null;
  user: User | null;
  profile: any | null;
  library: any | null;
  lastError: any | null;
  signInWithSteam: (redirectTo?: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
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
  const [lastError, setLastError] = useState<any | null>(null);
  
  const signInWithSteam = async (redirectTo?: string) => {
    try {
      setEnhancedStatus(EnhancedAuthStatus.SESSION_LOADING);
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'steam',
        options: {
          redirectTo: `${window.location.origin}/api/auth/steam/callback${redirectTo ? `?redirectTo=${encodeURIComponent(redirectTo)}` : ''}`,
        },
      });
      
      if (error) {
        console.error('Steam sign-in error:', error);
        setLastError({
          code: 'steam_sign_in_failed',
          message: error.message || 'Failed to initiate Steam sign-in',
          timestamp: Date.now()
        });
        setEnhancedStatus(EnhancedAuthStatus.SESSION_NOT_FOUND);
        return;
      }
      
      console.log('Steam sign-in initiated:', data);
      setAuthStatus(AuthStatus.LOADING);
      setEnhancedStatus(EnhancedAuthStatus.SESSION_LOADING);
    } catch (error) {
      console.error('Unexpected error during Steam sign-in:', error);
      setLastError({
        code: 'steam_sign_in_error',
        message: String(error) || 'Unexpected error during Steam sign-in',
        timestamp: Date.now()
      });
      setEnhancedStatus(EnhancedAuthStatus.SESSION_NOT_FOUND);
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
        return;
      }
      
      if (initialSession?.session) {
        setSession(initialSession.session);
        setUser(initialSession.session.user);
        setAuthStatus(AuthStatus.AUTHENTICATED);
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
      }
    };
    
    loadSession();
    
    // Set up listener for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log(`Auth state change event: ${event}`);
        
        switch (event) {
          case 'initialSession':
          case 'signedIn':
            setAuthStatus(AuthStatus.AUTHENTICATED);
            setEnhancedStatus(EnhancedAuthStatus.SESSION_LOADING);
            setSession(session);
            setUser(session?.user || null);
            
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
            
          case 'signedOut':
            setAuthStatus(AuthStatus.UNAUTHENTICATED);
            setEnhancedStatus(EnhancedAuthStatus.SESSION_NOT_FOUND);
            setSession(null);
            setUser(null);
            setProfile(null);
            setLibrary(null);
            break;
            
          case 'tokenRefreshed':
            setSession(session);
            setUser(session?.user || null);
            break;
            
          case 'userUpdated':
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
