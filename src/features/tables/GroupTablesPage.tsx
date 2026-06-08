import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faLayerGroup,
  faChevronDown,
  faChevronUp,
  faShield,
} from '@fortawesome/free-solid-svg-icons'
import { cn } from '@/lib/utils'
import { useGroupStandings } from '@/hooks/useGroupStandings'
import { useMatches } from '@/hooks/useMatches'
import type { GroupData, GroupStanding, Match } from '@/types/app'

// ─── Utilities ────────────────────────────────────────────────────────────────

function formatKickoff(utc: string): string {
  const d = new Date(utc)
  const datePart = d.toLocaleDateString('en-US', {
    timeZone: 'Asia/Kuwait',
    month: 'short',
    day: 'numeric',
  })
  const timePart = d.toLocaleTimeString('en-US', {
    timeZone: 'Asia/Kuwait',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
  return `${datePart} · ${timePart} KWT`
}

// ─── Flag image with fallback ─────────────────────────────────────────────────

function FlagImg({
  flagUrl,
  name,
  className,
}: {
  flagUrl: string | null
  name: string
  className?: string
}) {
  if (!flagUrl) {
    return (
      <span className={cn('flex items-center justify-center bg-pitch-700', className)}>
        <FontAwesomeIcon icon={faShield} className="text-[#4A6458] text-[10px]" />
      </span>
    )
  }
  return (
    <img
      src={flagUrl}
      alt={name}
      className={cn('object-cover', className)}
      loading="lazy"
      onError={(e) => {
        ;(e.currentTarget as HTMLImageElement).style.display = 'none'
        const parent = e.currentTarget.parentElement
        if (parent) {
          parent.innerHTML =
            '<span class="flex items-center justify-center w-full h-full"><svg class="w-2.5 h-2.5 text-[#4A6458]" viewBox="0 0 24 24"><path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/></svg></span>'
        }
      }}
    />
  )
}

// ─── Compact match row (Google-style) ────────────────────────────────────────

function GroupMatchRow({ match }: { match: Match }) {
  const teamA = match.teamA
  const teamB = match.teamB
  const nameA = teamA?.shortName ?? teamA?.name ?? match.teamAPlaceholder ?? 'TBD'
  const nameB = teamB?.shortName ?? teamB?.name ?? match.teamBPlaceholder ?? 'TBD'
  const hasScore =
    match.fullTimeScoreA !== null &&
    match.fullTimeScoreA !== undefined &&
    match.fullTimeScoreB !== null &&
    match.fullTimeScoreB !== undefined
  const isLive = match.status === 'live'

  return (
    <div
      className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-xl text-xs',
        isLive ? 'bg-live/10 border border-live/20' : 'bg-pitch-900/50',
      )}
    >
      {/* Team A */}
      <div className="flex items-center gap-1.5 flex-1 min-w-0 justify-end">
        <span
          className={cn(
            'font-heading font-semibold truncate',
            hasScore && match.fullTimeScoreA! > match.fullTimeScoreB!
              ? 'text-white'
              : 'text-[#8BA898]',
          )}
        >
          {nameA}
        </span>
        <div className="w-5 h-3.5 rounded-sm overflow-hidden border border-border/40 flex-shrink-0">
          <FlagImg flagUrl={teamA?.flagUrl ?? null} name={nameA} className="w-full h-full" />
        </div>
      </div>

      {/* Score / time */}
      {hasScore ? (
        <div
          className={cn(
            'flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-display text-base leading-none flex-shrink-0',
            isLive ? 'text-white' : 'text-white/90',
          )}
        >
          <span>{match.fullTimeScoreA}</span>
          <span className="text-[#4A6458] text-xs">–</span>
          <span>{match.fullTimeScoreB}</span>
        </div>
      ) : (
        <div className="text-center flex-shrink-0 min-w-[70px]">
          <div className="font-body text-[10px] text-[#4A6458] whitespace-nowrap">
            {formatKickoff(match.kickoffUtc)}
          </div>
        </div>
      )}

      {/* Team B */}
      <div className="flex items-center gap-1.5 flex-1 min-w-0">
        <div className="w-5 h-3.5 rounded-sm overflow-hidden border border-border/40 flex-shrink-0">
          <FlagImg flagUrl={teamB?.flagUrl ?? null} name={nameB} className="w-full h-full" />
        </div>
        <span
          className={cn(
            'font-heading font-semibold truncate',
            hasScore && match.fullTimeScoreB! > match.fullTimeScoreA!
              ? 'text-white'
              : 'text-[#8BA898]',
          )}
        >
          {nameB}
        </span>
      </div>
    </div>
  )
}

// ─── Standing row ─────────────────────────────────────────────────────────────

