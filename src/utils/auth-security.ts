
/**
 * @deprecated Use the new auth-service.ts instead
 * This file is kept for backward compatibility but will be removed in a future update.
 */

import { Session } from '@supabase/supabase-js';
import { AuthStorage, isSessionExpired, isSessionExpiringSoon, getSessionTimeRemaining, formatSessionTimeRemaining, sanitizeRedirectUrl, forceSignOut } from './auth-service';

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
  AuthStorage.clearAuthData();
};

// Force user sign out and redirect to auth page
export const forceSignOut = async () => {
  return forceSignOut();
};

// Check if a session is expired
export const isSessionExpired = (session: Session | null): boolean => {
  return isSessionExpired(session);
};

// Check if session is about to expire soon (within buffer minutes)
export const isSessionExpiringSoon = (session: Session | null, bufferMinutes = 5): boolean => {
  return isSessionExpiringSoon(session, bufferMinutes);
};

// Calculate time remaining in session
export const getSessionTimeRemaining = (session: Session | null): number => {
  return getSessionTimeRemaining(session);
};

// Format time remaining in friendly format
export const formatSessionTimeRemaining = (session: Session | null): string => {
  return formatSessionTimeRemaining(session);
};

// Set flag that auth animation has been shown
export const markAuthAnimationShown = () => {
  AuthStorage.markAuthAnimationShown();
};

// Check if auth animation has been shown
export const hasAuthAnimationBeenShown = (): boolean => {
  return AuthStorage.hasAuthAnimationBeenShown();
};

// Reset the auth animation flag
export const resetAuthAnimationFlag = () => {
  AuthStorage.resetAuthAnimationFlag();
};

// Sanitize auth redirect URL to prevent open redirect vulnerabilities
export const sanitizeRedirectUrl = (url: string | null): string => {
  return sanitizeRedirectUrl(url);
};
