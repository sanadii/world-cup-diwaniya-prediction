import { useParams, Link } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faArrowLeft,
  faLocationDot,
  faClock,
  faUsers,
  faBullseye,
  faCheckCircle,
  faCircleXmark,
  faLock,
} from '@fortawesome/free-solid-svg-icons'
import { CountdownTimer } from '@/components/match-card/CountdownTimer'
import { cn, getFlagUrl, getStageName, formatKuwaitTime } from '@/lib/utils'
import { useMatch, useMyPrediction, usePredictions, usePredictionStats } from '@/hooks'

export function MatchDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: match, isLoading: matchLoading, error: matchError } = useMatch(id)
  const { data: myPrediction, isLoading: predLoading } = useMyPrediction(id)
  const { data: allPredictions = [] } = usePredictions(
    match?.status === 'scored' || match?.status === 'finished' ? id : undefined,
  )

  // ── Loading ──
  if (matchLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10 space-y-4">
        <div className="animate-pulse bg-pitch-800 rounded-3xl h-52" />
        <div className="animate-pulse bg-pitch-800 rounded-2xl h-32" />
        <div className="animate-pulse bg-pitch-800 rounded-2xl h-24" />
      </div>
    )
  }

  // ── Error / not found ──
  if (matchError || !match) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <div className="font-display text-4xl text-white mb-3">MATCH NOT FOUND</div>
        <div className="text-[#4A6458] font-body mb-6">
          This match doesn't exist or has been removed.
        </div>
        <Link to="/matches" className="btn-gold px-6 py-2.5 rounded-xl text-sm">
          Back to Schedule
        </Link>
      </div>
    )
  }

  const isLive = match.status === 'live'
  const isFinished = match.status === 'finished' || match.status === 'scored'
  const isPreMatch =
    match.status === 'open' || match.status === 'scheduled' || match.status === 'locked'
  const showCommunity = match.status === 'scored' || match.status === 'finished'

  // ── Community prediction stats ──
  const totalPredictions = allPredictions.length
  const homeWins = allPredictions.filter((p) => p.predictedOutcome === 'team_a').length
  const draws = allPredictions.filter((p) => p.predictedOutcome === 'draw').length
  const awayWins = allPredictions.filter((p) => p.predictedOutcome === 'team_b').length
  const correctPredictions = allPredictions.filter(
    (p) => p.totalPoints !== undefined && p.totalPoints > 0,
  ).length

  const homeWinPct = totalPredictions > 0 ? Math.round((homeWins / totalPredictions) * 100) : 0
  const drawPct = totalPredictions > 0 ? Math.round((draws / totalPredictions) * 100) : 0
  const awayWinPct = totalPredictions > 0 ? Math.round((awayWins / totalPredictions) * 100) : 0

  const avgScoreA =
    totalPredictions > 0
      ? (allPredictions.reduce((sum, p) => sum + p.predictedScoreA, 0) / totalPredictions).toFixed(
          1,
        )
      : '—'
  const avgScoreB =
    totalPredictions > 0
      ? (allPredictions.reduce((sum, p) => sum + p.predictedScoreB, 0) / totalPredictions).toFixed(
          1,
        )
      : '—'

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Back link */}
      <Link
        to="/matches"
        className="inline-flex items-center gap-2 text-[#4A6458] hover:text-gold-400 transition-colors text-sm font-body mb-6"
      >
        <FontAwesomeIcon icon={faArrowLeft} className="text-xs" />
        Match Schedule
      </Link>

      {/* ── MATCH HEADER ── */}
      <section className="elevated-card rounded-3xl overflow-hidden mb-5">
        {/* Stage + group badge */}
        <div className="px-6 pt-6 pb-4 border-b border-border/60">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-body uppercase tracking-[0.2em] text-[#4A6458]">
                {getStageName(match.stage)}
                {match.groupName && ` · Group ${match.groupName}`}
              </span>
            </div>
            <StatusBadge status={match.status} />
          </div>
          <div className="flex items-center gap-1.5 text-[#4A6458] text-xs font-body">
            <FontAwesomeIcon icon={faLocationDot} className="text-[10px]" />
            {match.venue}, {match.city}
          </div>
        </div>

        {/* Teams + score row */}
        <div className="px-6 py-8">
          <div className="flex items-center justify-between gap-4">
            {/* Team A */}
            <div className="flex flex-col items-center gap-3 flex-1">
              <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-border shadow-lg">
                {match.teamA?.countryCode && (
                  <img
                    src={getFlagUrl(match.teamA.countryCode, 'w160')}
                    alt={match.teamA.name}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <div className="text-center">
                <div className="font-display text-xl text-white tracking-wide">
                  {match.teamA?.shortName ?? match.teamAPlaceholder ?? '?'}
                </div>
                <div className="text-xs text-[#4A6458] font-body">
                  {match.teamA?.name ?? match.teamAPlaceholder ?? '?'}
                </div>
              </div>
            </div>

            {/* Score / VS */}
            <div className="flex flex-col items-center gap-2 flex-shrink-0 min-w-[120px]">
              {isLive || isFinished ? (
                <>
                  <div className="font-display text-6xl text-white tracking-widest">
                    {match.fullTimeScoreA ?? 0}
                    <span className="text-[#4A6458] mx-2">—</span>
                    {match.fullTimeScoreB ?? 0}
                  </div>
                  {match.wentToPenalties && (
                    <div className="text-xs text-[#8BA898] font-body">
                      (Pen: {match.penaltyScoreA} – {match.penaltyScoreB})
                    </div>
                  )}
                  {isLive && (
                    <div className="flex items-center gap-1.5 bg-live/10 border border-live/20 rounded-full px-3 py-1">
                      <div className="w-1.5 h-1.5 bg-live rounded-full animate-pulse" />
                      <span className="text-xs font-heading font-semibold text-live">LIVE</span>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="font-display text-3xl text-[#4A6458] tracking-widest">VS</div>
                  <div className="flex items-center gap-1.5 text-[#8BA898] text-xs font-body">
                    <FontAwesomeIcon icon={faClock} className="text-[10px] text-gold-400/60" />
                    {formatKuwaitTime(match.kickoffUtc, 'time')} KWT
                  </div>
                </>
              )}
            </div>

            {/* Team B */}
            <div className="flex flex-col items-center gap-3 flex-1">
              <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-border shadow-lg">
                {match.teamB?.countryCode && (
                  <img
                    src={getFlagUrl(match.teamB.countryCode, 'w160')}
                    alt={match.teamB.name}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <div className="text-center">
                <div className="font-display text-xl text-white tracking-wide">
                  {match.teamB?.shortName ?? match.teamBPlaceholder ?? '?'}
                </div>
                <div className="text-xs text-[#4A6458] font-body">
                  {match.teamB?.name ?? match.teamBPlaceholder ?? '?'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PRE-MATCH: COUNTDOWN ── */}
      {isPreMatch && (
        <section className="elevated-card rounded-2xl p-6 mb-5 text-center">
          <div className="text-[11px] font-body uppercase tracking-[0.25em] text-[#4A6458] mb-4">
            Kickoff in
          </div>
          <CountdownTimer targetUtc={match.kickoffUtc} label="" />
          {match.status === 'locked' && (
            <div className="mt-4 flex items-center justify-center gap-2 text-xs text-[#8BA898] font-body">
              <FontAwesomeIcon icon={faLock} className="text-gold-400/60" />
              Predictions are locked
            </div>
          )}
        </section>
      )}

      {/* ── MY PREDICTION ── */}
      <section className="elevated-card rounded-2xl p-5 mb-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-heading font-semibold text-white text-base tracking-wide">
            My Prediction
          </h3>
          {match.status === 'open' && !predLoading && (
            <Link
              to={`/predict/${match.id}`}
              className="text-xs text-gold-400 hover:text-gold-300 font-body transition-colors"
            >
              {myPrediction ? 'Edit →' : 'Predict →'}
            </Link>
          )}
        </div>

        {predLoading ? (
          <div className="animate-pulse bg-pitch-800 rounded-xl h-16" />
        ) : myPrediction ? (
          <div>
            <div className="flex items-center justify-between">
              {/* Predicted score */}
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg overflow-hidden border border-border">
                  {match.teamA?.countryCode && (
                    <img
                      src={getFlagUrl(match.teamA.countryCode, 'w40')}
                      alt={match.teamA.shortName ?? ''}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div className="font-display text-3xl text-white">
                  {myPrediction.predictedScoreA}
                  <span className="text-[#4A6458] mx-2 text-2xl">—</span>
                  {myPrediction.predictedScoreB}
                </div>
                <div className="w-8 h-8 rounded-lg overflow-hidden border border-border">
                  {match.teamB?.countryCode && (
                    <img
                      src={getFlagUrl(match.teamB.countryCode, 'w40')}
                      alt={match.teamB.shortName ?? ''}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
              </div>

              {/* Points (if scored) */}
              {myPrediction.totalPoints !== undefined && (
                <div className="text-right">
                  <div
                    className={cn(
                      'font-display text-2xl',
                      myPrediction.totalPoints > 0 ? 'text-gold-400' : 'text-[#4A6458]',
                    )}
                  >
                    +{myPrediction.totalPoints}
                  </div>
                  <div className="text-[10px] text-[#4A6458] font-body">points</div>
                </div>
              )}
            </div>

            {/* Status indicator */}
            <div className="mt-3 flex items-center gap-2">
              {myPrediction.isLocked ? (
                <div className="flex items-center gap-1.5 text-xs text-[#8BA898] font-body">
                  <FontAwesomeIcon icon={faLock} className="text-gold-400/60 text-[10px]" />
                  Locked in
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-xs text-[#8BA898] font-body">
                  <FontAwesomeIcon icon={faCheckCircle} className="text-live text-[10px]" />
                  Saved · editable until kick-off
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <FontAwesomeIcon icon={faBullseye} className="text-2xl text-[#4A6458]" />
            {match.status === 'open' ? (
              <>
                <div className="text-sm font-body text-[#8BA898]">
                  You haven't predicted this match yet
                </div>
                <Link to={`/predict/${match.id}`} className="btn-gold px-5 py-2 rounded-xl text-sm">
                  Make Prediction
                </Link>
              </>
            ) : (
              <div className="text-sm font-body text-[#4A6458]">No prediction submitted</div>
            )}
          </div>
        )}
      </section>

      {/* ── COMMUNITY PREDICTIONS ── */}
      {showCommunity && (
        <section className="elevated-card rounded-2xl p-5 mb-5">
          <div className="flex items-center gap-2 mb-4">
            <FontAwesomeIcon icon={faUsers} className="text-gold-400/70 text-sm" />
            <h3 className="font-heading font-semibold text-white text-base tracking-wide">
              Community Predictions
            </h3>
          </div>

          {totalPredictions === 0 ? (
            <div className="text-sm text-[#4A6458] font-body text-center py-4">
              No predictions data available
            </div>
          ) : (
            <>
              {/* Win/draw/win bar */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-xs font-heading font-semibold mb-1.5">
                  <span className="text-white">
                    {match.teamA?.shortName ?? match.teamAPlaceholder ?? '?'} {homeWinPct}%
                  </span>
                  <span className="text-[#8BA898]">Draw {drawPct}%</span>
                  <span className="text-white">
                    {awayWinPct}% {match.teamB?.shortName ?? match.teamBPlaceholder ?? '?'}
                  </span>
                </div>
                <div className="flex h-3 rounded-full overflow-hidden gap-0.5">
                  {homeWinPct > 0 && (
                    <div
                      className="bg-gold-400 rounded-l-full"
                      style={{ width: `${homeWinPct}%` }}
                    />
                  )}
                  {drawPct > 0 && <div className="bg-pitch-600" style={{ width: `${drawPct}%` }} />}
                  {awayWinPct > 0 && (
                    <div className="bg-live rounded-r-full" style={{ width: `${awayWinPct}%` }} />
                  )}
                </div>
              </div>

              {/* Avg score + correct count */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-pitch-900/60 rounded-xl p-3 border border-border/60 text-center">
                  <div className="font-display text-2xl text-white">
                    {avgScoreA} — {avgScoreB}
                  </div>
                  <div className="text-[10px] text-[#4A6458] font-body mt-1 uppercase tracking-wider">
                    Avg predicted score
                  </div>
                </div>
                <div className="bg-pitch-900/60 rounded-xl p-3 border border-border/60 text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <FontAwesomeIcon
                      icon={
                        correctPredictions > totalPredictions / 2 ? faCheckCircle : faCircleXmark
                      }
                      className={cn(
                        'text-sm',
                        correctPredictions > totalPredictions / 2 ? 'text-live' : 'text-[#4A6458]',
                      )}
                    />
                    <div className="font-display text-2xl text-white">
                      {correctPredictions}/{totalPredictions}
                    </div>
                  </div>
                  <div className="text-[10px] text-[#4A6458] font-body mt-1 uppercase tracking-wider">
                    Predicted correctly
                  </div>
                </div>
              </div>
            </>
          )}
        </section>
      )}

      {/* ── COMMUNITY PICKS (locked / scored / finished) ── */}
      {['locked', 'scored', 'finished'].includes(match.status) && (
        <CommunityPicksPanel
          matchId={match.id}
          teamAName={match.teamA?.name ?? match.teamAPlaceholder ?? 'Team A'}
          teamBName={match.teamB?.name ?? match.teamBPlaceholder ?? 'Team B'}
        />
      )}

      {/* ── MATCH INFO ── */}
      <section className="elevated-card rounded-2xl p-5">
        <h3 className="font-heading font-semibold text-white text-base tracking-wide mb-4">
          Match Info
        </h3>
        <div className="space-y-3 text-sm">
          {[
            { label: 'Stage', value: getStageName(match.stage) },
            match.groupName ? { label: 'Group', value: `Group ${match.groupName}` } : null,
            { label: 'Venue', value: match.venue },
            { label: 'City', value: match.city },
            { label: 'Date & Time (KWT)', value: formatKuwaitTime(match.kickoffUtc, 'datetime') },
            { label: 'Match #', value: `#${match.matchNumber}` },
          ]
            .filter(Boolean)
            .map(
              (item) =>
                item && (
                  <div
                    key={item.label}
                    className="flex items-center justify-between py-2 border-b border-border/40 last:border-0"
                  >
                    <span className="text-[#4A6458] font-body">{item.label}</span>
                    <span className="text-white font-heading font-medium">{item.value}</span>
                  </div>
                ),
            )}
        </div>
      </section>
    </div>
  )
}

// ── Community Picks Panel (post-kickoff stats) ──
function CommunityPicksPanel({
  matchId,
  teamAName,
  teamBName,
}: {
  matchId: string
  teamAName: string
  teamBName: string
}) {
  const { data: stats, isLoading } = usePredictionStats(matchId, true)

  return (
    <section className="elevated-card rounded-2xl p-5 mb-5">
      <div className="flex items-center gap-2 mb-4">
        <FontAwesomeIcon icon={faUsers} className="text-gold-400/70 text-sm" />
        <h3 className="font-heading font-semibold text-white text-base tracking-wide">
          Community Picks
        </h3>
      </div>

      {isLoading ? (
        <div className="animate-pulse bg-pitch-800 rounded-xl h-20" />
      ) : !stats || stats.totalPredictions === 0 ? (
        <div className="text-sm text-[#4A6458] font-body text-center py-4">
          No predictions data available yet
        </div>
      ) : (
        <>
          {/* Outcome bars */}
          <div className="mb-4">
            <div className="flex items-center justify-between text-xs font-heading font-semibold mb-1.5">
              <span className="text-white">
                {teamAName} {stats.homeWinPct}%
              </span>
              <span className="text-[#8BA898]">Draw {stats.drawPct}%</span>
              <span className="text-white">
                {stats.awayWinPct}% {teamBName}
              </span>
            </div>
            <div className="flex h-3 rounded-full overflow-hidden gap-0.5">
              {stats.homeWinPct > 0 && (
                <div
                  className="bg-gold-400 rounded-l-full"
                  style={{ width: `${stats.homeWinPct}%` }}
                />
              )}
              {stats.drawPct > 0 && (
                <div className="bg-pitch-600" style={{ width: `${stats.drawPct}%` }} />
              )}
              {stats.awayWinPct > 0 && (
                <div className="bg-live rounded-r-full" style={{ width: `${stats.awayWinPct}%` }} />
              )}
            </div>
            <div className="text-[10px] text-[#4A6458] font-body mt-1 text-right">
              {stats.totalPredictions} predictions
            </div>
          </div>

          {/* Avg score */}
          <div className="bg-pitch-900/60 rounded-xl p-3 border border-border/60 text-center mb-3">
            <div className="font-display text-2xl text-white">
              {stats.avgPredictedScoreA} — {stats.avgPredictedScoreB}
            </div>
            <div className="text-[10px] text-[#4A6458] font-body mt-1 uppercase tracking-wider">
              Avg predicted score
            </div>
          </div>

          {/* Top 3 exact score picks */}
          {stats.exactScoreDistribution.length > 0 && (
            <div>
              <div className="text-[10px] text-[#4A6458] font-body uppercase tracking-wider mb-2">
                Top score picks
              </div>
              <div className="flex flex-wrap gap-2">
                {stats.exactScoreDistribution.slice(0, 3).map(({ score, pct }) => (
                  <div
                    key={score}
                    className="flex items-center gap-1.5 bg-pitch-900/60 border border-border/60 rounded-lg px-3 py-1.5"
                  >
                    <span className="font-display text-white text-sm">{score}</span>
                    <span className="text-[#4A6458] font-body text-xs">{pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </section>
  )
}

// ── Status badge ──
function StatusBadge({ status, minute }: { status: string; minute?: number }) {
  if (status === 'live') {
    return (
      <div className="flex items-center gap-1.5 bg-live/10 border border-live/20 rounded-full px-3 py-1">
        <div className="w-1.5 h-1.5 bg-live rounded-full animate-pulse" />
        <span className="text-xs font-heading font-semibold text-live">
          LIVE{minute ? ` · ${minute}'` : ''}
        </span>
      </div>
    )
  }
  if (status === 'finished' || status === 'scored') {
    return (
      <div className="bg-pitch-700 border border-border rounded-full px-3 py-1 text-xs font-heading text-[#8BA898]">
        Full Time
      </div>
    )
  }
  if (status === 'locked') {
    return (
      <div className="flex items-center gap-1.5 bg-gold-400/10 border border-gold-400/20 rounded-full px-3 py-1">
        <FontAwesomeIcon icon={faLock} className="text-gold-400 text-[9px]" />
        <span className="text-xs font-heading text-gold-400">Locked</span>
      </div>
    )
  }
  if (status === 'open') {
    return (
      <div className="bg-live/10 border border-live/20 rounded-full px-3 py-1 text-xs font-heading text-live">
        Open
      </div>
    )
  }
  return (
    <div className="bg-pitch-700 border border-border rounded-full px-3 py-1 text-xs font-heading text-[#4A6458]">
      Scheduled
    </div>
  )
}
