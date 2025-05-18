
/**
 * AuthSessionManager - Centralized utility for managing authentication session flags
 * 
 * This utility helps prevent race conditions and circular dependencies by providing
 * a single source of truth for authentication state management.
 */

// Constants for sessionStorage keys
const SESSION_FLAGS = {
  AUTH_IN_PROGRESS: 'authInProgress',
  AUTH_STARTED: 'authStarted',
  JUST_LOGGED_IN: 'justLoggedIn',
  STEAM_AUTH_STARTED: 'steamAuthStarted',
  STEAM_AUTH_ATTEMPTED: 'steamAuthAttempted',
  FROM_AUTH_CALLBACK: 'fromAuthCallback',
  AUTH_FLOW_STATUS: 'authFlowStatus',
  ONBOARDING_STARTED: 'onboardingStarted',
  FIRST_LOGIN_TIMESTAMP: 'firstLoginTimestamp',
};

// Authentication flow states forming a state machine
export enum AuthFlowState {
  INITIAL = 'initial',
  AUTH_STARTED = 'auth_started',
  AUTH_CALLBACK = 'auth_callback',
  AUTH_SUCCESS = 'auth_success',
  PROFILE_LOADING = 'profile_loading',
  PROFILE_LOADED = 'profile_loaded',
  ONBOARDING_NEEDED = 'onboarding_needed',
  STEAM_LINKING_NEEDED = 'steam_linking_needed',
  STEAM_LINKING_STARTED = 'steam_linking_started', 
  STEAM_LINKED = 'steam_linked',
  ONBOARDING_COMPLETE = 'onboarding_complete',
  AUTH_READY = 'auth_ready',
  AUTH_ERROR = 'auth_error'
}

// Safely check if sessionStorage is available
const isSessionStorageAvailable = () => {
  try {
    const testKey = '__test__';
    sessionStorage.setItem(testKey, testKey);
    sessionStorage.removeItem(testKey);
    return true;
  } catch (e) {
    console.warn('[AuthSessionManager] SessionStorage is not available:', e);
    return false;
  }
};

/**
 * Set an authentication flag with optional expiration
 */
export const setAuthFlag = (
  flag: keyof typeof SESSION_FLAGS, 
  value: string = 'true',
  expirationMs?: number
): void => {
  if (!isSessionStorageAvailable()) return;
  
  try {
    sessionStorage.setItem(SESSION_FLAGS[flag], value);
    console.log(`[AuthSessionManager] Flag set: ${flag} = ${value}`);
    
    // Add expiration if specified
    if (expirationMs) {
      setTimeout(() => {
        // Only clear if it's still set with the same value
        if (getAuthFlag(flag) === value) {
          console.log(`[AuthSessionManager] Auto-clearing expired flag: ${flag}`);
          removeAuthFlag(flag);
        }
      }, expirationMs);
    }
  } catch (error) {
    console.error(`[AuthSessionManager] Failed to set flag ${flag}:`, error);
  }
};

/**
 * Get an authentication flag
 */
export const getAuthFlag = (flag: keyof typeof SESSION_FLAGS): string | null => {
  if (!isSessionStorageAvailable()) return null;
  
  try {
    return sessionStorage.getItem(SESSION_FLAGS[flag]);
  } catch (error) {
    console.error(`[AuthSessionManager] Failed to get flag ${flag}:`, error);
    return null;
  }
};

/**
 * Remove an authentication flag
 */
export const removeAuthFlag = (flag: keyof typeof SESSION_FLAGS): void => {
  if (!isSessionStorageAvailable()) return;
  
  try {
    sessionStorage.removeItem(SESSION_FLAGS[flag]);
    console.log(`[AuthSessionManager] Flag removed: ${flag}`);
  } catch (error) {
    console.error(`[AuthSessionManager] Failed to remove flag ${flag}:`, error);
  }
};

/**
 * Check if a flag exists and is set to 'true'
 */
export const hasAuthFlag = (flag: keyof typeof SESSION_FLAGS): boolean => {
  return getAuthFlag(flag) === 'true';
};

/**
 * Set the current authentication flow state
 */
export const setAuthFlowState = (state: AuthFlowState): void => {
  setAuthFlag('AUTH_FLOW_STATUS', state);
};

/**
 * Get the current authentication flow state
 */
export const getAuthFlowState = (): AuthFlowState => {
  const state = getAuthFlag('AUTH_FLOW_STATUS') as AuthFlowState;
  return state || AuthFlowState.INITIAL;
};

/**
 * Clear all authentication-related flags
 */
export const clearAllAuthFlags = (): void => {
  if (!isSessionStorageAvailable()) return;
  
  Object.keys(SESSION_FLAGS).forEach((key) => {
    try {
      sessionStorage.removeItem(SESSION_FLAGS[key as keyof typeof SESSION_FLAGS]);
    } catch (error) {
      console.error(`[AuthSessionManager] Failed to clear flag ${key}:`, error);
    }
  });
  
  console.log('[AuthSessionManager] All auth flags cleared');
};

/**
 * Mark that a user has just logged in
 */
export const markJustLoggedIn = (): void => {
  setAuthFlag('JUST_LOGGED_IN', 'true');
  setAuthFlag('FIRST_LOGIN_TIMESTAMP', Date.now().toString());
};

/**
 * Remove the just logged in flag (typically after onboarding)
 */
export const clearJustLoggedIn = (): void => {
  removeAuthFlag('JUST_LOGGED_IN');
};

/**
 * Mark that authentication callback has been processed
 */
export const markFromAuthCallback = (): void => {
  setAuthFlag('FROM_AUTH_CALLBACK', 'true', 2 * 60 * 1000); // 2 minutes expiration
};

/**
 * Check if the current flow is from an auth callback
 */
export const isFromAuthCallback = (): boolean => {
  return hasAuthFlag('FROM_AUTH_CALLBACK');
};

/**
 * Mark that onboarding has started
 */
export const markOnboardingStarted = (): void => {
  setAuthFlag('ONBOARDING_STARTED', 'true');
};

/**
 * Check if onboarding has been started
 */
export const hasOnboardingStarted = (): boolean => {
  return hasAuthFlag('ONBOARDING_STARTED');
};

/**
 * Check if any authentication flow is in progress
 */
export const isAuthInProgress = (): boolean => {
  return hasAuthFlag('AUTH_IN_PROGRESS') || hasAuthFlag('AUTH_STARTED');
};

export default {
  setAuthFlag,
  getAuthFlag,
  removeAuthFlag,
  hasAuthFlag,
  setAuthFlowState,
  getAuthFlowState,
  clearAllAuthFlags,
  markJustLoggedIn,
  clearJustLoggedIn,
  markFromAuthCallback,
  isFromAuthCallback,
  markOnboardingStarted,
  hasOnboardingStarted,
  isAuthInProgress,
  AuthFlowState
};
