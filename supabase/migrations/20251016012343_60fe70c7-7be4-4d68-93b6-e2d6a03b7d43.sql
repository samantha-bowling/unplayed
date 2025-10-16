-- ============================================================================
-- Migration: Fix RPC Timeout by Disabling RLS in has_role()
-- ============================================================================
-- Problem: has_role() SECURITY DEFINER function still subject to RLS checks
-- Solution: Add SET row_security = off to bypass RLS inside the function
-- ============================================================================

-- Recreate has_role() function with row_security = off
CREATE OR REPLACE FUNCTION public.has_role(check_user_id uuid, check_role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'pg_temp', 'public'
SET row_security = off  -- ⭐ NEW: Explicitly bypass RLS inside SECURITY DEFINER function
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = check_user_id
      AND role = check_role
  )
$$;

COMMENT ON FUNCTION public.has_role(uuid, app_role) IS
'Check if a user has a specific role. SECURITY DEFINER with RLS disabled for reliable RPC calls. Safe because function only queries based on explicit user_id parameter.';