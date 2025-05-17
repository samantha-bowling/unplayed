
// src/context/auth/hook.ts
import { useContext } from 'react';
import { AuthContext } from './provider';

export const useAuth = () => {
  const context = useContext(AuthContext);
  
  // Add detailed information to the error to help debugging
  if (!context) {
    console.error('[Auth] useAuth() called outside of AuthProvider context. Check component hierarchy.');
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};
