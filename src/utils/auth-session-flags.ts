
/**
 * DEPRECATED: This file is being replaced by AuthSessionManager.
 * 
 * Please use the AuthSessionManager utilities instead, which provide a
 * more robust state machine implementation for auth flows.
 * 
 * import AuthSessionManager from '@/utils/auth/AuthSessionManager';
 */

import AuthSessionManager from './auth/AuthSessionManager';

// Re-export types needed for compatibility
export type AuthFlowStatus = 'initializing' | 'logged_in_waiting_profile' | 'onboarding_needed' | 'ready';

/**
 * @deprecated Use AuthSessionManager.setAuthFlag instead
 */
export const setSessionFlag = (flag: any, value: string = 'true'): void => {
  console.warn('[DEPRECATED] Using legacy setSessionFlag - please migrate to AuthSessionManager.setAuthFlag');
  AuthSessionManager.setAuthFlag(flag, value);
};

/**
 * @deprecated Use AuthSessionManager.getAuthFlag instead
 */
export const getSessionFlag = (flag: any): string | null => {
  console.warn('[DEPRECATED] Using legacy getSessionFlag - please migrate to AuthSessionManager.getAuthFlag');
  return AuthSessionManager.getAuthFlag(flag);
};

/**
 * @deprecated Use AuthSessionManager.removeAuthFlag instead
 */
export const removeSessionFlag = (flag: any): void => {
  console.warn('[DEPRECATED] Using legacy removeSessionFlag - please migrate to AuthSessionManager.removeAuthFlag');
  AuthSessionManager.removeAuthFlag(flag);
};

/**
 * @deprecated Use AuthSessionManager.hasAuthFlag instead
 */
export const hasSessionFlag = (flag: any): boolean => {
  console.warn('[DEPRECATED] Using legacy hasSessionFlag - please migrate to AuthSessionManager.hasAuthFlag');
  return AuthSessionManager.hasAuthFlag(flag);
};

/**
 * @deprecated Use AuthSessionManager.clearAllAuthFlags instead
 */
export const clearAuthSessionFlags = (): void => {
  console.warn('[DEPRECATED] Using legacy clearAuthSessionFlags - please migrate to AuthSessionManager.clearAllAuthFlags');
  AuthSessionManager.clearAllAuthFlags();
};

/**
 * @deprecated Use AuthSessionManager.isAuthInProgress instead
 */
export const isAuthInProgress = (): boolean => {
  console.warn('[DEPRECATED] Using legacy isAuthInProgress - please migrate to AuthSessionManager.isAuthInProgress');
  return AuthSessionManager.isAuthInProgress();
};

/**
 * @deprecated Use AuthSessionManager.setAuthFlag with timeout parameter instead
 */
export const setTimedSessionFlag = (
  flag: any, 
  value: string = 'true',
  expirationMs: number = 60000 // Default to 1 minute
): void => {
  console.warn('[DEPRECATED] Using legacy setTimedSessionFlag - please migrate to AuthSessionManager.setAuthFlag with timeout');
  AuthSessionManager.setAuthFlag(flag, value, expirationMs);
};

/**
 * @deprecated Use AuthSessionManager.setAuthFlowState with appropriate enum value instead
 */
export const setAuthFlowStatus = (status: AuthFlowStatus): void => {
  console.warn('[DEPRECATED] Using legacy setAuthFlowStatus - please migrate to AuthSessionManager.setAuthFlowState');
  switch(status) {
    case 'initializing':
      AuthSessionManager.setAuthFlowState(AuthSessionManager.AuthFlowState.INITIAL);
      break;
    case 'logged_in_waiting_profile':
      AuthSessionManager.setAuthFlowState(AuthSessionManager.AuthFlowState.PROFILE_LOADING);
      break;
    case 'onboarding_needed':
      AuthSessionManager.setAuthFlowState(AuthSessionManager.AuthFlowState.ONBOARDING_NEEDED);
      break;
    case 'ready':
      AuthSessionManager.setAuthFlowState(AuthSessionManager.AuthFlowState.AUTH_READY);
      break;
  }
};

