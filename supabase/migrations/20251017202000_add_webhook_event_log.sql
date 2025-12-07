-- Webhook idempotency log to deduplicate deliveries from Dodo Payments
-- Created by Sentra on 2025-10-17

create table if not exists public.webhook_event_log (
  event_key text primary key,
  event_type text not null,
  received_at timestamptz not null default now()
);

-- Optional fast lookup by time
create index if not exists webhook_event_log_received_at_idx
  on public.webhook_event_log (received_at);

-- Enforce no client-side access: enable RLS and do not add permissive policies
alter table public.webhook_event_log enable row level security;

-- No policies created intentionally. Service role bypasses RLS.

comment on table public.webhook_event_log is 'Idempotency store for Dodo webhook deliveries (SHA-256 of raw body)';