import { Link } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTrophy, faShield } from '@fortawesome/free-solid-svg-icons'
import { cn } from '@/lib/utils'
import { useKnockoutMatches } from '@/hooks/useKnockoutMatches'
import { useAuthContext } from '@/contexts/useAuthContext'
import type { Match } from '@/types/app'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function kwt(utc: string): string {
  const d = new Date(utc)
  return (
    d.toLocaleDateString('en-US', { timeZone: 'Asia/Kuwait', month: 'short', day: 'numeric' }) +
    ' · ' +
    d.toLocaleTimeString('en-US', {
      timeZone: 'Asia/Kuwait',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  )
}

// ─── Flag image with fallback ─────────────────────────────────────────────────

function TeamFlag({ flagUrl, name }: { flagUrl: string | null; name: string }) {
  if (!flagUrl)
    return (
      <div className="w-6 h-4 rounded-sm bg-pitch-700 flex items-center justify-center flex-shrink-0">
        <FontAwesomeIcon icon={faShield} className="text-[8px] text-[#4A6458]" />
      </div>
    )
  return (
    <img
      src={flagUrl}
      alt={name}
      className="w-6 h-4 object-cover rounded-sm flex-shrink-0 border border-border/30"
      loading="lazy"
    />
  )
}

// ─── Bracket match card ───────────────────────────────────────────────────────

const CARD_H = 88 // px — fixed height per card
const CARD_W = 176 // px

function BracketCard({ match, isApproved }: { match: Match | null; isApproved: boolean }) {
  if (!match) {
    return (
      <div
        style={{ width: CARD_W, minHeight: CARD_H }}
        className="elevated-card rounded-xl border border-dashed border-border/40 flex items-center justify-center"
      >
        <span className="text-[10px] text-[#4A6458] font-heading">TBD</span>
      </div>
    )
  }

  const teamA = match.teamA
  const teamB = match.teamB
  const nameA = teamA?.shortName ?? teamA?.name ?? 'TBD'
  const nameB = teamB?.shortName ?? teamB?.name ?? 'TBD'
  const hasScore =
    match.fullTimeScoreA !== null &&
    match.fullTimeScoreA !== undefined &&
    match.fullTimeScoreB !== null &&
    match.fullTimeScoreB !== undefined
  const winnerA = hasScore && match.winnerTeamId === teamA?.id
  const winnerB = hasScore && match.winnerTeamId === teamB?.id
  const isLive = match.status === 'live'
  const canPredict = match.status === 'open' && isApproved

  return (
    <Link
      to={`/matches/${match.id}`}
      style={{ width: CARD_W, minHeight: CARD_H }}
      className={cn(
        'elevated-card rounded-xl overflow-hidden flex flex-col hover:border-gold-400/30 transition-all',
        isLive && 'ring-1 ring-live/40',
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-border/50 bg-pitch-800/40">
        <span className="text-[9px] font-heading text-[#4A6458] tracking-wider">
          M{match.matchNumber}
        </span>
        <span className="text-[9px] font-body text-[#4A6458]">{kwt(match.kickoffUtc)}</span>
      </div>

      {/* Team A */}
      <div
        className={cn(
          'flex items-center justify-between gap-2 px-2.5 py-1.5',
          winnerA && 'bg-gold-500/5',
        )}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <TeamFlag flagUrl={teamA?.flagUrl ?? null} name={nameA} />
          <span
            className={cn(
              'font-heading text-xs truncate',
              winnerA ? 'text-gold-400 font-bold' : 'text-white',
              !teamA && 'text-[#4A6458]',
            )}
          >
            {nameA}
          </span>
        </div>
        {hasScore && (
          <span
            className={cn(
              'font-display text-base flex-shrink-0',
              winnerA ? 'text-gold-400' : 'text-white/60',
            )}
          >
            {match.fullTimeScoreA}
          </span>
        )}
      </div>

      {/* Divider */}
      <div className="h-px bg-border/30 mx-2.5" />

      {/* Team B */}
      <div
        className={cn(
          'flex items-center justify-between gap-2 px-2.5 py-1.5',
          winnerB && 'bg-gold-500/5',
        )}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <TeamFlag flagUrl={teamB?.flagUrl ?? null} name={nameB} />
          <span
            className={cn(
              'font-heading text-xs truncate',
              winnerB ? 'text-gold-400 font-bold' : 'text-white',
              !teamB && 'text-[#4A6458]',
            )}
          >
            {nameB}
          </span>
        </div>
        {hasScore && (
          <span
            className={cn(
              'font-display text-base flex-shrink-0',
              winnerB ? 'text-gold-400' : 'text-white/60',
            )}
          >
            {match.fullTimeScoreB}
          </span>
        )}
      </div>

      {/* Predict pill */}
      {canPredict && (
        <div className="px-2.5 pb-1.5 mt-auto">
          <div className="w-full text-center py-0.5 rounded-md bg-gold-500/15 border border-gold-500/30 text-[9px] font-heading text-gold-400 tracking-wider">
            PREDICT
          </div>
        </div>
      )}
    </Link>
  )
}

// ─── Bracket column ───────────────────────────────────────────────────────────

const GAP = 8 // px between cards

// Given the column depth (0=R32, 1=R16, 2=QF, 3=SF, 4=Final),
// each "slot" occupies 2^depth * (CARD_H + GAP) - GAP pixels.
function slotHeight(depth: number): number {
  return Math.pow(2, depth) * (CARD_H + GAP) - GAP
}

function BracketColumn({
  label,
  matches,
  depth,
  isApproved,
}: {
  label: string
  matches: (Match | null)[]
  depth: number
  isApproved: boolean
}) {
  const sh = slotHeight(depth)
  const totalH = matches.length * (sh + GAP) - GAP

  return (
    <div className="flex flex-col flex-shrink-0" style={{ width: CARD_W }}>
      {/* Column header */}
      <div className="text-center mb-4">
        <span className="text-[10px] font-heading font-semibold uppercase tracking-[0.15em] text-[#8BA898] whitespace-nowrap">
          {label}
        </span>
      </div>

      {/* Cards */}
      <div className="relative" style={{ height: totalH }}>
        {matches.map((match, i) => {
          const top = i * (sh + GAP) + (sh - CARD_H) / 2
          return (
            <div key={match?.id ?? `empty-${i}`} className="absolute" style={{ top, left: 0 }}>
              <BracketCard match={match} isApproved={isApproved} />
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Connector lines ──────────────────────────────────────────────────────────

function Connectors({
  fromCount,
  depth,
}: {
  fromCount: number // number of matches in the SOURCE column
  depth: number // depth of SOURCE column (0=R32, 1=R16, …)
}) {
  const sh = slotHeight(depth)
  const sh2 = slotHeight(depth + 1)
  const totalH = fromCount * (sh + GAP) - GAP

  // Each pair of source cards connects to one next-round card
  const pairs = Math.ceil(fromCount / 2)

  return (
    <div className="relative flex-shrink-0" style={{ width: 24, height: totalH + 25 }}>
      {Array.from({ length: pairs }).map((_, pi) => {
        const topA = pi * 2 * (sh + GAP) + (sh - CARD_H) / 2 + CARD_H / 2
        const topB = pi * 2 * (sh + GAP) + (sh + GAP) + (sh - CARD_H) / 2 + CARD_H / 2
        const mid = (topA + topB) / 2
        const targetCenter = pi * (sh2 + GAP) + (sh2 - CARD_H) / 2 + CARD_H / 2

        return (
          <svg
            key={pi}
            className="absolute inset-0 overflow-visible"
            style={{ top: 0, left: 0, width: 24, height: totalH }}
          >
            {/* Line from A card right edge going right then to mid */}
            <path
              d={`M 0 ${topA} L 12 ${topA} L 12 ${mid}`}
              fill="none"
              stroke="#4A6458"
              strokeWidth="1"
              opacity="0.5"
            />
            {/* Line from B card right edge going right then to mid */}
            <path
              d={`M 0 ${topB} L 12 ${topB} L 12 ${mid}`}
              fill="none"
              stroke="#4A6458"
              strokeWidth="1"
              opacity="0.5"
            />
            {/* Line from mid to target */}
            <path
              d={`M 12 ${mid} L 24 ${targetCenter}`}
              fill="none"
              stroke="#4A6458"
              strokeWidth="1"
              opacity="0.5"
            />
          </svg>
        )
      })}
    </div>
  )
}

// ─── Third place sidebar ──────────────────────────────────────────────────────

function ThirdPlaceCard({ match, isApproved }: { match: Match | null; isApproved: boolean }) {
  return (
    <div className="flex-shrink-0">
      <div className="text-center mb-4">
        <span className="text-[10px] font-heading font-semibold uppercase tracking-[0.15em] text-[#4A6458] whitespace-nowrap">
          3rd Place
        </span>
      </div>
      <BracketCard match={match} isApproved={isApproved} />
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const ROUND_META = [
  { stage: 'round_of_32' as const, label: 'Round of 32', depth: 0 },
  { stage: 'round_of_16' as const, label: 'Round of 16', depth: 1 },
  { stage: 'quarterfinal' as const, label: 'Quarter-finals', depth: 2 },
  { stage: 'semifinal' as const, label: 'Semi-finals', depth: 3 },
  { stage: 'final' as const, label: 'Final', depth: 4 },
]

export function KnockoutBracketPage() {
  const { data, isLoading, error } = useKnockoutMatches()
  const { isApproved } = useAuthContext()

  const byStage = data?.byStage ?? {}

  // Pad each stage's array to the expected count with nulls
  const rounds = ROUND_META.map((meta) => ({
    ...meta,
    matches: (byStage[meta.stage] ?? []) as (Match | null)[],
  }))

  // Third place
  const thirdPlaceMatches = (byStage['third_place'] ?? []) as (Match | null)[]
  const thirdPlace = thirdPlaceMatches[0] ?? null

  const hasAnyData = rounds.some((r) => r.matches.length > 0)

  return (
    <div className="min-h-screen bg-pitch-950 pb-16">
      {/* Page header */}
      <div className="px-4 pt-8 pb-4">
        <div className="max-w-full mx-auto px-0">
          <div className="flex items-center gap-3 mb-1">
            <FontAwesomeIcon icon={faTrophy} className="text-gold-400 text-2xl" />
            <h1 className="font-display text-4xl text-white tracking-widest">KNOCKOUT</h1>
          </div>
          <p className="text-[#4A6458] font-body text-sm ml-10">
            World Cup 2026 · Scroll right to see full bracket
          </p>
        </div>
      </div>

      {error && (
        <div className="px-4 py-8 text-center text-red-400 font-body">Failed to load bracket.</div>
      )}

      {isLoading && (
        <div className="px-4 flex gap-6 overflow-x-auto pb-8">
          {ROUND_META.map((meta) => (
            <div key={meta.stage} className="flex-shrink-0" style={{ width: CARD_W }}>
              <div className="text-center mb-4">
                <span className="text-[10px] font-heading text-[#4A6458] uppercase tracking-widest">
                  {meta.label}
                </span>
              </div>
              {[...Array(Math.pow(2, 4 - meta.depth))].map((_, i) => (
                <div
                  key={i}
                  className="elevated-card rounded-xl animate-pulse mb-2"
                  style={{ height: CARD_H, width: CARD_W }}
                />
              ))}
            </div>
          ))}
        </div>
      )}

      {!isLoading && !error && !hasAnyData && (
        <div className="flex flex-col items-center py-12 px-4">
          <img
            src="/bracket-empty.svg"
            alt="Bracket not yet available"
            className="w-full max-w-2xl opacity-90"
          />
        </div>
      )}

      {!isLoading && !error && hasAnyData && (
        <div className="overflow-x-auto pb-8">
          <div
            className="px-4 inline-flex gap-0 items-start pt-2"
            style={{ minWidth: 'max-content' }}
          >
            {rounds.map((round, idx) => (
              <div key={round.stage} className="inline-flex items-start gap-0">
                <BracketColumn
                  label={round.label}
                  matches={round.matches}
                  depth={round.depth}
                  isApproved={isApproved}
                />
                {idx < rounds.length - 1 && round.matches.length > 0 && (
                  <Connectors fromCount={round.matches.length} depth={round.depth} />
                )}
              </div>
            ))}

            {/* Third place — shown below the SF column vertically */}
            {thirdPlace && (
              <div className="ml-8 mt-auto self-end pb-4">
                <ThirdPlaceCard match={thirdPlace} isApproved={isApproved} />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
