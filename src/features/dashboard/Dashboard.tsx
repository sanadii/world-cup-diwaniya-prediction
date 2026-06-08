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
import { MatchCard } from '@/components/match-card/MatchCard'
import { CountdownTimer } from '@/components/match-card/CountdownTimer'
import { cn, getRankSuffix } from '@/lib/utils'
import { useMatches, useLeaderboard, useUserStats, usePredictions } from '@/hooks'
import { useAuthContext } from '@/contexts/useAuthContext'

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
  // Auth context — for display name + isYou detection
  const { user, profile } = useAuthContext()

  // Data hooks
  const allActiveMatches = useMatches({
    status: ['live', 'open', 'locked', 'scheduled', 'finished', 'scored'],
  })
  const { data: leaderboard = [], isLoading: leaderboardLoading } = useLeaderboard()
  const { data: stats, isLoading: statsLoading } = useUserStats()
  const { data: myPredictions = [] } = usePredictions()

  const allMatches = allActiveMatches.data ?? []
  const matchesLoading = allActiveMatches.isLoading

  // Filter by Kuwait date
  const todayMatches = allMatches.filter((m) => isKuwaitToday(m.kickoffUtc))
  const tomorrowMatches = allMatches.filter((m) => isKuwaitTomorrow(m.kickoffUtc))

  // Derived state
  const nextOpenMatch =
    todayMatches.find((m) => m.status === 'open') ??
    allMatches.find((m) => m.status === 'open') ??
    allMatches.find((m) => m.status === 'scheduled')
  const liveMatch = allMatches.find((m) => m.status === 'live')

  // Missing predictions: open matches user hasn't predicted yet
  const predictedMatchIds = new Set(myPredictions.map((p) => p.matchId))
  const openMatches = allMatches.filter((m) => m.status === 'open')
  const missingPredictions = openMatches.filter((m) => !predictedMatchIds.has(m.id)).length

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
      <section className="relative mb-10 rounded-3xl overflow-hidden animate-item-1">
        {/* Real stadium photo background */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: 'url(/hero-stadium.jpg)' }}
        />
        {/* Dark overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-pitch-950/95 via-pitch-950/80 to-pitch-950/60" />
        <div className="absolute inset-0 bg-gradient-to-t from-pitch-950/80 via-transparent to-pitch-950/40" />
        {/* Gold glow accents */}
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-gold-400/8 rounded-full blur-3xl" />
        <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-live/5 rounded-full blur-3xl" />

        <div className="relative px-6 py-8 sm:px-10 sm:py-12">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
            {/* Left: greeting + rank */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-gold-400" />
                <span className="text-[11px] font-body uppercase tracking-[0.25em] text-gold-400/80">
                  Diwaniya Season · Group Stage
                </span>
              </div>
              <h1 className="font-display text-5xl sm:text-6xl text-white tracking-wider leading-none mb-1">
                WELCOME BACK
              </h1>
              <div className="font-display text-5xl sm:text-6xl tracking-wider leading-none shimmer-text mb-5">
                {profile?.displayName?.toUpperCase() ?? 'CHAMPION'}
              </div>

              {/* Quick stats row */}
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2 bg-pitch-900/70 border border-border/80 rounded-xl px-4 py-2.5">
                  <FontAwesomeIcon icon={faTrophy} className="text-gold-400 text-sm" />
                  <div>
                    {statsLoading ? (
                      <div className="animate-pulse h-6 w-10 bg-pitch-700 rounded" />
                    ) : (
                      <div className="font-display text-2xl text-white leading-none">
                        {currentRank ?? '—'}
                        {currentRank != null && (
                          <sup className="font-heading text-xs text-gold-400 ml-0.5 font-semibold">
                            {getRankSuffix(currentRank)}
                          </sup>
                        )}
                      </div>
                    )}
                    <div className="text-[10px] text-[#4A6458] font-body uppercase tracking-wider">
                      of {totalParticipants}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 bg-pitch-900/70 border border-border/80 rounded-xl px-4 py-2.5">
                  <FontAwesomeIcon icon={faChartLine} className="text-live text-sm" />
                  <div>
                    {statsLoading ? (
                      <div className="animate-pulse h-6 w-10 bg-pitch-700 rounded" />
                    ) : (
                      <div className="font-display text-2xl text-white leading-none">
                        {totalPoints}
                      </div>
                    )}
                    <div className="text-[10px] text-[#4A6458] font-body uppercase tracking-wider">
                      Total Pts
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 bg-pitch-900/70 border border-border/80 rounded-xl px-4 py-2.5">
                  <FontAwesomeIcon icon={faFire} className="text-orange-400 text-sm" />
                  <div>
                    {statsLoading ? (
                      <div className="animate-pulse h-6 w-10 bg-pitch-700 rounded" />
                    ) : (
                      <div className="font-display text-2xl text-white leading-none">
                        +{todayPoints}
                      </div>
                    )}
                    <div className="text-[10px] text-[#4A6458] font-body uppercase tracking-wider">
                      Today
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: trophy + countdown */}
            <div className="flex flex-col items-center gap-5">
              <img
                src="/trophy.jpg"
                alt="World Cup Trophy"
                className="w-28 h-auto drop-shadow-[0_0_24px_rgba(212,175,55,0.4)] animate-[float_6s_ease-in-out_infinite] hidden lg:block"
                style={{ filter: 'drop-shadow(0 0 20px rgba(212,175,55,0.35))' }}
              />
              {nextOpenMatch && (
                <div className="text-center">
                  <div className="text-[11px] font-body uppercase tracking-[0.2em] text-[#4A6458] mb-1">
                    Next kick-off in
                  </div>
                  <div className="font-heading text-sm font-semibold text-white mb-4">
                    {nextOpenMatch.teamA?.shortName ?? nextOpenMatch.teamAPlaceholder ?? '?'} vs{' '}
                    {nextOpenMatch.teamB?.shortName ?? nextOpenMatch.teamBPlaceholder ?? '?'} ·{' '}
                    {new Date(nextOpenMatch.kickoffUtc).toLocaleDateString('en-US', {
                      timeZone: 'Asia/Kuwait',
                      month: 'short',
                      day: 'numeric',
                    })}{' '}
                    {new Date(nextOpenMatch.kickoffUtc).toLocaleTimeString('en-US', {
                      timeZone: 'Asia/Kuwait',
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true,
                    })}
                    {' KWT'}
                  </div>
                  <CountdownTimer targetUtc={nextOpenMatch.kickoffUtc} label="" />
                </div>
              )}
            </div>
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
                  LIVE NOW — {liveMatch.teamA?.name ?? liveMatch.teamAPlaceholder ?? '?'} vs{' '}
                  {liveMatch.teamB?.name ?? liveMatch.teamBPlaceholder ?? '?'}
                </div>
                <div className="text-xs text-[#8BA898] font-body mt-0.5">
                  {liveMatch.fullTimeScoreA} – {liveMatch.fullTimeScoreB}
                </div>
              </div>
            </div>
            <Link
              to={`/matches/${liveMatch.id}`}
              className="flex items-center gap-1.5 text-live text-sm font-heading font-semibold hover:text-white transition-colors"
            >
              Watch <FontAwesomeIcon icon={faArrowRight} className="text-xs" />
            </Link>
          </div>
        )}

        {missingPredictions > 0 && (
          <div className="flex items-center justify-between p-4 rounded-2xl bg-gold-400/8 border border-gold-400/20">
            <div className="flex items-center gap-3">
              <FontAwesomeIcon icon={faCircleExclamation} className="text-gold-400 flex-shrink-0" />
              <div>
                <div className="text-sm font-heading font-semibold text-white">
                  {missingPredictions} prediction{missingPredictions > 1 ? 's' : ''} missing
                </div>
                <div className="text-xs text-[#8BA898] font-body mt-0.5">
                  Don't miss out on points — predict before kick-off
                </div>
              </div>
            </div>
            <Link
              to="/matches"
              className="flex items-center gap-1.5 text-gold-400 text-sm font-heading font-semibold hover:text-gold-300 transition-colors"
            >
              Predict <FontAwesomeIcon icon={faChevronRight} className="text-xs" />
            </Link>
          </div>
        )}

        {stats?.todayPoints !== undefined && stats.todayPoints > 0 && (
          <div className="flex items-center justify-between p-4 rounded-2xl bg-pitch-800 border border-border">
            <div className="flex items-center gap-3">
              <FontAwesomeIcon icon={faCircleCheck} className="text-live flex-shrink-0" />
              <div>
                <div className="text-sm font-heading font-semibold text-white">Today's points</div>
                <div className="text-xs text-[#8BA898] font-body mt-0.5">
                  You earned{' '}
                  <span className="text-gold-400 font-semibold">
                    +{stats.todayPoints} points today
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
              title="Today's Diwaniya Matches"
              subtitle={new Date().toLocaleDateString('en-KW', {
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
                <div className="text-center py-8 text-[#4A6458] font-body text-sm">
                  No matches today
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
              title="Tomorrow's Matches"
              subtitle="Predictions open at midnight Kuwait Time"
              linkTo="/matches"
            />
            <div className="space-y-3 mt-4 opacity-80">
              {matchesLoading ? (
                <>
                  <SkeletonCard />
                  <SkeletonCard />
                </>
              ) : tomorrowMatches.length === 0 ? (
                <div className="text-center py-6 text-[#4A6458] font-body text-sm">
                  No matches tomorrow
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
                Your Stats
              </h3>
              <Link
                to="/profile"
                className="text-xs text-[#4A6458] hover:text-gold-400 transition-colors font-body"
              >
                View profile →
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
                    label: 'Total Points',
                    value: totalPoints,
                    icon: faTrophy,
                    color: 'text-gold-400',
                  },
                  {
                    label: 'Your Rank',
                    value: `#${currentRank}`,
                    icon: faMedal,
                    color: 'rank-gold',
                  },
                  {
                    label: 'Exact Scores',
                    value: exactScores,
                    icon: faStar,
                    color: 'text-gold-300',
                  },
                  {
                    label: 'Correct Results',
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
                    <div className="text-[10px] text-[#4A6458] font-body mt-1 uppercase tracking-wider">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Submissions progress */}
            <div className="mt-4 pt-4 border-t border-border/60">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-body text-[#8BA898]">Predictions submitted</span>
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
                    {predictionsAvailable} match{predictionsAvailable > 1 ? 'es' : ''} waiting for
                    your prediction
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
                  Leaderboard
                </h3>
                <div className="flex items-center gap-1 bg-live/10 border border-live/20 rounded-full px-2 py-0.5">
                  <div className="w-1.5 h-1.5 bg-live rounded-full" />
                  <span className="text-[10px] font-body text-live">Live</span>
                </div>
              </div>
              <Link
                to="/leaderboard"
                className="text-xs text-[#4A6458] hover:text-gold-400 transition-colors font-body"
              >
                Full table →
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
                                  : 'text-[#4A6458]',
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
                              <FontAwesomeIcon
                                icon={faUsers}
                                className="text-[8px] text-[#4A6458]"
                              />
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
                              <span className="ml-1.5 text-[10px] font-body text-gold-400/60">
                                (you)
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
                          <div className="text-[10px] text-[#4A6458] font-body">pts</div>
                        </div>
                      </div>
                    )
                  })}
            </div>

            {/* CTA */}
            <Link
              to="/leaderboard"
              className="mt-4 flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-border text-[#8BA898] text-sm font-heading font-medium hover:border-border-glow hover:text-white transition-all"
            >
              <FontAwesomeIcon icon={faTrophy} className="text-xs text-gold-400/60" />
              View Full Leaderboard
            </Link>
          </section>

          {/* Quick Links */}
          <section className="animate-item-5">
            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  to: '/matches?tab=groups',
                  icon: faUsers,
                  label: 'Group Tables',
                  sub: '12 groups',
                },
                {
                  to: '/matches?tab=bracket',
                  icon: faChartLine,
                  label: 'Knockout',
                  sub: 'Round of 32',
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
                    <div className="text-[11px] text-[#4A6458] font-body">{item.sub}</div>
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
  return (
    <div className="flex items-start justify-between">
      <div>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gold-400/10 border border-gold-400/20 flex items-center justify-center">
            <FontAwesomeIcon icon={icon} className="text-gold-400 text-xs" />
          </div>
          <h2 className="font-heading font-semibold text-white text-lg tracking-wide">{title}</h2>
        </div>
        {subtitle && <p className="text-xs text-[#4A6458] font-body mt-1 ml-9">{subtitle}</p>}
      </div>
      {linkTo && (
        <Link
          to={linkTo}
          className="flex items-center gap-1 text-xs text-[#4A6458] hover:text-gold-400 transition-colors font-body mt-1"
        >
          See all <FontAwesomeIcon icon={faChevronRight} className="text-[9px]" />
        </Link>
      )}
    </div>
  )
}