function StandingRow({ standing, rank }: { standing: GroupStanding; rank: number }) {
  const isAutoQualify = rank <= 2
  const isMaybeQualify = rank === 3
  const rankColor = rank === 1 ? 'text-gold-400' : rank === 2 ? 'text-[#9CA3AF]' : 'text-[#4A6458]'
  const gdDisplay =
    standing.goalDifference > 0 ? `+${standing.goalDifference}` : `${standing.goalDifference}`
  const gdColor =
    standing.goalDifference > 0
      ? 'text-emerald-400'
      : standing.goalDifference < 0
        ? 'text-red-400'
        : 'text-[#8BA898]'

  return (
    <tr
      className={cn(
        'border-b border-border/30 last:border-0 hover:bg-pitch-700/30 transition-colors',
        isAutoQualify && 'border-l-2 border-l-gold-500/60',
        isMaybeQualify && 'border-l-2 border-l-[#4A6458]/60',
      )}
    >
      {/* Rank */}
      <td className={cn('px-2 py-2.5 font-heading font-bold text-xs', rankColor)}>{rank}</td>

      {/* Team */}
      <td className="px-2 py-2.5">
        <div className="flex items-center gap-2">
          <div className="w-6 h-4 rounded-sm overflow-hidden border border-border/40 flex-shrink-0 bg-pitch-700">
            <FlagImg
              flagUrl={standing.team.flagUrl}
              name={standing.team.name}
              className="w-full h-full"
            />
          </div>
          <span className="font-heading font-semibold text-white text-xs">
            {standing.team.shortName}
          </span>
        </div>
      </td>

      {/* Stats */}
      <td className="px-2 py-2.5 text-center text-[#8BA898]">{standing.played}</td>
      <td className="px-2 py-2.5 text-center text-[#8BA898]">{standing.won}</td>
      <td className="px-2 py-2.5 text-center text-[#8BA898]">{standing.drawn}</td>
      <td className="px-2 py-2.5 text-center text-[#8BA898]">{standing.lost}</td>
      <td className="px-2 py-2.5 text-center text-[#8BA898] hidden sm:table-cell">
        {standing.goalsFor}
      </td>
      <td className="px-2 py-2.5 text-center text-[#8BA898] hidden sm:table-cell">
        {standing.goalsAgainst}
      </td>
      <td className={cn('px-2 py-2.5 text-center font-heading hidden sm:table-cell', gdColor)}>
        {gdDisplay}
      </td>
      <td
        className={cn(
          'px-2 py-2.5 text-center font-heading font-bold text-sm',
          isAutoQualify ? 'text-gold-400' : 'text-white',
        )}
      >
        {standing.points}
      </td>
    </tr>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <tr>
      {[...Array(10)].map((_, i) => (
        <td key={i} className="px-2 py-2.5">
          <div
            className="h-3 rounded bg-pitch-700 animate-pulse"
            style={{ width: i === 1 ? '80px' : '20px' }}
          />
        </td>
      ))}
    </tr>
  )
}

