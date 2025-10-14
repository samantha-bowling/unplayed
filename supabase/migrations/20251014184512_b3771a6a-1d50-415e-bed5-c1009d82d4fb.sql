-- Phase 1: Core Security Migration - Hybrid Role Model (Option B)
-- This migration implements a secure role system using auth.users.app_metadata as the source of truth
-- with a public.user_roles table as a compliance/audit mirror

-- Step 1: Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Step 2: Create user_roles table (compliance/audit mirror)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role public.app_role NOT NULL,
    synced_from_metadata BOOLEAN DEFAULT true,
    synced_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Step 3: Create admin audit logs table
CREATE TABLE public.admin_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    target_user_id UUID,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Step 4: Create SECURITY DEFINER functions that read from app_metadata
-- These are the PRIMARY authorization functions

CREATE OR REPLACE FUNCTION public.is_admin(check_user_id UUID DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_temp, public
AS $$
DECLARE
  target_user_id UUID;
  user_roles JSONB;
BEGIN
  -- Default to current user if no ID provided
  target_user_id := COALESCE(check_user_id, auth.uid());
  
  IF target_user_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Read roles from auth.users.app_metadata (immutable by clients)
  SELECT raw_app_meta_data->'roles' INTO user_roles
  FROM auth.users
  WHERE id = target_user_id;
  
  -- Log admin check for monitoring
  INSERT INTO public.admin_audit_logs (user_id, action, metadata)
  VALUES (
    auth.uid(),
    'admin_check',
    jsonb_build_object('checked_user_id', target_user_id, 'result', user_roles ? 'admin')
  );
  
  -- Check if 'admin' exists in roles array
  RETURN COALESCE(user_roles ? 'admin', false);
END;
$$;

CREATE OR REPLACE FUNCTION public.has_role(check_user_id UUID, check_role public.app_role)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_temp, public
AS $$
DECLARE
  user_roles JSONB;
BEGIN
  IF check_user_id IS NULL OR check_role IS NULL THEN
    RETURN false;
  END IF;
  
  -- Read roles from auth.users.app_metadata
  SELECT raw_app_meta_data->'roles' INTO user_roles
  FROM auth.users
  WHERE id = check_user_id;
  
  -- Check if role exists in roles array
  RETURN COALESCE(user_roles ? check_role::text, false);
END;
$$;

-- Step 5: Create sync function (optional, for compliance/audit)
CREATE OR REPLACE FUNCTION public.sync_user_roles_from_metadata()
RETURNS TABLE(synced_count INTEGER, errors_count INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_temp, public
AS $$
DECLARE
  synced INTEGER := 0;
  errors INTEGER := 0;
  user_record RECORD;
  role_text TEXT;
BEGIN
  -- Clear existing mirrored roles
  DELETE FROM public.user_roles WHERE synced_from_metadata = true;
  
  -- Sync from auth.users.app_metadata
  FOR user_record IN 
    SELECT id, raw_app_meta_data->'roles' as roles
    FROM auth.users
    WHERE raw_app_meta_data->'roles' IS NOT NULL
  LOOP
    BEGIN
      -- Insert each role from the roles array
      FOR role_text IN 
        SELECT jsonb_array_elements_text(user_record.roles)
      LOOP
        INSERT INTO public.user_roles (user_id, role, synced_from_metadata, synced_at)
        VALUES (user_record.id, role_text::public.app_role, true, now())
        ON CONFLICT (user_id, role) DO UPDATE
        SET synced_at = now(), synced_from_metadata = true;
        
        synced := synced + 1;
      END LOOP;
    EXCEPTION WHEN OTHERS THEN
      errors := errors + 1;
      RAISE WARNING 'Failed to sync roles for user %: %', user_record.id, SQLERRM;
    END;
  END LOOP;
  
  -- Log the sync operation
  INSERT INTO public.admin_audit_logs (user_id, action, metadata)
  VALUES (
    auth.uid(),
    'roles_sync',
    jsonb_build_object('synced_count', synced, 'errors_count', errors)
  );
  
  RETURN QUERY SELECT synced, errors;
END;
$$;

-- Step 6: RLS Policies for user_roles (read-only mirror)
CREATE POLICY "Admins can view all user roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Step 7: RLS Policies for admin_audit_logs
CREATE POLICY "Admins can view all audit logs"
ON public.admin_audit_logs
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Service role can insert audit logs"
ON public.admin_audit_logs
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Step 8: Initial admin role setup
-- Grant admin role to the specified user (6acbbe42-a14d-42f1-9866-b29fc8041b22)
-- Note: This must also be set in auth.users.app_metadata manually via Supabase Dashboard
INSERT INTO public.user_roles (user_id, role, synced_from_metadata)
VALUES ('6acbbe42-a14d-42f1-9866-b29fc8041b22', 'admin', false)
ON CONFLICT (user_id, role) DO NOTHING;

-- Step 9: Update existing is_current_user_admin() to use new function
-- Keep old function as fallback during transition
CREATE OR REPLACE FUNCTION public.is_current_user_admin_legacy()
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = pg_temp, public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.users 
    WHERE id = auth.uid() 
    AND role = 'admin'
  );
$$;

-- Replace with new implementation
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = pg_temp, public
AS $$
  SELECT public.is_admin(auth.uid());
$$;