-- Fix: Restrict admin_audit_logs INSERT to service_role only
DROP POLICY IF EXISTS "Service role can insert audit logs" ON public.admin_audit_logs;

CREATE POLICY "Service role can insert audit logs"
  ON public.admin_audit_logs
  FOR INSERT
  TO service_role
  WITH CHECK (true);