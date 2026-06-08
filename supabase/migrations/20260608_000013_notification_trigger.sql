-- Migration 013: Auto-create notifications when a match is scored
-- Fires AFTER UPDATE on matches when status moves to 'scored'.
-- Inserts one notification per user who has a locked prediction for that match.

CREATE OR REPLACE FUNCTION trg_notify_users_on_match_scored()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_team_a  text;
  v_team_b  text;
  v_match_label text;
  v_pred    RECORD;
  v_pts     integer;
  v_title   text;
  v_body    text;
BEGIN
  -- Only fire when status transitions to 'scored'
  IF OLD.status = 'scored' OR NEW.status != 'scored' THEN
    RETURN NEW;
  END IF;

  -- Build match label: "Team A vs Team B" or fallback
  SELECT
    COALESCE(ta.short_name, ta.name, 'TBD'),
    COALESCE(tb.short_name, tb.name, 'TBD')
  INTO v_team_a, v_team_b
  FROM matches m
  LEFT JOIN teams ta ON ta.id = m.team_a_id
  LEFT JOIN teams tb ON tb.id = m.team_b_id
  WHERE m.id = NEW.id;

  v_match_label := COALESCE(v_team_a, 'TBD') || ' vs ' || COALESCE(v_team_b, 'TBD');

  -- Loop over all locked predictions for this match
  FOR v_pred IN
    SELECT p.user_id, p.points_awarded
    FROM predictions p
    WHERE p.match_id = NEW.id
      AND p.is_locked = true
      AND p.first_submitted_at IS NOT NULL
  LOOP
    v_pts := COALESCE(v_pred.points_awarded, 0);

    IF v_pts >= 6 THEN
      v_title := 'Perfect prediction!';
      v_body  := v_match_label || ' — you nailed the exact score and earned ' || v_pts || ' pts!';
    ELSIF v_pts >= 4 THEN
      v_title := 'Great prediction!';
      v_body  := v_match_label || ' — correct result! You earned ' || v_pts || ' pts.';
    ELSIF v_pts >= 2 THEN
      v_title := 'Match scored';
      v_body  := v_match_label || ' has been scored. You earned ' || v_pts || ' pts.';
    ELSE
      v_title := 'Match scored';
      v_body  := v_match_label || ' has been scored. Better luck next time!';
    END IF;

    INSERT INTO notifications (user_id, type, title, body, is_read, data, created_at)
    VALUES (
      v_pred.user_id,
      'match_scored',
      v_title,
      v_body,
      false,
      jsonb_build_object(
        'match_id',     NEW.id,
        'points',       v_pts,
        'final_score',  NEW.full_time_score_a || '-' || NEW.full_time_score_b
      ),
      now()
    );
  END LOOP;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_match_scored_notify ON matches;
CREATE TRIGGER trg_match_scored_notify
  AFTER UPDATE ON matches
  FOR EACH ROW
  EXECUTE FUNCTION trg_notify_users_on_match_scored();
