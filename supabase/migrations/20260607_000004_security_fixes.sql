-- =============================================================================
-- Migration: 20260607_000004_security_fixes.sql
-- Description: Security hardening based on sec-lead verdict
-- Fixes: F1 (lock fn admin guard), F2 (predictions approved-only writes),
--        F3 (score bounds), role self-escalation, audit trigger, FK constraint
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- [F1] lock_predictions_for_match — add admin-only guard
-- Any authenticated user could previously call this via supabase.rpc()
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION lock_predictions_for_match(match_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Guard: only admins may lock predictions
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'permission denied: admin role required';
  END IF;

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

-- ─────────────────────────────────────────────────────────────────────────────
-- [F2] Predictions write policies — require is_approved()
-- Unapproved (pending) users were able to insert/update predictions
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS predictions_insert_own_open ON predictions;
DROP POLICY IF EXISTS predictions_update_own_open ON predictions;
DROP POLICY IF EXISTS predictions_delete_own_open ON predictions;

CREATE POLICY predictions_insert_own_open ON predictions
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND is_approved()
    AND EXISTS (
      SELECT 1 FROM matches m
      WHERE m.id = match_id AND m.status = 'open'
    )
  );

CREATE POLICY predictions_update_own_open ON predictions
  FOR UPDATE TO authenticated
  USING (
    user_id = auth.uid()
    AND is_approved()
    AND EXISTS (
      SELECT 1 FROM matches m
      WHERE m.id = match_id AND m.status = 'open'
    )
  )
  WITH CHECK (
    user_id = auth.uid()
    AND is_approved()
  );

CREATE POLICY predictions_delete_own_open ON predictions
  FOR DELETE TO authenticated
  USING (
    user_id = auth.uid()
    AND is_approved()
    AND EXISTS (
      SELECT 1 FROM matches m
      WHERE m.id = match_id AND m.status = 'open'
    )
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- [F3] Score bounds — CHECK constraints on predictions table
-- Prevent absurd score submissions (e.g. 9999)
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE predictions
  ADD CONSTRAINT predictions_pred_home_bounds
    CHECK (pred_home BETWEEN 0 AND 20),
  ADD CONSTRAINT predictions_pred_away_bounds
    CHECK (pred_away BETWEEN 0 AND 20),
  ADD CONSTRAINT predictions_pred_home_penalty_bounds
    CHECK (pred_home_penalty IS NULL OR pred_home_penalty BETWEEN 0 AND 20),
  ADD CONSTRAINT predictions_pred_away_penalty_bounds
    CHECK (pred_away_penalty IS NULL OR pred_away_penalty BETWEEN 0 AND 20);

-- ─────────────────────────────────────────────────────────────────────────────
-- [ROLE ESCALATION] Prevent users from setting their own role via profiles update
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION prevent_role_self_escalation()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Non-admins cannot change their own role or is_approved fields
  IF NOT is_admin() AND auth.uid() = OLD.id THEN
    IF NEW.role IS DISTINCT FROM OLD.role THEN
      RAISE EXCEPTION 'permission denied: cannot change own role';
    END IF;
    IF NEW.is_approved IS DISTINCT FROM OLD.is_approved THEN
      RAISE EXCEPTION 'permission denied: cannot change own approval status';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_role_escalation ON profiles;
CREATE TRIGGER trg_prevent_role_escalation
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION prevent_role_self_escalation();

-- ─────────────────────────────────────────────────────────────────────────────
-- [S2] Audit trigger on matches — log score changes
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION audit_match_score_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Only log when score-relevant fields change
  IF (
    NEW.home_score IS DISTINCT FROM OLD.home_score OR
    NEW.away_score IS DISTINCT FROM OLD.away_score OR
    NEW.went_to_penalties IS DISTINCT FROM OLD.went_to_penalties OR
    NEW.home_penalty IS DISTINCT FROM OLD.home_penalty OR
    NEW.away_penalty IS DISTINCT FROM OLD.away_penalty OR
    NEW.status IS DISTINCT FROM OLD.status
  ) THEN
    INSERT INTO audit_logs (actor_id, action, target_table, target_id, old_data, new_data)
    VALUES (
      auth.uid(),
      'match_score_update',
      'matches',
      OLD.id,
      jsonb_build_object(
        'home_score', OLD.home_score,
        'away_score', OLD.away_score,
        'went_to_penalties', OLD.went_to_penalties,
        'home_penalty', OLD.home_penalty,
        'away_penalty', OLD.away_penalty,
        'status', OLD.status
      ),
      jsonb_build_object(
        'home_score', NEW.home_score,
        'away_score', NEW.away_score,
        'went_to_penalties', NEW.went_to_penalties,
        'home_penalty', NEW.home_penalty,
        'away_penalty', NEW.away_penalty,
        'status', NEW.status
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_match_score ON matches;
CREATE TRIGGER trg_audit_match_score
  AFTER UPDATE ON matches
  FOR EACH ROW EXECUTE FUNCTION audit_match_score_change();

-- ─────────────────────────────────────────────────────────────────────────────
-- [N2] FK constraint on predictions.pred_winner_team_id → teams.id
-- Already a REFERENCES in schema but adding explicit constraint name for clarity
-- ─────────────────────────────────────────────────────────────────────────────
-- Note: if the FK already exists from migration 1, this is a no-op safety check
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'predictions_pred_winner_team_id_fkey'
      AND table_name = 'predictions'
  ) THEN
    ALTER TABLE predictions
      ADD CONSTRAINT predictions_pred_winner_team_id_fkey
      FOREIGN KEY (pred_winner_team_id) REFERENCES teams(id);
  END IF;
END $$;
