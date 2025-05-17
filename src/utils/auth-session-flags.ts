
/**
 * Utility functions for managing auth session flags
 * These flags help track auth state across page loads and navigation
 */

// Constants for sessionStorage keys
export const SESSION_FLAGS = {
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

// Safely check if sessionStorage is available
const isSessionStorageAvailable = () => {
  try {
    const testKey = '__test__';
    sessionStorage.setItem(testKey, testKey);
    sessionStorage.removeItem(testKey);
    return true;
  } catch (e) {
    console.warn('SessionStorage is not available:', e);
    return false;
  }
};

// Set a flag in sessionStorage
export const setSessionFlag = (flag: keyof typeof SESSION_FLAGS, value: string = 'true'): void => {
  if (!isSessionStorageAvailable()) return;
  
  try {
    sessionStorage.setItem(SESSION_FLAGS[flag], value);
    console.log(`Session flag set: ${flag} = ${value}`);
    
    // Auto-expire flags after a safety period (except for stable flags)
    const nonExpiringFlags = ['AUTH_FLOW_STATUS', 'FIRST_LOGIN_TIMESTAMP'];
    if (!nonExpiringFlags.includes(flag)) {
      setTimeout(() => {
        // Only clear if it's still set with the same value
        if (getSessionFlag(flag) === value) {
          console.log(`Auto-clearing timed-out session flag: ${flag}`);
          removeSessionFlag(flag);
        }
      }, 5 * 60 * 1000); // 5 minutes max lifetime for flags
    }
  } catch (error) {
    console.error(`Failed to set session flag ${flag}:`, error);
  }
};

// Get a flag from sessionStorage
export const getSessionFlag = (flag: keyof typeof SESSION_FLAGS): string | null => {
  if (!isSessionStorageAvailable()) return null;
  
  try {
    return sessionStorage.getItem(SESSION_FLAGS[flag]);
  } catch (error) {
    console.error(`Failed to get session flag ${flag}:`, error);
    return null;
  }
};

// Remove a flag from sessionStorage
export const removeSessionFlag = (flag: keyof typeof SESSION_FLAGS): void => {
  if (!isSessionStorageAvailable()) return;
  
  try {
    sessionStorage.removeItem(SESSION_FLAGS[flag]);
    console.log(`Session flag removed: ${flag}`);
  } catch (error) {
    console.error(`Failed to remove session flag ${flag}:`, error);
  }
};

// Check if a flag exists in sessionStorage
export const hasSessionFlag = (flag: keyof typeof SESSION_FLAGS): boolean => {
  return getSessionFlag(flag) === 'true';
};

// Clear all auth-related flags
export const clearAuthSessionFlags = (): void => {
  if (!isSessionStorageAvailable()) return;
  
  Object.keys(SESSION_FLAGS).forEach((key) => {
    try {
      sessionStorage.removeItem(SESSION_FLAGS[key as keyof typeof SESSION_FLAGS]);
    } catch (error) {
      console.error(`Failed to clear session flag ${key}:`, error);
    }
  });
  
  console.log('All auth session flags cleared');
};

// Check if any auth flow is in progress
export const isAuthInProgress = (): boolean => {
  if (!isSessionStorageAvailable()) return false;
  return hasSessionFlag('AUTH_IN_PROGRESS') || hasSessionFlag('AUTH_STARTED');
};

// Set a flag with auto-expiration (safety mechanism)
export const setTimedSessionFlag = (
  flag: keyof typeof SESSION_FLAGS, 
  value: string = 'true',
  expirationMs: number = 60000 // Default to 1 minute
): void => {
  setSessionFlag(flag, value);
  
  // Auto-clear the flag after the expiration time
  setTimeout(() => {
    if (hasSessionFlag(flag)) {
      console.log(`Auto-removing expired session flag: ${flag}`);
      removeSessionFlag(flag);
    }
  }, expirationMs);
};

// Track the auth flow status
export type AuthFlowStatus = 'initializing' | 'logged_in_waiting_profile' | 'onboarding_needed' | 'ready';

// Set the current auth flow status
export const setAuthFlowStatus = (status: AuthFlowStatus): void => {
  setSessionFlag('AUTH_FLOW_STATUS', status);
};

// Get the current auth flow status
export const getAuthFlowStatus = (): AuthFlowStatus => {
  const status = getSessionFlag('AUTH_FLOW_STATUS');
  return (status as AuthFlowStatus) || 'initializing';
};

// Mark first login with timestamp
export const markFirstLogin = (): void => {
  if (!hasSessionFlag('FIRST_LOGIN_TIMESTAMP')) {
    setSessionFlag('FIRST_LOGIN_TIMESTAMP', Date.now().toString());
    setSessionFlag('JUST_LOGGED_IN', 'true');
  }
};

// Check if this is a first login within a timeframe (default 5 minutes)
export const isRecentFirstLogin = (maxAgeMs: number = 5 * 60 * 1000): boolean => {
  const timestamp = getSessionFlag('FIRST_LOGIN_TIMESTAMP');
  if (!timestamp) return false;
  
  const loginTime = parseInt(timestamp, 10);
  return !isNaN(loginTime) && (Date.now() - loginTime) < maxAgeMs;
};

// Mark that onboarding has started
export const markOnboardingStarted = (): void => {
  setSessionFlag('ONBOARDING_STARTED', 'true');
};

// Check if onboarding has been started
export const hasOnboardingStarted = (): boolean => {
  return hasSessionFlag('ONBOARDING_STARTED');
};

// Mark that we're coming from auth callback
export const markFromAuthCallback = (): void => {
  setTimedSessionFlag('FROM_AUTH_CALLBACK', 'true', 2 * 60 * 1000); // 2 minutes
};

// Check if we're coming from auth callback
export const isFromAuthCallback = (): boolean => {
  return hasSessionFlag('FROM_AUTH_CALLBACK');
};
