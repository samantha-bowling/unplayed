-- ============================================================================
-- Migration: Fix user_roles RLS Recursion + Add Admin RPC
-- ============================================================================
-- Phase 1: Remove recursive policy causing infinite loops
-- Phase 2: Add privileged RPC for admin operations
-- ============================================================================

-- PHASE 1: Remove Recursive Policy
-- Drop the problematic "Admins can view all user roles" policy
-- This policy was causing infinite recursion by querying user_roles within
-- the user_roles table's own RLS policy
DROP POLICY IF EXISTS "Admins can view all user roles" ON public.user_roles;

-- The simple "Users can view their own roles" policy remains in place:
-- CREATE POLICY "Users can view their own roles" 
-- ON public.user_roles FOR SELECT 
-- USING (auth.uid() = user_id);
-- This allows users to see their own roles without recursion

-- PHASE 2: Add Privileged RPC for Admin Operations
-- Create a secure function for admins to view all user role assignments
CREATE OR REPLACE FUNCTION public.get_all_user_roles()
RETURNS TABLE(user_id uuid, role app_role)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  -- Only return data if the calling user is an admin
  SELECT 
    ur.user_id,
    ur.role
  FROM public.user_roles ur
  WHERE public.is_admin(auth.uid());
$$;

COMMENT ON FUNCTION public.get_all_user_roles() IS 
'Admin-only RPC to view all user role assignments. Returns empty if caller is not an admin. Use this instead of direct table queries for admin dashboards.';