
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
 * PRIMARY SOURCE: public.user_roles table via profile.roles
 * SECURITY: Roles sourced from database query, NOT from app_metadata
 * 
 * @param user - User object from Supabase auth (NOT USED for role check)
 * @param profile - User profile with joined user_roles
 * @returns boolean indicating if user is admin
 */
export const isAdmin = (user?: User | null, profile?: UserProfile | null): boolean => {
  if (!user || !profile) return false;
  
  // Check roles from profile.roles (joined from user_roles table)
  const roles = profile.roles;
  if (Array.isArray(roles) && roles.includes('admin')) {
    return true;
  }
  
  return false;
};

/**
 * Check if user has a specific role
 * 
 * PRIMARY SOURCE: public.user_roles table via profile.roles
 * 
 * @param user - User object from Supabase auth (NOT USED for role check)
 * @param role - Role to check for
 * @param profile - User profile with joined user_roles
 * @returns boolean indicating if user has the role
 */
export const hasRole = (user: User | null, role: string, profile?: UserProfile | null): boolean => {
  if (!user || !profile) return false;
  
  // Check roles from profile.roles
  const roles = profile.roles;
  if (Array.isArray(roles) && roles.includes(role)) {
    return true;
  }
  
  return false;
};

/**
 * Get all roles for a user
 * 
 * PRIMARY SOURCE: public.user_roles table via profile.roles
 * 
 * @param user - User object from Supabase auth (NOT USED for role check)
 * @param profile - User profile with joined user_roles
 * @returns Array of role strings
 */
export const getUserRoles = (user: User | null, profile?: UserProfile | null): string[] => {
  if (!user || !profile) return [];
  
  // Get roles from profile.roles
  const profileRoles = profile.roles;
  if (Array.isArray(profileRoles)) {
    return [...profileRoles]; // Return copy to prevent mutation
  }
  
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
