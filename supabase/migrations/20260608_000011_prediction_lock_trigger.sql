-- Migration 011: Auto-lock predictions when match status advances past 'open'
-- When a match moves to locked/live/finished/scored, freeze all its predictions.

CREATE OR REPLACE FUNCTION trg_lock_predictions_on_match_advance()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Only fire when status is moving away from 'open'
  IF OLD.status = 'open' AND NEW.status != 'open' THEN
    UPDATE predictions
    SET is_locked = true,
        locked_at = COALESCE(locked_at, now()),
        updated_at = now()
    WHERE match_id = NEW.id
      AND is_locked = false
      AND first_submitted_at IS NOT NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_match_lock_predictions ON matches;
CREATE TRIGGER trg_match_lock_predictions
  AFTER UPDATE ON matches
  FOR EACH ROW
  EXECUTE FUNCTION trg_lock_predictions_on_match_advance();

-- Also lock when match is first inserted as non-open (edge case: ESPN syncs a live match)
CREATE OR REPLACE FUNCTION trg_lock_predictions_on_match_insert()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NEW.status NOT IN ('open', 'scheduled') THEN
    UPDATE predictions
    SET is_locked = true,
        locked_at = COALESCE(locked_at, now()),
        updated_at = now()
    WHERE match_id = NEW.id
      AND is_locked = false
      AND first_submitted_at IS NOT NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_match_insert_lock_predictions ON matches;
CREATE TRIGGER trg_match_insert_lock_predictions
  AFTER INSERT ON matches
  FOR EACH ROW
  EXECUTE FUNCTION trg_lock_predictions_on_match_insert();
