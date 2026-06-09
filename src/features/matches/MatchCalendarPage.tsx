import { useState, useMemo } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCalendarXmark } from '@fortawesome/free-solid-svg-icons'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import type { MatchStage } from '@/types/app'
import { useMatches } from '@/hooks/useMatches'
import { useMyPredictions } from '@/hooks/usePredictions'
import { MatchCard } from '@/components/match-card/MatchCard'
import type { Match, Prediction } from '@/types/app'

// ─── Round definitions ────────────────────────────────────────────────────────

interface Round {
  id: string
  stage: string | null // null = all group rounds
  startDate: string // YYYY-MM-DD KWT
  endDate: string // YYYY-MM-DD KWT (inclusive)
}

const ROUNDS: Round[] = [
  { id: 'r1', stage: 'group', startDate: '2026-06-11', endDate: '2026-06-15' },
  { id: 'r2', stage: 'group', startDate: '2026-06-16', endDate: '2026-06-20' },
  { id: 'r3', stage: 'group', startDate: '2026-06-21', endDate: '2026-06-26' },
  { id: 'r32', stage: 'round_of_32', startDate: '2026-06-27', endDate: '2026-07-03' },
  { id: 'r16', stage: 'round_of_16', startDate: '2026-07-04', endDate: '2026-07-07' },
  { id: 'qf', stage: 'quarterfinal', startDate: '2026-07-09', endDate: '2026-07-12' },
  { id: 'sf', stage: 'semifinal', startDate: '2026-07-14', endDate: '2026-07-15' },
  { id: 'tp', stage: 'third_place', startDate: '2026-07-18', endDate: '2026-07-18' },
  { id: 'f', stage: 'final', startDate: '2026-07-19', endDate: '2026-07-19' },
]

// Explicit membership — no string-prefix hacks (old filter had critical bugs)
const GROUP_ROUND_IDS = new Set(['r1', 'r2', 'r3'])
const KO_ROUND_IDS = new Set(['r32', 'r16', 'qf', 'sf', 'tp', 'f'])

// Kuwait date helper — use Intl for correctness on all machines
function kuwaitDateStr(utc: string): string {
  return new Date(utc).toLocaleDateString('en-CA', { timeZone: 'Asia/Kuwait' })
}

function todayKuwait(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kuwait' })
}

function detectCurrentRound(): string {
  const today = todayKuwait()
  for (const round of ROUNDS) {
    if (today >= round.startDate && today <= round.endDate) return round.id
  }
  // Before tournament starts → show round 1
  if (today < ROUNDS[0].startDate) return 'r1'
  // After final → last round
  return ROUNDS[ROUNDS.length - 1].id
}

// ─── Match card wrapper ───────────────────────────────────────────────────────

// Predicted badge is now rendered inside MatchCard's own top bar — no external overlay needed
function CalendarMatchCard({ match, prediction }: { match: Match; prediction?: Prediction }) {
  return <MatchCard match={match} prediction={prediction} showPredictButton />
}

// ─── Day header ───────────────────────────────────────────────────────────────

function tomorrowKuwait(): string {
  return new Date(Date.now() + 86400000).toLocaleDateString('en-CA', { timeZone: 'Asia/Kuwait' })
}

