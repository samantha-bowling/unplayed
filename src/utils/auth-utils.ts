
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
 * PRIMARY SOURCE: auth.users.app_metadata.roles (immutable by clients)
 * This is the ONLY source of truth for role checking in the Hybrid security model.
 * 
 * @param user - User object from Supabase auth
 * @param profile - Optional user profile (NOT USED for role checks)
 * @returns boolean indicating if user is admin
 */
export const isAdmin = (user?: User | null, profile?: UserProfile | null): boolean => {
  if (!user) return false;
  
  // ONLY check app_metadata.roles (source of truth)
  const roles = user.app_metadata?.roles;
  if (Array.isArray(roles) && roles.includes('admin')) {
    return true;
  }
  
  // No fallback - roles MUST be in app_metadata
  return false;
};

/**
 * Check if user has a specific role
 * 
 * PRIMARY SOURCE: auth.users.app_metadata.roles (immutable by clients)
 * 
 * @param user - User object from Supabase auth
 * @param role - Role to check for
 * @param profile - Optional user profile (NOT USED for role checks)
 * @returns boolean indicating if user has the role
 */
export const hasRole = (user: User | null, role: string, profile?: UserProfile | null): boolean => {
  if (!user) return false;
  
  // ONLY check app_metadata.roles (source of truth)
  const roles = user.app_metadata?.roles;
  if (Array.isArray(roles) && roles.includes(role)) {
    return true;
  }
  
  // No fallback - roles MUST be in app_metadata
  return false;
};

/**
 * Get all roles for a user
 * 
 * PRIMARY SOURCE: auth.users.app_metadata.roles (immutable by clients)
 * 
 * @param user - User object from Supabase auth
 * @param profile - Optional user profile (NOT USED for role checks)
 * @returns Array of role strings
 */
export const getUserRoles = (user: User | null, profile?: UserProfile | null): string[] => {
  if (!user) return [];
  
  // ONLY get roles from app_metadata (source of truth)
  const appMetadataRoles = user.app_metadata?.roles;
  if (Array.isArray(appMetadataRoles)) {
    return [...appMetadataRoles];
  }
  
  // No fallback - roles MUST be in app_metadata
  return [];
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
