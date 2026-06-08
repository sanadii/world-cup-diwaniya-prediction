# Agent Task Board — Sprint 3: Schema Reconciliation + V2 Polish

---

## Active Sprint

| ID | Task | Agent | Status | Depends On | Notes |
|----|------|-------|--------|------------|-------|
| S3-01 | DB: add flag_code to profiles + fix is_approved() helper | db-agent | READY | — | migration 006 |
| S3-02 | Update src/types/app.ts to match live schema exactly | backend-agent | READY | — | no DB dep |
| S3-03 | Rewrite ALL hooks to use live column names | backend-agent | PENDING | S3-02 | critical |
| S3-04 | Fix frontend files referencing old field names | frontend-agent | PENDING | S3-03 | |
| S3-05 | Notifications hook + bell UI in Navbar | frontend-agent | PENDING | S3-03 | notifications table exists |
| S3-06 | Update tests to match new field names | test-agent | PENDING | S3-03,S3-04 | |

---

## Live Schema (source of truth)

### profiles
id, email, full_name, display_name, avatar_url, favorite_team_id,
role ('user'/'admin'/'super_admin'), approval_status ('pending'/'approved'),
is_active, created_at, updated_at
+ flag_code (to be added by db-agent migration 006)

### matches
id, match_number, external_provider, external_match_id,
stage, group_name, team_a_id, team_b_id, team_a_placeholder, team_b_placeholder,
kickoff_at_utc, venue, city, country, status,
full_time_score_a, full_time_score_b, went_to_penalties,
penalty_score_a, penalty_score_b, winner_team_id,
manual_override, manual_override_reason, provider_payload,
last_synced_at, created_at, updated_at

### predictions
id, user_id, match_id,
predicted_score_a, predicted_score_b, predicted_outcome,
predicted_winner_team_id, predicts_penalties,
predicted_penalty_score_a, predicted_penalty_score_b,
first_submitted_at, last_updated_at, locked_at,
is_locked, is_valid, created_at, updated_at
NOTE: no is_submitted column — use (first_submitted_at IS NOT NULL)
NOTE: no points_awarded — points are in prediction_scores table

### prediction_scores
id, prediction_id, match_id, user_id, scoring_rule_version,
valid_submission_points, locked_at_kickoff_points, correct_outcome_points,
exact_score_points, penalty_prediction_points, exact_penalty_score_points,
stage_bonus_points, total_points, is_exact_score, is_correct_outcome,
final_match_points, breakdown (jsonb), calculated_at

### leaderboard_snapshots (was leaderboard_entries)
id, user_id, total_points, exact_scores_count, correct_outcomes_count,
final_match_points, submissions_count, submission_time_sum,
today_points, rank, snapshot_at

### scoring_rules (was scoring_configs)
id, version, name, is_active, config (jsonb), created_by, created_at, activated_at

### notifications
id, user_id, type, title, body, is_read, data (jsonb), created_at

### teams
id, name, short_name, fifa_code, country_code, flag_url,
group_name, primary_color, secondary_color, created_at, updated_at

### admin_actions (was audit_logs)
id, admin_user_id, action_type, entity_type, entity_id,
old_value, new_value, reason, created_at

---

## Handoff Log
```
[2026-06-08] [orchestrator] → Sprint 3 started. Live schema audited. All agents briefed.
```
