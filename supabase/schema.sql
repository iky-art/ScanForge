-- ScanForge v1.0.0 — Supabase schema
-- Run this in the Supabase SQL editor for your project.
-- Every user-owned table has Row Level Security enabled: a user can only
-- ever read/write rows where user_id = auth.uid(). Nothing here uses the
-- service-role key — this is meant to be safe to run with the project's
-- default anon-key access rules layered on top.

create extension if not exists "uuid-ossp";

-- ---------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------
create table if not exists profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "profiles_select_own"
  on profiles for select
  using (auth.uid() = id);

create policy "profiles_insert_own"
  on profiles for insert
  with check (auth.uid() = id);

create policy "profiles_update_own"
  on profiles for update
  using (auth.uid() = id);

-- Auto-create a profile row whenever a new auth user is created.
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'user_name', new.email));
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ---------------------------------------------------------------------
-- scans
-- ---------------------------------------------------------------------
create table if not exists scans (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users (id) on delete cascade,
  target text not null,
  scan_type text not null check (scan_type in ('website', 'source')),
  status text not null default 'running' check (status in ('running', 'completed', 'failed')),
  overall_score int,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

alter table scans enable row level security;

create policy "scans_select_own"
  on scans for select
  using (auth.uid() = user_id);

create policy "scans_insert_own"
  on scans for insert
  with check (auth.uid() = user_id);

create policy "scans_update_own"
  on scans for update
  using (auth.uid() = user_id);

create policy "scans_delete_own"
  on scans for delete
  using (auth.uid() = user_id);

create index if not exists scans_user_id_idx on scans (user_id, created_at desc);

-- ---------------------------------------------------------------------
-- findings
-- ---------------------------------------------------------------------
create table if not exists findings (
  id uuid primary key default uuid_generate_v4(),
  scan_id uuid not null references scans (id) on delete cascade,
  rule_id text not null,
  category text not null,
  severity text not null check (severity in ('low', 'medium', 'high', 'critical')),
  confidence text not null check (confidence in ('low', 'medium', 'high')),
  anomalous boolean not null default false,
  title text not null,
  description text,
  evidence jsonb,
  remediation text,
  prevention text,
  verification text,
  created_at timestamptz not null default now()
);

alter table findings enable row level security;

-- Findings are owned indirectly through their parent scan.
create policy "findings_select_via_scan"
  on findings for select
  using (
    exists (
      select 1 from scans
      where scans.id = findings.scan_id
      and scans.user_id = auth.uid()
    )
  );

create policy "findings_insert_via_scan"
  on findings for insert
  with check (
    exists (
      select 1 from scans
      where scans.id = findings.scan_id
      and scans.user_id = auth.uid()
    )
  );

create index if not exists findings_scan_id_idx on findings (scan_id);

-- ---------------------------------------------------------------------
-- reports
-- ---------------------------------------------------------------------
create table if not exists reports (
  id uuid primary key default uuid_generate_v4(),
  scan_id uuid not null references scans (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null default 'Untitled Report',
  created_at timestamptz not null default now()
);

alter table reports enable row level security;

create policy "reports_select_own"
  on reports for select
  using (auth.uid() = user_id);

create policy "reports_insert_own"
  on reports for insert
  with check (auth.uid() = user_id);

create policy "reports_delete_own"
  on reports for delete
  using (auth.uid() = user_id);
