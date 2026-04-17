-- GaiaSpeak gold suppliers directory (verified physical gold sources)

create table if not exists public.gold_suppliers (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  country text,
  contact_email text,
  contact_phone text,
  website text,
  price_per_gram numeric not null default 0,
  currency text not null default 'USD',
  min_order_grams numeric not null default 1,
  lead_time_days integer not null default 14,
  verified boolean not null default false,
  active boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists gold_suppliers_active_verified_idx
  on public.gold_suppliers (active, verified, price_per_gram);

alter table public.gold_suppliers enable row level security;

-- Public read (directory is publicly visible in the app)
drop policy if exists "Public read gold suppliers" on public.gold_suppliers;
create policy "Public read gold suppliers"
  on public.gold_suppliers
  for select
  using (true);

-- Open write policies to support the client-side admin panel (same pattern as other tables in this project).
-- Lock these down once a server-side admin role is introduced.
drop policy if exists "Admin insert gold suppliers" on public.gold_suppliers;
create policy "Admin insert gold suppliers"
  on public.gold_suppliers
  for insert
  with check (true);

drop policy if exists "Admin update gold suppliers" on public.gold_suppliers;
create policy "Admin update gold suppliers"
  on public.gold_suppliers
  for update
  using (true)
  with check (true);

drop policy if exists "Admin delete gold suppliers" on public.gold_suppliers;
create policy "Admin delete gold suppliers"
  on public.gold_suppliers
  for delete
  using (true);

-- Keep updated_at fresh on row updates
create or replace function public.gold_suppliers_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists gold_suppliers_set_updated_at on public.gold_suppliers;
create trigger gold_suppliers_set_updated_at
before update on public.gold_suppliers
for each row execute function public.gold_suppliers_set_updated_at();

-- Seed verified suppliers (idempotent by name)
insert into public.gold_suppliers
  (name, country, contact_email, contact_phone, website, price_per_gram, currency, min_order_grams, lead_time_days, verified, active, notes)
select * from (values
  (
    'Atlas Bullion',
    'Switzerland',
    'trade@atlasbullion.ch',
    '+41 22 555 0111',
    'https://atlasbullion.example',
    72.90::numeric,
    'USD',
    500::numeric,
    7,
    true,
    true,
    'LBMA Good Delivery refiner. Preferred partner for sub-1kg batches with fastest turnaround.'
  ),
  (
    'Auric Trust Metals',
    'United Arab Emirates',
    'deals@aurictrust.ae',
    '+971 4 555 0222',
    'https://aurictrust.example',
    73.80::numeric,
    'USD',
    1000::numeric,
    10,
    true,
    true,
    'DMCC-licensed. Strong logistics for MENA and Asia shipments. Bulk-friendly pricing at 1kg+.'
  ),
  (
    'NovaMint Cooperative',
    'Canada',
    'supply@novamint.coop',
    '+1 416 555 0333',
    'https://novamint.example',
    74.10::numeric,
    'USD',
    250::numeric,
    14,
    true,
    true,
    'RCM-aligned cooperative. Transparent chain-of-custody reports and ethical sourcing audit.'
  ),
  (
    'Sahara Gold Partners',
    'Tanzania',
    'ops@saharagold.tz',
    '+255 22 555 0444',
    'https://saharagold.example',
    71.50::numeric,
    'USD',
    100::numeric,
    21,
    false,
    true,
    'Pending verification. Competitive origin pricing — awaiting refinery certification package.'
  )
) as seed(name, country, contact_email, contact_phone, website, price_per_gram, currency, min_order_grams, lead_time_days, verified, active, notes)
where not exists (
  select 1 from public.gold_suppliers gs where gs.name = seed.name
);

