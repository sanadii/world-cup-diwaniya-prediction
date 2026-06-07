import { useState, useMemo } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faCalendarXmark,
  faChevronLeft,
  faChevronRight,
  faCheckCircle,
} from '@fortawesome/free-solid-svg-icons'
import { cn, formatKuwaitTime } from '@/lib/utils'
import { useMatches } from '@/hooks/useMatches'
import { useMyPrediction } from '@/hooks/usePredictions'
import { useAuthContext } from '@/contexts/useAuthContext'
import { MatchCard } from '@/components/match-card/MatchCard'
import type { Match, MatchStage, MatchStatus } from '@/types/app'

// ─── Filter types ─────────────────────────────────────────────────────────────

type StageFilter = 'all' | MatchStage
type StatusFilter = 'all' | MatchStatus

const STAGE_OPTIONS: { label: string; value: StageFilter }[] = [
  { label: 'All', value: 'all' },
  { label: 'Group Stage', value: 'group' },
  { label: 'Round of 32', value: 'round_of_32' },
  { label: 'Round of 16', value: 'round_of_16' },
  { label: 'Quarterfinals', value: 'quarterfinal' },
  { label: 'Semifinals', value: 'semifinal' },
  { label: 'Final', value: 'final' },
]

const STATUS_OPTIONS: { label: string; value: StatusFilter }[] = [
  { label: 'All', value: 'all' },
  { label: 'Open', value: 'open' },
  { label: 'Live', value: 'live' },
  { label: 'Finished', value: 'finished' },
]

// ─── Filter pills ─────────────────────────────────────────────────────────────

function FilterPill({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'px-3 py-1.5 rounded-full text-xs font-heading font-semibold uppercase tracking-wider whitespace-nowrap transition-all',
        active
          ? 'bg-gold-500 text-pitch-950 shadow-gold-sm'
          : 'bg-pitch-800 border border-border text-[#8BA898] hover:border-border-glow hover:text-white',
      )}
    >
      {label}
    </button>
  )
}

// ─── Date navigator ───────────────────────────────────────────────────────────

function DateNavigator({
  date,
  onPrev,
  onNext,
  onClear,
}: {
  date: string | null
  onPrev: () => void
  onNext: () => void
  onClear: () => void
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={onPrev}
        className="w-8 h-8 rounded-full bg-pitch-800 border border-border flex items-center justify-center text-[#8BA898] hover:text-white hover:border-border-glow transition-all"
      >
        <FontAwesomeIcon icon={faChevronLeft} className="text-xs" />
      </button>
      <button
        onClick={onClear}
        className={cn(
          'px-3 py-1.5 rounded-full text-xs font-heading font-semibold tracking-wider transition-all border',
          date
            ? 'border-gold-500/50 text-gold-400 bg-gold-500/10'
            : 'border-border text-[#4A6458] bg-pitch-800',
        )}
      >
        {date ? formatKuwaitTime(`${date}T12:00:00Z`, 'date') : 'All Dates'}
      </button>
      <button
        onClick={onNext}
        className="w-8 h-8 rounded-full bg-pitch-800 border border-border flex items-center justify-center text-[#8BA898] hover:text-white hover:border-border-glow transition-all"
      >
        <FontAwesomeIcon icon={faChevronRight} className="text-xs" />
      </button>
    </div>
  )
}

// ─── Date group header ────────────────────────────────────────────────────────

function DateGroupHeader({ dateKey }: { dateKey: string }) {
  const label = formatKuwaitTime(`${dateKey}T12:00:00Z`, 'date').toUpperCase()
  return (
    <div className="flex items-center gap-3 py-2">
      <span className="font-heading text-sm font-semibold tracking-widest text-[#8BA898]">
        {label}
      </span>
      <div className="flex-1 h-px bg-gold-500/20" />
    </div>
  )
}

// ─── Match card wrapper with prediction badge ─────────────────────────────────

