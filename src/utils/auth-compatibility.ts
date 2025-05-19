
// src/utils/auth-compatibility.ts
// This file provides compatibility with older auth implementation while we transition to the simpler model

import { AuthStatus } from "@/context/AuthContext";

// Legacy enum for backward compatibility during transition
export enum EnhancedAuthStatus {
  INITIAL = 'INITIAL',
  SESSION_LOADING = 'SESSION_LOADING',
  SESSION_FOUND = 'SESSION_FOUND',
  PROFILE_LOADING = 'PROFILE_LOADING',
  PROFILE_LOADED = 'PROFILE_LOADED',
  PROFILE_ERROR = 'PROFILE_ERROR',
  LIBRARY_LOADING = 'LIBRARY_LOADING',
  LIBRARY_READY = 'LIBRARY_READY',
  LIBRARY_ERROR = 'LIBRARY_ERROR',
  AUTH_ERROR = 'AUTH_ERROR',
  TOKEN_REFRESH_ERROR = 'TOKEN_REFRESH_ERROR'
}

// Map the simplified AuthStatus to legacy EnhancedAuthStatus
export const mapToEnhancedStatus = (status: AuthStatus, hasProfile: boolean, hasError: boolean): EnhancedAuthStatus => {
  if (status === AuthStatus.LOADING) {
    return EnhancedAuthStatus.SESSION_LOADING;
  }
  
  if (status === AuthStatus.UNAUTHENTICATED) {
    return EnhancedAuthStatus.INITIAL;
  }
  
  if (status === AuthStatus.AUTHENTICATED) {
    if (hasError) {
      return EnhancedAuthStatus.PROFILE_ERROR;
    }
    
    if (hasProfile) {
      return EnhancedAuthStatus.PROFILE_LOADED;
    }
    
    return EnhancedAuthStatus.PROFILE_LOADING;
  }
  
  return EnhancedAuthStatus.INITIAL;
};
