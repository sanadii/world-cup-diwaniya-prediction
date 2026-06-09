import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faTrophy,
  faChevronRight,
  faFire,
  faStar,
  faCheckDouble,
  faArrowUp,
  faArrowRight,
  faCircleExclamation,
  faCircleCheck,
  faUsers,
  faCalendarDays,
  faMedal,
  faChartLine,
} from '@fortawesome/free-solid-svg-icons'
import { useTranslation } from 'react-i18next'
import { getTeamNameAr } from '@/lib/teamNamesAr'
import { MatchCard } from '@/components/match-card/MatchCard'
import { CountdownTimer } from '@/components/match-card/CountdownTimer'
import { cn } from '@/lib/utils'
import { useMatches, useLeaderboard, useUserStats, usePredictions } from '@/hooks'
import { useAuthContext } from '@/contexts/useAuthContext'
import type { MatchStatus } from '@/types/app'

// Stable reference — prevents TanStack Query from seeing a new object on every render
const ALL_MATCH_STATUSES: MatchStatus[] = [
  'live',
  'open',
  'locked',
  'scheduled',
  'finished',
  'scored',
]

// ── Kuwait date helpers — use Intl for machine-TZ independence ───────────────

function kuwaitDay(date: Date): string {
  return date.toLocaleDateString('en-CA', { timeZone: 'Asia/Kuwait' }) // YYYY-MM-DD
}

function isKuwaitToday(utcDate: string): boolean {
  return kuwaitDay(new Date(utcDate)) === kuwaitDay(new Date())
}

function isKuwaitTomorrow(utcDate: string): boolean {
  return kuwaitDay(new Date(utcDate)) === kuwaitDay(new Date(Date.now() + 86400000))
}

// ── Skeleton shimmer helper ──────────────────────────────────────────────────

function SkeletonCard() {
  return <div className="animate-pulse bg-pitch-800 rounded-2xl h-24 border border-border/40" />
}

// ── Dashboard ────────────────────────────────────────────────────────────────

