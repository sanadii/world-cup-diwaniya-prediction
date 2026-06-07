# World Cup Diwaniya Prediction

A family/friends FIFA World Cup 2026 prediction app. Private competition, Kuwait Time, Diwaniya spirit.

## Stack

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Backend**: Supabase (Auth, Postgres, RLS, Edge Functions, Storage)
- **Routing**: React Router v6
- **Data fetching**: TanStack Query v5
- **Icons**: FontAwesome (never use emoji in UI)
- **Flags**: FlagCDN (`https://flagcdn.com/w80/{countryCode}.png`)
- **Fonts**: Bebas Neue (display), Oswald (headings), Outfit (body)
- **Deployment**: Vercel (auto-deploy from GitHub `master`)

## Project Structure

```
src/
  app/          # Router, providers
  components/   # Shared UI: layout/, match-card/, leaderboard/
  features/     # Screen-level: dashboard/, auth/, predictions/, matches/, leaderboard/, admin/
  lib/          # supabase.ts, utils.ts, mockData.ts
  types/        # app.ts (all shared TypeScript types)
  vite-env.d.ts
```

## Key Rules

- **All times stored in UTC, displayed in Kuwait Time** (`Asia/Kuwait` / UTC+3)
- **Predictions lock at kick-off** (configurable `lock_offset_minutes` in scoring_rules)
- **Before kick-off**: user sees only their own prediction. After kick-off: all predictions visible
- **Scoring is calculated server-side** (Supabase Edge Function or DB function) — frontend shows estimates only
- **Never expose `SUPABASE_SERVICE_ROLE_KEY` to the client** — only `VITE_SUPABASE_ANON_KEY`
- **No emojis in UI** — use FontAwesome icons instead
- **No `Inter`, `Roboto`, `Arial`, `system-ui`** — use the project fonts above

## Database Tables

`profiles`, `teams`, `matches`, `predictions`, `prediction_scores`, `scoring_rules`, `leaderboard_snapshots`, `sync_sources`, `sync_logs`, `assets`, `admin_actions`, `app_settings`, `notifications`

RLS is enabled on all tables. Use `is_approved()` and `is_admin()` helper functions.

## Scoring System (default)

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

## Supabase Project

- **URL**: https://iklkvvmdbyjnukrlyzqj.supabase.co
- **Dashboard**: https://supabase.com/dashboard/project/iklkvvmdbyjnukrlyzqj
- **Region**: EU Central (Frankfurt)

## Vercel

- **Dashboard**: https://vercel.com/sanad-general/world-cup-predictions
- **Production URL**: https://world-cup-predictions-9kscvm580-sanad-general.vercel.app
- **Auto-deploys**: master branch → production

## Environment Variables

See `.env.example`. Copy to `.env.local` for local development.

## Commands

```bash
npm run dev        # Start dev server
npm run build      # Production build (tsc + vite build)
npm run preview    # Preview production build
npm run lint       # ESLint
npm run format     # Prettier
npm run test       # Vitest
npm run test:ui    # Vitest UI
npm run typecheck  # tsc --noEmit
```

## Coding Conventions

- Feature files live in `src/features/{feature}/`
- Shared components in `src/components/`
- All Supabase queries go through TanStack Query hooks in `src/features/{feature}/hooks/`
- Use `cn()` from `src/lib/utils.ts` for conditional classNames
- Match status badge classes: `badge-live`, `badge-open`, `badge-locked`, `badge-finished`, `badge-scored`
- Card classes: `elevated-card`, `glass-card`
- Gold CTA button: `btn-gold`
