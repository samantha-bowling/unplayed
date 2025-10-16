
/**
 * Auth Permission Hook
 * 
 * A custom hook for checking user permissions in components.
 * This creates a consistent way to check permissions across the app.
 */
import { useCallback, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useProfile } from '@/hooks/use-profile';
import { isAdmin, hasRole, canAccess, getUserRoles, UserRole } from '@/utils/auth-utils';

export function useAuthPermission() {
  const { user } = useAuth();
  const { profile, isLoading: profileLoading } = useProfile();

  // Memoize admin check (stable boolean value)
  const isAdminValue = useMemo(() => isAdmin(user, profile), [user, profile]);

  // Memoize userRoles (stable array reference)
  const userRolesValue = useMemo(() => getUserRoles(user, profile), [user, profile]);

  // Memoize hasRole function (stable function reference)
  const hasRoleCallback = useCallback(
    (role: string) => hasRole(user, role, profile),
    [user, profile]
  );

  // Memoize canAccess function (stable function reference)
  const canAccessCallback = useCallback(
    (requiredPermissions: { 
      roles?: string[], 
      conditions?: ((user: any, profile?: any) => boolean)[] 
    }) => canAccess(user, requiredPermissions, profile),
    [user, profile]
  );

  return {
    // Check if user is authenticated
    isAuthenticated: !!user,
    
    // Check if user is an admin
    isAdmin: isAdminValue,
    
    // Check if user has a specific role
    hasRole: hasRoleCallback,
    
    // Get all user roles
    userRoles: userRolesValue,
    
    // Check if user can access a resource based on permissions
    canAccess: canAccessCallback,
    
    // Helper for checking user role enum
    UserRole,

    // Add loading state to indicate when profile data is being fetched
    isLoading: profileLoading,
  };
}

export default useAuthPermission;
