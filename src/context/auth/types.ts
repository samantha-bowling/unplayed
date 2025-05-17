
// src/context/auth/types.ts
import { Session, User } from '@supabase/supabase-js';

// Define all auth-related enums
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
  PROFILE_LOADING = 'PROFILE_LOADING',
  PROFILE_LOADED = 'PROFILE_LOADED',
  PROFILE_ERROR = 'PROFILE_ERROR',
  AUTH_ERROR = 'AUTH_ERROR',
  LIBRARY_IMPORTING = 'LIBRARY_IMPORTING',
  TOKEN_REFRESH_ERROR = 'TOKEN_REFRESH_ERROR',
  LIBRARY_ERROR = 'LIBRARY_ERROR',
  LIBRARY_READY = 'LIBRARY_READY',
  LIBRARY_UPDATING = 'LIBRARY_UPDATING',
  LIBRARY_LOADING = 'LIBRARY_LOADING',
  TOKEN_REFRESHING = 'TOKEN_REFRESHING',
}

// Define app auth state as a discriminated union for better type safety
export type AppAuthState = 
  | 'ANONYMOUS'               // No user authenticated
  | 'AUTHENTICATED'           // User authenticated but profile not loaded
  | 'AUTH_TRANSITIONING'      // In the middle of an auth state change
  | 'PROFILE_LOADING'         // Profile is being loaded
  | 'ONBOARDING'              // User authenticated, profile exists but not complete
  | 'ONBOARDING_STEAM_LINK'   // Explicitly in the Steam linking phase
  | 'READY'                   // User fully authenticated with complete profile
  | 'ERROR';                  // Error state

// Define auth error type
export type AuthError = {
  code: string;
  message: string;
  timestamp: number;
  details?: any;
};

// Define AuthContext type
export type AuthContextType = {
  authStatus: AuthStatus;
  enhancedStatus: EnhancedAuthStatus;
  appAuthState: AppAuthState;
  authIsStable: boolean;
  session: Session | null;
  user: User | null;
  profile: any | null;
  lastError: AuthError | null;
  signInWithProvider: (provider: 'discord' | 'twitch', options?: { redirectTo?: string }) => Promise<void>;
  signInWithEmail: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<any>;
  refreshSession: () => Promise<Session | null>;
  clearAuthError: () => void;
  isLoading: boolean;
  isAuthReady: boolean;
  isAuthBootComplete: boolean;
  isSteamLinked: boolean;
  isProfileComplete: boolean;
};
