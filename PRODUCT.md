# Product — World Cup Diwaniya

## What It Is

A private prediction competition for family/friends during FIFA World Cup 2026. Users predict match scores before kick-off and earn points for correctness. A live leaderboard tracks rankings throughout the tournament.

## Who It's For

A closed group — invites only. No public registration. Admins approve accounts. Kuwait-based (all times in `Asia/Kuwait` / UTC+3, Arabic + English UI).

## Core User Flows

1. **Register** → submit email/name → wait for admin approval
2. **Dashboard** → see today/tomorrow matches + missing predictions + countdown to next match
3. **Predict** → open `MatchCard` → `PredictModal` (or `/predict/:matchId` full-page) → enter home/away scores → submit before kick-off
4. **Watch results** → after kick-off, all predictions visible; scores/points auto-calculated server-side
5. **Leaderboard** → view full rankings + top-3 podium + your own position + share card
6. **Tournament** → browse group tables, bracket, calendar with round tabs
7. **Admin** → enter match results → trigger scoring → manage users → send notifications

## Scoring (server-side only — frontend shows estimates)

| Rule | Points |
|---|---|
| Valid submission | +1 |
| Locked at kick-off | +1 |
| Correct outcome/winner | +2 |
| Exact full-time score | +2 |
| Predicted penalties (knockout) | +1 |
| Exact penalty score (knockout) | +1 |
| Stage bonus (group→final: 0,1,1,2,3,2,5) | varies |

Max per match: 6 (group), up to 13 (final with penalties).

Predictions lock at kick-off. `lock_offset_minutes` in `scoring_rules` table is configurable.

## What Was Intentionally Left Out

- Public registration / social login
- Live score ingestion (scores entered manually by admin)
- Push notifications (infrastructure exists via `notifications` table; sending is manual/admin)
- Match commenting / social features
- Historical tournaments (World Cup 2026 only)

## Known Limitations

- Scoring is triggered manually by admin after entering results — there is no auto-scoring on score entry
- No offline support / PWA install prompt (manifest exists but no service worker)
- Bracket view displays placeholder teams for unplayed knockout rounds — updates as results are entered

## Tech Stack

| Layer | Choice |
|---|---|
| Frontend | React 18 + TypeScript + Vite + Tailwind CSS v3 |
| Routing | React Router v6 |
| Data fetching | TanStack Query v5 |
| Backend | Supabase (Auth, Postgres, RLS, Edge Functions) |
| Deployment | Vercel (auto-deploy from `master`) |
| Testing | Vitest + Testing Library (110 tests) |
| i18n | react-i18next, English + Arabic RTL |

## Key Constraints

- `SUPABASE_SERVICE_ROLE_KEY` never exposed to client — anon key only
- All times stored UTC, displayed Kuwait Time
- Before kick-off: user sees only their own prediction; after kick-off: all visible
- No emoji in UI — FontAwesome icons only
- Admin mutations validated server-side via RLS `is_admin()` helper
