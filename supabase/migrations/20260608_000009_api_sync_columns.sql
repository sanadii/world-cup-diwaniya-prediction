-- Migration 009: Add live API sync columns and unique constraints
-- Applied to live DB via Supabase MCP during Sprint 8
-- Enables ESPN (and future provider) upsert without duplicates

-- matches: columns for live sync
ALTER TABLE matches
  ADD COLUMN IF NOT EXISTS external_provider   text,
  ADD COLUMN IF NOT EXISTS external_match_id   text,
  ADD COLUMN IF NOT EXISTS last_synced_at      timestamptz,
  ADD COLUMN IF NOT EXISTS city                text;

-- teams: columns for live sync
ALTER TABLE teams
  ADD COLUMN IF NOT EXISTS country_code  text,
  ADD COLUMN IF NOT EXISTS flag_url      text,
  ADD COLUMN IF NOT EXISTS group_name    text,
  ADD COLUMN IF NOT EXISTS fifa_code     text;

-- Unique constraints needed for upsert ON CONFLICT
ALTER TABLE matches
  ADD CONSTRAINT matches_external_match_id_key UNIQUE (external_match_id);

ALTER TABLE teams
  ADD CONSTRAINT teams_name_key UNIQUE (name);

-- pg_cron + pg_net for automated 5-min sync
CREATE EXTENSION IF NOT EXISTS pg_net   SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule edge function every 5 minutes
-- (adjust project ref and anon key via Supabase secrets if needed)
SELECT cron.schedule(
  'sync-fixtures-every-5min',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url    := current_setting('app.supabase_url') || '/functions/v1/sync-fixtures',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.service_role_key')
    ),
    body   := '{}'::jsonb
  );
  $$
);
