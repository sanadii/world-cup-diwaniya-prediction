# Design System — World Cup Diwaniya

## Direction

Dark premium sports app. Reference aesthetic: Sofascore — near-black surfaces, tight typography, high information density without clutter. Bold but clean. Gold as the single accent. Green only for live status.

## Palette

Three-level surface system. Green only in stadium radial glow + live indicators. Surface colors are neutral dark.

```
pitch-950  #0B0B0C   body background — near pure black
pitch-900  #1C2020   L1 card surfaces       (ΔL* +4.8 vs body)
pitch-800  #242929   L2 nested / inputs     (ΔL* +2.7 vs L1)
pitch-700  #2C3232   L3 hover / interactive (ΔL* +2.7 vs L2)
pitch-600  #363C3C   separators / active
pitch-500  #444C4C   highlights
pitch-400  #566262   border glows

border.DEFAULT  #363C3C  (neutral — hex for opacity modifier compatibility)
border.subtle   #262C2C
border.glow     #566262

Card surfaces use rgba(255,255,255,0.1) borders — always crisp white edges.

gold-400   #D4AF37   primary CTA, icons, accent
gold-300   #EDD06A   hover gold
gold-500   #C9A020   pressed gold

muted      #909A96   secondary text — WCAG AA 5.5:1 on pitch-900
secondary  #A8B2AE   tertiary / placeholder — WCAG AA 6.8:1 on pitch-900

live       #16A34A   live match indicator only
```

## Typography

| Role | Font | Usage |
|---|---|---|
| Display | Bebas Neue | Hero headlines, score numbers, countdown |
| Heading | Oswald | Section labels, nav, badges, buttons |
| Body | Outfit | Paragraph, metadata, form labels |
| Arabic | Almarai | All text when `lang=ar` |

No Inter, Roboto, Arial, or system-ui.

## Component Classes

```css
.elevated-card    /* standard card — dark green gradient, 1px border */
.glass-card       /* frosted-glass dropdown / modal surface */
.btn-gold         /* primary CTA — gold gradient + shimmer sweep on hover */
.badge-live       /* green pill — live match only */
.badge-open       /* blue pill — prediction window open */
.badge-locked     /* red pill — prediction locked */
.badge-finished   /* muted pill — match ended, not yet scored */
.badge-scored     /* gold pill — points assigned */
.live-dot         /* 8px pulsing green dot */
.text-gold-gradient /* shimmer gold text for hero display */
```

## Flags

All flag containers use `rounded-full` — circular crop. Source: FlagCDN `https://flagcdn.com/w80/{code}.png`.

## Icons

FontAwesome Free only. Never emoji in UI.

## Decisions Made

- **Circular flags**: All flag display switched from `rounded-xl` to `rounded-full` across MatchCard, MatchDetailPage, PredictModal, PredictionPage, LeaderboardPage. Matches Sofascore reference.
- **btn-gold shimmer**: CSS `::after` pseudo-element with `translateX` sweep on hover. No JS required.
- **Modal backgrounds**: PredictModal uses `bg-pitch-900` — matches palette. Previous `bg-[#0f1420]` was off-brand cold blue.
- **WCAG contrast**: `text-muted` (`#7A9088`) replaces all `text-[#4A6458]` instances. Ratio 5.6:1 on pitch-900.
- **CountdownTimer**: Green gradient boxes replaced with `rgba(20,26,23,0.95)` + gold border. Gold is urgency, not green.
- **Leaderboard banner**: Gradient overlay + Bebas Neue title rendered on top. Previously a raw image slot.
- **Body glow**: Radial gradient at 0.11 opacity, 120% spread — perceptible depth without bleed.
- **Navbar logo**: `w-9 h-9`, `text-sm` trophy icon, gold box-shadow `0 0 14px rgba(212,175,55,0.18)`. Subtitle `text-[10px]` at full `text-gold-400`.

## RTL

When `i18n.language === 'ar'`, the app switches to Almarai font and RTL layout. Use logical CSS properties (`ms-`, `me-`, `ps-`, `pe-`, `start-`, `end-`) throughout.
