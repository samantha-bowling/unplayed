
// src/components/ProtectedRoute.tsx

import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { AuthStatus } from '@/context/AuthContext';
import SteamLoader from './SteamLoader';
import { AuthStorage } from '@/utils/auth-service';
import { useProfile } from '@/hooks/use-profile';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: string;
}

export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { status, user } = useAuth();
  const { profile, isLoading: profileLoading } = useProfile();
  const location = useLocation();

  // Show loading state only when necessary authentication data is loading
  const isLoading = status === AuthStatus.LOADING || 
    (status === AuthStatus.AUTHENTICATED && requiredRole && profileLoading);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <SteamLoader message="Verifying access..." size="md" variant="secondary" />
      </div>
    );
  }

  // If not authenticated, redirect to auth page
  if (status === AuthStatus.UNAUTHENTICATED || !user) {
    // Store the current path for redirect after login
    AuthStorage.setRedirectPath(location.pathname);
    return <Navigate to={`/auth?redirectTo=${encodeURIComponent(location.pathname)}`} replace />;
  }

  // Check for required role using app_metadata instead of profile.role
  if (requiredRole === "admin" && !user.app_metadata?.roles?.includes('admin')) {
    return <Navigate to="/" replace />;
  }

  // User is authenticated, render the protected content
  return <>{children}</>;
}
