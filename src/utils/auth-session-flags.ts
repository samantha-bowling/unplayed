
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

