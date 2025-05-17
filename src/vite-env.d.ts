
/// <reference types="vite/client" />

// Add debug interface to Window object
interface Window {
  __UNPLAYED_DEBUG__?: {
    authUser?: string | null;
    appAuthState?: string;
    profileId?: string | null;
    isProfileComplete?: boolean;
    isSteamLinked?: boolean;
    profileRefreshAttempts?: number;
    authIsStable?: boolean;
    isAuthReady?: boolean;
    isAuthBootComplete?: boolean;
  };
}
