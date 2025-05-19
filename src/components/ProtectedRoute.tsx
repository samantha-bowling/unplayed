
// src/components/ProtectedRoute.tsx

import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { AuthStatus } from '@/context/AuthContext';
import SteamLoader from './SteamLoader';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: string;
}

export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { status, user, profile, isLoading } = useAuth();
  const location = useLocation();

  // Show loading state
  if (status === AuthStatus.LOADING || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <SteamLoader message="Verifying access..." size="md" variant="secondary" />
      </div>
    );
  }

  // If not authenticated, redirect to auth page
  if (status === AuthStatus.UNAUTHENTICATED || !user) {
    return <Navigate to={`/auth?redirectTo=${encodeURIComponent(location.pathname)}`} replace />;
  }

  // Check for required role if specified
  if (requiredRole && profile?.role !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  // User is authenticated, render the protected content
  return <>{children}</>;
}