function CalendarMatchCard({ match }: { match: Match }) {
  const { data: prediction } = useMyPrediction(match.id)
  const hasPrediction = !!prediction

  return (
    <div className="relative">
      <MatchCard match={match} prediction={prediction ?? undefined} showPredictButton />
      {hasPrediction && (
        <div className="absolute top-3 right-3 flex items-center gap-1 bg-gold-500/20 border border-gold-500/40 rounded-full px-2 py-0.5 pointer-events-none">
          <FontAwesomeIcon icon={faCheckCircle} className="text-gold-400 text-[9px]" />
          <span className="text-[9px] font-heading font-semibold text-gold-400 uppercase tracking-wider">
            Predicted
          </span>
        </div>
      )}
    </div>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
      <div className="w-16 h-16 rounded-full bg-pitch-800 border border-border flex items-center justify-center">
        <FontAwesomeIcon icon={faCalendarXmark} className="text-[#4A6458] text-2xl" />
      </div>
      <div className="font-display text-2xl text-white tracking-wider">No Matches Found</div>
      <p className="text-sm text-[#4A6458] font-body max-w-xs">
        Try adjusting your filters or date to see more matches.
      </p>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function MatchCalendarPage() {
  useAuthContext() // ensure auth context is available

  const [stageFilter, setStageFilter] = useState<StageFilter>('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [dateFilter, setDateFilter] = useState<string | null>(null)

  const matchFilters = useMemo(
    () => ({
      ...(stageFilter !== 'all' && { stage: stageFilter as MatchStage }),
      ...(statusFilter !== 'all' && { status: statusFilter as MatchStatus }),
      ...(dateFilter && { date: dateFilter }),
    }),
    [stageFilter, statusFilter, dateFilter],
  )

  const { data: matches = [], isLoading } = useMatches(matchFilters)

  // Group matches by Kuwait date
  const grouped = useMemo(() => {
    const map = new Map<string, Match[]>()
    for (const match of matches) {
      const date = new Date(match.kickoffUtc)
      const kuwaitOffset = 3 * 60
      const localOffset = date.getTimezoneOffset()
      const kuwait = new Date(date.getTime() + (kuwaitOffset + localOffset) * 60000)
      const key = kuwait.toISOString().slice(0, 10)
      if (!map.has(key)) map.set(key, [])
      // Live matches first in group
      const group = map.get(key)!
      if (match.status === 'live') {
        group.unshift(match)
      } else {
        group.push(match)
      }
    }
    // Sort keys
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b))
  }, [matches])

  function shiftDate(direction: 1 | -1) {
    const base = dateFilter ?? new Date().toISOString().slice(0, 10)
    const d = new Date(`${base}T12:00:00Z`)
    d.setDate(d.getDate() + direction)
    setDateFilter(d.toISOString().slice(0, 10))
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-5 animate-fade-in">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="font-display text-5xl text-white tracking-wider">MATCH CALENDAR</h1>
        <p className="text-[#4A6458] font-body text-sm">World Cup 2026</p>
      </div>

      {/* Filter bar */}
      <div className="space-y-3">
        {/* Stage filters */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {STAGE_OPTIONS.map((opt) => (
            <FilterPill
              key={opt.value}
              label={opt.label}
              active={stageFilter === opt.value}
              onClick={() => setStageFilter(opt.value)}
            />
          ))}
        </div>

        {/* Status + date row */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex gap-2 overflow-x-auto">
            {STATUS_OPTIONS.map((opt) => (
              <FilterPill
                key={opt.value}
                label={opt.label}
                active={statusFilter === opt.value}
                onClick={() => setStatusFilter(opt.value)}
              />
            ))}
          </div>
          <DateNavigator
            date={dateFilter}
            onPrev={() => shiftDate(-1)}
            onNext={() => shiftDate(1)}
            onClear={() => setDateFilter(null)}
          />
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="elevated-card rounded-2xl h-32 animate-pulse" />
          ))}
        </div>
      ) : grouped.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-6">
          {grouped.map(([dateKey, dayMatches]) => (
            <div key={dateKey} className="space-y-3">
              <DateGroupHeader dateKey={dateKey} />
              {dayMatches.map((match) => (
                <CalendarMatchCard key={match.id} match={match} />
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
