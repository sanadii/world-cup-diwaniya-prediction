-- =============================================================================
-- Migration: 20260608_000005_scoring_functions.sql
-- Description: Scoring functions for match points, leaderboard, and group standings
-- =============================================================================

-- =============================================================================
-- Function 1: calculate_match_points(p_match_id uuid)
-- Scores all submitted+locked predictions for a match and triggers leaderboard recalc
-- =============================================================================

CREATE OR REPLACE FUNCTION calculate_match_points(p_match_id uuid)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_match matches%ROWTYPE;
  v_config jsonb;
  v_pred predictions%ROWTYPE;
  v_pts integer;
  v_count integer := 0;
  -- scoring config values
  v_valid_submission integer;
  v_locked_at_kickoff integer;
  v_correct_winner integer;
  v_exact_score integer;
  v_correct_penalties integer;
  v_exact_penalty integer;
  v_stage_bonus integer;
  -- outcome helpers
  v_actual_outcome text;
  v_pred_outcome text;
BEGIN
  -- Guard: admin only
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'permission denied';
  END IF;

  -- Load match
  SELECT * INTO v_match FROM matches WHERE id = p_match_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'match not found'; END IF;
  IF v_match.status NOT IN ('finished', 'scored') THEN
    RAISE EXCEPTION 'match must be finished or scored';
  END IF;

  -- Load active scoring config
  SELECT rules INTO v_config FROM scoring_configs WHERE is_active = true LIMIT 1;
  v_valid_submission  := (v_config->>'validSubmission')::integer;
  v_locked_at_kickoff := (v_config->>'lockedAtKickoff')::integer;
  v_correct_winner    := (v_config->>'correctWinnerOrOutcome')::integer;
  v_exact_score       := (v_config->>'exactFullTimeScore')::integer;
  v_correct_penalties := (v_config->>'correctlyPredictedPenalties')::integer;
  v_exact_penalty     := (v_config->>'exactPenaltyScore')::integer;
  v_stage_bonus       := COALESCE((v_config->'stageBonus'->>v_match.stage)::integer, 0);

  -- Actual outcome for group stage
  v_actual_outcome := CASE
    WHEN v_match.home_score > v_match.away_score THEN 'home'
    WHEN v_match.home_score < v_match.away_score THEN 'away'
    ELSE 'draw'
  END;

  -- Loop all submitted+locked predictions for this match
  FOR v_pred IN
    SELECT * FROM predictions
    WHERE match_id = p_match_id AND is_submitted = true AND is_locked = true
  LOOP
    v_pts := 0;

    -- Participation points
    v_pts := v_pts + v_valid_submission + v_locked_at_kickoff;

    -- Correct outcome / winner
    IF v_match.stage = 'group' THEN
      v_pred_outcome := CASE
        WHEN v_pred.pred_home > v_pred.pred_away THEN 'home'
        WHEN v_pred.pred_home < v_pred.pred_away THEN 'away'
        ELSE 'draw'
      END;
      IF v_pred_outcome = v_actual_outcome THEN
        v_pts := v_pts + v_correct_winner + v_stage_bonus;
      END IF;
    ELSE
      IF v_pred.pred_winner_team_id = v_match.winner_team_id THEN
        v_pts := v_pts + v_correct_winner + v_stage_bonus;
      END IF;
    END IF;

    -- Exact full-time score
    IF v_pred.pred_home = v_match.home_score AND v_pred.pred_away = v_match.away_score THEN
      v_pts := v_pts + v_exact_score;
    END IF;

    -- Penalties (knockout only)
    IF v_match.stage != 'group' AND v_match.went_to_penalties AND v_pred.pred_penalties THEN
      v_pts := v_pts + v_correct_penalties;
      IF v_pred.pred_home_penalty = v_match.home_penalty
         AND v_pred.pred_away_penalty = v_match.away_penalty THEN
        v_pts := v_pts + v_exact_penalty;
      END IF;
    END IF;

    -- Update prediction
    UPDATE predictions
    SET points_awarded = v_pts, updated_at = now()
    WHERE id = v_pred.id;

    v_count := v_count + 1;
  END LOOP;

  -- Mark match as scored
  UPDATE matches SET status = 'scored', updated_at = now() WHERE id = p_match_id;

  -- Trigger leaderboard recalc for this tournament
  PERFORM recalculate_leaderboard(v_match.tournament_id);

  RETURN v_count; -- number of predictions scored
END;
$$;

-- =============================================================================
-- Function 2: recalculate_leaderboard(p_tournament_id uuid)
-- Rebuilds leaderboard_entries for a tournament from scored predictions
-- =============================================================================

