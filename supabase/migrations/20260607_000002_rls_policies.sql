-- =============================================================================
-- Migration: 20260607_000002_rls_policies.sql
-- Description: Enable RLS and define all row-level security policies
-- NOTE: is_approved() and is_admin() helper functions are defined in file 3.
--       This file can run after file 3, or you may inline those helpers here.
--       The functions must exist before these policies are exercised at runtime.
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE profiles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournaments        ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams              ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups             ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_teams        ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches            ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE scoring_configs    ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges             ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges        ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs         ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings       ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- profiles
-- =============================================================================
CREATE POLICY "profiles_select_approved"
  ON profiles FOR SELECT
  TO authenticated
  USING (is_approved());

CREATE POLICY "profiles_insert_own"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_update_admin"
  ON profiles FOR UPDATE
  TO authenticated
  USING (is_admin());

-- =============================================================================
-- tournaments
-- =============================================================================
CREATE POLICY "tournaments_select_auth"
  ON tournaments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "tournaments_insert_admin"
  ON tournaments FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "tournaments_update_admin"
  ON tournaments FOR UPDATE
  TO authenticated
  USING (is_admin());

CREATE POLICY "tournaments_delete_admin"
  ON tournaments FOR DELETE
  TO authenticated
  USING (is_admin());

-- =============================================================================
-- teams
-- =============================================================================
CREATE POLICY "teams_select_auth"
  ON teams FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "teams_insert_admin"
  ON teams FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "teams_update_admin"
  ON teams FOR UPDATE
  TO authenticated
  USING (is_admin());

CREATE POLICY "teams_delete_admin"
  ON teams FOR DELETE
  TO authenticated
  USING (is_admin());

-- =============================================================================
-- groups
-- =============================================================================
CREATE POLICY "groups_select_auth"
  ON groups FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "groups_insert_admin"
  ON groups FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "groups_update_admin"
  ON groups FOR UPDATE
  TO authenticated
  USING (is_admin());

CREATE POLICY "groups_delete_admin"
  ON groups FOR DELETE
  TO authenticated
  USING (is_admin());

-- =============================================================================
-- group_teams
-- =============================================================================
CREATE POLICY "group_teams_select_auth"
  ON group_teams FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "group_teams_insert_admin"
  ON group_teams FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "group_teams_update_admin"
  ON group_teams FOR UPDATE
  TO authenticated
  USING (is_admin());

CREATE POLICY "group_teams_delete_admin"
  ON group_teams FOR DELETE
  TO authenticated
  USING (is_admin());

-- =============================================================================
-- matches
-- =============================================================================
CREATE POLICY "matches_select_auth"
  ON matches FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "matches_insert_admin"
  ON matches FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "matches_update_admin"
  ON matches FOR UPDATE
  TO authenticated
  USING (is_admin());

CREATE POLICY "matches_delete_admin"
  ON matches FOR DELETE
  TO authenticated
  USING (is_admin());

-- =============================================================================
-- predictions
-- SELECT: own predictions always; others' only after match is scored/finished
-- INSERT/UPDATE/DELETE: own only, match must be 'open'
-- =============================================================================
CREATE POLICY "predictions_select_own"
  ON predictions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "predictions_select_others_after_scored"
  ON predictions FOR SELECT
  TO authenticated
  USING (
    user_id <> auth.uid()
    AND EXISTS (
      SELECT 1 FROM matches m
      WHERE m.id = predictions.match_id
        AND m.status IN ('scored', 'finished')
    )
  );

CREATE POLICY "predictions_insert_own_open"
  ON predictions FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM matches m
      WHERE m.id = predictions.match_id
        AND m.status = 'open'
    )
  );

CREATE POLICY "predictions_update_own_open"
  ON predictions FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM matches m
      WHERE m.id = predictions.match_id
        AND m.status = 'open'
    )
  );

CREATE POLICY "predictions_delete_own_open"
  ON predictions FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM matches m
      WHERE m.id = predictions.match_id
        AND m.status = 'open'
    )
  );

-- =============================================================================
-- leaderboard_entries
-- =============================================================================
CREATE POLICY "leaderboard_select_approved"
  ON leaderboard_entries FOR SELECT
  TO authenticated
  USING (is_approved());

CREATE POLICY "leaderboard_insert_admin"
  ON leaderboard_entries FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "leaderboard_update_admin"
  ON leaderboard_entries FOR UPDATE
  TO authenticated
  USING (is_admin());

CREATE POLICY "leaderboard_delete_admin"
  ON leaderboard_entries FOR DELETE
  TO authenticated
  USING (is_admin());

-- =============================================================================
-- scoring_configs
-- =============================================================================
CREATE POLICY "scoring_configs_select_auth"
  ON scoring_configs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "scoring_configs_insert_admin"
  ON scoring_configs FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "scoring_configs_update_admin"
  ON scoring_configs FOR UPDATE
  TO authenticated
  USING (is_admin());

CREATE POLICY "scoring_configs_delete_admin"
  ON scoring_configs FOR DELETE
  TO authenticated
  USING (is_admin());

-- =============================================================================
-- badges
-- =============================================================================
CREATE POLICY "badges_select_auth"
  ON badges FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "badges_insert_admin"
  ON badges FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "badges_update_admin"
  ON badges FOR UPDATE
  TO authenticated
  USING (is_admin());

CREATE POLICY "badges_delete_admin"
  ON badges FOR DELETE
  TO authenticated
  USING (is_admin());

-- =============================================================================
-- user_badges
-- =============================================================================
CREATE POLICY "user_badges_select_auth"
  ON user_badges FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "user_badges_insert_admin"
  ON user_badges FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "user_badges_update_admin"
  ON user_badges FOR UPDATE
  TO authenticated
  USING (is_admin());

CREATE POLICY "user_badges_delete_admin"
  ON user_badges FOR DELETE
  TO authenticated
  USING (is_admin());

-- =============================================================================
-- audit_logs
-- SELECT: admin only; INSERT: service role only (no authenticated policy = deny)
-- =============================================================================
CREATE POLICY "audit_logs_select_admin"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (is_admin());

-- INSERT is intentionally left to service_role only (no authenticated INSERT policy)

-- =============================================================================
-- app_settings
-- =============================================================================
CREATE POLICY "app_settings_select_auth"
  ON app_settings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "app_settings_update_admin"
  ON app_settings FOR UPDATE
  TO authenticated
  USING (is_admin());
