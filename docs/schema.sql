-- ============================================================
-- The Seed Chronicles — Supabase schema + RLS
-- Run this once in the Supabase SQL editor after project creation.
-- ============================================================

create table invite_codes (
  code text primary key,
  used boolean not null default false,
  used_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table game_progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  current_chapter int not null default 1,
  chapter_state jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

-- RLS: game_progress — owner-only read/write
alter table game_progress enable row level security;

create policy "select own progress" on game_progress
  for select using (auth.uid() = user_id);

create policy "insert own progress" on game_progress
  for insert with check (auth.uid() = user_id);

create policy "update own progress" on game_progress
  for update using (auth.uid() = user_id);

-- Supabase requires an explicit GRANT in addition to RLS policies — tables
-- created via the SQL editor don't get the default role grants that tables
-- made through the Table Editor UI get automatically. Without this, PostgREST
-- returns "permission denied" before RLS is even evaluated. The `authenticated`
-- role is logged-in users; RLS policies above still scope them to their own row.
-- `service_role` (used by api/signup.js's admin client) bypasses RLS but NOT
-- table-level grants, so it needs its own explicit grant too.
grant select, insert, update on game_progress to authenticated;
grant select, insert, update on game_progress to service_role;

-- RLS: invite_codes — enabled, NO client-facing policies.
-- Only the admin client (secret key, server-side, in api/signup.js) can touch
-- this table — it runs as service_role, which still needs its own explicit
-- grant despite bypassing RLS (see note above).
alter table invite_codes enable row level security;
grant select, update on invite_codes to service_role;

-- Seed exactly 3 invite codes (2 for the couple + 1 spare).
-- Placeholder codes — regenerate/edit these before real use.
insert into invite_codes (code) values
  ('SEED-ALPHA-0001'),
  ('SEED-ALPHA-0002'),
  ('SEED-ALPHA-SPARE');
