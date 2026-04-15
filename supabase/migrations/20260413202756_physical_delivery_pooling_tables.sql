-- GaiaSpeak physical delivery pooling schema (mock-chain ready)

create table if not exists public.physical_delivery_batches (
  id uuid default gen_random_uuid() primary key,
  batch_number integer not null unique,
  target_grams numeric not null default 1000,
  collected_grams numeric not null default 0,
  status text not null default 'collecting', -- collecting | completed
  supplier_name text,
  supplier_price_per_gram numeric,
  oracle_note text,
  created_at timestamptz default now(),
  closed_at timestamptz,
  updated_at timestamptz default now()
);

create table if not exists public.physical_delivery_requests (
  id uuid default gen_random_uuid() primary key,
  wallet_address text not null,
  token_type text not null check (token_type in ('GSG', 'GSS')),
  grams numeric not null check (grams >= 1),
  country text not null,
  city text not null,
  street text not null,
  postal_code text not null,
  status text not null default 'queued', -- queued | supplier_selected | shipped
  batch_id uuid references public.physical_delivery_batches(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.physical_delivery_batches enable row level security;
alter table public.physical_delivery_requests enable row level security;

drop policy if exists "Public read active physical batches" on public.physical_delivery_batches;
create policy "Public read active physical batches"
  on public.physical_delivery_batches
  for select
  using (true);

drop policy if exists "Public read physical requests" on public.physical_delivery_requests;
create policy "Public read physical requests"
  on public.physical_delivery_requests
  for select
  using (true);

drop policy if exists "Users insert physical requests" on public.physical_delivery_requests;
create policy "Users insert physical requests"
  on public.physical_delivery_requests
  for insert
  with check (true);

-- Seed first collecting batch
insert into public.physical_delivery_batches (batch_number, target_grams, collected_grams, status)
select 1, 1000, 0, 'collecting'
where not exists (
  select 1 from public.physical_delivery_batches where status = 'collecting'
);
