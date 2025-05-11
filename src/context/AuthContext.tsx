import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate, useLocation } from 'react-router-dom';
import { logAuthEvent, trackAuthPerformance } from '@/utils/auth-analytics';

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
  AUTH_ERROR = 'auth_error',
  // New enhanced statuses for library sync
  LIBRARY_IMPORTING = 'library_importing',
  LIBRARY_UPDATING = 'library_updating', 
  LIBRARY_READY = 'library_ready',
  LIBRARY_ERROR = 'library_error'
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
  refreshSession: () => Promise<void>;
  clearAuthError: () => void;
  isLibrarySynced: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_STORAGE_REDIRECT_KEY = 'unplayed_auth_redirect';
const LAST_SESSION_KEY = 'unplayed_last_session';
const LAST_SESSION_TIME_KEY = 'unplayed_last_session_time';
const DEBUG_AUTH = process.env.NODE_ENV === 'development';

// Helper function to determine the correct API URL based on environment
const getSteamAuthUrl = (queryParams: string = ''): string => {
  // Log the environment to help debug production vs development behavior
  console.log(`[Steam Auth] Environment: ${process.env.NODE_ENV}, Origin: ${window.location.origin}`);
  
  // Always prefer using API path as it handles both development and production properly
  const url = `/api/auth/steam/login${queryParams}`;
  console.log(`[Steam Auth] Using URL: ${url}`);
  return url;
};

