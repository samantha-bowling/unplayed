
/**
 * Auth Permission Hook
 * 
 * A custom hook for checking user permissions in components.
 * This creates a consistent way to check permissions across the app.
 */
import { useAuth } from '@/context/AuthContext';
import { useProfile } from '@/hooks/use-profile';
import { isAdmin, hasRole, canAccess, getUserRoles, UserRole } from '@/utils/auth-utils';

export function useAuthPermission() {
  const { user } = useAuth();
  const { profile } = useProfile();

  return {
    // Check if user is authenticated
    isAuthenticated: !!user,
    
    // Check if user is an admin
    isAdmin: isAdmin(user, profile),
    
    // Check if user has a specific role
    hasRole: (role: string) => hasRole(user, role, profile),
    
    // Get all user roles
    userRoles: getUserRoles(user, profile),
    
    // Check if user can access a resource based on permissions
    canAccess: (requiredPermissions: { 
      roles?: string[], 
      conditions?: ((user: any, profile?: any) => boolean)[] 
    }) => canAccess(user, requiredPermissions, profile),
    
    // Helper for checking user role enum
    UserRole,
  };
}

export default useAuthPermission;
