-- =============================================================================
-- Migration 008: Badge tables + award logic
-- Creates badges + user_badges tables (not in live DB yet),
-- seeds 9 badge definitions, and wires up auto-award triggers.
-- Uses ACTUAL live column names throughout.
-- =============================================================================

-- ============================================================
-- 1. Create badges table
-- ============================================================
CREATE TABLE IF NOT EXISTS badges (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug           text UNIQUE NOT NULL,
  name           text NOT NULL,
  description    text,
  icon           text,
  criteria_type  text,
  criteria_value jsonb,
  points_reward  int NOT NULL DEFAULT 0,
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 2. Create user_badges table
-- ============================================================
CREATE TABLE IF NOT EXISTS user_badges (
  user_id    uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  badge_id   uuid NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  awarded_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, badge_id)
);

CREATE INDEX IF NOT EXISTS user_badges_user_idx ON user_badges(user_id);

-- ============================================================
-- 3. Badge definitions (9 badges)
-- ============================================================
INSERT INTO badges (slug, name, description, icon, criteria_type, criteria_value, points_reward)
VALUES
  ('first-prediction',  'First Prediction',  'Submit your first prediction',          'fa-star',         'prediction_count',       '{"min":1}',         5),
  ('perfect-score',     'Perfect Score',     'Get an exact score prediction',          'fa-bullseye',     'exact_score_count',      '{"min":1}',        10),
  ('hat-trick',         'Hat Trick',         '3 exact scores in a row',               'fa-hat-wizard',   'exact_score_streak',     '{"min":3}',        25),
  ('top-three',         'Top 3',             'Reach top 3 on the leaderboard',        'fa-trophy',       'leaderboard_rank',       '{"max":3}',        50),
  ('early-bird',        'Early Bird',        'Predict all 72 group stage matches',    'fa-clock',        'group_stage_predictions','{"min":72}',       30),
  ('knockout-expert',   'Knockout Expert',   '5 correct knockout round predictions',  'fa-medal',        'knockout_correct_count', '{"min":5}',        40),
  ('oracle',            'Oracle',            '10 exact scores total',                 'fa-eye',          'exact_score_count',      '{"min":10}',      100),
  ('champion-picker',   'Champion Picker',   'Correctly predict the tournament winner','fa-crown',       'predicted_champion',     '{"correct":true}',200),
  ('consistent',        'Consistent',        'Predict 20 matches correctly',          'fa-check-double', 'correct_outcome_count',  '{"min":20}',       75)
ON CONFLICT (slug) DO UPDATE SET
  name           = EXCLUDED.name,
  description    = EXCLUDED.description,
  icon           = EXCLUDED.icon,
  criteria_type  = EXCLUDED.criteria_type,
  criteria_value = EXCLUDED.criteria_value,
  points_reward  = EXCLUDED.points_reward;

