import { useState } from 'react'
import { Link } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTrophy, faQuestion } from '@fortawesome/free-solid-svg-icons'
import { cn, getFlagUrl } from '@/lib/utils'
import { useKnockoutMatches } from '@/hooks/useKnockoutMatches'
import { useAuthContext } from '@/contexts/useAuthContext'
import type { Match, MatchStage } from '@/types/app'

// ──────────────────────────────────────────
// Stage ordering
// ──────────────────────────────────────────
const STAGE_ORDER: MatchStage[] = [
  'round_of_32',
  'round_of_16',
  'quarterfinal',
  'semifinal',
  'third_place',
  'final',
]

const STAGE_LABELS: Record<MatchStage, string> = {
  group: 'Group Stage',
  round_of_32: 'Round of 32',
  round_of_16: 'Round of 16',
  quarterfinal: 'Quarter-finals',
  semifinal: 'Semi-finals',
  third_place: '3rd Place',
  final: 'Final',
}

// ──────────────────────────────────────────
// TBD team placeholder
// ──────────────────────────────────────────
function TBDTeam({ label }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 text-[#4A6458]">
      <div className="w-8 h-8 rounded-lg bg-pitch-700 flex items-center justify-center flex-shrink-0">
        <FontAwesomeIcon icon={faQuestion} className="text-xs" />
      </div>
      <span className="font-heading text-sm">{label ?? 'TBD'}</span>
    </div>
  )
}

// ──────────────────────────────────────────
// Team display for bracket card
// ──────────────────────────────────────────
function BracketTeam({
  team,
  placeholder,
  isWinner,
}: {
  team: Match['teamA'] | null
  placeholder?: string
  isWinner: boolean
}) {
  if (!team) return <TBDTeam label={placeholder} />

  const flagUrl = getFlagUrl(team.countryCode ?? team.flagUrl ?? '', 'w40')

  return (
    <div className={cn('flex items-center gap-2', isWinner ? 'text-gold-400' : 'text-white')}>
      <div
        className={cn(
          'w-8 h-8 rounded-lg overflow-hidden border-2 flex-shrink-0',
          isWinner ? 'border-gold-500' : 'border-border/60',
        )}
      >
        <img
          src={team.flagUrl || flagUrl}
          alt={team.name}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>
      <span className={cn('font-heading text-sm', isWinner ? 'font-bold' : 'font-semibold')}>
        {team.shortName}
      </span>
    </div>
  )
}

