
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
  refreshUserSession: () => Promise<void>;
  clearAuthError: () => void;
  isLoading: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [authStatus, setAuthStatus] = useState<AuthStatus>(AuthStatus.LOADING);
  const [enhancedStatus, setEnhancedStatus] = useState<EnhancedAuthStatus>(EnhancedAuthStatus.SESSION_LOADING);
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [library, setLibrary] = useState<any | null>(null);
  const [lastError, setLastError] = useState<AuthError | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const clearAuthError = useCallback(() => {
    setLastError(null);
  }, []);

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

  const getLibrary = useCallback(async (profileData: any) => {
    if (!profileData?.steam_id) return;

    try {
      setEnhancedStatus(EnhancedAuthStatus.LIBRARY_LOADING);

      const { data: libraryData, error: libraryError } = await supabase
        .from('user_games')
        .select('game_id, playtime_minutes, last_played_date, games(name, image_url)')
        .eq('user_id', user?.id);

      if (libraryError) {
        setLastError({
          code: 'library_load_failed',
          message: libraryError.message,
          timestamp: Date.now()
        });
        setEnhancedStatus(EnhancedAuthStatus.LIBRARY_ERROR);
        return;
      }

      const games = (libraryData || []).map((item: any) => ({
        game_id: item.game_id,
        playtime_minutes: item.playtime_minutes,
        last_played_date: item.last_played_date,
        name: item.games?.name || 'Unknown Game',
        image_url: item.games?.image_url || null,
      }));

      setLibrary(games);
      setEnhancedStatus(EnhancedAuthStatus.LIBRARY_READY);
    } catch (error) {
      setLastError({
        code: 'library_load_error',
        message: String(error),
        timestamp: Date.now()
      });
      setEnhancedStatus(EnhancedAuthStatus.LIBRARY_ERROR);
    }
  }, [user?.id]);

  const refreshProfile = useCallback(async () => {
    if (!user) return;

    try {
      setEnhancedStatus(EnhancedAuthStatus.PROFILE_LOADING);

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error || !data) {
        setLastError({
          code: error ? 'profile_refresh_failed' : 'profile_not_found',
          message: error?.message || 'Profile not found',
          timestamp: Date.now()
        });
        setEnhancedStatus(EnhancedAuthStatus.PROFILE_ERROR);
        return;
      }

      setProfile(data);
      setEnhancedStatus(EnhancedAuthStatus.PROFILE_LOADED);

      await getLibrary(data);
    } catch (error) {
      setLastError({
        code: 'profile_refresh_error',
        message: String(error),
        timestamp: Date.now()
      });
      setEnhancedStatus(EnhancedAuthStatus.PROFILE_ERROR);
    }
  }, [user, getLibrary]);

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

  const signInWithSteam = async (redirectTo?: string) => {
    try {
      setEnhancedStatus(EnhancedAuthStatus.SESSION_LOADING);
      setIsLoading(true);

      const response = await fetch('/api/auth/steam/login' +
        (redirectTo ? `?redirectTo=${encodeURIComponent(redirectTo)}` : ''));

      if (!response.ok) {
        setLastError({
          code: 'steam_login_failed',
          message: `Steam login failed (Status: ${response.status})`,
          timestamp: Date.now()
        });
        setEnhancedStatus(EnhancedAuthStatus.AUTH_ERROR);
        setIsLoading(false);
        return;
      }

      const { url } = await response.json();
      if (!url) {
        setLastError({
          code: 'invalid_steam_url',
          message: 'Login URL missing from Steam auth',
          timestamp: Date.now()
        });
        setEnhancedStatus(EnhancedAuthStatus.AUTH_ERROR);
        setIsLoading(false);
        return;
      }

      window.location.href = url;
    } catch (error) {
      setLastError({
        code: 'steam_sign_in_error',
        message: String(error),
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
    } catch (error) {
      setLastError({
        code: 'sign_out_failed',
        message: String(error),
        timestamp: Date.now()
      });
    }
  };

  useEffect(() => {
    const loadSession = async () => {
      setEnhancedStatus(EnhancedAuthStatus.SESSION_LOADING);
      setIsLoading(true);

      const { data, error } = await supabase.auth.getSession();

      if (error || !data?.session) {
        setAuthStatus(AuthStatus.UNAUTHENTICATED);
        setEnhancedStatus(EnhancedAuthStatus.SESSION_NOT_FOUND);
        setIsLoading(false);
        return;
      }

      setSession(data.session);
      setUser(data.session.user);
      setAuthStatus(AuthStatus.AUTHENTICATED);
      setIsLoading(false);

      try {
        const { data: profileData, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.session.user.id)
          .single();

        if (!profileData || profileError) {
          setEnhancedStatus(EnhancedAuthStatus.PROFILE_ERROR);
          return;
        }

        setProfile(profileData);
        setEnhancedStatus(EnhancedAuthStatus.PROFILE_LOADED);
        await getLibrary(profileData);
      } catch {
        setEnhancedStatus(EnhancedAuthStatus.PROFILE_ERROR);
      }
    };

    loadSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session) => {
        if (['INITIAL_SESSION', 'SIGNED_IN'].includes(event)) {
          setAuthStatus(AuthStatus.AUTHENTICATED);
          setEnhancedStatus(EnhancedAuthStatus.SESSION_LOADING);
          setSession(session);
          setUser(session?.user || null);
          setIsLoading(false);

          if (session?.user) await refreshProfile();
        }

        if (event === 'SIGNED_OUT') {
          setAuthStatus(AuthStatus.UNAUTHENTICATED);
          setEnhancedStatus(EnhancedAuthStatus.SESSION_NOT_FOUND);
          setSession(null);
          setUser(null);
          setProfile(null);
          setLibrary(null);
          setIsLoading(false);
        }

        if (event === 'TOKEN_REFRESHED') {
          setSession(session);
          setUser(session?.user || null);
        }

        if (event === 'USER_UPDATED') {
          setUser(session?.user || null);
        }
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, [getLibrary, refreshProfile]);

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