-- ============================================================
-- 4. Function: award_badges_for_user(p_user_id uuid)
-- Uses LIVE column names:
--   predictions.first_submitted_at (not is_submitted)
--   predictions.predicted_winner_team_id (not pred_winner_team_id)
--   prediction_scores.is_exact_score, is_correct_outcome, total_points
--   leaderboard_snapshots (not leaderboard_entries)
--   leaderboard_snapshots.exact_scores_count, correct_outcomes_count, rank
-- ============================================================
CREATE OR REPLACE FUNCTION award_badges_for_user(p_user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_pred_count    integer := 0;
  v_exact_count   integer := 0;
  v_correct_count integer := 0;
  v_rank          integer;
  v_ko_correct    integer := 0;
  v_gs_pred       integer := 0;
  v_badge_id      uuid;
BEGIN
  -- Submitted prediction count (first_submitted_at IS NOT NULL = submitted)
  SELECT COUNT(*) INTO v_pred_count
  FROM predictions
  WHERE user_id = p_user_id
    AND first_submitted_at IS NOT NULL;

  -- Exact scores and correct outcomes from leaderboard_snapshots
  SELECT
    COALESCE(SUM(exact_scores_count), 0),
    COALESCE(SUM(correct_outcomes_count), 0)
  INTO v_exact_count, v_correct_count
  FROM leaderboard_snapshots
  WHERE user_id = p_user_id;

  -- Best leaderboard rank
  SELECT MIN(rank) INTO v_rank
  FROM leaderboard_snapshots
  WHERE user_id = p_user_id AND rank IS NOT NULL;

  -- Correct knockout predictions (from prediction_scores + matches stage)
  SELECT COUNT(*) INTO v_ko_correct
  FROM prediction_scores ps
  JOIN matches m ON m.id = ps.match_id
  WHERE ps.user_id = p_user_id
    AND m.stage != 'group'
    AND ps.is_correct_outcome = true;

  -- Group stage predictions submitted
  SELECT COUNT(*) INTO v_gs_pred
  FROM predictions p
  JOIN matches m ON m.id = p.match_id
  WHERE p.user_id = p_user_id
    AND m.stage = 'group'
    AND p.first_submitted_at IS NOT NULL;

  -- ── Award: first-prediction ──────────────────────────────
  IF v_pred_count >= 1 THEN
    SELECT id INTO v_badge_id FROM badges WHERE slug = 'first-prediction';
    IF v_badge_id IS NOT NULL THEN
      INSERT INTO user_badges (user_id, badge_id) VALUES (p_user_id, v_badge_id)
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;

  -- ── Award: perfect-score ─────────────────────────────────
  IF v_exact_count >= 1 THEN
    SELECT id INTO v_badge_id FROM badges WHERE slug = 'perfect-score';
    IF v_badge_id IS NOT NULL THEN
      INSERT INTO user_badges (user_id, badge_id) VALUES (p_user_id, v_badge_id)
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;

  -- ── Award: oracle (10 exact) ─────────────────────────────
  IF v_exact_count >= 10 THEN
    SELECT id INTO v_badge_id FROM badges WHERE slug = 'oracle';
    IF v_badge_id IS NOT NULL THEN
      INSERT INTO user_badges (user_id, badge_id) VALUES (p_user_id, v_badge_id)
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;

  -- ── Award: consistent (20 correct) ──────────────────────
  IF v_correct_count >= 20 THEN
    SELECT id INTO v_badge_id FROM badges WHERE slug = 'consistent';
    IF v_badge_id IS NOT NULL THEN
      INSERT INTO user_badges (user_id, badge_id) VALUES (p_user_id, v_badge_id)
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;

  -- ── Award: top-three ────────────────────────────────────
  IF v_rank IS NOT NULL AND v_rank <= 3 THEN
    SELECT id INTO v_badge_id FROM badges WHERE slug = 'top-three';
    IF v_badge_id IS NOT NULL THEN
      INSERT INTO user_badges (user_id, badge_id) VALUES (p_user_id, v_badge_id)
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;

  -- ── Award: knockout-expert (5 correct knockout) ──────────
  IF v_ko_correct >= 5 THEN
    SELECT id INTO v_badge_id FROM badges WHERE slug = 'knockout-expert';
    IF v_badge_id IS NOT NULL THEN
      INSERT INTO user_badges (user_id, badge_id) VALUES (p_user_id, v_badge_id)
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;

  -- ── Award: early-bird (72 group stage) ───────────────────
  IF v_gs_pred >= 72 THEN
    SELECT id INTO v_badge_id FROM badges WHERE slug = 'early-bird';
    IF v_badge_id IS NOT NULL THEN
      INSERT INTO user_badges (user_id, badge_id) VALUES (p_user_id, v_badge_id)
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;
END;
$$;

-- ============================================================
-- 5. Trigger: award badges after leaderboard_snapshots upsert
-- ============================================================
CREATE OR REPLACE FUNCTION trigger_award_badges_leaderboard()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  PERFORM award_badges_for_user(NEW.user_id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS award_badges_on_leaderboard ON leaderboard_snapshots;
CREATE TRIGGER award_badges_on_leaderboard
  AFTER INSERT OR UPDATE ON leaderboard_snapshots
  FOR EACH ROW EXECUTE FUNCTION trigger_award_badges_leaderboard();

-- ============================================================
-- 6. Trigger: award first-prediction badge immediately on submit
-- ============================================================
CREATE OR REPLACE FUNCTION trigger_award_badges_prediction()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Fire when first_submitted_at is newly set (prediction submitted)
  IF NEW.first_submitted_at IS NOT NULL AND
     (OLD IS NULL OR OLD.first_submitted_at IS NULL) THEN
    PERFORM award_badges_for_user(NEW.user_id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS award_badges_on_prediction ON predictions;
CREATE TRIGGER award_badges_on_prediction
  AFTER INSERT OR UPDATE ON predictions
  FOR EACH ROW EXECUTE FUNCTION trigger_award_badges_prediction();

-- ============================================================
-- 7. RLS policies
-- ============================================================
ALTER TABLE badges      ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS badges_select       ON badges;
CREATE POLICY badges_select ON badges FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS badges_admin_write  ON badges;
CREATE POLICY badges_admin_write ON badges FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS user_badges_select  ON user_badges;
CREATE POLICY user_badges_select ON user_badges FOR SELECT TO authenticated USING (true);

-- Block direct client writes — only the SECURITY DEFINER function can insert
DROP POLICY IF EXISTS user_badges_no_write ON user_badges;
CREATE POLICY user_badges_no_write ON user_badges
  FOR INSERT TO authenticated WITH CHECK (false);