// ──────────────────────────────────────────
// Bracket match card
// ──────────────────────────────────────────
function BracketCard({ match, isApproved }: { match: Match; isApproved: boolean }) {
  const hasScore = match.fullTimeScoreA !== undefined && match.fullTimeScoreB !== undefined
  const winnerA = match.winnerTeamId === match.teamA?.id
  const winnerB = match.winnerTeamId === match.teamB?.id

  return (
    <div className="elevated-card rounded-xl overflow-hidden">
      {/* Header: match number + time */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/60 bg-pitch-800/60">
        <span className="text-[10px] font-heading tracking-widest text-[#4A6458]">
          Match {match.matchNumber}
        </span>
        {!hasScore && (
          <span className="text-[10px] font-body text-[#4A6458]">{match.kickoffKuwait}</span>
        )}
        {hasScore && (
          <span className="text-[10px] font-heading text-[#8BA898]">
            {match.status === 'live' ? 'LIVE' : 'FT'}
          </span>
        )}
      </div>

      {/* Teams + score */}
      <div className="px-3 py-3 space-y-2">
        {/* Team A row */}
        <div className="flex items-center justify-between gap-2">
          <BracketTeam
            team={match.teamA ?? null}
            placeholder={match.teamAPlaceholder}
            isWinner={winnerA}
          />
          {hasScore && (
            <span
              className={cn('font-display text-xl', winnerA ? 'text-gold-400' : 'text-white/70')}
            >
              {match.fullTimeScoreA}
            </span>
          )}
        </div>

        {/* Divider */}
        <div className="h-px bg-border/40" />

        {/* Team B row */}
        <div className="flex items-center justify-between gap-2">
          <BracketTeam
            team={match.teamB ?? null}
            placeholder={match.teamBPlaceholder}
            isWinner={winnerB}
          />
          {hasScore && (
            <span
              className={cn('font-display text-xl', winnerB ? 'text-gold-400' : 'text-white/70')}
            >
              {match.fullTimeScoreB}
            </span>
          )}
        </div>

        {/* Penalty info */}
        {match.wentToPenalties &&
          match.penaltyScoreA !== undefined &&
          match.penaltyScoreB !== undefined && (
            <div className="text-[10px] text-center text-[#8BA898] font-body">
              Pens: {match.penaltyScoreA} – {match.penaltyScoreB}
            </div>
          )}
      </div>

      {/* Predict CTA */}
      {match.status === 'open' && isApproved && (
        <div className="px-3 pb-3">
          <Link
            to={`/predict/${match.id}`}
            className="btn-gold w-full flex items-center justify-center py-2 rounded-lg text-xs font-heading font-semibold"
          >
            Predict
          </Link>
        </div>
      )}
    </div>
  )
}

// ──────────────────────────────────────────
// Skeleton card
// ──────────────────────────────────────────
function SkeletonBracketCard() {
  return (
    <div className="elevated-card rounded-xl overflow-hidden">
      <div className="px-3 py-2 border-b border-border/60 bg-pitch-800/60">
        <div className="h-2.5 w-20 rounded bg-pitch-700 animate-pulse" />
      </div>
      <div className="px-3 py-3 space-y-3">
        {[0, 1].map((i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-pitch-700 animate-pulse" />
            <div className="h-3 w-24 rounded bg-pitch-700 animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  )
}

// ──────────────────────────────────────────
// Mini team box for the Final Four visual
// ──────────────────────────────────────────
function MiniBox({ match, side }: { match?: Match; side?: 'a' | 'b' }) {
  if (!match) {
    return (
      <div className="bg-pitch-800 border border-border/60 rounded-lg px-3 py-2 flex items-center gap-2 min-w-[120px]">
        <div className="w-6 h-6 rounded bg-pitch-700 flex items-center justify-center">
          <FontAwesomeIcon icon={faQuestion} className="text-[9px] text-[#4A6458]" />
        </div>
        <span className="font-heading text-xs text-[#4A6458]">TBD</span>
      </div>
    )
  }

  const team = side === 'b' ? match.teamB : match.teamA
  const placeholder = side === 'b' ? match.teamBPlaceholder : match.teamAPlaceholder
  const score = side === 'b' ? match.fullTimeScoreB : match.fullTimeScoreA
  const hasScore = match.fullTimeScoreA !== undefined
  const isWinner = team && match.winnerTeamId === team.id

  if (!team) {
    return (
      <div className="bg-pitch-800 border border-border/60 rounded-lg px-3 py-2 flex items-center gap-2 min-w-[120px]">
        <div className="w-6 h-6 rounded bg-pitch-700 flex items-center justify-center">
          <FontAwesomeIcon icon={faQuestion} className="text-[9px] text-[#4A6458]" />
        </div>
        <span className="font-heading text-xs text-[#4A6458]">{placeholder ?? 'TBD'}</span>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'bg-pitch-800 border rounded-lg px-3 py-2 flex items-center justify-between gap-3 min-w-[120px]',
        isWinner ? 'border-gold-500/60' : 'border-border/60',
      )}
    >
      <div className="flex items-center gap-2">
        <img
          src={team.flagUrl}
          alt={team.name}
          className="w-6 h-4 object-cover rounded-sm"
          loading="lazy"
        />
        <span
          className={cn(
            'font-heading text-xs',
            isWinner ? 'text-gold-400 font-bold' : 'text-white',
          )}
        >
          {team.shortName}
        </span>
      </div>
      {hasScore && (
        <span className={cn('font-display text-sm', isWinner ? 'text-gold-400' : 'text-white/60')}>
          {score}
        </span>
      )}
    </div>
  )
}

// ──────────────────────────────────────────
// Final 4 Visual Summary
// ──────────────────────────────────────────
function FinalFourSummary({ matches }: { matches: Partial<Record<MatchStage, Match[]>> }) {
  const semis = matches['semifinal'] ?? []
  const finals = matches['final'] ?? []
  const thirdPlace = matches['third_place'] ?? []

  const sf1 = semis[0]
  const sf2 = semis[1]
  const finalMatch = finals[0]
  const tp = thirdPlace[0]

  return (
    <div className="hidden lg:block mb-8">
      <div className="elevated-card rounded-2xl p-6">
        <h3 className="font-display text-lg text-gold-400 tracking-widest mb-6">FINAL FOUR</h3>

        <div className="flex items-start justify-center gap-0">
          {/* SF1 */}
          <div className="flex flex-col gap-2 items-end">
            <MiniBox match={sf1} side="a" />
            <MiniBox match={sf1} side="b" />
          </div>

          {/* Line to final */}
          <div className="flex flex-col items-center justify-center self-stretch px-4">
            <div className="w-6 h-px bg-gold-500/40" />
            <div className="h-10 w-px bg-gold-500/40" />
            <div className="w-6 h-px bg-gold-500/40" />
          </div>

          {/* Final + 3rd place */}
          <div className="flex flex-col items-center gap-4">
            {/* Final */}
            <div className="bg-pitch-700 border border-gold-500/30 rounded-xl px-4 py-3 text-center">
              <div className="font-display text-xs text-gold-400 tracking-widest mb-2">FINAL</div>
              <div className="flex flex-col gap-1.5">
                <MiniBox match={finalMatch} side="a" />
                <MiniBox match={finalMatch} side="b" />
              </div>
            </div>
            {/* 3rd place */}
            {tp && (
              <div className="bg-pitch-800 border border-border/60 rounded-xl px-3 py-2.5 text-center">
                <div className="font-heading text-[10px] text-[#4A6458] tracking-widest mb-1.5">
                  3RD PLACE
                </div>
                <div className="flex flex-col gap-1">
                  <MiniBox match={tp} side="a" />
                  <MiniBox match={tp} side="b" />
                </div>
              </div>
            )}
          </div>

          {/* Line from final */}
          <div className="flex flex-col items-center justify-center self-stretch px-4">
            <div className="w-6 h-px bg-gold-500/40" />
            <div className="h-10 w-px bg-gold-500/40" />
            <div className="w-6 h-px bg-gold-500/40" />
          </div>

          {/* SF2 */}
          <div className="flex flex-col gap-2 items-start">
            <MiniBox match={sf2} side="a" />
            <MiniBox match={sf2} side="b" />
          </div>
        </div>
      </div>
    </div>
  )
}

// ──────────────────────────────────────────
// Page
// ──────────────────────────────────────────
export function KnockoutBracketPage() {
  const { data, isLoading, error } = useKnockoutMatches()
  const { isApproved } = useAuthContext()

  const availableStages = STAGE_ORDER.filter((s) => data?.byStage[s]?.length)
  const [activeStage, setActiveStage] = useState<MatchStage | null>(null)

  const currentStage: MatchStage | null = activeStage ?? availableStages[0] ?? null
  const currentMatches = currentStage ? (data?.byStage[currentStage] ?? []) : []

  const showFinalFour =
    currentStage === 'semifinal' || currentStage === 'final' || currentStage === 'third_place'

  const isFinal = currentStage === 'final'

  return (
    <div className="min-h-screen bg-pitch-950 pb-16">
      {/* Page header */}
      <div className="px-4 pt-8 pb-6 bg-gold-glow">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-1">
            <FontAwesomeIcon icon={faTrophy} className="text-gold-400 text-2xl" />
            <h1 className="font-display text-4xl text-white tracking-widest">KNOCKOUT BRACKET</h1>
          </div>
          <p className="text-[#4A6458] font-body text-sm ml-10">World Cup 2026</p>
        </div>
      </div>

      {/* Round tabs */}
      <div className="sticky top-0 z-10 bg-pitch-900/95 backdrop-blur border-b border-border/60 shadow-card">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex gap-0 overflow-x-auto scrollbar-thin">
            {isLoading
              ? STAGE_ORDER.map((s) => (
                  <div
                    key={s}
                    className="flex-shrink-0 px-4 py-3 text-xs font-heading text-[#4A6458]"
                  >
                    {STAGE_LABELS[s]}
                  </div>
                ))
              : availableStages.map((s) => (
                  <button
                    key={s}
                    onClick={() => setActiveStage(s)}
                    className={cn(
                      'flex-shrink-0 px-4 py-3 text-xs font-heading font-semibold tracking-wide border-b-2 transition-colors whitespace-nowrap',
                      currentStage === s
                        ? 'border-gold-400 text-gold-400'
                        : 'border-transparent text-[#4A6458] hover:text-white',
                    )}
                  >
                    {STAGE_LABELS[s]}
                  </button>
                ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 pt-6">
        {error && (
          <div className="text-center py-12 text-red-400 font-body">
            Failed to load knockout matches.
          </div>
        )}

        {/* Final Four visual summary */}
        {!isLoading && showFinalFour && data && <FinalFourSummary matches={data.byStage} />}

        {/* Loading skeletons */}
        {isLoading && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <SkeletonBracketCard key={i} />
            ))}
          </div>
        )}

        {/* No matches for stage */}
        {!isLoading && !error && availableStages.length === 0 && (
          <div className="text-center py-20">
            <FontAwesomeIcon icon={faTrophy} className="text-4xl text-[#1A3024] mb-4" />
            <div className="font-display text-2xl text-[#4A6458] tracking-widest">
              DRAW NOT YET MADE
            </div>
            <p className="text-[#4A6458] font-body text-sm mt-2">
              Knockout matches will appear here after the group stage.
            </p>
          </div>
        )}

        {!isLoading && !error && currentMatches.length === 0 && availableStages.length > 0 && (
          <div className="text-center py-12 text-[#4A6458] font-body">
            No matches for this round yet.
          </div>
        )}

        {/* Match grid */}
        {!isLoading && currentMatches.length > 0 && (
          <div
            className={cn(
              'grid gap-4',
              isFinal
                ? 'grid-cols-1 max-w-sm mx-auto'
                : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
            )}
          >
            {currentMatches.map((match) => (
              <BracketCard key={match.id} match={match} isApproved={isApproved} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
