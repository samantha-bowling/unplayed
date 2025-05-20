
/**
 * Unified Authentication Service
 * 
 * This service centralizes all authentication-related utilities, storage,
 * and state management to eliminate redundancy and provide a single source of truth.
 */

import { Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// ======================================================
// Storage Management (unified localStorage wrapper)
// ======================================================

/**
 * Unified storage keys - a single source of truth for all auth-related storage
 */
export const STORAGE_KEYS = {
  // Session state
  AUTH_STATE: 'unplayed_auth_state',
  REDIRECT_PATH: 'unplayed_redirect_path',
  PROFILE_CACHE: 'unplayed_profile_cache',
  
  // Flags
  AUTH_IN_PROGRESS: 'unplayed_auth_in_progress',
  AUTH_ANIMATION_SHOWN: 'unplayed_auth_animation_shown',
  JUST_LOGGED_IN: 'unplayed_just_logged_in',
  FROM_AUTH_CALLBACK: 'unplayed_from_auth_callback',
};

/**
 * Basic auth states using a simplified three-state system
 */
export enum AuthState {
  LOADING = 'loading',
  AUTHENTICATED = 'authenticated',
  UNAUTHENTICATED = 'unauthenticated'
}

/**
 * Internal helper to safely interact with localStorage
 */
const storage = {
  get: (key: string): string | null => {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      console.error('Error accessing localStorage:', e);
      return null;
    }
  },
  
  set: (key: string, value: string, expirationMs?: number): void => {
    try {
      localStorage.setItem(key, value);
      
      // Add expiration if specified
      if (expirationMs) {
        const expiration = Date.now() + expirationMs;
        localStorage.setItem(`${key}_expires`, String(expiration));
        
        // Set cleanup timeout
        setTimeout(() => {
          if (storage.get(key) === value) {
            storage.remove(key);
          }
        }, expirationMs);
      }
    } catch (e) {
      console.error('Error setting localStorage item:', e);
    }
  },
  
  remove: (key: string): void => {
    try {
      localStorage.removeItem(key);
      localStorage.removeItem(`${key}_expires`);
    } catch (e) {
      console.error('Error removing localStorage item:', e);
    }
  },
  
  isExpired: (key: string): boolean => {
    try {
      const expirationStr = localStorage.getItem(`${key}_expires`);
      if (!expirationStr) return false;
      
      const expiration = parseInt(expirationStr, 10);
      return Date.now() > expiration;
    } catch (e) {
      console.error('Error checking expiration:', e);
      return false;
    }
  }
};

// ======================================================
// AuthStorage - Unified API for auth state persistence
// ======================================================

export const AuthStorage = {
  /**
   * Set the current authentication state
   */
  setAuthState: (state: AuthState): void => {
    storage.set(STORAGE_KEYS.AUTH_STATE, state);
  },
  
  /**
   * Get the current authentication state
   */
  getAuthState: (): AuthState => {
    const state = storage.get(STORAGE_KEYS.AUTH_STATE) as AuthState;
    return state || AuthState.LOADING;
  },
  
  /**
   * Store redirect path for after authentication
   */
  setRedirectPath: (path: string): void => {
    storage.set(STORAGE_KEYS.REDIRECT_PATH, path);
  },
  
  /**
   * Get and clear the stored redirect path
   */
  getRedirectPath: (): string => {
    const path = storage.get(STORAGE_KEYS.REDIRECT_PATH) || '/';
    storage.remove(STORAGE_KEYS.REDIRECT_PATH);
    return path;
  },
  
  /**
   * Set an authentication flag
   */
  setAuthFlag: (flag: keyof typeof STORAGE_KEYS, value: string = 'true', expirationMs?: number): void => {
    storage.set(STORAGE_KEYS[flag], value, expirationMs);
  },
  
  /**
   * Get an authentication flag
   */
  getAuthFlag: (flag: keyof typeof STORAGE_KEYS): string | null => {
    // Check if expired
    if (storage.isExpired(STORAGE_KEYS[flag])) {
      storage.remove(STORAGE_KEYS[flag]);
      return null;
    }
    
    return storage.get(STORAGE_KEYS[flag]);
  },
  
  /**
   * Remove an authentication flag
   */
  removeAuthFlag: (flag: keyof typeof STORAGE_KEYS): void => {
    storage.remove(STORAGE_KEYS[flag]);
  },
  
  /**
   * Check if an auth flag exists and is set to 'true'
   */
  hasAuthFlag: (flag: keyof typeof STORAGE_KEYS): boolean => {
    return AuthStorage.getAuthFlag(flag) === 'true';
  },
  
  /**
   * Clear all authentication data (for logout or critical errors)
   */
  clearAuthData: (): void => {
    Object.values(STORAGE_KEYS).forEach(key => {
      storage.remove(key);
    });
  },
  
  /**
   * Mark that a user has just logged in
   */
  markJustLoggedIn: (expirationMs: number = 5 * 60 * 1000): void => {
    AuthStorage.setAuthFlag('JUST_LOGGED_IN', 'true', expirationMs);
  },
  
  /**
   * Check if user has just logged in
   */
  hasJustLoggedIn: (): boolean => {
    return AuthStorage.hasAuthFlag('JUST_LOGGED_IN');
  },
  
  /**
   * Clear the just logged in flag (typically after onboarding)
   */
  clearJustLoggedIn: (): void => {
    AuthStorage.removeAuthFlag('JUST_LOGGED_IN');
  },
  
  /**
   * Mark that authentication callback has been processed
   */
  markFromAuthCallback: (expirationMs: number = 2 * 60 * 1000): void => {
    AuthStorage.setAuthFlag('FROM_AUTH_CALLBACK', 'true', expirationMs);
  },
  
  /**
   * Check if the current flow is from an auth callback
   */
  isFromAuthCallback: (): boolean => {
    return AuthStorage.hasAuthFlag('FROM_AUTH_CALLBACK');
  },
  
  /**
   * Mark that auth animation has been shown
   */
  markAuthAnimationShown: (): void => {
    AuthStorage.setAuthFlag('AUTH_ANIMATION_SHOWN', 'true');
  },
  
  /**
   * Check if auth animation has been shown
   */
  hasAuthAnimationBeenShown: (): boolean => {
    return AuthStorage.hasAuthFlag('AUTH_ANIMATION_SHOWN');
  },
  
  /**
   * Reset the auth animation flag
   */
  resetAuthAnimationFlag: (): void => {
    AuthStorage.removeAuthFlag('AUTH_ANIMATION_SHOWN');
  }
};

