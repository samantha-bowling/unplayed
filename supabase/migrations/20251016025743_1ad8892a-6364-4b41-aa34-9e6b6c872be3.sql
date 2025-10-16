-- Step 1: Drop the old policy that depends on users.role
DROP POLICY IF EXISTS "Admins can view security events" ON public.security_events;

-- Step 2: Create new policy using the proper is_admin() security definer function
CREATE POLICY "Admins can view security events"
ON public.security_events
FOR SELECT
USING (is_admin(auth.uid()));

-- Step 3: Now we can safely drop the legacy role column
ALTER TABLE public.users DROP COLUMN IF EXISTS role;