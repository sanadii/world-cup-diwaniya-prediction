-- =============================================================================
-- Migration: 20260607_000003_functions_triggers_seed.sql
-- Description: Helper functions, triggers, and seed data
-- =============================================================================

-- =============================================================================
-- Helper Functions
-- =============================================================================

-- Returns true if the current user's profile has is_approved = true
CREATE OR REPLACE FUNCTION is_approved()
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND is_approved = true
  );
$$;

-- Returns true if the current user's profile has role IN ('admin', 'super_admin')
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
  );
$$;

-- =============================================================================
-- Auto-create profile on signup
-- =============================================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO profiles (id, display_name, email, flag_code)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'flag_code', 'kw')
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =============================================================================
-- Auto-update updated_at
-- =============================================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Apply to profiles
DROP TRIGGER IF EXISTS set_updated_at_profiles ON profiles;
CREATE TRIGGER set_updated_at_profiles
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Apply to matches
DROP TRIGGER IF EXISTS set_updated_at_matches ON matches;
CREATE TRIGGER set_updated_at_matches
  BEFORE UPDATE ON matches
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Apply to predictions
DROP TRIGGER IF EXISTS set_updated_at_predictions ON predictions;
CREATE TRIGGER set_updated_at_predictions
  BEFORE UPDATE ON predictions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Apply to leaderboard_entries
DROP TRIGGER IF EXISTS set_updated_at_leaderboard_entries ON leaderboard_entries;
CREATE TRIGGER set_updated_at_leaderboard_entries
  BEFORE UPDATE ON leaderboard_entries
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =============================================================================
-- Lock predictions at match kickoff
-- =============================================================================

CREATE OR REPLACE FUNCTION lock_predictions_for_match(match_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE predictions
  SET is_locked = true, locked_at = now()
  WHERE predictions.match_id = lock_predictions_for_match.match_id
    AND is_submitted = true
    AND is_locked = false;

  UPDATE matches
  SET status = 'locked', locked_at = now()
  WHERE id = lock_predictions_for_match.match_id
    AND status = 'open';
END;
$$;

-- =============================================================================
-- Seed Data
-- =============================================================================

-- Scoring configuration (v1, active)
INSERT INTO scoring_configs (version, rules, is_active) VALUES (
  1,
  '{
    "validSubmission": 1,
    "lockedAtKickoff": 1,
    "correctWinnerOrOutcome": 2,
    "exactFullTimeScore": 2,
    "correctlyPredictedPenalties": 1,
    "exactPenaltyScore": 1,
    "stageBonus": {
      "group": 0,
      "round_of_32": 1,
      "round_of_16": 1,
      "quarterfinal": 2,
      "semifinal": 3,
      "third_place": 2,
      "final": 5
    }
  }'::jsonb,
  true
) ON CONFLICT (version) DO NOTHING;

-- Badges
INSERT INTO badges (slug, name, description, icon) VALUES
  ('perfect_score',     'Perfect Score',     'Predicted an exact scoreline',                        'faTrophy'),
  ('prophet',           'Prophet',           'Predicted 5 exact scores',                            'faEye'),
  ('streak_3',          'On Fire',           '3 correct predictions in a row',                      'faFire'),
  ('early_bird',        'Early Bird',        'Submitted all group stage predictions before first match', 'faClock'),
  ('top_3',             'Podium',            'Finished in top 3 on the leaderboard',                'faMedal'),
  ('winner',            'Champion',          'Won the competition',                                 'faCrown'),
  ('penalty_king',      'Penalty King',      'Correctly predicted penalties 3 times',               'faFutbol'),
  ('final_predictor',   'Final Predictor',   'Correctly predicted the World Cup winner',            'faStar'),
  ('participated',      'Participant',       'Submitted at least one prediction',                   'faCheck')
ON CONFLICT (slug) DO NOTHING;

-- App settings
INSERT INTO app_settings (key, value) VALUES
  ('tournament_id',        'null'::jsonb),
  ('registration_open',    'true'::jsonb),
  ('predictions_visible',  'false'::jsonb)
ON CONFLICT (key) DO NOTHING;
