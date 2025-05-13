
import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { Session, User, AuthChangeEvent } from '@supabase/supabase-js';
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
        const { data: userData, error: userError } = await supabase.auth.getUser();

        if (userError || !userData?.user) {
          console.error('Failed to hydrate user after refreshSession:', userError);
          setEnhancedStatus(EnhancedAuthStatus.TOKEN_REFRESH_ERROR);
          return;
        }

        setSession(data.session);
        setUser(userData.user);
        setEnhancedStatus(EnhancedAuthStatus.SESSION_FOUND);
        console.log('User hydrated via getUser()', userData.user);
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

  // other logic (refreshUserSession, signInWithSteam, etc.) unchanged

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
