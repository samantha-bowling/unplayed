
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

// Constants for localStorage keys
const LOCAL_STORAGE_KEYS = {
  AUTH_REDIRECT: 'unplayed_auth_redirect',
  PROFILE_CACHE: 'unplayed_profile_cache',
  LAST_SESSION: 'unplayed_last_session',
  LAST_SESSION_TIME: 'unplayed_last_session_time',
  AUTH_ANIMATION_SHOWN: 'unplayed_auth_animation_shown'
};

// Clear all auth-related data from local storage
export const clearAuthData = () => {
  Object.values(LOCAL_STORAGE_KEYS).forEach(key => {
    localStorage.removeItem(key);
  });
};

// Force user sign out and redirect to auth page
export const forceSignOut = async () => {
  await supabase.auth.signOut();
  clearAuthData();
  window.location.href = '/auth';
};

// Check if a session is expired
export const isSessionExpired = (session: Session | null): boolean => {
  if (!session) return true;
  
  const expiresAt = new Date(session.expires_at * 1000);
  return expiresAt < new Date();
};

// Check if session is about to expire soon (within buffer minutes)
export const isSessionExpiringSoon = (session: Session | null, bufferMinutes = 5): boolean => {
  if (!session) return true;
  
  const expiresAt = new Date(session.expires_at * 1000);
  const bufferMs = bufferMinutes * 60 * 1000;
  return expiresAt.getTime() - Date.now() < bufferMs;
};

// Calculate time remaining in session
export const getSessionTimeRemaining = (session: Session | null): number => {
  if (!session) return 0;
  
  const expiresAt = new Date(session.expires_at * 1000);
  return Math.max(0, expiresAt.getTime() - Date.now());
};

// Format time remaining in friendly format
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

// Set flag that auth animation has been shown
export const markAuthAnimationShown = () => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEYS.AUTH_ANIMATION_SHOWN, 'true');
  } catch (err) {
    console.error('Error setting auth animation flag:', err);
  }
};

// Check if auth animation has been shown
export const hasAuthAnimationBeenShown = (): boolean => {
  try {
    return localStorage.getItem(LOCAL_STORAGE_KEYS.AUTH_ANIMATION_SHOWN) === 'true';
  } catch (err) {
    console.error('Error checking auth animation flag:', err);
    return false;
  }
};

// Reset the auth animation flag
export const resetAuthAnimationFlag = () => {
  try {
    localStorage.removeItem(LOCAL_STORAGE_KEYS.AUTH_ANIMATION_SHOWN);
  } catch (err) {
    console.error('Error resetting auth animation flag:', err);
  }
};

// Sanitize auth redirect URL to prevent open redirect vulnerabilities
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
