
import { ReactNode } from 'react';
import { AuthError, EnhancedAuthStatus } from '@/context/AuthContext';

// Common component props
export interface SteamLoginButtonProps {
  className?: string;
  redirectPath?: string;
  fullWidth?: boolean;
  centered?: boolean;
  disabled?: boolean;
}

export interface AuthErrorMessageProps {
  errorType: EnhancedAuthStatus;
  error: AuthError | null;
  onRetry: () => void;
  isRetrying?: boolean;
}

export interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: string;
}

// Add more shared types as needed
