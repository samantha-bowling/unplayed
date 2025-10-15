import { ReactNode, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthPermission } from '@/hooks/use-auth-permission';
import { verifyAdminRPC } from '@/utils/auth-rpc';
import SteamLoader from './SteamLoader';

interface RequireAdminProps {
  children: ReactNode;
}

/**
 * Admin Route Guard with Server Verification
 * 
 * Uses cached profile check first (fast), then verifies with RPC (secure)
 * This prevents UI flicker while maintaining security.
 */
export function RequireAdmin({ children }: RequireAdminProps) {
  const { isAdmin: cachedIsAdmin, isLoading } = useAuthPermission();
  const [verified, setVerified] = useState<boolean | null>(null);

  useEffect(() => {
    // Only verify if cached check passes
    if (cachedIsAdmin && !isLoading) {
      verifyAdminRPC().then(setVerified);
    } else if (!cachedIsAdmin && !isLoading) {
      setVerified(false);
    }
  }, [cachedIsAdmin, isLoading]);

  if (isLoading || verified === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <SteamLoader message="Verifying admin access..." size="md" variant="secondary" />
      </div>
    );
  }

  if (!verified) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
