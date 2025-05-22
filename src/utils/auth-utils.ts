
/**
 * Authentication and Authorization Utilities
 * 
 * This module centralizes permission checks, role validation, and other
 * auth-related helper functions to maintain consistency across the application.
 */
import { User } from '@supabase/supabase-js';
import { UserProfile } from '@/hooks/use-profile';

/**
 * Available user roles in the application
 */
export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
}

/**
 * Check if a user has admin privileges
 * 
 * This standardizes admin checks across the application by checking both 
 * app_metadata.roles and profile.role for backward compatibility.
 */
export const isAdmin = (user?: User | null, profile?: UserProfile | null): boolean => {
  // Early return if no user
  if (!user) return false;
  
  // Check app_metadata first (Supabase recommended approach)
  if (user.app_metadata?.roles?.includes(UserRole.ADMIN)) {
    return true;
  }
  
  // Fallback to profile.role (legacy approach)
  if (profile?.role === UserRole.ADMIN) {
    return true;
  }
  
  return false;
};

/**
 * Check if user has a specific role
 */
export const hasRole = (user: User | null, role: string, profile?: UserProfile | null): boolean => {
  // Early return if no user or role
  if (!user || !role) return false;
  
  // Check app_metadata roles array
  if (user.app_metadata?.roles?.includes(role)) {
    return true;
  }
  
  // Fallback to profile.role if it matches exactly
  if (profile?.role === role) {
    return true;
  }
  
  return false;
};

/**
 * Get all roles for a user
 * 
 * This combines roles from both app_metadata and profile for a complete list
 */
export const getUserRoles = (user: User | null, profile?: UserProfile | null): string[] => {
  if (!user) return [];
  
  const metadataRoles = user.app_metadata?.roles || [];
  const profileRole = profile?.role;
  
  // Combine and deduplicate roles
  const allRoles = [...metadataRoles];
  
  // Add profile role if it exists and is not already in the list
  if (profileRole && !allRoles.includes(profileRole)) {
    allRoles.push(profileRole);
  }
  
  return allRoles;
};

/**
 * Check if user can access a protected resource
 * 
 * This is a more generic function that can be used to check multiple permissions
 */
export const canAccess = (
  user: User | null, 
  requiredPermissions: { roles?: string[], conditions?: ((user: User, profile?: UserProfile) => boolean)[] },
  profile?: UserProfile | null,
): boolean => {
  // No user means no access
  if (!user) return false;
  
  // If no permissions specified, allow access to authenticated users
  if (!requiredPermissions.roles && !requiredPermissions.conditions) return true;
  
  // Check role-based permissions
  if (requiredPermissions.roles && requiredPermissions.roles.length > 0) {
    const hasRequiredRole = requiredPermissions.roles.some(role => 
      hasRole(user, role, profile)
    );
    
    if (!hasRequiredRole) return false;
  }
  
  // Check condition-based permissions
  if (requiredPermissions.conditions && requiredPermissions.conditions.length > 0) {
    const meetsAllConditions = requiredPermissions.conditions.every(condition => 
      user ? condition(user, profile) : false
    );
    
    if (!meetsAllConditions) return false;
  }
  
  // All checks passed
  return true;
};
