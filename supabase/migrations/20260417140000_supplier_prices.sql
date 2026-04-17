-- GaiaSpeak supplier price oracle — stores per-submission price snapshots
-- from mine/refinery suppliers (e.g. Mwanza Mine).

create table if not exists public.supplier_prices (
  id               uuid           default gen_random_uuid() primary key,
  supplier_id      uuid           not null references public.gold_suppliers(id),
  gold_price_per_kg   numeric(18,4) not null check (gold_price_per_kg > 0),
  silver_price_per_kg numeric(18,4) not null check (silver_price_per_kg > 0),
  submitted_at     timestamptz    not null,
  created_at       timestamptz    default now()
);

-- Fast lookup: latest price per supplier
create index if not exists supplier_prices_latest_idx
  on public.supplier_prices (supplier_id, submitted_at desc);

alter table public.supplier_prices enable row level security;

-- Anyone can read prices (public dashboard / oracle reads)
drop policy if exists "Public read supplier prices" on public.supplier_prices;
create policy "Public read supplier prices"
  on public.supplier_prices
  for select
  using (true);

-- Open insert for now (supplier form has no auth in v1).
-- Lock down with a service-role-only policy once auth is added.
drop policy if exists "Insert supplier prices" on public.supplier_prices;
create policy "Insert supplier prices"
  on public.supplier_prices
  for insert
  with check (true);
