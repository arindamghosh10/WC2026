-- ============================================================
-- World Cup 2026 — Supabase Schema
-- Run this entire file in your Supabase SQL Editor
-- Project Settings > SQL Editor > New Query > Paste > Run
-- ============================================================

-- 1. MATCHES TABLE
create table if not exists matches (
  id            integer primary key,
  status        text,           -- SCHEDULED, IN_PLAY, FINISHED, etc.
  stage         text,           -- GROUP_STAGE, ROUND_OF_16, etc.
  "group"       text,           -- GROUP_A … GROUP_L
  matchday      integer,
  utc_date      timestamptz,
  home_team_id  integer,
  home_team_name text,
  home_team_crest text,
  away_team_id  integer,
  away_team_name text,
  away_team_crest text,
  home_score    integer,
  away_score    integer,
  home_score_ht integer,
  away_score_ht integer,
  winner        text,           -- HOME_TEAM, AWAY_TEAM, DRAW
  minute        integer,
  venue         text,
  referees      text,
  updated_at    timestamptz default now()
);

-- 2. SCORERS TABLE (Golden Boot)
create table if not exists scorers (
  player_id   integer primary key,
  player_name text,
  nationality text,
  team_id     integer,
  team_name   text,
  team_crest  text,
  goals       integer default 0,
  assists     integer default 0,
  penalties   integer default 0,
  rank        integer,
  updated_at  timestamptz default now()
);

-- 3. STANDINGS TABLE
create table if not exists standings (
  id            text primary key,   -- e.g. GROUP_A_123
  group_name    text,
  position      integer,
  team_id       integer,
  team_name     text,
  team_crest    text,
  played        integer default 0,
  won           integer default 0,
  draw          integer default 0,
  lost          integer default 0,
  goals_for     integer default 0,
  goals_against integer default 0,
  goal_diff     integer default 0,
  points        integer default 0,
  updated_at    timestamptz default now()
);

-- 4. Enable Row Level Security (RLS) — allow public read, no public write
alter table matches   enable row level security;
alter table scorers   enable row level security;
alter table standings enable row level security;

-- Public can read all data
create policy "Public read matches"
  on matches for select using (true);

create policy "Public read scorers"
  on scorers for select using (true);

create policy "Public read standings"
  on standings for select using (true);

-- 5. Indexes for fast queries
create index if not exists idx_matches_status   on matches(status);
create index if not exists idx_matches_utc_date on matches(utc_date);
create index if not exists idx_matches_group    on matches("group");
create index if not exists idx_standings_group  on standings(group_name);
create index if not exists idx_scorers_rank     on scorers(rank);

-- Done! You should see 3 tables in your Table Editor.
