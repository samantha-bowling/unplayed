
import { ReactNode, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { AuthStatus } from '@/context/AuthContext';
import SteamLoader from './SteamLoader';
import { AuthStorage } from '@/utils/auth-service';
import { useAuthPermission } from '@/hooks/use-auth-permission';
import { verifyAdminRPC } from '@/utils/auth-rpc';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: string;
  verifyWithRPC?: boolean; // Enable server-side RPC verification (auto-enabled for admin routes)
}

export default function ProtectedRoute({ 
  children, 
  requiredRole,
  verifyWithRPC = requiredRole === 'admin' // Auto-enable RPC verification for admin routes
}: ProtectedRouteProps) {
  const { status, user } = useAuth();
  const { hasRole, isLoading: permissionLoading } = useAuthPermission();
  const location = useLocation();
  const [rpcVerified, setRpcVerified] = useState<boolean | null>(null);

  // Show loading state only when necessary authentication data is loading
  const isLoading = status === AuthStatus.LOADING || 
    (status === AuthStatus.AUTHENTICATED && requiredRole && permissionLoading);

  // Server-side RPC verification for admin routes (defense-in-depth)
  useEffect(() => {
    if (!verifyWithRPC || isLoading) {
      setRpcVerified(true); // Skip RPC for non-admin routes
      return;
    }

    // Only verify if cached check passes
    if (!hasRole(requiredRole!)) {
      setRpcVerified(false);
      return;
    }

    // Race condition protection: prevent state updates after unmount
    let cancelled = false;
    
    // Timeout protection: fail closed after 5 seconds
    const timeout = setTimeout(() => {
      if (!cancelled) {
        console.warn('[ProtectedRoute] RPC verification timeout - denying access');
        setRpcVerified(false);
      }
    }, 5000);

    // Execute server-side verification
    verifyAdminRPC()
      .then(result => {
        if (!cancelled) {
          setRpcVerified(result);
          if (!result) {
            console.warn('[ProtectedRoute] RPC verification failed - cached role mismatch detected');
          }
        }
      })
      .catch(err => {
        if (!cancelled) {
          console.error('[ProtectedRoute] RPC verification error:', err);
          setRpcVerified(false); // Fail closed on error
        }
      });

    // Cleanup: cancel pending operations on unmount
    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [verifyWithRPC, requiredRole, hasRole, isLoading]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <SteamLoader message="Verifying access..." size="md" variant="secondary" />
      </div>
    );
  }

  // Show separate loading state for RPC verification
  if (verifyWithRPC && rpcVerified === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <SteamLoader message="Verifying admin access..." size="md" variant="secondary" />
      </div>
    );
  }

  // If not authenticated, redirect to auth page
  if (status === AuthStatus.UNAUTHENTICATED || !user) {
    // Store the current path for redirect after login
    AuthStorage.setRedirectPath(location.pathname);
    return <Navigate to={`/auth?redirectTo=${encodeURIComponent(location.pathname)}`} replace />;
  }

  // Cached role check (fast UI)
  if (requiredRole && !hasRole(requiredRole)) {
    return <Navigate to="/" replace />;
  }

  // Server-side RPC check (secure enforcement)
  if (verifyWithRPC && !rpcVerified) {
    return <Navigate to="/" replace />;
  }

  // User is authenticated and authorized, render the protected content
  return <>{children}</>;
}
