-- Ghummakad — Supabase schema. Applied once by scripts/setup-droplet.sh.
-- A per-user `trips` table with Row-Level Security so each user only ever sees
-- and modifies their own saved trips.

create extension if not exists "pgcrypto";

create table if not exists public.trips (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at  timestamptz not null default now(),
  vibe        text not null,
  result      jsonb not null
);

create index if not exists trips_user_created_idx
  on public.trips (user_id, created_at desc);

alter table public.trips enable row level security;

drop policy if exists "trips_select_own" on public.trips;
create policy "trips_select_own" on public.trips
  for select using (auth.uid() = user_id);

drop policy if exists "trips_insert_own" on public.trips;
create policy "trips_insert_own" on public.trips
  for insert with check (auth.uid() = user_id);

drop policy if exists "trips_delete_own" on public.trips;
create policy "trips_delete_own" on public.trips
  for delete using (auth.uid() = user_id);
