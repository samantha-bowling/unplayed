
/**
 * @deprecated Use the new auth-service.ts instead
 * This file is kept for backward compatibility but will be removed in a future update.
 */

import { AuthStorage as AuthStorageService } from './auth-service';

/**
 * Simple storage to persist flags across page reloads
 * @deprecated Use AuthStorage from auth-service.ts instead
 */
export const AuthStorage = {
  setFlag: (key: string, value: string | boolean) => {
    AuthStorageService.setAuthFlag(key as any, String(value));
  },

  getFlag: (key: string): string | null => {
    return AuthStorageService.getAuthFlag(key as any);
  },

  clearFlag: (key: string) => {
    AuthStorageService.removeAuthFlag(key as any);
  }
};

/**
 * Store redirect path for after authentication
 * @deprecated Use AuthStorage.setRedirectPath from auth-service.ts instead
 */
export const setRedirectPath = (path: string) => {
  AuthStorageService.setRedirectPath(path);
};

/**
 * @deprecated Use AuthStorage.getRedirectPath from auth-service.ts instead
 */
export const getRedirectPath = (): string => {
  return AuthStorageService.getRedirectPath();
};