function SkeletonGroupCard({ letter }: { letter: string }) {
  return (
    <div className="elevated-card rounded-2xl p-4 mb-6">
      <div className="flex items-center gap-3 mb-3">
        <h2 className="font-display text-xl text-white tracking-widest">GROUP {letter}</h2>
        <div className="flex-1 h-px bg-gold-500/40" />
      </div>
      <table className="w-full text-xs">
        <tbody>
          {[...Array(4)].map((_, i) => (
            <SkeletonRow key={i} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── Group card ───────────────────────────────────────────────────────────────

function GroupCard({ group, groupMatches }: { group: GroupData; groupMatches: Match[] }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="elevated-card rounded-2xl p-4 mb-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <h2 className="font-display text-xl text-white tracking-widest">GROUP {group.letter}</h2>
        <div className="flex-1 h-px bg-gold-500/40" />
      </div>

      {/* Standings table */}
      <div className="overflow-x-auto -mx-1">
        <table className="w-full min-w-[360px] text-xs">
          <thead>
            <tr className="border-b border-border/60">
              <th className="px-2 py-2 text-left w-6 text-[#4A6458] font-heading font-semibold">
                #
              </th>
              <th className="px-2 py-2 text-left text-[#4A6458] font-heading font-semibold">
                Team
              </th>
              <th className="px-2 py-2 text-center text-[#4A6458] font-heading font-semibold">P</th>
              <th className="px-2 py-2 text-center text-[#4A6458] font-heading font-semibold">W</th>
              <th className="px-2 py-2 text-center text-[#4A6458] font-heading font-semibold">D</th>
              <th className="px-2 py-2 text-center text-[#4A6458] font-heading font-semibold">L</th>
              <th className="px-2 py-2 text-center text-[#4A6458] font-heading font-semibold hidden sm:table-cell">
                GF
              </th>
              <th className="px-2 py-2 text-center text-[#4A6458] font-heading font-semibold hidden sm:table-cell">
                GA
              </th>
              <th className="px-2 py-2 text-center text-[#4A6458] font-heading font-semibold hidden sm:table-cell">
                GD
              </th>
              <th className="px-2 py-2 text-center text-[#4A6458] font-heading font-semibold">
                Pts
              </th>
            </tr>
          </thead>
          <tbody>
            {group.standings.map((s, idx) => (
              <StandingRow key={s.teamId} standing={s} rank={idx + 1} />
            ))}
          </tbody>
        </table>
      </div>

      {/* Qualification legend */}
      <div className="flex items-center gap-4 mt-2 px-1">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm bg-gold-500/60" />
          <span className="text-[10px] text-[#4A6458] font-body">Advance</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm bg-[#4A6458]/60" />
          <span className="text-[10px] text-[#4A6458] font-body">Best 3rd may advance</span>
        </div>
      </div>

      {/* Matches toggle */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="mt-3 flex items-center gap-1.5 text-[11px] font-heading text-[#8BA898] hover:text-gold-400 transition-colors"
      >
        <FontAwesomeIcon icon={expanded ? faChevronUp : faChevronDown} className="text-[9px]" />
        Matches ({groupMatches.length})
      </button>

      {expanded && (
        <div className="mt-3 space-y-1.5 border-t border-border/40 pt-3">
          {groupMatches.length === 0 ? (
            <p className="text-[11px] text-[#4A6458] font-body italic px-1">
              Match schedule will appear here once confirmed.
            </p>
          ) : (
            groupMatches.map((m) => <GroupMatchRow key={m.id} match={m} />)
          )}
        </div>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const ALL_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L']

export function GroupTablesPage() {
  const { data: groups, isLoading: standingsLoading, error } = useGroupStandings()
  const { data: allGroupMatches = [] } = useMatches({ stage: 'group' })
  const [activeFilter, setActiveFilter] = useState<string>('ALL')

  const visibleLetters = groups ? groups.map((g) => g.letter) : ALL_LETTERS.slice(0, 12)

  const filteredGroups: GroupData[] = (() => {
    if (!groups) return []
    if (activeFilter === 'ALL') return groups
    return groups.filter((g) => g.letter === activeFilter)
  })()

  function getGroupMatches(letter: string): Match[] {
    return allGroupMatches
      .filter((m) => m.groupName === letter)
      .sort((a, b) => a.kickoffUtc.localeCompare(b.kickoffUtc))
  }

  return (
    <div className="min-h-screen bg-pitch-950 pb-16">
      {/* Page header */}
      <div className="px-4 pt-8 pb-6 bg-gold-glow">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-1">
            <FontAwesomeIcon icon={faLayerGroup} className="text-gold-400 text-2xl" />
            <h1 className="font-display text-4xl text-white tracking-widest">GROUP STAGE</h1>
          </div>
          <p className="text-[#4A6458] font-body text-sm ml-10">
            World Cup 2026 · 12 Groups · Best 8 of 3rd place advance
          </p>
        </div>
      </div>

      {/* Filter bar */}
      <div className="sticky top-16 z-10 bg-pitch-900/95 backdrop-blur border-b border-border/60 shadow-card">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex gap-2 py-2.5 overflow-x-auto snap-x scrollbar-thin">
            <button
              onClick={() => setActiveFilter('ALL')}
              className={cn(
                'flex-shrink-0 snap-start px-3 py-1.5 rounded-lg text-xs font-heading font-semibold tracking-wide transition-colors',
                activeFilter === 'ALL'
                  ? 'bg-gold-500 text-pitch-950'
                  : 'bg-pitch-800 text-[#8BA898] hover:text-white',
              )}
            >
              All Groups
            </button>
            {visibleLetters.map((letter) => (
              <button
                key={letter}
                onClick={() => setActiveFilter(letter)}
                className={cn(
                  'flex-shrink-0 snap-start px-3 py-1.5 rounded-lg text-xs font-heading font-semibold tracking-wide transition-colors',
                  activeFilter === letter
                    ? 'bg-gold-500 text-pitch-950'
                    : 'bg-pitch-800 text-[#8BA898] hover:text-white',
                )}
              >
                {letter}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 pt-6">
        {error && (
          <div className="text-center py-12 text-red-400 font-body">
            Failed to load group standings.
          </div>
        )}
        {standingsLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0 md:gap-x-6">
            {ALL_LETTERS.slice(0, 12).map((letter) => (
              <SkeletonGroupCard key={letter} letter={letter} />
            ))}
          </div>
        )}
        {!standingsLoading && !error && filteredGroups.length === 0 && (
          <div className="text-center py-16 text-[#4A6458] font-body">
            No group data available yet.
          </div>
        )}
        {!standingsLoading && !error && filteredGroups.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0 md:gap-x-6">
            {filteredGroups.map((group) => (
              <GroupCard
                key={group.letter}
                group={group}
                groupMatches={getGroupMatches(group.letter)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
