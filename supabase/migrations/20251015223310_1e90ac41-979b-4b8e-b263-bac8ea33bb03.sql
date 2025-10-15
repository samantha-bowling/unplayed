-- Remove audit logging from is_admin() to prevent authentication timeouts
-- Audit logs are valuable but shouldn't block critical auth checks
-- Future: Move audit logging to separate async mechanism

CREATE OR REPLACE FUNCTION public.is_admin(check_user_id uuid DEFAULT NULL::uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_temp, public
AS $$
DECLARE
  target_user_id uuid;
  has_admin_role boolean;
BEGIN
  -- Default to current user if no ID provided
  target_user_id := COALESCE(check_user_id, auth.uid());
  
  IF target_user_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Check role from user_roles table (ONLY source of truth)
  has_admin_role := public.has_role(target_user_id, 'admin'::app_role);
  
  -- REMOVED: Audit logging (was causing timeouts)
  -- Future enhancement: Move to async background job
  
  RETURN has_admin_role;
END;
$$;

COMMENT ON FUNCTION public.is_admin(uuid) IS 
'SECURITY: Checks if user is admin. Sources from public.user_roles table ONLY. Optimized: removed audit logging. Migration: Phase 0 v2';

-- Verification
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'is_admin' 
    AND pronamespace = 'public'::regnamespace
  ) THEN
    RAISE NOTICE '✅ is_admin() function updated successfully';
  ELSE
    RAISE EXCEPTION '❌ is_admin() function not found';
  END IF;
END $$;