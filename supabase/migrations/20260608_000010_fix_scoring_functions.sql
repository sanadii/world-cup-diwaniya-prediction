-- Migration 010: Rewrite scoring functions to match live DB schema
-- Live column names differ from original migration 005:
--   predictions: predicted_score_a/b, predicted_winner_team_id, predicts_penalties,
--                predicted_penalty_score_a/b, is_locked, first_submitted_at (not is_submitted)
--   matches:     full_time_score_a/b, penalty_score_a/b, went_to_penalties (no tournament_id)
--   leaderboard: leaderboard_snapshots (not leaderboard_entries)

-- 1. Add points_awarded to predictions if missing
ALTER TABLE predictions ADD COLUMN IF NOT EXISTS points_awarded integer DEFAULT 0;

-- 2. Rewrite calculate_match_points
CREATE OR REPLACE FUNCTION calculate_match_points(p_match_id uuid)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_match     matches%ROWTYPE;
  v_pred      predictions%ROWTYPE;
  v_pts       integer;
  v_count     integer := 0;
  -- scoring weights (match spec defaults)
  v_valid_submission  integer := 1;
  v_locked_kickoff    integer := 1;
  v_correct_winner    integer := 2;
  v_exact_score       integer := 2;
  v_correct_penalties integer := 1;
  v_exact_penalty     integer := 1;
  v_stage_bonus       integer := 0;
  -- outcome helpers
  v_actual_outcome text;
  v_pred_outcome   text;
BEGIN
  -- Guard: admin only
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'permission denied';
  END IF;

  -- Load match
  SELECT * INTO v_match FROM matches WHERE id = p_match_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'match not found'; END IF;
  IF v_match.status NOT IN ('finished', 'scored') THEN
    RAISE EXCEPTION 'match must be finished or scored (currently: %)', v_match.status;
  END IF;
  IF v_match.full_time_score_a IS NULL OR v_match.full_time_score_b IS NULL THEN
    RAISE EXCEPTION 'match scores not set';
  END IF;

  -- Stage bonus
  v_stage_bonus := CASE v_match.stage
    WHEN 'round_of_32'  THEN 1
    WHEN 'round_of_16'  THEN 1
    WHEN 'quarterfinal' THEN 2
    WHEN 'semifinal'    THEN 3
    WHEN 'third_place'  THEN 2
    WHEN 'final'        THEN 5
    ELSE 0
  END;

  -- Actual outcome (team_a win / draw / team_b win)
  v_actual_outcome := CASE
    WHEN v_match.full_time_score_a > v_match.full_time_score_b THEN 'team_a'
    WHEN v_match.full_time_score_a < v_match.full_time_score_b THEN 'team_b'
    ELSE 'draw'
  END;

  -- Score all submitted+locked predictions for this match
  FOR v_pred IN
    SELECT * FROM predictions
    WHERE match_id = p_match_id
      AND is_locked = true
      AND first_submitted_at IS NOT NULL
  LOOP
    v_pts := 0;

    -- Participation points
    v_pts := v_pts + v_valid_submission + v_locked_kickoff;

    -- Correct outcome / winner
    IF v_match.stage = 'group' THEN
      v_pred_outcome := CASE
        WHEN v_pred.predicted_score_a > v_pred.predicted_score_b THEN 'team_a'
        WHEN v_pred.predicted_score_a < v_pred.predicted_score_b THEN 'team_b'
        ELSE 'draw'
      END;
      IF v_pred_outcome = v_actual_outcome THEN
        v_pts := v_pts + v_correct_winner + v_stage_bonus;
      END IF;
    ELSE
      -- Knockout: correct winner team
      IF v_pred.predicted_winner_team_id IS NOT NULL
         AND v_pred.predicted_winner_team_id = v_match.winner_team_id THEN
        v_pts := v_pts + v_correct_winner + v_stage_bonus;
      END IF;
    END IF;

    -- Exact full-time score
    IF v_pred.predicted_score_a = v_match.full_time_score_a
       AND v_pred.predicted_score_b = v_match.full_time_score_b THEN
      v_pts := v_pts + v_exact_score;
    END IF;

    -- Penalties (knockout only)
    IF v_match.stage != 'group' AND v_match.went_to_penalties = true THEN
      IF v_pred.predicts_penalties = true THEN
        v_pts := v_pts + v_correct_penalties;
        IF v_pred.predicted_penalty_score_a = v_match.penalty_score_a
           AND v_pred.predicted_penalty_score_b = v_match.penalty_score_b THEN
          v_pts := v_pts + v_exact_penalty;
        END IF;
      END IF;
    END IF;

    -- Save points
    UPDATE predictions
    SET points_awarded = v_pts, updated_at = now()
    WHERE id = v_pred.id;

    v_count := v_count + 1;
  END LOOP;

  -- Mark match as scored
  UPDATE matches SET status = 'scored', updated_at = now() WHERE id = p_match_id;

  -- Refresh leaderboard
  PERFORM recalculate_leaderboard();

  RETURN v_count;
