-- ============================================
-- BlinkTest Database Schema v3
-- Account system with open registration
-- Run this in Supabase SQL Editor
-- ============================================

create extension if not exists "uuid-ossp";

-- ============================================
-- Drop old tables (clean slate)
-- ============================================
drop table if exists public.responses cascade;
drop table if exists public.test_variants cascade;
drop table if exists public.tests cascade;
drop table if exists public.invites cascade;
drop table if exists public.profiles cascade;

-- ============================================
-- PROFILES TABLE
-- ============================================
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  name text not null,
  role text not null default 'member' check (role in ('admin', 'member')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Anyone can read profiles"
  on public.profiles for select using (true);

create policy "Users can update own profile"
  on public.profiles for update to authenticated
  using (auth.uid() = id);

create policy "Anyone can insert profile"
  on public.profiles for insert
  with check (true);

-- ============================================
-- TESTS TABLE
-- ============================================
create table public.tests (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete set null,
  creator_name text not null,
  channel_tag text not null default 'Main',
  intended_message text,
  notes text,
  status text not null default 'active' check (status in ('active', 'completed', 'archived')),
  target_responses int not null default 10,
  created_at timestamptz not null default now()
);

alter table public.tests enable row level security;

create policy "Anyone can read tests"
  on public.tests for select using (true);

create policy "Anyone can create tests"
  on public.tests for insert with check (true);

create policy "Admins can update tests"
  on public.tests for update to authenticated
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
    or user_id = auth.uid()
  );

create policy "Admins can delete tests"
  on public.tests for delete to authenticated
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
    or user_id = auth.uid()
  );

-- ============================================
-- TEST VARIANTS TABLE
-- ============================================
create table public.test_variants (
  id uuid default uuid_generate_v4() primary key,
  test_id uuid references public.tests(id) on delete cascade not null,
  thumbnail_url text not null,
  display_order int not null default 0,
  duration_badge text not null default '10:00'
);

alter table public.test_variants enable row level security;

create policy "Anyone can read variants"
  on public.test_variants for select using (true);

create policy "Anyone can insert variants"
  on public.test_variants for insert with check (true);

-- ============================================
-- RESPONSES TABLE
-- ============================================
create table public.responses (
  id uuid default uuid_generate_v4() primary key,
  test_id uuid references public.tests(id) on delete cascade not null,
  variant_id uuid references public.test_variants(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete set null,
  tester_name text not null,
  answer_html text not null,
  clarity_rating int not null check (clarity_rating >= 1 and clarity_rating <= 5),
  created_at timestamptz not null default now()
);

alter table public.responses enable row level security;

create policy "Anyone can read responses"
  on public.responses for select using (true);

create policy "Anyone can insert responses"
  on public.responses for insert with check (true);

-- ============================================
-- STORAGE BUCKET
-- ============================================
insert into storage.buckets (id, name, public)
values ('thumbnails', 'thumbnails', true)
on conflict (id) do nothing;

drop policy if exists "Anyone can upload thumbnails" on storage.objects;
drop policy if exists "Anyone can read thumbnails" on storage.objects;
drop policy if exists "Authenticated users can upload" on storage.objects;
drop policy if exists "Public can read thumbnails" on storage.objects;

create policy "Anyone can upload thumbnails"
  on storage.objects for insert
  with check (bucket_id = 'thumbnails');

create policy "Anyone can read thumbnails"
  on storage.objects for select
  using (bucket_id = 'thumbnails');

-- ============================================
-- ENABLE REALTIME
-- ============================================
alter publication supabase_realtime add table public.responses;
