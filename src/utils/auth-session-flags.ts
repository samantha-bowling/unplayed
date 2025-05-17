
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

// Set a flag in sessionStorage
export const setSessionFlag = (flag: keyof typeof SESSION_FLAGS, value: string = 'true'): void => {
  try {
    sessionStorage.setItem(SESSION_FLAGS[flag], value);
  } catch (error) {
    console.error(`Failed to set session flag ${flag}:`, error);
  }
};

// Get a flag from sessionStorage
export const getSessionFlag = (flag: keyof typeof SESSION_FLAGS): string | null => {
  try {
    return sessionStorage.getItem(SESSION_FLAGS[flag]);
  } catch (error) {
    console.error(`Failed to get session flag ${flag}:`, error);
    return null;
  }
};

// Remove a flag from sessionStorage
export const removeSessionFlag = (flag: keyof typeof SESSION_FLAGS): void => {
  try {
    sessionStorage.removeItem(SESSION_FLAGS[flag]);
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
  Object.keys(SESSION_FLAGS).forEach((key) => {
    try {
      sessionStorage.removeItem(SESSION_FLAGS[key as keyof typeof SESSION_FLAGS]);
    } catch (error) {
      console.error(`Failed to clear session flag ${key}:`, error);
    }
  });
};

// Check if any auth flow is in progress
export const isAuthInProgress = (): boolean => {
  return hasSessionFlag('AUTH_IN_PROGRESS') || hasSessionFlag('AUTH_STARTED');
};