END;
$$;

-- 3. Rewrite recalculate_leaderboard (global — no tournament_id in live schema)
CREATE OR REPLACE FUNCTION recalculate_leaderboard()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Upsert snapshot per user from all their scored predictions
  INSERT INTO leaderboard_snapshots (
    user_id,
    total_points,
    exact_scores_count,
    correct_outcomes_count,
    submissions_count,
    today_points,
    snapshot_at
  )
  SELECT
    p.user_id,
    COALESCE(SUM(p.points_awarded), 0)                                     AS total_points,
    COUNT(*) FILTER (WHERE
      p.predicted_score_a = m.full_time_score_a
      AND p.predicted_score_b = m.full_time_score_b
    )                                                                       AS exact_scores_count,
    COUNT(*) FILTER (WHERE p.points_awarded >= 4)                           AS correct_outcomes_count,
    COUNT(*)                                                                AS submissions_count,
    COALESCE(SUM(p.points_awarded) FILTER (WHERE
      m.kickoff_at_utc >= date_trunc('day', now() AT TIME ZONE 'Asia/Kuwait')
                           AT TIME ZONE 'Asia/Kuwait'
      AND m.kickoff_at_utc < date_trunc('day', now() AT TIME ZONE 'Asia/Kuwait')
                              AT TIME ZONE 'Asia/Kuwait' + interval '1 day'
    ), 0)                                                                   AS today_points,
    now()
  FROM predictions p
  JOIN matches m ON p.match_id = m.id
  WHERE p.is_locked = true
    AND p.first_submitted_at IS NOT NULL
    AND m.status = 'scored'
  GROUP BY p.user_id
  ON CONFLICT (user_id) DO UPDATE SET
    total_points           = EXCLUDED.total_points,
    exact_scores_count     = EXCLUDED.exact_scores_count,
    correct_outcomes_count = EXCLUDED.correct_outcomes_count,
    submissions_count      = EXCLUDED.submissions_count,
    today_points           = EXCLUDED.today_points,
    snapshot_at            = now();

  -- Recalculate ranks
  WITH ranked AS (
    SELECT id,
           ROW_NUMBER() OVER (
             ORDER BY total_points DESC,
                      exact_scores_count DESC,
                      correct_outcomes_count DESC,
                      submission_time_sum ASC NULLS LAST
           ) AS new_rank
    FROM leaderboard_snapshots
  )
  UPDATE leaderboard_snapshots ls
  SET rank = r.new_rank
  FROM ranked r
  WHERE ls.id = r.id;
END;
$$;

-- 4. Unique constraint on user_id for the leaderboard upsert
ALTER TABLE leaderboard_snapshots
  ADD CONSTRAINT leaderboard_snapshots_user_id_key UNIQUE (user_id);
