
// src/utils/auth-utils.ts
// Simplified utilities for auth flow management

/**
 * Simple storage to persist flags across page reloads
 */
export const AuthStorage = {
  setFlag: (key: string, value: string | boolean) => {
    try {
      localStorage.setItem(`auth_${key}`, String(value));
    } catch (e) {
      console.error('Error saving auth flag to localStorage:', e);
    }
  },

  getFlag: (key: string): string | null => {
    try {
      return localStorage.getItem(`auth_${key}`);
    } catch (e) {
      console.error('Error retrieving auth flag from localStorage:', e);
      return null;
    }
  },

  clearFlag: (key: string) => {
    try {
      localStorage.removeItem(`auth_${key}`);
    } catch (e) {
      console.error('Error removing auth flag from localStorage:', e);
    }
  }
};

/**
 * Store redirect path for after authentication
 */
export const setRedirectPath = (path: string) => {
  AuthStorage.setFlag('redirect_path', path);
};

export const getRedirectPath = (): string => {
  const path = AuthStorage.getFlag('redirect_path');
  AuthStorage.clearFlag('redirect_path');
  return path || '/';
};
