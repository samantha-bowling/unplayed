
/// <reference types="vite/client" />

declare global {
  interface Window {
    __UNPLAYED_DEBUG__?: {
      authUser?: string | null;
      appAuthState?: any;
      profileId?: string | null;
      isProfileComplete?: boolean;
      isSteamLinked?: boolean;
      profileRefreshAttempts?: number;
      authIsStable?: boolean;
      isAuthReady?: boolean;
      isAuthBootComplete?: boolean;
    };
  }
}

export {};
