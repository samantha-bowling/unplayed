/**
 * Server-Side Role Verification Utilities
 * 
 * Use these for security-critical operations where client-side cache
 * verification is insufficient (e.g., admin route guards, write operations).
 */
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

/**
 * Verify admin status via server RPC call
 * 
 * SECURITY: Always queries latest state from database, bypasses cache
 * Use for: Route guards, permission-sensitive actions
 * 
 * @param userId - User ID to check (defaults to current user)
 * @returns Promise<boolean> - true if user is admin
 */
export async function verifyAdminRPC(userId?: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('is_admin', {
      check_user_id: userId || null
    });

    if (error) {
      console.error('[verifyAdminRPC] Error:', error);
      return false;
    }

    return data === true;
  } catch (err) {
    console.error('[verifyAdminRPC] Exception:', err);
    return false;
  }
}

/**
 * Verify specific role via server RPC call
 * 
 * @param role - Role to check for
 * @param userId - User ID to check (defaults to current user)
 * @returns Promise<boolean> - true if user has role
 */
export async function verifyRoleRPC(role: AppRole, userId?: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('has_role', {
      check_user_id: userId || null,
      check_role: role
    });

    if (error) {
      console.error('[verifyRoleRPC] Error:', error);
      return false;
    }

    return data === true;
  } catch (err) {
    console.error('[verifyRoleRPC] Exception:', err);
    return false;
  }
}

/**
 * Assign role to user (admin only)
 * 
 * @param targetUserId - User to assign role to
 * @param role - Role to assign
 */
export async function assignRoleRPC(targetUserId: string, role: AppRole): Promise<void> {
  const { error } = await supabase.rpc('assign_role', {
    target_user_id: targetUserId,
    target_role: role
  });

  if (error) {
    console.error('[assignRoleRPC] Error:', error);
    throw error;
  }
}

/**
 * Revoke role from user (admin only)
 * 
 * @param targetUserId - User to revoke role from
 * @param role - Role to revoke
 */
export async function revokeRoleRPC(targetUserId: string, role: AppRole): Promise<void> {
  const { error } = await supabase.rpc('revoke_role', {
    target_user_id: targetUserId,
    target_role: role
  });

  if (error) {
    console.error('[revokeRoleRPC] Error:', error);
    throw error;
  }
}
