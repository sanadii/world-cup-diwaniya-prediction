# Agent Task Board — World Cup Diwaniya Prediction

> Shared state file. All agents READ this before starting. Orchestrator WRITES it.
> Status values: `PENDING` | `READY` | `IN_PROGRESS` | `DONE` | `BLOCKED` | `FAILED`

---

## Active Sprint — MVP Full Build

| ID | Task | Agent | Status | Depends On | Notes |
|----|------|-------|--------|------------|-------|
| T01 | Create supabase/ dir + all 13 table migrations + RLS | db-agent | DONE | — | migrations in supabase/migrations/ |
| T02 | Security review: Auth + predictions + admin data flow | sec-lead | DONE | — | verdict: SHIP WITH FIXES |
| T03 | Create src/hooks/ — all data hooks (auth, matches, predictions, leaderboard, admin) | backend-agent | DONE | T01 | |
| T04 | Extract scoring logic to src/lib/scoring.ts | backend-agent | DONE | — | from scoring.test.ts |
| T05 | Auth screens — Login, Register, ForgotPassword pages | frontend-agent | DONE | T03 | |
| T06 | Auth context + protected routes + ProtectedRoute guard | frontend-agent | DONE | T03 | |
| T07 | Prediction Page — submit/edit prediction for a match | frontend-agent | DONE | T03 | |
| T08 | Match Calendar page — full schedule, filters, status badges | frontend-agent | DONE | T03 | |
| T09 | Full Leaderboard page — rankings, tie-breaker display | frontend-agent | DONE | T03 | |
| T10 | User Profile page — stats, badges, prediction history | frontend-agent | DONE | T03 | |
| T11 | Admin Panel — user approval, match scores, scoring trigger | frontend-agent | DONE | T03 | |
| T12 | Connect Dashboard to real Supabase data (replace mock) | frontend-agent | DONE | T03 | |
| T13 | Write tests for scoring, hooks, auth, prediction page | test-agent | DONE | T04,T05,T06,T07 | |

---

## Completed Tasks

| ID | Task | Agent | Finished |
|----|------|-------|---------|
| R01 | Full codebase audit | research-agent | 2026-06-07 |

---

## Agent Handoff Log

```
[2026-06-07] [research-agent] → DONE: Full audit complete. No supabase/ dir, no hooks/, 7 placeholder routes, all TS clean, 7 tests passing. db-agent and sec-lead UNBLOCKED.
[2026-06-07] [db-agent] → DONE: Created supabase/ structure + 3 migration files covering all 13 tables, RLS, helpers, triggers, seed data. backend-agent UNBLOCKED.
[2026-06-07] [sec-lead] → DONE: Security verdict SHIP WITH FIXES. 3 must-fix items folded into backend-agent and frontend-agent tasks.
[2026-06-07] [backend-agent] → DONE: Created src/hooks/ with 8 hook files + src/lib/scoring.ts. All frontend agents UNBLOCKED.
[2026-06-07] [frontend-agent] → DONE: Auth screens, protected routes, auth context complete.
[2026-06-07] [frontend-agent] → DONE: Prediction page, Match Calendar, Leaderboard, Profile, Admin Panel, Dashboard real-data wired.
[2026-06-07] [test-agent] → DONE: Tests written and passing for scoring, auth, prediction page.
```

---

## Current API Contract

### Hooks (src/hooks/)
- `useAuth()` → `{ user, profile, isAdmin, isApproved, isLoading, signIn, signUp, signOut }`
- `useMatches(filters?)` → `{ data: Match[], isLoading, error }`
- `useMatch(id)` → `{ data: Match, isLoading, error }`
- `usePredictions(matchId?)` → `{ data: Prediction[], isLoading, error }`
- `useMyPrediction(matchId)` → `{ data: Prediction | null, isLoading }`
- `useSavePrediction()` → mutation `{ mutate, isLoading, error }`
- `useLeaderboard(tournamentId?)` → `{ data: LeaderboardEntry[], isLoading }`
- `useUserStats(userId?)` → `{ data: UserStats, isLoading }`
- `useAdminUsers()` → `{ data: Profile[], isLoading }` (admin only)
- `useApproveUser()` → mutation
- `useUpdateMatchScore()` → mutation (admin only)
- `useTriggerScoring()` → mutation (admin only)

### Query Keys
- `['matches', filters]`, `['match', id]`
- `['predictions', matchId]`, `['my-prediction', matchId]`
- `['leaderboard', tournamentId]`
- `['user-stats', userId]`
- `['admin-users']`

---

## Current Schema Snapshot

Tables: profiles, tournaments, teams, groups, group_teams, matches, predictions,
        leaderboard_entries, scoring_configs, badges, user_badges, audit_logs, app_settings

Key:
- profiles: id (→ auth.users), display_name, flag_code, role, is_approved, invite_code
- matches: id, tournament_id, home_team_id, away_team_id, stage, group_id,
           scheduled_at (UTC), status, home_score, away_score, went_to_penalties,
           home_penalty, away_penalty, winner_team_id, locked_at
- predictions: id, user_id, match_id, pred_home, pred_away, pred_winner_team_id,
               pred_penalties, pred_home_penalty, pred_away_penalty,
               is_submitted, is_locked, points_awarded, submitted_at, locked_at
- leaderboard_entries: user_id, tournament_id, total_points, rank, matches_predicted,
                       exact_scores, correct_outcomes
- scoring_configs: version, rules (jsonb), is_active

Migration files:
- supabase/migrations/20260607_000001_initial_schema.sql
- supabase/migrations/20260607_000002_rls_policies.sql
- supabase/migrations/20260607_000003_functions_triggers_seed.sql

---

## Dependency Rules (always apply)

### Development Squad
```
research-agent → no dependencies (read-only, runs anytime)
db-agent       → no dependencies (runs first for schema work)
backend-agent  → waits for db-agent IF schema is new/changed
frontend-agent → waits for backend-agent IF it needs API contract
test-agent     → waits for frontend-agent OR backend-agent (whoever it tests)
orchestrator   → assigns tasks, never implements code directly
```

### Security Squad (always invoked via sec-lead)
```
sec-risk-analyst   → no dependencies (runs immediately when security review starts)
sec-best-practices → no dependencies (runs immediately when security review starts)
sec-use-cases      → no dependencies (runs immediately when security review starts)
sec-devil-advocate → waits for sec-risk-analyst + sec-best-practices + sec-use-cases
sec-lead           → waits for ALL FOUR panel agents before synthesizing verdict
```

### Cross-Squad
```
Security review (sec-lead) → should complete BEFORE db-agent/backend-agent/frontend-agent
Dev agents (with fixes)    → pick up sec-lead's "MUST FIX" tasks after verdict is issued
```