export function Dashboard() {
  const { t, i18n } = useTranslation()
  const isAr = i18n.language === 'ar'
  // Auth context — for display name + isYou detection
  const { user, profile } = useAuthContext()

  // Data hooks
  const allActiveMatches = useMatches({ status: ALL_MATCH_STATUSES })
  const { data: leaderboard = [], isLoading: leaderboardLoading } = useLeaderboard()
  const { data: stats, isLoading: statsLoading } = useUserStats()
  const { data: myPredictions = [] } = usePredictions()

  const allMatches = useMemo(() => allActiveMatches.data ?? [], [allActiveMatches.data])
  const matchesLoading = allActiveMatches.isLoading

  // Filter by Kuwait date
  const todayMatches = useMemo(
    () => allMatches.filter((m) => isKuwaitToday(m.kickoffUtc)),
    [allMatches],
  )
  const tomorrowMatches = useMemo(
    () => allMatches.filter((m) => isKuwaitTomorrow(m.kickoffUtc)),
    [allMatches],
  )

  // Derived state
  const nextOpenMatch =
    todayMatches.find((m) => m.status === 'open') ??
    allMatches.find((m) => m.status === 'open') ??
    allMatches.find((m) => m.status === 'scheduled')
  const liveMatch = allMatches.find((m) => m.status === 'live')

  // Missing predictions: open matches user hasn't predicted yet
  const predictedMatchIds = useMemo(
    () => new Set(myPredictions.map((p) => p.matchId)),
    [myPredictions],
  )
  const missingPredictions = useMemo(
    () => allMatches.filter((m) => m.status === 'open' && !predictedMatchIds.has(m.id)).length,
    [allMatches, predictedMatchIds],
  )

  // Fallback stats values while loading
  const currentRank = stats?.rank ?? null
  const totalParticipants = leaderboard.length
  const totalPoints = stats?.totalPoints ?? 0
  const todayPoints = stats?.todayPoints ?? 0
  const exactScores = stats?.exactScores ?? 0
  const correctOutcomes = stats?.correctOutcomes ?? 0
  const predictionsSubmitted = stats?.matchesPredicted ?? 0
  const predictionsAvailable = missingPredictions
  const totalPredictions = predictionsSubmitted + predictionsAvailable
  const submissionPct = totalPredictions > 0 ? (predictionsSubmitted / totalPredictions) * 100 : 0

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* ── HERO SECTION ── */}
      <section className="relative mb-10 rounded-3xl overflow-hidden animate-item-1 min-h-[260px]">
        {/* Stadium background */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: 'url(/hero-stadium.jpg)' }}
        />
        {/* Layered overlays — photo bleeds through on the right edge */}
        <div className="absolute inset-0 bg-gradient-to-b from-pitch-950/30 via-pitch-950/60 to-pitch-950" />
        <div className="absolute inset-0 bg-gradient-to-r from-pitch-950/95 via-pitch-950/70 to-pitch-950/20" />
        {/* Gold top accent line */}
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-gold-400/50 to-transparent" />
        {/* Ambient glows */}
        <div className="absolute -top-24 left-1/3 w-96 h-96 bg-gold-400/12 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-live/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 -translate-y-1/2 right-1/4 w-64 h-64 bg-primary/8 rounded-full blur-3xl pointer-events-none" />

        <div className="relative px-6 pt-10 pb-8 sm:px-10 sm:pt-14 sm:pb-10">
          {/* Season tag */}
          <div className="inline-flex items-center gap-2 bg-gold-400/10 border border-gold-400/20 rounded-full px-3 py-1 mb-6">
            <div className="w-1.5 h-1.5 rounded-full bg-gold-400 animate-pulse" />
            <span className="text-[10px] font-heading uppercase text-gold-400/80">
              {t('dashboard.season')}
            </span>
          </div>

          <div className="flex flex-col xl:flex-row items-start xl:items-end justify-between gap-8">
            {/* Left: identity + stats */}
            <div className="flex-1 max-w-xl">
              <p className="text-xs font-heading text-muted uppercase mb-2">
                {t('dashboard.welcomeBack')}
              </p>
              {/* Username — hero text */}
              <h1 className="font-display text-[clamp(2.8rem,9vw,5.5rem)] text-white tracking-wider leading-none shimmer-text mb-8 break-all">
                {profile?.displayName?.toUpperCase() ?? t('dashboard.champion')}
              </h1>

              {/* Stat chips */}
              <div className="flex flex-wrap gap-3">
                {/* Rank */}
                <div className="flex items-center gap-3 bg-gold-400/15 backdrop-blur-sm border border-gold-400/50 rounded-2xl px-5 py-3 shadow-lg">
                  <FontAwesomeIcon
                    icon={faTrophy}
                    className="text-gold-400 text-base flex-shrink-0"
                  />
                  <div>
                    {statsLoading ? (
                      <div className="animate-pulse h-7 w-10 bg-pitch-700 rounded mb-1" />
                    ) : (
                      <div className="font-display text-3xl text-white leading-none">
                        {currentRank != null ? `#${currentRank}` : '—'}
                      </div>
                    )}
                    <div className="text-[10px] text-muted font-body uppercase mt-0.5">
                      {t('dashboard.of')} {totalParticipants}
                    </div>
                  </div>
                </div>

                {/* Points */}
                <div className="flex items-center gap-3 bg-white/12 backdrop-blur-sm border border-white/30 rounded-2xl px-5 py-3 shadow-lg">
                  <FontAwesomeIcon
                    icon={faChartLine}
                    className="text-live text-base flex-shrink-0"
                  />
                  <div>
                    {statsLoading ? (
                      <div className="animate-pulse h-7 w-10 bg-pitch-700 rounded mb-1" />
                    ) : (
                      <div className="font-display text-3xl text-white leading-none">
                        {totalPoints}
                      </div>
                    )}
                    <div className="text-[10px] text-muted font-body uppercase mt-0.5">
                      {t('dashboard.totalPts')}
                    </div>
                  </div>
                </div>

                {/* Today's pts — only if > 0 */}
                {todayPoints > 0 && (
                  <div className="flex items-center gap-3 bg-live/10 border border-live/20 rounded-2xl px-5 py-3 backdrop-blur-sm">
                    <FontAwesomeIcon
                      icon={faFire}
                      className="text-orange-400 text-base flex-shrink-0"
                    />
                    <div>
                      <div className="font-display text-3xl text-live leading-none">
                        +{todayPoints}
                      </div>
                      <div className="text-[10px] text-live/50 font-body uppercase mt-0.5">
                        {t('dashboard.today')}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right: next match countdown */}
            {nextOpenMatch && (
              <div className="bg-white/10 backdrop-blur-md border border-white/28 rounded-2xl p-5 min-w-[190px] xl:text-end shadow-xl">
                <div className="text-[10px] font-heading uppercase text-muted mb-2">
                  {t('dashboard.nextKickoff')}
                </div>
                <div className="font-heading text-sm font-semibold text-white mb-1">
                  {isAr
                    ? getTeamNameAr(
                        nextOpenMatch.teamA?.name ?? nextOpenMatch.teamAPlaceholder ?? '?',
                      )
                    : (nextOpenMatch.teamA?.shortName ??
                      nextOpenMatch.teamAPlaceholder ??
                      '?')}{' '}
                  vs{' '}
                  {isAr
                    ? getTeamNameAr(
                        nextOpenMatch.teamB?.name ?? nextOpenMatch.teamBPlaceholder ?? '?',
                      )
                    : (nextOpenMatch.teamB?.shortName ?? nextOpenMatch.teamBPlaceholder ?? '?')}
                </div>
                <div className="text-[11px] text-muted font-body mb-4">
                  {new Date(nextOpenMatch.kickoffUtc).toLocaleDateString('en-US', {
                    timeZone: 'Asia/Kuwait',
                    month: 'short',
                    day: 'numeric',
                  })}{' '}
                  ·{' '}
                  {new Date(nextOpenMatch.kickoffUtc).toLocaleTimeString('en-US', {
                    timeZone: 'Asia/Kuwait',
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true,
                  })}{' '}
                  {t('dashboard.kwt')}
                </div>
                <CountdownTimer targetUtc={nextOpenMatch.kickoffUtc} label="" />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── ALERT BANNERS ── */}
      <div className="space-y-3 mb-8 animate-item-2">
        {liveMatch && (
          <div className="flex items-center justify-between p-4 rounded-2xl bg-live/10 border border-live/20">
            <div className="flex items-center gap-3">
              <div className="live-dot flex-shrink-0" />
              <div>
                <div className="text-sm font-heading font-semibold text-white">
                  {t('dashboard.liveNow')} —{' '}
                  {isAr
                    ? getTeamNameAr(liveMatch.teamA?.name ?? liveMatch.teamAPlaceholder ?? '?')
                    : (liveMatch.teamA?.name ?? liveMatch.teamAPlaceholder ?? '?')}{' '}
                  vs{' '}
                  {isAr
                    ? getTeamNameAr(liveMatch.teamB?.name ?? liveMatch.teamBPlaceholder ?? '?')
                    : (liveMatch.teamB?.name ?? liveMatch.teamBPlaceholder ?? '?')}
                </div>
                <div className="text-xs text-secondary font-body mt-0.5">
                  {liveMatch.fullTimeScoreA} – {liveMatch.fullTimeScoreB}
                </div>
              </div>
            </div>
            <Link
              to={`/matches/${liveMatch.id}`}
              className="flex items-center gap-1.5 text-live text-sm font-heading font-semibold hover:text-white transition-colors"
            >
              {t('dashboard.watch')} <FontAwesomeIcon icon={faArrowRight} className="text-xs" />
            </Link>
          </div>
        )}

        {missingPredictions > 0 && (
          <div className="flex items-center justify-between p-4 rounded-2xl bg-gold-400/8 border border-gold-400/20">
            <div className="flex items-center gap-3">
              <FontAwesomeIcon icon={faCircleExclamation} className="text-gold-400 flex-shrink-0" />
              <div>
                <div className="text-sm font-heading font-semibold text-white">
                  {t('dashboard.predictionsMissing', { count: missingPredictions })}
                </div>
                <div className="text-xs text-secondary font-body mt-0.5">
                  {t('dashboard.dontMissPoints')}
                </div>
              </div>
            </div>
            <Link
              to="/matches"
              className="flex items-center gap-1.5 text-gold-400 text-sm font-heading font-semibold hover:text-gold-300 transition-colors"
            >
              {t('dashboard.predict')} <FontAwesomeIcon icon={faChevronRight} className="text-xs" />
            </Link>
          </div>
        )}

        {stats?.todayPoints !== undefined && stats.todayPoints > 0 && (
          <div className="flex items-center justify-between p-4 rounded-2xl bg-pitch-800 border border-border">
            <div className="flex items-center gap-3">
              <FontAwesomeIcon icon={faCircleCheck} className="text-live flex-shrink-0" />
              <div>
                <div className="text-sm font-heading font-semibold text-white">
                  {t('dashboard.todaysPoints')}
                </div>
                <div className="text-xs text-secondary font-body mt-0.5">
                  {t('dashboard.youEarned')}{' '}
                  <span className="text-gold-400 font-semibold">
                    +{stats.todayPoints} {t('dashboard.pointsToday')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── MAIN GRID ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* LEFT: Today + Tomorrow Matches */}
        <div className="xl:col-span-2 space-y-8">
          {/* Today's Matches */}
          <section className="animate-item-3">
            <SectionHeader
              icon={faCalendarDays}
              title={t('dashboard.todaysMatches')}
              subtitle={new Date().toLocaleDateString('en-US', {
                timeZone: 'Asia/Kuwait',
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
              linkTo="/matches"
            />
            <div className="space-y-3 mt-4">
              {matchesLoading ? (
                <>
                  <SkeletonCard />
                  <SkeletonCard />
                  <SkeletonCard />
                </>
              ) : todayMatches.length === 0 ? (
                <div className="text-center py-8 text-muted font-body text-sm">
                  {t('dashboard.noMatchesToday')}
                </div>
              ) : (
                todayMatches.map((match, i) => (
                  <MatchCard
                    key={match.id}
                    match={match}
                    prediction={myPredictions.find((p) => p.matchId === match.id)}
                    showPredictButton={true}
                    animationClass={`animate-item-${i + 3}`}
                  />
                ))
              )}
            </div>
          </section>

          {/* Tomorrow's Matches */}
          <section className="animate-item-4">
            <SectionHeader
              icon={faCalendarDays}
              title={t('dashboard.tomorrowsMatches')}
              subtitle={t('dashboard.predictionsOpenMidnight')}
              linkTo="/matches"
            />
            <div className="space-y-3 mt-4 opacity-80">
              {matchesLoading ? (
                <>
                  <SkeletonCard />
                  <SkeletonCard />
                </>
              ) : tomorrowMatches.length === 0 ? (
                <div className="text-center py-6 text-muted font-body text-sm">
                  {t('dashboard.noMatchesTomorrow')}
                </div>
              ) : (
                tomorrowMatches.map((match) => (
                  <MatchCard
                    key={match.id}
                    match={match}
                    showPredictButton={false}
                    compact={false}
                  />
                ))
              )}
            </div>
          </section>
        </div>

        {/* RIGHT: Leaderboard + Stats */}
        <div className="space-y-6">
          {/* Personal Stats Card */}
          <section className="elevated-card rounded-2xl p-5 animate-item-3">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading font-semibold text-white text-base tracking-wide">
                {t('dashboard.yourStats')}
              </h3>
              <Link
                to="/profile"
                className="text-xs text-muted hover:text-gold-400 transition-colors font-body"
              >
                {t('dashboard.viewProfile')}
              </Link>
            </div>

            {statsLoading ? (
              <div className="grid grid-cols-2 gap-3">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="animate-pulse bg-pitch-900/60 rounded-xl p-3 border border-border/60 h-20"
                  />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {[
                  {
                    label: t('dashboard.points'),
                    value: totalPoints,
                    icon: faTrophy,
                    color: 'text-gold-400',
                  },
                  {
                    label: t('dashboard.rank'),
                    value: currentRank != null ? `#${currentRank}` : '—',
                    icon: faMedal,
                    color: 'rank-gold',
                  },
                  {
                    label: t('dashboard.exactScores'),
                    value: exactScores,
                    icon: faStar,
                    color: 'text-gold-300',
                  },
                  {
                    label: t('dashboard.correctOutcomes'),
                    value: correctOutcomes,
                    icon: faCheckDouble,
                    color: 'text-live',
                  },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="bg-pitch-900/60 rounded-xl p-3 border border-border/60"
                  >
                    <FontAwesomeIcon icon={stat.icon} className={cn('text-xs mb-2', stat.color)} />
                    <div
                      className={cn(
                        'font-display text-2xl leading-none',
                        stat.color === 'rank-gold' ? 'rank-gold' : stat.color,
                      )}
                    >
                      {stat.value}
                    </div>
                    <div className="text-[10px] text-muted font-body mt-1 uppercase tracking-wider">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Submissions progress */}
            <div className="mt-4 pt-4 border-t border-border/60">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-body text-secondary">
                  {t('dashboard.predictions')} {t('dashboard.submitted')}
                </span>
                <span className="text-xs font-heading font-semibold text-white">
                  {predictionsSubmitted}/{totalPredictions}
                </span>
              </div>
              <div className="h-1.5 bg-pitch-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-gold-500 to-gold-400 rounded-full transition-all duration-700"
                  style={{ width: `${submissionPct}%` }}
                />
              </div>
              {predictionsAvailable > 0 && (
                <div className="flex items-center gap-1.5 mt-2.5">
                  <FontAwesomeIcon icon={faArrowUp} className="text-[10px] text-gold-400" />
                  <span className="text-[11px] text-gold-400 font-body">
                    {t('dashboard.matchesWaiting', { count: predictionsAvailable })}
                  </span>
                </div>
              )}
            </div>
          </section>

          {/* Mini Leaderboard */}
          <section className="elevated-card rounded-2xl p-5 animate-item-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h3 className="font-heading font-semibold text-white text-base tracking-wide">
                  {t('nav.leaderboard')}
                </h3>
                <div className="flex items-center gap-1 bg-live/10 border border-live/20 rounded-full px-2 py-0.5">
                  <div className="w-1.5 h-1.5 bg-live rounded-full" />
                  <span className="text-[10px] font-body text-live">
                    {t('matchCard.statusLive')}
                  </span>
                </div>
              </div>
              <Link
                to="/leaderboard"
                className="text-xs text-muted hover:text-gold-400 transition-colors font-body"
              >
                {t('dashboard.fullTable')}
              </Link>
            </div>

            <div className="space-y-2">
              {leaderboardLoading
                ? [0, 1, 2, 3, 4].map((i) => (
                    <div key={i} className="animate-pulse bg-pitch-800 rounded-xl h-12" />
                  ))
                : leaderboard.slice(0, 5).map((entry) => {
                    const isYou = !!user && entry.userId === user.id
                    return (
                      <div
                        key={entry.userId}
                        className={cn(
                          'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all',
                          isYou
                            ? 'bg-gold-400/8 border border-gold-400/20'
                            : 'hover:bg-pitch-700/50',
                        )}
                      >
                        {/* Rank */}
                        <div
                          className={cn(
                            'w-6 text-center font-display text-lg leading-none flex-shrink-0',
                            entry.rank === 1
                              ? 'rank-gold'
                              : entry.rank === 2
                                ? 'rank-silver'
                                : entry.rank === 3
                                  ? 'rank-bronze'
                                  : 'text-muted',
                          )}
                        >
                          {entry.rank === 1 || entry.rank === 2 || entry.rank === 3 ? (
                            <FontAwesomeIcon icon={faMedal} />
                          ) : (
                            entry.rank
                          )}
                        </div>

                        {/* Flag avatar */}
                        <div className="w-7 h-7 rounded-lg overflow-hidden border border-border flex-shrink-0">
                          {entry.profile.avatarUrl ? (
                            <img
                              src={entry.profile.avatarUrl}
                              alt={entry.profile.displayName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-pitch-700 flex items-center justify-center">
                              <FontAwesomeIcon icon={faUsers} className="text-[8px] text-muted" />
                            </div>
                          )}
                        </div>

                        {/* Name + badges */}
                        <div className="flex-1 min-w-0">
                          <div
                            className={cn(
                              'text-sm font-heading font-semibold leading-none truncate',
                              isYou ? 'text-gold-400' : 'text-white',
                            )}
                          >
                            {entry.profile.displayName}
                            {isYou && (
                              <span className="ms-1.5 text-[10px] font-body text-gold-400/60">
                                ({t('dashboard.you')})
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Points */}
                        <div className="text-right flex-shrink-0">
                          <div
                            className={cn(
                              'font-display text-xl leading-none',
                              isYou ? 'text-gold-400' : 'text-white',
                            )}
                          >
                            {entry.totalPoints}
                          </div>
                          <div className="text-[10px] text-muted font-body">
                            {t('leaderboard.pts')}
                          </div>
                        </div>
                      </div>
                    )
                  })}
            </div>

            {/* CTA */}
            <Link
              to="/leaderboard"
              className="mt-4 flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-border text-secondary text-sm font-heading font-medium hover:border-border-glow hover:text-white transition-all"
            >
              <FontAwesomeIcon icon={faTrophy} className="text-xs text-gold-400/60" />
              {t('dashboard.viewFullLeaderboard')}
            </Link>
          </section>

          {/* Quick Links */}
          <section className="animate-item-5">
            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  to: '/matches?tab=groups',
                  icon: faUsers,
                  label: t('dashboard.groupTables'),
                  sub: t('dashboard.groupsCount'),
                },
                {
                  to: '/matches?tab=bracket',
                  icon: faChartLine,
                  label: t('dashboard.knockout'),
                  sub: t('matches.roundOf32'),
                },
              ].map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="elevated-card rounded-2xl p-4 flex flex-col items-center gap-2 text-center group hover:border-gold-400/20"
                >
                  <div className="w-10 h-10 rounded-xl bg-gold-400/10 border border-gold-400/20 flex items-center justify-center group-hover:bg-gold-400/20 transition-colors">
                    <FontAwesomeIcon icon={item.icon} className="text-gold-400 text-sm" />
                  </div>
                  <div>
                    <div className="text-sm font-heading font-semibold text-white">
                      {item.label}
                    </div>
                    <div className="text-[11px] text-muted font-body">{item.sub}</div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

// ── Section Header Component ──
function SectionHeader({
  icon,
  title,
  subtitle,
  linkTo,
}: {
  icon: typeof faCalendarDays
  title: string
  subtitle?: string
  linkTo?: string
}) {
  const { t } = useTranslation()
  return (
    <div className="flex items-start justify-between">
      <div>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gold-400/10 border border-gold-400/20 flex items-center justify-center">
            <FontAwesomeIcon icon={icon} className="text-gold-400 text-xs" />
          </div>
          <h2 className="font-heading font-semibold text-white text-lg tracking-wide">{title}</h2>
        </div>
        {subtitle && <p className="text-xs text-muted font-body mt-1 ms-9">{subtitle}</p>}
      </div>
      {linkTo && (
        <Link
          to={linkTo}
          className="flex items-center gap-1 text-xs text-muted hover:text-gold-400 transition-colors font-body mt-1"
        >
          {t('dashboard.seeAllMatches')}{' '}
          <FontAwesomeIcon icon={faChevronRight} className="text-[9px]" />
        </Link>
      )}
    </div>
  )
}
