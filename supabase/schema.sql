-- Run this in Supabase SQL Editor.
-- Safe to re-run (uses IF NOT EXISTS / OR REPLACE).

create table if not exists public.sleep_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  chronotype text not null,
  target_bedtime integer not null,
  sleep_duration numeric not null,
  timezone text not null default 'UTC',
  updated_at timestamptz default now()
);

create table if not exists public.sleep_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date text not null,
  bedtime integer not null,
  wake_time integer not null,
  created_at timestamptz default now(),
  unique (user_id, date)
);

create table if not exists public.sun_exposure (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date text not null,
  morning boolean default false,
  afternoon boolean default false,
  unique (user_id, date)
);

-- Row Level Security
alter table public.sleep_profiles enable row level security;
alter table public.sleep_entries enable row level security;
alter table public.sun_exposure enable row level security;

drop policy if exists "own profile"  on public.sleep_profiles;
drop policy if exists "own entries"  on public.sleep_entries;
drop policy if exists "own sun"      on public.sun_exposure;

create policy "own profile" on public.sleep_profiles for all using (auth.uid() = user_id);
create policy "own entries" on public.sleep_entries  for all using (auth.uid() = user_id);
create policy "own sun"     on public.sun_exposure   for all using (auth.uid() = user_id);

-- Add timezone column if upgrading an existing table
alter table public.sleep_profiles add column if not exists timezone text not null default 'UTC';

-- Enable real-time for all three tables
alter publication supabase_realtime add table public.sleep_profiles;
alter publication supabase_realtime add table public.sleep_entries;
alter publication supabase_realtime add table public.sun_exposure;

-- Full replica identity so DELETE events carry the old row
alter table public.sleep_entries replica identity full;
alter table public.sun_exposure replica identity full;
