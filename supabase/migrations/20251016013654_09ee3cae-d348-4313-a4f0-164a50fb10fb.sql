-- ============================================================================
-- Migration: Optimize is_admin() to Fast SQL Function
-- ============================================================================
-- Problem: is_admin() still uses PL/pgSQL with procedural overhead
-- Solution: Convert to SQL language with row_security = off for < 50ms response
-- ============================================================================

-- Recreate is_admin() as optimized SQL function
CREATE OR REPLACE FUNCTION public.is_admin(check_user_id uuid DEFAULT NULL::uuid)
RETURNS boolean
LANGUAGE sql                              -- Changed from plpgsql for speed
STABLE
SECURITY DEFINER
SET search_path TO 'pg_temp', 'public'
SET row_security = off                    -- Bypass RLS for fast execution
AS $$
  SELECT public.has_role(
    COALESCE(check_user_id, auth.uid()),  -- Handles both direct and RPC contexts
    'admin'::app_role
  )
$$;

COMMENT ON FUNCTION public.is_admin(uuid) IS
'Fast admin check using SQL language with RLS disabled. SECURITY DEFINER ensures safe execution. Returns boolean only, never exposes data. Optimized for < 50ms RPC response time.';