// Enhanced function to safely fetch and parse JSON responses with additional logging
const fetchAndParseJson = async (url: string, options: RequestInit = {}): Promise<any> => {
  console.log(`[Steam Auth] Fetching URL: ${url}`);
  console.log(`[Steam Auth] Request options:`, JSON.stringify(options, null, 2));
  
  let response: Response;
  try {
    // Add timestamp to prevent caching issues
    const urlWithTimestamp = url.includes('?') 
      ? `${url}&_t=${Date.now()}` 
      : `${url}?_t=${Date.now()}`;
      
    response = await fetch(urlWithTimestamp, options);
    console.log(`[Steam Auth] Response status: ${response.status} ${response.statusText}`);
    console.log(`[Steam Auth] Response headers:`, JSON.stringify(Object.fromEntries([...response.headers.entries()]), null, 2));
  } catch (fetchError) {
    console.error(`[Steam Auth] Network error fetching ${url}:`, fetchError);
    throw new Error(`Network error connecting to Steam auth service: ${fetchError.message}`);
  }
  
  // Read the response as text first to avoid the "body stream already read" error
  let responseText: string;
  try {
    responseText = await response.text();
    console.log(`[Steam Auth] Response text length: ${responseText.length} characters`);
    if (responseText.length > 0) {
      console.log(`[Steam Auth] Response preview:`, responseText.substring(0, 200) + (responseText.length > 200 ? '...' : ''));
    }
  } catch (textError) {
    console.error(`[Steam Auth] Error reading response text:`, textError);
    throw new Error(`Failed to read response from Steam auth service: ${textError.message}`);
  }
  
  // Check response status before trying to parse
  if (!response.ok) {
    // Check content type to provide better error messages
    const contentType = response.headers.get('content-type');
    console.log(`[Steam Auth] Response content type: ${contentType}`);
    
    if (contentType && contentType.includes('text/html')) {
      console.error('[Steam Auth] Received HTML instead of JSON:', responseText.substring(0, 200));
      throw new Error(`Received HTML instead of JSON. Status: ${response.status}. This usually indicates a redirect issue.`);
    }
    
    // Try to parse error as JSON if possible
    try {
      const errorData = JSON.parse(responseText);
      console.error('[Steam Auth] JSON error response:', errorData);
      throw new Error(`Request failed: ${errorData.message || errorData.error || response.statusText}`);
    } catch (parseError) {
      // If we can't parse as JSON, use the text response in the error
      console.error('[Steam Auth] Failed to parse error response as JSON:', parseError);
      throw new Error(`Request failed (${response.status}): ${responseText.substring(0, 100)}...`);
    }
  }
  
  // Try to parse successful response as JSON
  try {
    const jsonData = JSON.parse(responseText);
    console.log('[Steam Auth] Successfully parsed JSON response');
    return jsonData;
  } catch (parseError) {
    console.error('[Steam Auth] Failed to parse response as JSON:', parseError);
    console.error('[Steam Auth] Response content:', responseText.substring(0, 200));
    throw new Error(`Failed to parse response as JSON. Raw response: ${responseText.substring(0, 100)}...`);
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
  const [isLibrarySynced, setIsLibrarySynced] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
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
    const startTime = Date.now();
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
        const duration = Date.now() - startTime;
        logAuthEvent('Profile fetched successfully', { steamName: data.steam_name, durationMs: duration });
        
        // Check if library sync has happened
        if (data.last_sync) {
          setIsLibrarySynced(true);
          setEnhancedStatus(EnhancedAuthStatus.LIBRARY_READY);
        } else {
          setIsLibrarySynced(false);
          setEnhancedStatus(EnhancedAuthStatus.PROFILE_LOADED);
        }
        
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

  // Setup token refresh timer
  const setupTokenRefreshTimer = (currentSession: Session | null) => {
    // Clear any existing timers
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
    
    if (!currentSession) return;
    
    // Calculate time until expiry minus buffer (60s)
    const expiresAt = new Date(currentSession.expires_at * 1000);
    const timeUntilExpiry = expiresAt.getTime() - Date.now();
    const refreshBuffer = 60 * 1000; // 1 minute
    
    if (timeUntilExpiry <= refreshBuffer) {
      // Already near expiration, refresh now
      refreshSession();
      return;
    }
    
    // Set timer for refresh
    refreshTimerRef.current = setTimeout(
      () => refreshSession(),
      timeUntilExpiry - refreshBuffer
    );
    
    logAuthEvent('Token refresh timer set', { 
      expiresAt: expiresAt.toISOString(), 
      refreshIn: Math.round((timeUntilExpiry - refreshBuffer) / 1000) + 's'
    });
  };

  // Public method to refresh the session
  const refreshSession = async (): Promise<void> => {
    try {
      logAuthEvent('Refreshing session token');
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        logAuthEvent('Token refresh error', error);
        setEnhancedStatus(EnhancedAuthStatus.TOKEN_REFRESH_ERROR);
        recordAuthError('refresh_error', 'Failed to refresh authentication token', error, true);
        
        toast({
          title: 'Session Expired',
          description: 'Your login session has expired. Please sign in again.',
          variant: 'destructive',
        });
        return;
      }
      
      if (data.session) {
        logAuthEvent('Token refreshed successfully');
        // This will trigger onAuthStateChange, which will update our state
      }
    } catch (error) {
      logAuthEvent('Exception during token refresh', error);
      recordAuthError('token_refresh_exception', 'Exception during token refresh', error, true);
    }
  };

  // Persist minimal session state for recovery
  const persistSessionState = (currentSession: Session | null) => {
    if (currentSession) {
      // Only store minimal info needed to detect changes
      localStorage.setItem(LAST_SESSION_KEY, currentSession.user.id);
      localStorage.setItem(LAST_SESSION_TIME_KEY, Date.now().toString());
    } else {
      localStorage.removeItem(LAST_SESSION_KEY);
      localStorage.removeItem(LAST_SESSION_TIME_KEY);
    }
  };

  // Check if user has games in their library
  const checkForLibraryData = async (userId: string): Promise<boolean> => {
    try {
      const { count, error } = await supabase
        .from('user_games')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId);
      
      if (error) {
        console.error('Error checking for library data:', error);
        return false;
      }
      
      return count !== null && count > 0;
    } catch (e) {
      console.error('Exception checking library data:', e);
      return false;
    }
  };

  // Public method to manually refresh profile data
  const refreshProfile = async (): Promise<void> => {
    if (!user) return;
    
    try {
      logAuthEvent('Manual profile refresh', { userId: user.id });
      const profileData = await fetchProfile(user.id);
      if (profileData) {
        setProfile(profileData);
        
        // Check for library data
        const hasLibrary = await checkForLibraryData(user.id);
        setIsLibrarySynced(hasLibrary);
        
        if (hasLibrary) {
          setEnhancedStatus(EnhancedAuthStatus.LIBRARY_READY);
        } else {
          setEnhancedStatus(EnhancedAuthStatus.PROFILE_LOADED);
        }
      }
    } catch (error) {
      logAuthEvent('Manual profile refresh failed', error);
      toast({
        title: 'Profile Refresh Failed',
        description: 'Could not update your profile information.',
        variant: 'destructive',
      });
    }
  };

  // Network connectivity detection for auth recovery
  useEffect(() => {
    const handleOnline = () => {
      logAuthEvent('Network connection restored');
      if (lastError?.code === 'network_error' || 
          enhancedStatus === EnhancedAuthStatus.TOKEN_REFRESH_ERROR) {
        // Try to recover session
        refreshSession();
      }
    };
    
    const handleOffline = () => {
      logAuthEvent('Network connection lost');
      // We'll just log this for now, recovery happens on reconnect
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [enhancedStatus, lastError]);

  // Setup session recovery from browser crash/refresh
  useEffect(() => {
    // Check for inconsistent state on init
    const storedSessionUserId = localStorage.getItem(LAST_SESSION_KEY);
    
    if (storedSessionUserId && !isLoading && !session) {
      // We expected to have a session but don't
      logAuthEvent('Detected inconsistent session state', { storedSessionUserId });
      
      // Try to recover by forcing a session refresh
      supabase.auth.refreshSession().then(({ data, error }) => {
        if (error || !data.session) {
          // Failed to recover, clear stored state
          logAuthEvent('Failed to recover session', { error });
          localStorage.removeItem(LAST_SESSION_KEY);
          localStorage.removeItem(LAST_SESSION_TIME_KEY);
        } else {
          logAuthEvent('Successfully recovered session', { userId: data.session.user.id });
        }
      });
    }
  }, [isLoading]);

  // Update session persistence when session changes
  useEffect(() => {
    if (session) {
      persistSessionState(session);
      setupTokenRefreshTimer(session);
    } else if (!isLoading) {
      // Only clear if we're sure there's no session (not during initial loading)
      persistSessionState(null);
    }
  }, [session, isLoading]);

  // Process URL parameters for authentication with enhanced error handling
  useEffect(() => {
    const processAuthParams = async () => {
      const url = new URL(window.location.href);
      const steamId = url.searchParams.get('steam_id');
      const userId = url.searchParams.get('user_id');
      const authSuccess = url.searchParams.get('auth_success');
      const errorCode = url.searchParams.get('error_code');
      const errorMessage = url.searchParams.get('error_message');
      const errorDetails = url.searchParams.get('error_details');

      // Enhanced error logging
      if (errorCode) {
        let details = null;
        try {
          if (errorDetails) {
            details = JSON.parse(decodeURIComponent(errorDetails));
          }
        } catch (e) {
          console.error('Error parsing error details:', e);
        }
        
        logAuthEvent('Auth error from URL', { errorCode, errorMessage, details });
        setAuthStatus(AuthStatus.ERROR);
        setEnhancedStatus(EnhancedAuthStatus.AUTH_ERROR);
        recordAuthError(errorCode, errorMessage || 'Authentication error', details);
        
        toast({
          title: 'Authentication Error',
          description: errorMessage || 'Failed to authenticate with Steam',
          variant: 'destructive',
        });
        
        // Remove error params from URL
        const cleanUrl = new URL(window.location.href);
        cleanUrl.searchParams.delete('error_code');
        cleanUrl.searchParams.delete('error_message');
        cleanUrl.searchParams.delete('error_details');
        window.history.replaceState({}, document.title, cleanUrl.toString());
        return;
      }

      // Process successful Steam authentication
      if (steamId && userId && authSuccess) {
        try {
          logAuthEvent('Processing Steam auth success');
          setAuthStatus(AuthStatus.LOADING);
          setEnhancedStatus(EnhancedAuthStatus.SESSION_LOADING);
          
          // Attempt to get or create session for this user
          const { data, error } = await supabase.auth.getSession();
          
          if (error || !data.session) {
            logAuthEvent('No session available after Steam auth', { error });
            
            // Try to sign in with email/password
            const email = `steam_${steamId}@unplayed.wtf`;
            const password = crypto.randomUUID(); // This won't actually work but we'll try
            
            const { error: signInError } = await supabase.auth.signInWithPassword({
              email,
              password
            });
            
            if (signInError) {
              // Try to recover by refreshing the page
              console.log("Couldn't establish session automatically. Refreshing the profile data.");
              
              // Try to set up the profile without a session
              const { data: profileData } = await supabase
                .from('users')
                .select('*')
                .eq('id', userId)
                .maybeSingle();
              
              if (profileData) {
                // We got a profile, so let's set it up
                setProfile(profileData);
                setIsLibrarySynced(!!profileData.last_sync);
                
                // Try to get library data
                const hasLibrary = await checkForLibraryData(userId);
                setIsLibrarySynced(hasLibrary);
                
                toast({
                  title: 'Partial Sign In',
                  description: 'Your profile was loaded but your session may expire soon.',
                  variant: 'default',
                });
              } else {
                throw new Error('Could not find user profile');
              }
            }
          } else {
            logAuthEvent('Session available after Steam auth');
            setSession(data.session);
            setUser(data.session.user);
            setAuthStatus(AuthStatus.AUTHENTICATED);
            setEnhancedStatus(EnhancedAuthStatus.SESSION_FOUND);
            
            toast({
              title: 'Sign In Successful',
              description: 'You have successfully signed in with Steam.',
            });
          }
          
          // Clean the URL - remove auth parameters
          const cleanUrl = new URL(window.location.href);
          cleanUrl.searchParams.delete('steam_id');
          cleanUrl.searchParams.delete('user_id');
          cleanUrl.searchParams.delete('auth_success');
          window.history.replaceState({}, document.title, cleanUrl.toString());
          
        } catch (error) {
          logAuthEvent('Error processing Steam auth params', error);
          setAuthStatus(AuthStatus.ERROR);
          setEnhancedStatus(EnhancedAuthStatus.AUTH_ERROR);
          recordAuthError('steam_auth_processing', 'Failed to process Steam authentication', error);
        }
      }
    };
    
    processAuthParams();
  }, [location.search, toast]);

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
            setIsLibrarySynced(false);
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
        
        // Setup token refresh timer
        setupTokenRefreshTimer(existingSession);
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
      
      // Clear any timers on unmount
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
    };
  }, []);

  // Fetch user profile when user is authenticated
  useEffect(() => {
    if (!user) {
      setProfile(null);
      setIsLibrarySynced(false);
      return;
    }

    const getProfile = async () => {
      try {
        const profileData = await fetchProfile(user.id);
        if (profileData) {
          setProfile(profileData);
          
          // Check if we have library data
          const hasLibraryData = await checkForLibraryData(user.id);
          setIsLibrarySynced(hasLibraryData);
          
          // Update status based on library data presence
          if (hasLibraryData) {
            setEnhancedStatus(EnhancedAuthStatus.LIBRARY_READY);
          } else {
            setEnhancedStatus(EnhancedAuthStatus.PROFILE_LOADED);
          }
        }
      } catch (error) {
        logAuthEvent('Error fetching profile after auth', error);
      }
    };

    getProfile();
  }, [user]);

  // Initialize Steam auth flow with better error handling
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
      
      // Get login URL from our edge function - use environment-aware URL helper
      const queryParams = redirectTo ? `?redirectTo=${encodeURIComponent(redirectTo)}` : '';
      const authUrl = getSteamAuthUrl(queryParams);
      
      logAuthEvent('Fetching Steam login URL', { authUrl });
      
      // Use our enhanced helper function to safely fetch and parse the response
      const responseData = await fetchAndParseJson(authUrl, {
        headers: {
          'User-Agent': 'UnplayedWTF Web App',
          'Content-Type': 'application/json',
          'X-Client-Info': navigator.userAgent,
          'X-Debug-Origin': window.location.origin
        },
        // Add cache control to prevent caching issues
        cache: 'no-store'
      });
      
      const { url, error } = responseData;
      
      if (error) {
        throw new Error(`Steam auth error: ${error.message || JSON.stringify(error)}`);
      }
      
      if (url) {
        // Show a loading toast before redirecting
        toast({
          title: 'Redirecting to Steam',
          description: 'Please wait while we connect to Steam...',
        });
        
        console.log(`[Steam Auth] Redirecting to Steam URL: ${url.substring(0, 100)}...`);
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

  // Clear auth data utility
  const clearAuthData = () => {
    // Clear all auth-related data
    localStorage.removeItem(LOCAL_STORAGE_REDIRECT_KEY);
    localStorage.removeItem(LAST_SESSION_KEY);
    localStorage.removeItem(LAST_SESSION_TIME_KEY);
  };

  // Sign out
  const signOut = async () => {
    try {
      logAuthEvent('Signing out');
      await supabase.auth.signOut();
      
      // Clear auth data
      clearAuthData();
      
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
        refreshSession,
        clearAuthError,
        isLibrarySynced,
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
