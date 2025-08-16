-- Create steam_app_metadata table for caching app metadata
create table if not exists steam_app_metadata (
  appid bigint primary key,
  name text,
  icon_url text,
  logo_url text,
  header_url text,
  updated_at timestamptz default now()
);

-- Create steam_call_logs table for monitoring Steam API calls
create table if not exists steam_call_logs (
  id bigserial primary key,
  user_id uuid null,
  endpoint text not null,
  status int not null,
  err_code text null,
  duration_ms int not null,
  attempts int not null,
  created_at timestamptz default now()
);

-- Create indexes for efficient querying
create index if not exists steam_call_logs_created_at_idx on steam_call_logs (created_at desc);
create index if not exists steam_call_logs_endpoint_idx on steam_call_logs (endpoint);
create index if not exists steam_call_logs_user_id_idx on steam_call_logs (user_id) where user_id is not null;
create index if not exists steam_call_logs_status_idx on steam_call_logs (status);

-- Create helpful views for monitoring
create or replace view steam_errors_last_24h as
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

create or replace view steam_latency_last_24h as
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