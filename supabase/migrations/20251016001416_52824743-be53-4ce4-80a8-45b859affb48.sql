-- Fix recursive RLS policy on user_roles table
-- The "Admins can view all user roles" policy was calling is_admin()
-- which created a circular dependency. We need to check admin status
-- directly in the policy without going through the is_admin() function.

-- Drop the problematic policy
DROP POLICY IF EXISTS "Admins can view all user roles" ON public.user_roles;

-- Create a new policy that checks admin role directly
CREATE POLICY "Admins can view all user roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (
  -- Check if the current user has admin role directly
  -- This avoids calling is_admin() which would create recursion
  EXISTS (
    SELECT 1 
    FROM public.user_roles admin_check
    WHERE admin_check.user_id = auth.uid()
      AND admin_check.role = 'admin'::app_role
  )
);

COMMENT ON POLICY "Admins can view all user roles" ON public.user_roles IS
'SECURITY: Allows admins to view all user roles. Checks admin status directly to avoid recursion with is_admin() function. Migration: Fix recursive RLS v1';

-- Verification
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'user_roles'
      AND policyname = 'Admins can view all user roles'
  ) THEN
    RAISE NOTICE '✅ RLS policy updated successfully - recursion loop broken';
  ELSE
    RAISE EXCEPTION '❌ RLS policy not found after creation';
  END IF;
END $$;