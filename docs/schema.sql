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

-- RLS: invite_codes — enabled, NO client policies at all.
-- Only the service-role key (server-side, in /api/signup.js) can touch this table.
alter table invite_codes enable row level security;

-- Seed exactly 3 invite codes (2 for the couple + 1 spare).
-- Placeholder codes — regenerate/edit these before real use.
insert into invite_codes (code) values
  ('SEED-ALPHA-0001'),
  ('SEED-ALPHA-0002'),
  ('SEED-ALPHA-SPARE');
