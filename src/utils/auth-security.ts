
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

// Constants for localStorage keys
const LOCAL_STORAGE_KEYS = {
  AUTH_REDIRECT: 'unplayed_auth_redirect',
  PROFILE_CACHE: 'unplayed_profile_cache',
  LAST_SESSION: 'unplayed_last_session',
  LAST_SESSION_TIME: 'unplayed_last_session_time'
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
