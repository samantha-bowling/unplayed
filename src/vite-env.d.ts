
/// <reference types="vite/client" />

// Import the AppAuthState type for proper type checking
import { AppAuthState } from './context/auth/types';

// Add debug interface to Window object with proper typing
interface Window {
  __UNPLAYED_DEBUG__?: {
    authUser?: string | null;
    appAuthState?: AppAuthState; // Now uses proper typed enum instead of string
    profileId?: string | null;
    isProfileComplete?: boolean;
    isSteamLinked?: boolean;
    profileRefreshAttempts?: number;
    authIsStable?: boolean;
    isAuthReady?: boolean;
    isAuthBootComplete?: boolean;
  };
}
