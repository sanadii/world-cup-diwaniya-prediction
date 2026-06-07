# Agent Task Board — World Cup Diwaniya Prediction

> Sprint 2 — Group Tables, Knockout Bracket, Scoring Engine, API-Football Sync

---

## Active Sprint — Sprint 2

| ID | Task | Agent | Status | Depends On | Notes |
|----|------|-------|--------|------------|-------|
| S2-01 | Audit existing code relevant to tables/bracket/scoring | research-agent | DONE | — | |
| S2-02 | DB: calculate_match_points function + leaderboard recalc | db-agent | READY | — | new migration file |
| S2-03 | Hook: useGroupStandings + useKnockoutMatches | backend-agent | PENDING | S2-02 | |
| S2-04 | Frontend: Group Tables page (/tables) | frontend-agent | PENDING | S2-03 | |
| S2-05 | Frontend: Knockout Bracket page (/bracket) | frontend-agent | PENDING | S2-03 | |
| S2-06 | Edge Function: calculate-scores (trigger scoring for a match) | backend-agent | PENDING | S2-02 | supabase/functions/ |
| S2-07 | Edge Function: sync-scores (API-Football score fetch + update) | backend-agent | PENDING | S2-02 | |
| S2-08 | Tests: scoring fn, group tables hook, bracket rendering | test-agent | PENDING | S2-04,S2-05,S2-06 | |

---

## Completed — Sprint 1

All 13 screens built, 75/75 tests passing, deployed to Vercel + GitHub.

---

## Agent Handoff Log

```
[2026-06-08] [research-agent] → DONE: Audited. No group/bracket hooks exist. matches table has stage+group_id. group_teams has standings cols. App.tsx has /tables and /bracket as placeholders. db-agent and backend-agent UNBLOCKED.
[2026-06-08] [db-agent] → DONE: Migration 005 — calculate_match_points(), recalculate_leaderboard(), update_group_standings() functions created. backend-agent UNBLOCKED.
```

---

## Current API Contract

### Sprint 2 Hooks (src/hooks/)
- `useGroupStandings(tournamentId?)` → `{ data: GroupStanding[], isLoading, error }`
- `useKnockoutMatches(tournamentId?)` → `{ data: Match[], isLoading, error }` (all non-group stages)

### Edge Functions (supabase/functions/)
- `calculate-scores/index.ts` — POST `{ match_id }` → calls `calculate_match_points(match_id)`
- `sync-scores/index.ts` — POST `{ match_id?, fixture_id? }` → fetches from API-Football, updates matches table

---

## Dependency Rules

```
research-agent → no dependencies
db-agent       → no dependencies
backend-agent  → waits for db-agent (S2-02)
frontend-agent → waits for backend-agent (S2-03)
test-agent     → waits for frontend + backend (S2-04, S2-05, S2-06)
```
