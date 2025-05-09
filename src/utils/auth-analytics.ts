
import { EnhancedAuthStatus } from '@/context/AuthContext';

type AuthEventType = 
  | 'auth_success' 
  | 'auth_failed' 
  | 'token_refresh' 
  | 'profile_loaded' 
  | 'error_recovered'
  | 'session_expired';

type EventContext = Record<string, any>;

export const trackAuthEvent = (
  eventType: AuthEventType, 
  context?: EventContext
) => {
  // For development, just log to console
  if (process.env.NODE_ENV === 'development') {
    console.debug(`[Auth Analytics] ${eventType}`, context || {});
    return;
  }
  
  // In production, this would connect to analytics system
  // E.g., PostHog, mixpanel, or custom backend
};

// Map enhanced status to user-friendly descriptions
export const getStatusDescription = (status: EnhancedAuthStatus): string => {
  switch (status) {
    case EnhancedAuthStatus.INITIAL:
      return 'Initializing authentication...';
    case EnhancedAuthStatus.SESSION_LOADING:
      return 'Loading your session...';
    case EnhancedAuthStatus.SESSION_FOUND:
      return 'Session found';
    case EnhancedAuthStatus.SESSION_NOT_FOUND:
      return 'Not signed in';
    case EnhancedAuthStatus.PROFILE_LOADING:
      return 'Loading your profile...';
    case EnhancedAuthStatus.PROFILE_LOADED:
      return 'Profile loaded';
    case EnhancedAuthStatus.PROFILE_ERROR:
      return 'Error loading profile';
    case EnhancedAuthStatus.TOKEN_REFRESH_ERROR:
      return 'Session expired';
    case EnhancedAuthStatus.AUTH_ERROR:
      return 'Authentication error';
    default:
      return 'Unknown status';
  }
};

// Utility to check if a session error is recoverable
export const isRecoverableAuthError = (status: EnhancedAuthStatus): boolean => {
  return [
    EnhancedAuthStatus.PROFILE_ERROR,
    EnhancedAuthStatus.TOKEN_REFRESH_ERROR
  ].includes(status);
};

// Extended debug log that also tracks events
export const logAuthEvent = (event: string, data?: any) => {
  // Original debug logging
  if (process.env.NODE_ENV === 'development') {
    console.debug(`[Auth] ${event}`, data || '');
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
  }
};

// Track auth metrics with timing
export const trackAuthPerformance = (operation: string, startTime: number) => {
  const duration = Date.now() - startTime;
  logAuthEvent(`Performance: ${operation} completed in ${duration}ms`, { duration });
  
  // Could send to analytics in production
  // trackAuthEvent('auth_performance', { operation, duration });
};
