-- =============================================================================
-- Migration: 20260607_000001_initial_schema.sql
-- Description: Create all 13 tables for the World Cup Diwaniya Prediction app
-- =============================================================================

-- profiles
CREATE TABLE IF NOT EXISTS profiles (
  id           uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL,
  email        text,
  flag_code    text DEFAULT 'kw',
  role         text NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin', 'super_admin')),
  is_approved  boolean NOT NULL DEFAULT false,
  invite_code  text,
  avatar_url   text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- tournaments
CREATE TABLE IF NOT EXISTS tournaments (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  slug       text UNIQUE NOT NULL,
  start_date date NOT NULL,
  end_date   date NOT NULL,
  is_active  boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- teams
CREATE TABLE IF NOT EXISTS teams (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  short_name    text NOT NULL,
  flag_code     text NOT NULL,
  group_letter  text,
  tournament_id uuid REFERENCES tournaments(id),
  created_at    timestamptz DEFAULT now()
);

-- groups
CREATE TABLE IF NOT EXISTS groups (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES tournaments(id),
  letter        text NOT NULL,
  name          text,
  created_at    timestamptz DEFAULT now(),
  UNIQUE(tournament_id, letter)
);

-- group_teams
CREATE TABLE IF NOT EXISTS group_teams (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id       uuid NOT NULL REFERENCES groups(id),
  team_id        uuid NOT NULL REFERENCES teams(id),
  played         int DEFAULT 0,
  won            int DEFAULT 0,
  drawn          int DEFAULT 0,
  lost           int DEFAULT 0,
  goals_for      int DEFAULT 0,
  goals_against  int DEFAULT 0,
  points         int DEFAULT 0,
  UNIQUE(group_id, team_id)
);

-- matches
CREATE TABLE IF NOT EXISTS matches (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id       uuid NOT NULL REFERENCES tournaments(id),
  home_team_id        uuid REFERENCES teams(id),
  away_team_id        uuid REFERENCES teams(id),
  group_id            uuid REFERENCES groups(id),
  stage               text NOT NULL CHECK (stage IN ('group','round_of_32','round_of_16','quarterfinal','semifinal','third_place','final')),
  match_number        int,
  scheduled_at        timestamptz NOT NULL,
  venue               text,
  status              text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled','open','locked','live','finished','scored','postponed','cancelled')),
  home_score          int,
  away_score          int,
  went_to_penalties   boolean DEFAULT false,
  home_penalty        int,
  away_penalty        int,
  winner_team_id      uuid REFERENCES teams(id),
  live_minute         int,
  locked_at           timestamptz,
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now()
);

-- predictions
CREATE TABLE IF NOT EXISTS predictions (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  match_id             uuid NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  pred_home            int NOT NULL DEFAULT 0,
  pred_away            int NOT NULL DEFAULT 0,
  pred_winner_team_id  uuid REFERENCES teams(id),
  pred_penalties       boolean DEFAULT false,
  pred_home_penalty    int,
  pred_away_penalty    int,
  is_submitted         boolean NOT NULL DEFAULT false,
  is_locked            boolean NOT NULL DEFAULT false,
  points_awarded       int,
  submitted_at         timestamptz,
  locked_at            timestamptz,
  created_at           timestamptz DEFAULT now(),
  updated_at           timestamptz DEFAULT now(),
  UNIQUE(user_id, match_id)
);

-- leaderboard_entries
CREATE TABLE IF NOT EXISTS leaderboard_entries (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  tournament_id      uuid NOT NULL REFERENCES tournaments(id),
  total_points       int NOT NULL DEFAULT 0,
  rank               int,
  matches_predicted  int DEFAULT 0,
  exact_scores       int DEFAULT 0,
  correct_outcomes   int DEFAULT 0,
  updated_at         timestamptz DEFAULT now(),
  UNIQUE(user_id, tournament_id)
);

-- scoring_configs
CREATE TABLE IF NOT EXISTS scoring_configs (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version    int NOT NULL DEFAULT 1,
  rules      jsonb NOT NULL,
  is_active  boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(version)
);

-- badges
CREATE TABLE IF NOT EXISTS badges (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        text UNIQUE NOT NULL,
  name        text NOT NULL,
  description text,
  icon        text,
  created_at  timestamptz DEFAULT now()
);

-- user_badges
CREATE TABLE IF NOT EXISTS user_badges (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  badge_id   uuid NOT NULL REFERENCES badges(id),
  awarded_at timestamptz DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

-- audit_logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id     uuid REFERENCES profiles(id),
  action       text NOT NULL,
  target_table text,
  target_id    uuid,
  old_data     jsonb,
  new_data     jsonb,
  created_at   timestamptz DEFAULT now()
);

-- app_settings
CREATE TABLE IF NOT EXISTS app_settings (
  key        text PRIMARY KEY,
  value      jsonb NOT NULL,
  updated_at timestamptz DEFAULT now()
);