CREATE OR REPLACE FUNCTION recalculate_leaderboard(p_tournament_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Upsert leaderboard_entries for all users with predictions in this tournament
  INSERT INTO leaderboard_entries (user_id, tournament_id, total_points, matches_predicted, exact_scores, correct_outcomes, updated_at)
  SELECT
    p.user_id,
    p_tournament_id,
    COALESCE(SUM(p.points_awarded), 0)                                        AS total_points,
    COUNT(*)                                                                   AS matches_predicted,
    COUNT(*) FILTER (WHERE
      p.pred_home = m.home_score AND p.pred_away = m.away_score
    )                                                                          AS exact_scores,
    COUNT(*) FILTER (WHERE
      p.points_awarded >= 4  -- has correct winner/outcome points
    )                                                                          AS correct_outcomes,
    now()
  FROM predictions p
  JOIN matches m ON p.match_id = m.id
  WHERE m.tournament_id = p_tournament_id
    AND p.is_submitted = true
    AND p.is_locked = true
    AND m.status IN ('scored')
  GROUP BY p.user_id
  ON CONFLICT (user_id, tournament_id) DO UPDATE SET
    total_points      = EXCLUDED.total_points,
    matches_predicted = EXCLUDED.matches_predicted,
    exact_scores      = EXCLUDED.exact_scores,
    correct_outcomes  = EXCLUDED.correct_outcomes,
    updated_at        = now();

  -- Recalculate ranks (rank by total_points desc, exact_scores desc, correct_outcomes desc)
  WITH ranked AS (
    SELECT id,
           ROW_NUMBER() OVER (
             ORDER BY total_points DESC, exact_scores DESC, correct_outcomes DESC
           ) AS new_rank
    FROM leaderboard_entries
    WHERE tournament_id = p_tournament_id
  )
  UPDATE leaderboard_entries le
  SET rank = r.new_rank
  FROM ranked r
  WHERE le.id = r.id;
END;
$$;

-- =============================================================================
-- Function 3: update_group_standings(p_group_id uuid)
-- Recalculates group_teams standings from all scored group-stage matches
-- =============================================================================

CREATE OR REPLACE FUNCTION update_group_standings(p_group_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Reset all teams in the group
  UPDATE group_teams
  SET played=0, won=0, drawn=0, lost=0, goals_for=0, goals_against=0, points=0
  WHERE group_id = p_group_id;

  -- Accumulate from scored matches
  -- Home team stats
  UPDATE group_teams gt
  SET
    played        = gt.played + 1,
    won           = gt.won   + CASE WHEN m.home_score > m.away_score THEN 1 ELSE 0 END,
    drawn         = gt.drawn + CASE WHEN m.home_score = m.away_score THEN 1 ELSE 0 END,
    lost          = gt.lost  + CASE WHEN m.home_score < m.away_score THEN 1 ELSE 0 END,
    goals_for     = gt.goals_for     + m.home_score,
    goals_against = gt.goals_against + m.away_score,
    points        = gt.points
                    + CASE WHEN m.home_score > m.away_score THEN 3
                           WHEN m.home_score = m.away_score THEN 1
                           ELSE 0 END
  FROM matches m
  WHERE m.group_id = p_group_id
    AND m.status = 'scored'
    AND gt.team_id = m.home_team_id;

  -- Away team stats
  UPDATE group_teams gt
  SET
    played        = gt.played + 1,
    won           = gt.won   + CASE WHEN m.away_score > m.home_score THEN 1 ELSE 0 END,
    drawn         = gt.drawn + CASE WHEN m.away_score = m.home_score THEN 1 ELSE 0 END,
    lost          = gt.lost  + CASE WHEN m.away_score < m.home_score THEN 1 ELSE 0 END,
    goals_for     = gt.goals_for     + m.away_score,
    goals_against = gt.goals_against + m.home_score,
    points        = gt.points
                    + CASE WHEN m.away_score > m.home_score THEN 3
                           WHEN m.away_score = m.home_score THEN 1
                           ELSE 0 END
  FROM matches m
  WHERE m.group_id = p_group_id
    AND m.status = 'scored'
    AND gt.team_id = m.away_team_id;
END;
$$;

-- =============================================================================
-- Trigger: auto-update group standings when a group match is scored
-- =============================================================================

CREATE OR REPLACE FUNCTION trg_auto_update_standings()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NEW.status = 'scored' AND NEW.stage = 'group' AND NEW.group_id IS NOT NULL
     AND (OLD.status IS DISTINCT FROM 'scored') THEN
    PERFORM update_group_standings(NEW.group_id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_match_scored_standings ON matches;
CREATE TRIGGER trg_match_scored_standings
  AFTER UPDATE ON matches
  FOR EACH ROW EXECUTE FUNCTION trg_auto_update_standings();
