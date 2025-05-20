
/**
 * @deprecated Use the new auth-service.ts instead
 * This file is kept for backward compatibility but will be removed in a future update.
 */

import { AuthStorage, AuthState } from '../auth-service';

// Simplified authentication flow states - only use these three states
export enum AuthFlowState {
  LOADING = 'loading',
  AUTHENTICATED = 'authenticated',
  UNAUTHENTICATED = 'unauthenticated'
}

// Map old states to new states for backward compatibility
const mapToNewState = (oldState: AuthFlowState): AuthState => {
  switch (oldState) {
    case AuthFlowState.LOADING: return AuthState.LOADING;
    case AuthFlowState.AUTHENTICATED: return AuthState.AUTHENTICATED;
    case AuthFlowState.UNAUTHENTICATED: return AuthState.UNAUTHENTICATED;
    default: return AuthState.LOADING;
  }
};

/**
 * Set an authentication flag with optional expiration
 * @deprecated Use AuthStorage.setAuthFlag from auth-service.ts instead
 */
export const setAuthFlag = (
  flag: string, 
  value: string = 'true',
  expirationMs?: number
): void => {
  // Map old flag names to new ones
  let newFlagName: any = flag;
  if (flag === 'AUTH_FLOW_STATUS') newFlagName = 'AUTH_STATE';
  
  AuthStorage.setAuthFlag(newFlagName as any, value, expirationMs);
};

/**
 * Get an authentication flag
 * @deprecated Use AuthStorage.getAuthFlag from auth-service.ts instead
 */
export const getAuthFlag = (flag: string): string | null => {
  // Map old flag names to new ones
  let newFlagName: any = flag;
  if (flag === 'AUTH_FLOW_STATUS') newFlagName = 'AUTH_STATE';
  
  return AuthStorage.getAuthFlag(newFlagName as any);
};

/**
 * Remove an authentication flag
 * @deprecated Use AuthStorage.removeAuthFlag from auth-service.ts instead
 */
export const removeAuthFlag = (flag: string): void => {
  // Map old flag names to new ones
  let newFlagName: any = flag;
  if (flag === 'AUTH_FLOW_STATUS') newFlagName = 'AUTH_STATE';
  
  AuthStorage.removeAuthFlag(newFlagName as any);
};

/**
 * Check if a flag exists and is set to 'true'
 * @deprecated Use AuthStorage.hasAuthFlag from auth-service.ts instead
 */
export const hasAuthFlag = (flag: string): boolean => {
  // Map old flag names to new ones
  let newFlagName: any = flag;
  if (flag === 'AUTH_FLOW_STATUS') newFlagName = 'AUTH_STATE';
  
  return AuthStorage.hasAuthFlag(newFlagName as any);
};

/**
 * Set the current authentication flow state to one of the three simplified states
 * @deprecated Use AuthStorage.setAuthState from auth-service.ts instead
 */
export const setAuthFlowState = (state: AuthFlowState): void => {
  AuthStorage.setAuthState(mapToNewState(state));
};

/**
 * Get the current authentication flow state
 * @deprecated Use AuthStorage.getAuthState from auth-service.ts instead
 */
export const getAuthFlowState = (): AuthFlowState => {
  const newState = AuthStorage.getAuthState();
  
  // Map new states to old states for backward compatibility
  switch (newState) {
    case AuthState.LOADING: return AuthFlowState.LOADING;
    case AuthState.AUTHENTICATED: return AuthFlowState.AUTHENTICATED;
    case AuthState.UNAUTHENTICATED: return AuthFlowState.UNAUTHENTICATED;
    default: return AuthFlowState.LOADING;
  }
};

/**
 * Clear all authentication-related flags
 * @deprecated Use AuthStorage.clearAuthData from auth-service.ts instead
 */
export const clearAllAuthFlags = (): void => {
  AuthStorage.clearAuthData();
};

/**
 * Mark that a user has just logged in
 * @deprecated Use AuthStorage.markJustLoggedIn from auth-service.ts instead
 */
export const markJustLoggedIn = (): void => {
  AuthStorage.markJustLoggedIn();
};

/**
 * Remove the just logged in flag (typically after onboarding)
 * @deprecated Use AuthStorage.clearJustLoggedIn from auth-service.ts instead
 */
export const clearJustLoggedIn = (): void => {
  AuthStorage.clearJustLoggedIn();
};

/**
 * Mark that authentication callback has been processed
 * @deprecated Use AuthStorage.markFromAuthCallback from auth-service.ts instead
 */
export const markFromAuthCallback = (): void => {
  AuthStorage.markFromAuthCallback();
};

/**
 * Check if the current flow is from an auth callback
 * @deprecated Use AuthStorage.isFromAuthCallback from auth-service.ts instead
 */
export const isFromAuthCallback = (): boolean => {
  return AuthStorage.isFromAuthCallback();
};

export default {
  setAuthFlag,
  getAuthFlag,
  removeAuthFlag,
  hasAuthFlag,
  setAuthFlowState,
  getAuthFlowState,
  clearAllAuthFlags,
  markJustLoggedIn,
  clearJustLoggedIn,
  markFromAuthCallback,
  isFromAuthCallback,
  AuthFlowState
};
