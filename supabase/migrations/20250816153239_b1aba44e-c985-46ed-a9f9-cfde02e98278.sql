-- Fix security issues for new tables

-- Enable RLS on new tables
alter table steam_app_metadata enable row level security;
alter table steam_call_logs enable row level security;

-- RLS policies for steam_app_metadata (read-only for authenticated users)
create policy "Authenticated users can read steam app metadata"
  on steam_app_metadata for select
  to authenticated
  using (true);

-- Admin-only insert/update for steam_app_metadata
create policy "Service role can manage steam app metadata"
  on steam_app_metadata for all
  to service_role
  using (true)
  with check (true);

-- RLS policies for steam_call_logs (users can see their own logs, admins see all)
create policy "Users can view their own steam call logs"
  on steam_call_logs for select
  to authenticated
  using (auth.uid() = user_id or user_id is null);

-- Service role can manage all steam call logs
create policy "Service role can manage all steam call logs"
  on steam_call_logs for all
  to service_role
  using (true)
  with check (true);

-- Admins can view all steam call logs
create policy "Admins can view all steam call logs"
  on steam_call_logs for select
  to authenticated
  using (is_current_user_admin());

-- Drop and recreate views without SECURITY DEFINER (they'll be standard views)
drop view if exists steam_errors_last_24h;
drop view if exists steam_latency_last_24h;

-- Recreate as standard views (not SECURITY DEFINER)
create view steam_errors_last_24h as
select 
  endpoint, 
  status, 
  err_code, 
  count(*) as hits
from steam_call_logs
where created_at > now() - interval '24 hours'
  and (status >= 400 or err_code is not null)
group by endpoint, status, err_code
order by hits desc;

create view steam_latency_last_24h as
select 
  endpoint,
  percentile_disc(0.95) within group (order by duration_ms) as p95_ms,
  percentile_disc(0.50) within group (order by duration_ms) as p50_ms,
  avg(duration_ms)::int as avg_ms,
  count(*) as calls
from steam_call_logs
where created_at > now() - interval '24 hours'
group by endpoint
order by p95_ms desc;