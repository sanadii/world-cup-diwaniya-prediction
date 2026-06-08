-- Migration 006: Schema patch for live DB
-- Adds flag_code to profiles, fixes is_approved()/is_admin() helpers, refreshes RLS policies

-- 1. Add flag_code to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS flag_code text DEFAULT 'kw';

-- 2. Fix is_approved() helper — live DB uses approval_status not is_approved
CREATE OR REPLACE FUNCTION is_approved()
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
      AND approval_status = 'approved'
      AND is_active = true
  );
$$;

-- 3. Fix is_admin() helper — same issue
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
      AND approval_status = 'approved'
  );
$$;

-- 4. RLS policies using correct column names

-- Enable RLS on all tables (idempotent)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE prediction_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE scoring_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_actions ENABLE ROW LEVEL SECURITY;

-- profiles: read all approved, update own only
DROP POLICY IF EXISTS profiles_select_approved ON profiles;
CREATE POLICY profiles_select_approved ON profiles
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS profiles_update_own ON profiles;
CREATE POLICY profiles_update_own ON profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- matches: read all authenticated
DROP POLICY IF EXISTS matches_select_all ON matches;
CREATE POLICY matches_select_all ON matches
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS matches_admin_write ON matches;
CREATE POLICY matches_admin_write ON matches
  FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- teams: read all
DROP POLICY IF EXISTS teams_select_all ON teams;
CREATE POLICY teams_select_all ON teams
  FOR SELECT TO authenticated USING (true);

-- predictions: own always, others only after match scored/finished
DROP POLICY IF EXISTS predictions_select ON predictions;
CREATE POLICY predictions_select ON predictions
  FOR SELECT TO authenticated USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM matches m
      WHERE m.id = match_id
        AND m.status IN ('scored', 'finished')
    )
  );

DROP POLICY IF EXISTS predictions_insert ON predictions;
CREATE POLICY predictions_insert ON predictions
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND is_approved()
    AND EXISTS (
      SELECT 1 FROM matches m
      WHERE m.id = match_id AND m.status = 'open'
    )
  );

DROP POLICY IF EXISTS predictions_update ON predictions;
CREATE POLICY predictions_update ON predictions
  FOR UPDATE TO authenticated
  USING (
    user_id = auth.uid()
    AND is_approved()
    AND EXISTS (
      SELECT 1 FROM matches m WHERE m.id = match_id AND m.status = 'open'
    )
  )
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS predictions_delete ON predictions;
CREATE POLICY predictions_delete ON predictions
  FOR DELETE TO authenticated
  USING (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM matches m WHERE m.id = match_id AND m.status = 'open'
    )
  );

-- leaderboard_snapshots: read all approved
DROP POLICY IF EXISTS leaderboard_select ON leaderboard_snapshots;
CREATE POLICY leaderboard_select ON leaderboard_snapshots
  FOR SELECT TO authenticated USING (is_approved());

-- prediction_scores: own + match scored
DROP POLICY IF EXISTS pred_scores_select ON prediction_scores;
CREATE POLICY pred_scores_select ON prediction_scores
  FOR SELECT TO authenticated USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM matches m WHERE m.id = match_id AND m.status IN ('scored','finished')
    )
  );

-- notifications: own only
DROP POLICY IF EXISTS notifications_select ON notifications;
CREATE POLICY notifications_select ON notifications
  FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS notifications_update ON notifications;
CREATE POLICY notifications_update ON notifications
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- scoring_rules: read all, write admin
DROP POLICY IF EXISTS scoring_rules_select ON scoring_rules;
CREATE POLICY scoring_rules_select ON scoring_rules
  FOR SELECT TO authenticated USING (true);

-- admin_actions: admin read
DROP POLICY IF EXISTS admin_actions_select ON admin_actions;
CREATE POLICY admin_actions_select ON admin_actions
  FOR SELECT TO authenticated USING (is_admin());
