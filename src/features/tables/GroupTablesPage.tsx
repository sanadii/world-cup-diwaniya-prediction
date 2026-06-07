import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faLayerGroup, faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons'
import { cn, getFlagUrl } from '@/lib/utils'
import { useGroupStandings } from '@/hooks/useGroupStandings'
import type { GroupData, GroupStanding } from '@/types/app'

// ──────────────────────────────────────────
// Skeleton rows
// ──────────────────────────────────────────
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

// ──────────────────────────────────────────
// Group card — standings table
// ──────────────────────────────────────────
function GroupCard({ group }: { group: GroupData }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="elevated-card rounded-2xl p-4 mb-6">
      {/* Group header */}
      <div className="flex items-center gap-3 mb-3">
        <h2 className="font-display text-xl text-white tracking-widest">GROUP {group.letter}</h2>
        <div className="flex-1 h-px bg-gold-500/40" />
      </div>

      {/* Table */}
      <div className="overflow-x-auto -mx-1">
        <table className="w-full min-w-[420px] text-xs">
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
              <StandingRow key={s.teamId} standing={s} rank={idx + 1} qualifies={idx < 2} />
            ))}
          </tbody>
        </table>
      </div>

      {/* Matches toggle */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="mt-3 flex items-center gap-1.5 text-[11px] font-heading text-[#8BA898] hover:text-gold-400 transition-colors"
      >
        <FontAwesomeIcon icon={expanded ? faChevronUp : faChevronDown} className="text-[9px]" />
        Matches
      </button>

      {expanded && (
        <div className="mt-3 space-y-1 border-t border-border/40 pt-3">
          <GroupMatchesNote />
        </div>
      )}
    </div>
  )
}

function GroupMatchesNote() {
  return (
    <p className="text-[11px] text-[#4A6458] font-body italic">
      Match results will appear here once the group stage begins.
    </p>
  )
}

// ──────────────────────────────────────────
// Standing row
// ──────────────────────────────────────────
function StandingRow({
  standing,
  rank,
  qualifies,
}: {
  standing: GroupStanding
  rank: number
  qualifies: boolean
}) {
  const rankColor = rank === 1 ? 'text-gold-400' : rank === 2 ? 'text-[#9CA3AF]' : 'text-[#4A6458]'

  const gdDisplay =
    standing.goalDifference > 0 ? `+${standing.goalDifference}` : `${standing.goalDifference}`

  const gdColor =
    standing.goalDifference > 0
      ? 'text-emerald-400'
      : standing.goalDifference < 0
        ? 'text-red-400'
        : 'text-[#8BA898]'

  const flagUrl = getFlagUrl(standing.team.flagCode, 'w40')

  return (
    <tr
      className={cn(
        'border-b border-border/30 last:border-0 hover:bg-pitch-700/30 transition-colors',
        qualifies && 'border-l-2 border-l-gold-500/60',
      )}
    >
      {/* Rank */}
      <td className={cn('px-2 py-2.5 font-heading font-bold text-xs', rankColor)}>{rank}</td>

      {/* Team */}
      <td className="px-2 py-2.5">
        <div className="flex items-center gap-2">
          <img
            src={flagUrl}
            alt={standing.team.name}
            className="w-6 h-4 object-cover rounded-sm flex-shrink-0"
            loading="lazy"
          />
          <span className="font-heading font-semibold text-white text-xs hidden sm:inline">
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

      {/* Points */}
      <td
        className={cn(
          'px-2 py-2.5 text-center font-heading font-bold text-sm',
          qualifies ? 'text-gold-400' : 'text-white',
        )}
      >
        {standing.points}
      </td>
    </tr>
  )
}

// ──────────────────────────────────────────
// Loading skeleton group card
// ──────────────────────────────────────────
function SkeletonGroupCard({ letter }: { letter: string }) {
  return (
    <div className="elevated-card rounded-2xl p-4 mb-6">
      <div className="flex items-center gap-3 mb-3">
        <h2 className="font-display text-xl text-white tracking-widest">GROUP {letter}</h2>
        <div className="flex-1 h-px bg-gold-500/40" />
      </div>
      <table className="w-full min-w-[420px] text-xs">
        <tbody>
          {[...Array(4)].map((_, i) => (
            <SkeletonRow key={i} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ──────────────────────────────────────────
// Page
// ──────────────────────────────────────────
const ALL_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L']

export function GroupTablesPage() {
  const { data: groups, isLoading, error } = useGroupStandings()
  const [activeFilter, setActiveFilter] = useState<string>('ALL')

  const visibleLetters = groups ? groups.map((g) => g.letter) : ALL_LETTERS.slice(0, 12)

  const filteredGroups: GroupData[] = (() => {
    if (!groups) return []
    if (activeFilter === 'ALL') return groups
    return groups.filter((g) => g.letter === activeFilter)
  })()

  return (
    <div className="min-h-screen bg-pitch-950 pb-16">
      {/* Page header */}
      <div className="px-4 pt-8 pb-6 bg-gold-glow">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-1">
            <FontAwesomeIcon icon={faLayerGroup} className="text-gold-400 text-2xl" />
            <h1 className="font-display text-4xl text-white tracking-widest">GROUP TABLES</h1>
          </div>
          <p className="text-[#4A6458] font-body text-sm ml-10">World Cup 2026 · Group Stage</p>
        </div>
      </div>

      {/* Filter bar */}
      <div className="sticky top-0 z-10 bg-pitch-900/95 backdrop-blur border-b border-border/60 shadow-card">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex gap-2 py-2.5 overflow-x-auto snap-x scrollbar-thin">
            {/* All Groups button */}
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
                Group {letter}
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

        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0 md:gap-x-6">
            {ALL_LETTERS.slice(0, 12).map((letter) => (
              <SkeletonGroupCard key={letter} letter={letter} />
            ))}
          </div>
        )}

        {!isLoading && !error && filteredGroups.length === 0 && (
          <div className="text-center py-16 text-[#4A6458] font-body">
            No group data available yet.
          </div>
        )}

        {!isLoading && !error && filteredGroups.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0 md:gap-x-6">
            {filteredGroups.map((group) => (
              <GroupCard key={group.letter} group={group} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
