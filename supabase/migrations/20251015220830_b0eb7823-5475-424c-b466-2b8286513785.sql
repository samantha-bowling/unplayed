-- Fix PostgREST join error by adding FK from user_roles to public.users
-- This enables auto-join while maintaining existing auth.users reference

-- Add foreign key to public.users (required for PostgREST auto-join)
ALTER TABLE public.user_roles
  ADD CONSTRAINT fk_user_roles_public_users
  FOREIGN KEY (user_id)
  REFERENCES public.users(id)
  ON DELETE CASCADE;

-- Add index for join performance
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id
  ON public.user_roles(user_id);

-- Verification query
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_user_roles_public_users'
    AND table_name = 'user_roles'
  ) THEN
    RAISE NOTICE '✅ Foreign key constraint successfully created';
  ELSE
    RAISE EXCEPTION '❌ Foreign key constraint was not created';
  END IF;
END $$;