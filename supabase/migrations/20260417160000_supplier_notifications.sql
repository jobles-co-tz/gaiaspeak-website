-- Logs every email notification sent to a supplier so we can
-- audit delivery history and debug "I never received an email" claims.

create table if not exists public.supplier_notifications (
  id            uuid          default gen_random_uuid() primary key,
  supplier_id   uuid          not null references public.gold_suppliers(id),
  email         text          not null,
  status        text          not null check (status in ('sent', 'failed')),
  error_message text,
  sent_at       timestamptz   not null default now()
);

create index if not exists supplier_notifications_supplier_idx
  on public.supplier_notifications (supplier_id, sent_at desc);

alter table public.supplier_notifications enable row level security;

-- Service-role only writes (edge function uses service key).
-- No public insert policy — inserts come exclusively from the notify function.
drop policy if exists "Service read notifications" on public.supplier_notifications;
create policy "Service read notifications"
  on public.supplier_notifications
  for select
  using (true);
