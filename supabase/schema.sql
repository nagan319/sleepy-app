-- Run this in Supabase SQL Editor to create the required tables.
-- Enable Row Level Security so each user only sees their own data.

create table if not exists public.sleep_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id text not null unique,         -- anonymous device ID
  chronotype text not null,
  target_bedtime integer not null,      -- minutes since midnight
  sleep_duration numeric not null,
  updated_at timestamptz default now()
);

create table if not exists public.sleep_entries (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  date text not null,                   -- YYYY-MM-DD
  bedtime integer not null,             -- minutes since midnight
  wake_time integer not null,
  created_at timestamptz default now(),
  unique (user_id, date)
);

create table if not exists public.sun_exposure (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  date text not null,                   -- YYYY-MM-DD
  morning boolean default false,
  afternoon boolean default false,
  unique (user_id, date)
);

-- No auth in anon mode — use a device-generated UUID as user_id.
-- For production, wire in Supabase Auth and replace user_id checks with auth.uid().
