/**
 * @deprecated This file contains mostly dummy functions for analytics that aren't used in production.
 * It should be properly implemented or removed in a future update.
 */

import { AuthStatus } from '@/context/AuthContext';
import { devDebug } from '../lib/dev-log';

type AuthEventType = 
  | 'auth_success' 
  | 'auth_failed' 
  | 'token_refresh' 
  | 'profile_loaded' 
  | 'library_imported'
  | 'library_updated'
  | 'error_recovered'
  | 'session_expired'
  | 'auth_ui_interaction'
  | 'auth_animation_complete';

type EventContext = Record<string, any>;

export const trackAuthEvent = (
  eventType: AuthEventType, 
  context?: EventContext
) => {
  // For development, just log to console
  if (process.env.NODE_ENV === 'development') {
    devDebug(`[Auth Analytics] ${eventType}`, context || {});
    return;
  }
  
  // In production, this would connect to analytics system
  // E.g., PostHog, mixpanel, or custom backend
};

// Map auth status to user-friendly descriptions
export const getStatusDescription = (status: AuthStatus): string => {
  switch (status) {
    case AuthStatus.LOADING:
      return 'Loading your session...';
    case AuthStatus.AUTHENTICATED:
      return 'Authenticated';
    case AuthStatus.UNAUTHENTICATED:
      return 'Not signed in';
    default:
      return 'Unknown status';
  }
};

// Utility to check if a session error is recoverable
export const isRecoverableAuthError = (errorType: string): boolean => {
  return [
    'PROFILE_ERROR',
    'TOKEN_REFRESH_ERROR'
  ].includes(errorType);
};

// Extended debug log that also tracks events
export const logAuthEvent = (event: string, data?: any) => {
  // Original debug logging
  if (process.env.NODE_ENV === 'development') {
    devDebug(`[Auth] ${event}`, data || '');
  }
  
  // Map certain events to analytics
  if (event === 'Session established from URL tokens') {
    trackAuthEvent('auth_success', { method: 'steam', ...(data || {}) });
  } else if (event.includes('failed') || event.includes('error')) {
    trackAuthEvent('auth_failed', { reason: event, ...(data || {}) });
  } else if (event === 'Token refreshed successfully') {
    trackAuthEvent('token_refresh', { success: true });
  } else if (event === 'Profile fetched successfully') {
    trackAuthEvent('profile_loaded', data);
  } else if (event === 'Game library import completed') {
    trackAuthEvent('library_imported', { gameCount: data?.gameCount });
  } else if (event === 'Game library update completed') {
    trackAuthEvent('library_updated', { updatedCount: data?.updatedCount });
  } else if (event === 'Success animation displayed') {
    trackAuthEvent('auth_animation_complete', { displayDuration: data?.duration });
  }
};

// Track auth metrics with timing
export const trackAuthPerformance = (operation: string, startTime: number) => {
  const duration = Date.now() - startTime;
  logAuthEvent(`Performance: ${operation} completed in ${duration}ms`, { duration });
  
  // Could send to analytics in production
  // trackAuthEvent('auth_performance', { operation, duration });
};

// Track auth UI interactions
export const trackAuthUIInteraction = (interaction: string, context?: Record<string, any>) => {
  trackAuthEvent('auth_ui_interaction', {
    interaction,
    timestamp: Date.now(),
    ...context
  });
};

// Generate a user-friendly error message based on error code
export const getUserFriendlyErrorMessage = (errorCode: string): string => {
  switch (errorCode) {
    case 'auth/invalid-login-credentials':
      return 'Invalid login credentials. Please check and try again.';
    case 'auth/user-not-found':
      return 'User not found. Please check your login details or sign up.';
    case 'auth/too-many-requests':
      return 'Too many login attempts. Please try again later.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your internet connection.';
    case 'auth/steam-profile-private':
      return 'Your Steam profile appears to be private. Please check your privacy settings.';
    case 'auth/steam-api-error':
      return 'There was an error connecting to Steam. Please try again later.';
    case 'auth/session-expired':
      return 'Your session has expired. Please sign in again.';
    case 'verification_failed':
      return 'Authentication verification failed with Steam. Please try again.';
    case 'signup_failed':
      return 'There was a problem creating your account. Please try again.';
    default:
      return 'An error occurred during authentication. Please try again.';
  }
};

// Add a TypeScript interface for gtag
interface WindowWithGtag extends Window {
  gtag?: (...args: any[]) => void;
}

export const trackAuthStatusChange = (newStatus: AuthStatus, userId?: string | null) => {
  // Check if gtag exists in the window object
  const windowWithGtag = window as WindowWithGtag;
  if (!windowWithGtag.gtag) return;

  let eventName = '';
  let properties = {
    auth_status: newStatus,
    user_id: userId || undefined,
  };

  switch (newStatus) {
    case AuthStatus.LOADING:
      eventName = 'auth_session_loading';
      break;
    case AuthStatus.UNAUTHENTICATED:
      eventName = 'auth_session_not_found';
      break;
    case AuthStatus.AUTHENTICATED:
      eventName = 'auth_session_found';
      break;
    default:
      eventName = 'auth_status_unknown';
  }

  if (eventName) {
    windowWithGtag.gtag?.('event', eventName, properties);
  }
};