function DayHeader({ dateKey }: { dateKey: string }) {
  const { t, i18n } = useTranslation()
  const d = new Date(`${dateKey}T12:00:00Z`)
  const today = todayKuwait()
  const tomorrow = tomorrowKuwait()
  const locale = i18n.language === 'ar' ? 'ar-KW' : 'en-US'

  const label =
    dateKey === today
      ? t('matches.today')
      : dateKey === tomorrow
        ? t('matches.tomorrow')
        : d.toLocaleDateString(locale, {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            timeZone: 'Asia/Kuwait',
          })

  return (
    <div className="flex items-center gap-3 py-2">
      <span className="font-heading text-sm font-semibold text-[#8BA898] whitespace-nowrap">
        {i18n.language === 'ar' ? label : label.toUpperCase()}
      </span>
      <div className="flex-1 h-px bg-gold-500/20" />
    </div>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState() {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
      <div className="w-16 h-16 rounded-full bg-pitch-800 border border-border flex items-center justify-center">
        <FontAwesomeIcon icon={faCalendarXmark} className="text-[#4A6458] text-2xl" />
      </div>
      <div className="font-display text-2xl text-white tracking-wider">{t('matches.title')}</div>
      <p className="text-sm text-[#4A6458] font-body max-w-xs">{t('matches.noMatchesInRound')}</p>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function MatchCalendarPage() {
  const { t } = useTranslation()

  function getRoundLabel(id: string): string {
    const map: Record<string, string> = {
      r1: t('matches.round1'),
      r2: t('matches.round2'),
      r3: t('matches.round3'),
      r32: t('matches.roundOf32'),
      r16: t('matches.roundOf16'),
      qf: t('matches.quarterFinals'),
      sf: t('matches.semiFinals'),
      tp: t('matches.thirdPlace'),
      f: t('matches.final'),
    }
    return map[id] ?? id
  }

  const [activeRound, setActiveRound] = useState<string>(detectCurrentRound)

  const round = ROUNDS.find((r) => r.id === activeRound) ?? ROUNDS[0]

  // Fetch matches for this round's stage
  const { data: matches = [], isLoading } = useMatches(
    round.stage ? { stage: round.stage as MatchStage } : undefined,
  )

  const { data: myPredictions = [] } = useMyPredictions()
  const predictionByMatchId = useMemo(
    () => new Map(myPredictions.map((p) => [p.matchId, p])),
    [myPredictions],
  )

  // Filter matches to this round's date range
  const roundMatches = useMemo(() => {
    return matches
      .filter((m) => {
        const d = kuwaitDateStr(m.kickoffUtc)
        return d >= round.startDate && d <= round.endDate
      })
      .sort((a, b) => a.kickoffUtc.localeCompare(b.kickoffUtc))
  }, [matches, round])

  // Group by Kuwait date
  const grouped = useMemo(() => {
    const map = new Map<string, Match[]>()
    for (const m of roundMatches) {
      const key = kuwaitDateStr(m.kickoffUtc)
      if (!map.has(key)) map.set(key, [])
      const grp = map.get(key)!
      if (m.status === 'live') grp.unshift(m)
      else grp.push(m)
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b))
  }, [roundMatches])

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-5 animate-fade-in">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="font-display text-5xl text-white tracking-wider">{t('matches.title')}</h1>
        <p className="text-[#4A6458] font-body text-sm">
          {getRoundLabel(round.id)} · {t('common.worldCup2026')}
        </p>
      </div>

      {/* Round selector — two rows: group rounds / knockout rounds */}
      <div className="space-y-2">
        {/* Row 1: Group stage rounds */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-heading text-[#4A6458] uppercase tracking-widest flex-shrink-0 w-12">
            {t('matches.groupStage')}
          </span>
          <div className="flex gap-1.5 overflow-x-auto scrollbar-thin">
            {ROUNDS.filter((r) => GROUP_ROUND_IDS.has(r.id)).map((r) => (
              <button
                key={r.id}
                onClick={() => setActiveRound(r.id)}
                className={cn(
                  'flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-heading font-semibold uppercase tracking-wider whitespace-nowrap transition-all',
                  activeRound === r.id
                    ? 'bg-gold-500 text-pitch-950'
                    : 'bg-pitch-800 border border-border text-[#8BA898] hover:border-border-glow hover:text-white',
                )}
              >
                {getRoundLabel(r.id)}
              </button>
            ))}
          </div>
        </div>

        {/* Row 2: Knockout rounds */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-heading text-[#4A6458] uppercase tracking-widest flex-shrink-0 w-12">
            {t('matches.knockoutStage')}
          </span>
          <div className="flex gap-1.5 overflow-x-auto scrollbar-thin">
            {ROUNDS.filter((r) => KO_ROUND_IDS.has(r.id)).map((r) => (
              <button
                key={r.id}
                onClick={() => setActiveRound(r.id)}
                className={cn(
                  'flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-heading font-semibold uppercase tracking-wider whitespace-nowrap transition-all',
                  activeRound === r.id
                    ? 'bg-gold-500 text-pitch-950'
                    : 'bg-pitch-800 border border-border text-[#8BA898] hover:border-border-glow hover:text-white',
                )}
              >
                {getRoundLabel(r.id)}
              </button>
            ))}
          </div>
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
              <DayHeader dateKey={dateKey} />
              {dayMatches.map((match) => (
                <CalendarMatchCard
                  key={match.id}
                  match={match}
                  prediction={predictionByMatchId.get(match.id)}
                />
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
