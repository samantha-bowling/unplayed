
/**
 * AuthSessionManager - Simplified utility for managing authentication session flags
 * 
 * This utility helps prevent race conditions by providing a single source
 * of truth for authentication state management.
 */

// Constants for sessionStorage keys
const SESSION_FLAGS = {
  AUTH_IN_PROGRESS: 'authInProgress',
  JUST_LOGGED_IN: 'justLoggedIn',
  FROM_AUTH_CALLBACK: 'fromAuthCallback',
  AUTH_FLOW_STATUS: 'authFlowStatus',
};

// Simplified authentication flow states - only use these three states
export enum AuthFlowState {
  LOADING = 'loading',
  AUTHENTICATED = 'authenticated',
  UNAUTHENTICATED = 'unauthenticated'
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
    
    // Add expiration if specified
    if (expirationMs) {
      setTimeout(() => {
        // Only clear if it's still set with the same value
        if (getAuthFlag(flag) === value) {
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
 * Set the current authentication flow state to one of the three simplified states
 */
export const setAuthFlowState = (state: AuthFlowState): void => {
  setAuthFlag('AUTH_FLOW_STATUS', state);
};

/**
 * Get the current authentication flow state
 */
export const getAuthFlowState = (): AuthFlowState => {
  const state = getAuthFlag('AUTH_FLOW_STATUS') as AuthFlowState;
  return state || AuthFlowState.LOADING;
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
};

/**
 * Mark that a user has just logged in
 */
export const markJustLoggedIn = (): void => {
  setAuthFlag('JUST_LOGGED_IN', 'true');
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
  AuthFlowState
};