/**
 * @deprecated Use AuthSessionManager.getAuthFlowState and map as needed
 */
export const getAuthFlowStatus = (): AuthFlowStatus => {
  console.warn('[DEPRECATED] Using legacy getAuthFlowStatus - please migrate to AuthSessionManager.getAuthFlowState');
  const state = AuthSessionManager.getAuthFlowState();
  
  switch(state) {
    case AuthSessionManager.AuthFlowState.INITIAL:
      return 'initializing';
    case AuthSessionManager.AuthFlowState.PROFILE_LOADING:
      return 'logged_in_waiting_profile';
    case AuthSessionManager.AuthFlowState.ONBOARDING_NEEDED:
      return 'onboarding_needed';
    case AuthSessionManager.AuthFlowState.AUTH_READY:
      return 'ready';
    default:
      return 'initializing';
  }
};

/**
 * @deprecated Use AuthSessionManager.markJustLoggedIn instead
 */
export const markFirstLogin = (): void => {
  console.warn('[DEPRECATED] Using legacy markFirstLogin - please migrate to AuthSessionManager.markJustLoggedIn');
  AuthSessionManager.markJustLoggedIn();
};

/**
 * @deprecated Use custom logic with AuthSessionManager.getAuthFlag instead
 */
export const isRecentFirstLogin = (maxAgeMs: number = 5 * 60 * 1000): boolean => {
  console.warn('[DEPRECATED] Using legacy isRecentFirstLogin - please implement with AuthSessionManager.getAuthFlag');
  const timestamp = AuthSessionManager.getAuthFlag('FIRST_LOGIN_TIMESTAMP');
  if (!timestamp) return false;
  
  const loginTime = parseInt(timestamp, 10);
  return !isNaN(loginTime) && (Date.now() - loginTime) < maxAgeMs;
};

/**
 * @deprecated Use AuthSessionManager.markOnboardingStarted instead
 */
export const markOnboardingStarted = (): void => {
  console.warn('[DEPRECATED] Using legacy markOnboardingStarted - please migrate to AuthSessionManager.markOnboardingStarted');
  AuthSessionManager.markOnboardingStarted();
};

/**
 * @deprecated Use AuthSessionManager.hasOnboardingStarted instead
 */
export const hasOnboardingStarted = (): boolean => {
  console.warn('[DEPRECATED] Using legacy hasOnboardingStarted - please migrate to AuthSessionManager.hasOnboardingStarted');
  return AuthSessionManager.hasOnboardingStarted();
};

/**
 * @deprecated Use AuthSessionManager.markFromAuthCallback instead
 */
export const markFromAuthCallback = (): void => {
  console.warn('[DEPRECATED] Using legacy markFromAuthCallback - please migrate to AuthSessionManager.markFromAuthCallback');
  AuthSessionManager.markFromAuthCallback();
};

/**
 * @deprecated Use AuthSessionManager.isFromAuthCallback instead
 */
export const isFromAuthCallback = (): boolean => {
  console.warn('[DEPRECATED] Using legacy isFromAuthCallback - please migrate to AuthSessionManager.isFromAuthCallback');
  return AuthSessionManager.isFromAuthCallback();
};

// Export SESSION_FLAGS for compatibility
export const SESSION_FLAGS = {
  AUTH_IN_PROGRESS: 'authInProgress',
  AUTH_STARTED: 'authStarted',
  JUST_LOGGED_IN: 'justLoggedIn',
  STEAM_AUTH_STARTED: 'steamAuthStarted',
  STEAM_AUTH_ATTEMPTED: 'steamAuthAttempted',
  FROM_AUTH_CALLBACK: 'fromAuthCallback',
  AUTH_FLOW_STATUS: 'authFlowStatus',
  ONBOARDING_STARTED: 'onboardingStarted',
  FIRST_LOGIN_TIMESTAMP: 'firstLoginTimestamp',
};