// ======================================================
// Security & Session Management
// ======================================================

/**
 * Check if a session is expired
 */
export const isSessionExpired = (session: Session | null): boolean => {
  if (!session) return true;
  
  const expiresAt = new Date(session.expires_at * 1000);
  return expiresAt < new Date();
};

/**
 * Check if session is about to expire soon (within buffer minutes)
 */
export const isSessionExpiringSoon = (session: Session | null, bufferMinutes = 5): boolean => {
  if (!session) return true;
  
  const expiresAt = new Date(session.expires_at * 1000);
  const bufferMs = bufferMinutes * 60 * 1000;
  return expiresAt.getTime() - Date.now() < bufferMs;
};

/**
 * Calculate time remaining in session
 */
export const getSessionTimeRemaining = (session: Session | null): number => {
  if (!session) return 0;
  
  const expiresAt = new Date(session.expires_at * 1000);
  return Math.max(0, expiresAt.getTime() - Date.now());
};

/**
 * Format time remaining in friendly format
 */
export const formatSessionTimeRemaining = (session: Session | null): string => {
  const ms = getSessionTimeRemaining(session);
  
  if (ms <= 0) return 'Expired';
  
  const minutes = Math.floor(ms / (1000 * 60));
  const seconds = Math.floor((ms % (1000 * 60)) / 1000);
  
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  
  return `${seconds}s`;
};

/**
 * Sanitize auth redirect URL to prevent open redirect vulnerabilities
 */
export const sanitizeRedirectUrl = (url: string | null): string => {
  // Default redirect location
  const defaultRedirect = '/';
  
  // If no URL provided, use default
  if (!url) return defaultRedirect;
  
  try {
    // If it's a relative URL (starts with /) it's safe
    if (url.startsWith('/')) return url;
    
    // For absolute URLs, check if it's on the same origin
    const urlObj = new URL(url, window.location.origin);
    if (urlObj.origin === window.location.origin) {
      return urlObj.pathname + urlObj.search + urlObj.hash;
    }
    
    // If not same origin, return default
    return defaultRedirect;
  } catch (e) {
    // Invalid URL, return default
    console.error('Invalid redirect URL:', url);
    return defaultRedirect;
  }
};

/**
 * Force user sign out and redirect to auth page
 */
export const forceSignOut = async () => {
  try {
    await supabase.auth.signOut();
    AuthStorage.clearAuthData();
    toast.info('Your session has expired. Please sign in again.');
    window.location.href = '/auth';
  } catch (error) {
    console.error('Error during forced sign out:', error);
    window.location.href = '/auth';
  }
};

// Export the unified AuthState enum
export default {
  storage: AuthStorage,
  AuthState,
  isSessionExpired,
  isSessionExpiringSoon,
  getSessionTimeRemaining,
  formatSessionTimeRemaining,
  sanitizeRedirectUrl,
  forceSignOut
};
