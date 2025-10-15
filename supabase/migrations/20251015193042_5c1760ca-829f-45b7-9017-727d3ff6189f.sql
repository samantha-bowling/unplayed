-- ============================================================================
-- Phase 0: Critical Role Architecture Security Fix
-- Migration Version: phase0_v1
-- Purpose: Eliminate privilege escalation vulnerability by migrating role 
--          authorization from auth.users.app_metadata.roles to public.user_roles table
-- ============================================================================

-- Step 1: Add Missing Constraints & Indexes
-- ============================================================================

-- Ensure UNIQUE constraint exists (idempotent)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'user_roles_user_id_role_key'
  ) THEN
    ALTER TABLE public.user_roles 
      ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);
  END IF;
END $$;

-- Add performance indexes
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id 
  ON public.user_roles(user_id);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id_role 
  ON public.user_roles(user_id, role);

-- Add helpful comment
COMMENT ON TABLE public.user_roles IS 
'PRIMARY SOURCE OF TRUTH for user role authorization. Never check app_metadata for roles.';

-- Step 2: Migrate Existing Role Data
-- ============================================================================

-- 2.1: Migrate from users.role column (legacy)
INSERT INTO public.user_roles (user_id, role)
SELECT id, role::app_role
FROM public.users
WHERE role IS NOT NULL
  AND role IN ('admin', 'moderator', 'user')
  AND NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = users.id 
      AND user_roles.role = users.role::app_role
  );

-- 2.2: Migrate from app_metadata (one-time sync)
DO $$
DECLARE
  user_record RECORD;
  role_text TEXT;
  migrated_count INTEGER := 0;
  error_count INTEGER := 0;
BEGIN
  FOR user_record IN 
    SELECT id, email, raw_app_meta_data->'roles' as roles
    FROM auth.users
    WHERE raw_app_meta_data->'roles' IS NOT NULL
  LOOP
    BEGIN
      FOR role_text IN 
        SELECT jsonb_array_elements_text(user_record.roles)
      LOOP
        -- Only migrate valid roles
        IF role_text IN ('admin', 'moderator', 'user') THEN
          INSERT INTO public.user_roles (user_id, role)
          VALUES (user_record.id, role_text::app_role)
          ON CONFLICT (user_id, role) DO NOTHING;
          migrated_count := migrated_count + 1;
        END IF;
      END LOOP;
    EXCEPTION WHEN OTHERS THEN
      error_count := error_count + 1;
      RAISE WARNING 'Failed to migrate roles for user % (email: %): %', 
        user_record.id, user_record.email, SQLERRM;
    END;
  END LOOP;
  
  RAISE NOTICE 'Migration complete: % roles migrated, % errors', migrated_count, error_count;
END $$;

-- Step 3: Replace Authorization Functions (keeping same parameter names)
-- ============================================================================

-- 3.1: Replace has_role() function (keeping original parameter names)
CREATE OR REPLACE FUNCTION public.has_role(check_user_id uuid, check_role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_temp, public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = check_user_id
      AND role = check_role
  )
$$;

COMMENT ON FUNCTION public.has_role(uuid, app_role) IS 
'SECURITY: Checks if user has specific role. Sources from public.user_roles table ONLY. Never checks app_metadata.';

-- 3.2: Replace is_admin() function (keeping original parameter names)
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
  
  -- Audit log admin checks (non-blocking)
  BEGIN
    INSERT INTO public.admin_audit_logs (user_id, action, metadata)
    VALUES (
      auth.uid(),
      'admin_check',
      jsonb_build_object(
        'checked_user_id', target_user_id, 
        'result', has_admin_role,
        'source', 'user_roles_table',
        'migration_version', 'phase0_v1'
      )
    );
  EXCEPTION WHEN OTHERS THEN
    -- Don't fail the check if logging fails
    NULL;
  END;
  
  RETURN has_admin_role;
END;
$$;

COMMENT ON FUNCTION public.is_admin(uuid) IS 
'SECURITY: Checks if user is admin. Sources from public.user_roles table ONLY. Logs to admin_audit_logs. Migration: Phase 0 v1';

-- Step 4: Add Controlled Role Management Functions
-- ============================================================================

-- 4.1: Admin-only role assignment function
CREATE OR REPLACE FUNCTION public.assign_role(target_user_id uuid, target_role app_role)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_temp, public
AS $$
BEGIN
  -- Only admins can assign roles
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only administrators can assign roles';
  END IF;
  
  -- Prevent self-modification of admin role
  IF target_user_id = auth.uid() AND target_role = 'admin' THEN
    RAISE EXCEPTION 'Cannot modify your own admin role';
  END IF;
  
  -- Insert role
  INSERT INTO public.user_roles(user_id, role)
  VALUES (target_user_id, target_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  
  -- Audit log
  INSERT INTO public.admin_audit_logs (user_id, action, metadata)
  VALUES (
    auth.uid(),
    'role_assigned',
    jsonb_build_object('target_user_id', target_user_id, 'role', target_role::text)
  );
END;
$$;

COMMENT ON FUNCTION public.assign_role(uuid, app_role) IS 
'SECURITY: Admin-only function to assign roles. Logs to audit trail.';

-- 4.2: Admin-only role revocation function
CREATE OR REPLACE FUNCTION public.revoke_role(target_user_id uuid, target_role app_role)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_temp, public
AS $$
BEGIN
  -- Only admins can revoke roles
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only administrators can revoke roles';
  END IF;
  
  -- Prevent self-revocation of admin
  IF target_user_id = auth.uid() AND target_role = 'admin' THEN
    RAISE EXCEPTION 'Cannot revoke your own admin role';
  END IF;
  
  -- Delete role
  DELETE FROM public.user_roles
  WHERE user_id = target_user_id AND role = target_role;
  
  -- Audit log
  INSERT INTO public.admin_audit_logs (user_id, action, metadata)
  VALUES (
    auth.uid(),
    'role_revoked',
    jsonb_build_object('target_user_id', target_user_id, 'role', target_role::text)
  );
END;
$$;

COMMENT ON FUNCTION public.revoke_role(uuid, app_role) IS 
'SECURITY: Admin-only function to revoke roles. Logs to audit trail.';

-- Step 5: Deprecate Legacy Storage
-- ============================================================================

-- 5.1: Remove default from users.role column
ALTER TABLE public.users 
  ALTER COLUMN role DROP DEFAULT;

-- Add deprecation warning
COMMENT ON COLUMN public.users.role IS 
'⚠️ DEPRECATED: This column is no longer used for authorization. Use public.user_roles table instead. Scheduled for removal in migration v2.0';

-- 5.2: Delete sync function (no longer needed)
DROP FUNCTION IF EXISTS public.sync_user_roles_from_metadata();

-- ============================================================================
-- Migration Complete - Verification
-- ============================================================================

-- Verification query
SELECT 
  COUNT(*) as total_role_assignments,
  COUNT(DISTINCT user_id) as users_with_roles,
  role,
  COUNT(*) as count_per_role
FROM public.user_roles
GROUP BY role
ORDER BY role;