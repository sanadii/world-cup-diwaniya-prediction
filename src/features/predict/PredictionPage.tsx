import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useTranslation } from 'react-i18next'
import {
  faLock,
  faCheckCircle,
  faEdit,
  faBullseye,
  faLocationDot,
  faTrophy,
  faChevronLeft,
  faTriangleExclamation,
  faSpinner,
  faStar,
} from '@fortawesome/free-solid-svg-icons'
import { cn, getStageKey, formatKuwaitTime } from '@/lib/utils'
import { useMatch } from '@/hooks/useMatch'
import { useMyPrediction } from '@/hooks/usePredictions'
import { useSavePrediction } from '@/hooks/useSavePrediction'
import { useAuthContext } from '@/contexts/useAuthContext'
import { CountdownTimer } from '@/components/match-card/CountdownTimer'
import { calculatePoints, DEFAULT_POINTS, STAGE_BONUS } from '@/lib/scoring'
import type { Match } from '@/types/app'

// ─── Score Input ────────────────────────────────────────────────────────────

function ScoreInput({
  value,
  onChange,
  disabled,
}: {
  value: number
  onChange: (v: number) => void
  disabled?: boolean
}) {
  return (
    <input
      type="number"
      min={0}
      max={20}
      value={value}
      onChange={(e) => {
        const v = Math.max(0, Math.min(20, parseInt(e.target.value) || 0))
        onChange(v)
      }}
      disabled={disabled}
      className={cn(
        'w-24 h-20 text-4xl font-display text-center rounded-xl border-2 outline-none transition-all',
        'bg-pitch-800 text-white tracking-widest',
        disabled
          ? 'border-border/40 opacity-60 cursor-not-allowed'
          : 'border-border focus:border-gold-500 focus:shadow-gold-sm',
      )}
    />
  )
}

// ─── Match Header ────────────────────────────────────────────────────────────

function MatchHeader({ match }: { match: Match }) {
  const { t } = useTranslation()
  const isKnockout = match.stage !== 'group'
  return (
    <div className="elevated-card rounded-2xl p-6">
      {/* Stage / venue */}
      <div className="flex flex-col items-center gap-1 mb-6">
        <span className="text-xs font-heading uppercase tracking-widest text-[#4A6458]">
          {t(getStageKey(match.stage))}
          {match.groupName && ` · ${t('matchDetail.group')} ${match.groupName}`}
          {isKnockout && ` · ${t('predict.knockout')}`}
        </span>
        <div className="flex items-center gap-1.5">
          <FontAwesomeIcon icon={faLocationDot} className="text-[10px] text-[#4A6458]" />
          <span className="text-[11px] text-[#4A6458] font-body">
            {match.venue} · {match.city}
          </span>
        </div>
        <span className="text-xs text-[#8BA898] font-body mt-1">
          {formatKuwaitTime(match.kickoffUtc, 'datetime')} ({t('predict.kuwaitTime')})
        </span>
      </div>

      {/* Teams */}
      <div className="flex items-center justify-between gap-4">
        <TeamBadge
          name={match.teamA?.name ?? match.teamAPlaceholder ?? '?'}
          shortName={match.teamA?.shortName ?? match.teamAPlaceholder ?? '?'}
          flagUrl={match.teamA?.flagUrl ?? null}
          align="left"
        />
        <div className="flex-shrink-0 font-display text-3xl text-[#4A6458] tracking-widest">VS</div>
        <TeamBadge
          name={match.teamB?.name ?? match.teamBPlaceholder ?? '?'}
          shortName={match.teamB?.shortName ?? match.teamBPlaceholder ?? '?'}
          flagUrl={match.teamB?.flagUrl ?? null}
          align="right"
        />
      </div>
    </div>
  )
}

function TeamBadge({
  name,
  shortName,
  flagUrl,
  align,
}: {
  name: string
  shortName: string
  flagUrl: string | null
  align: 'left' | 'right'
}) {
  return (
    <div
      className={cn('flex flex-col items-center gap-3 flex-1 min-w-0', align === 'left' ? '' : '')}
    >
      <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-border shadow-card flex-shrink-0">
        {flagUrl && <img src={flagUrl} alt={name} className="w-full h-full object-cover" />}
      </div>
      <div className="text-center">
        <div className="font-heading font-semibold text-white text-sm leading-tight">{name}</div>
        <div className="text-[10px] text-[#4A6458] font-body mt-0.5">{shortName}</div>
      </div>
    </div>
  )
}

// ─── Status Banner ───────────────────────────────────────────────────────────

function StatusBanner({ match }: { match: Match }) {
  const { t } = useTranslation()
  const { status } = match

  if (status === 'open') {
    return (
      <div className="rounded-xl px-4 py-3 bg-open/10 border border-open/30 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-open animate-pulse" />
          <span className="text-sm font-heading font-semibold text-open tracking-wide uppercase">
            {t('predict.predictionsOpen')}
          </span>
        </div>
        <CountdownTimer targetUtc={match.kickoffUtc} label={t('predict.locksIn')} compact />
      </div>
    )
  }

  if (status === 'locked' || status === 'live') {
    return (
      <div className="rounded-xl px-4 py-3 bg-locked/10 border border-locked/30 flex items-center gap-2">
        <FontAwesomeIcon icon={faLock} className="text-locked text-sm" />
        <span className="text-sm font-heading font-semibold text-locked tracking-wide uppercase">
          {t('predict.predictionsLocked')}
        </span>
        {status === 'live' && (
          <span className="ml-auto text-xs font-body text-live">{t('predict.live')}</span>
        )}
      </div>
    )
  }

  if (status === 'finished' || status === 'scored') {
    const scoreA = match.fullTimeScoreA ?? '?'
    const scoreB = match.fullTimeScoreB ?? '?'
    return (
      <div className="rounded-xl px-4 py-3 bg-pitch-800 border border-border flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <FontAwesomeIcon icon={faCheckCircle} className="text-[#4A6458]" />
          <span className="text-sm font-heading font-semibold text-[#8BA898] tracking-wide uppercase">
            {t('predict.finalResult')}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-display text-2xl text-white">{scoreA}</span>
          <span className="font-display text-lg text-[#4A6458]">–</span>
          <span className="font-display text-2xl text-white">{scoreB}</span>
        </div>
        {match.wentToPenalties && (
          <span className="text-xs text-[#4A6458] font-body">
            (P: {match.penaltyScoreA}–{match.penaltyScoreB})
          </span>
        )}
      </div>
    )
  }

  return null
}

// ─── Points Preview ──────────────────────────────────────────────────────────

function PointsPreview({
  match,
  scoreA,
  scoreB,
  winnerTeamId,
  predPenalties,
  penaltyA,
  penaltyB,
}: {
  match: Match
  scoreA: number
  scoreB: number
  winnerTeamId?: string
  predPenalties?: boolean
  penaltyA?: number
  penaltyB?: number
}) {
  const maxPossible = (() => {
    const base =
      DEFAULT_POINTS.validSubmission +
      DEFAULT_POINTS.lockedAtKickoff +
      DEFAULT_POINTS.correctWinnerOrOutcome +
      DEFAULT_POINTS.exactFullTimeScore +
      (STAGE_BONUS[match.stage] ?? 0)
    const penBonus =
      match.stage !== 'group'
        ? DEFAULT_POINTS.correctlyPredictedPenalties + DEFAULT_POINTS.exactPenaltyScore
        : 0
    return base + penBonus
  })()

  // Live estimate — pretend these scores are correct
  const estimatedPts = (() => {
    const derivedWinner =
      match.stage !== 'group' && winnerTeamId
        ? winnerTeamId
        : scoreA > scoreB
          ? (match.teamA?.id ?? '')
          : scoreB > scoreA
            ? (match.teamB?.id ?? '')
            : (match.teamA?.id ?? '') // draw tiebreaker placeholder

    return calculatePoints({
      stage: match.stage,
      actualScoreA: scoreA,
      actualScoreB: scoreB,
      wentToPenalties: predPenalties,
      actualPenaltyA: penaltyA,
      actualPenaltyB: penaltyB,
      actualWinnerTeamId: derivedWinner,
      predScoreA: scoreA,
      predScoreB: scoreB,
      predWinnerTeamId: winnerTeamId,
      predPenalties,
      predPenaltyA: penaltyA,
      predPenaltyB: penaltyB,
      isSubmitted: true,
      isLocked: true,
    })
  })()

  return <PointsPreviewInner match={match} estimatedPts={estimatedPts} maxPossible={maxPossible} />
}

function PointsPreviewInner({
  match,
  estimatedPts,
  maxPossible,
}: {
  match: Match
  estimatedPts: number
  maxPossible: number
}) {
  const { t } = useTranslation()
  return (
    <div className="glass-card rounded-xl p-4 border border-gold-500/20">
      <div className="flex items-center gap-2 mb-3">
        <FontAwesomeIcon icon={faStar} className="text-gold-400 text-sm" />
        <span className="text-xs font-heading uppercase tracking-widest text-[#8BA898]">
          {t('predict.pointsPreview')}
        </span>
      </div>

      <div className="flex items-end justify-between">
        <div>
          <div className="text-3xl font-display text-gold-400 leading-none">{estimatedPts}</div>
          <div className="text-[11px] text-[#4A6458] font-body mt-1">
            {t('predict.potentialPoints')}
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-[#4A6458] font-body">{t('predict.maxPossible')}</div>
          <div className="text-sm font-heading font-semibold text-[#8BA898]">
            {maxPossible} {t('predict.pts')}
          </div>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-border/60 grid grid-cols-2 gap-1.5 text-[11px] font-body text-[#4A6458]">
        <span>
          {t('predict.submissionLabel')}: +{DEFAULT_POINTS.validSubmission}
        </span>
        <span>
          {t('predict.lockedKickoff')}: +{DEFAULT_POINTS.lockedAtKickoff}
        </span>
        <span>
          {t('predict.correctOutcome')}: +{DEFAULT_POINTS.correctWinnerOrOutcome}
        </span>
        <span>
          {t('predict.exactScore')}: +{DEFAULT_POINTS.exactFullTimeScore}
        </span>
        {match.stage !== 'group' && (
          <>
            <span>
              {t('predict.stageBonus')}: +{STAGE_BONUS[match.stage] ?? 0}
            </span>
            <span>
              {t('predict.penaltiesLabel')}: +
              {DEFAULT_POINTS.correctlyPredictedPenalties + DEFAULT_POINTS.exactPenaltyScore}
            </span>
          </>
        )}
      </div>
    </div>
  )
}

// ─── My Prediction Panel ─────────────────────────────────────────────────────

function MyPredictionPanel({
  prediction,
  match,
  onEdit,
}: {
  prediction: NonNullable<ReturnType<typeof useMyPrediction>['data']>
  match: Match
  onEdit: () => void
}) {
  const { t } = useTranslation()
  return (
    <div className="elevated-card rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-heading uppercase tracking-widest text-[#8BA898]">
          {t('predict.yourPrediction')}
        </span>
        {match.status === 'open' && (
          <button
            onClick={onEdit}
            className="flex items-center gap-1.5 text-xs font-heading text-gold-400 hover:text-gold-300 transition-colors"
          >
            <FontAwesomeIcon icon={faEdit} />
            {t('predict.edit')}
          </button>
        )}
      </div>

      <div className="flex items-center justify-center gap-6">
        <div className="text-center">
          {match.teamA?.flagUrl && (
            <img
              src={match.teamA.flagUrl}
              alt={match.teamA.name}
              className="w-10 h-10 rounded-lg object-cover mx-auto mb-1"
            />
          )}
          <div className="font-display text-3xl text-white">{prediction.predictedScoreA}</div>
          <div className="text-[10px] text-[#4A6458] font-body">
            {match.teamA?.shortName ?? match.teamAPlaceholder ?? '?'}
          </div>
        </div>
        <div className="font-display text-xl text-[#4A6458]">–</div>
        <div className="text-center">
          {match.teamB?.flagUrl && (
            <img
              src={match.teamB.flagUrl}
              alt={match.teamB.name}
              className="w-10 h-10 rounded-lg object-cover mx-auto mb-1"
            />
          )}
          <div className="font-display text-3xl text-white">{prediction.predictedScoreB}</div>
          <div className="text-[10px] text-[#4A6458] font-body">
            {match.teamB?.shortName ?? match.teamBPlaceholder ?? '?'}
          </div>
        </div>
      </div>

      {prediction.predictedWinnerTeamId && (
        <div className="mt-3 text-center">
          <span className="text-[11px] text-[#4A6458] font-body">{t('predict.winnerLabel')}: </span>
          <span className="text-xs font-heading font-semibold text-white">
            {prediction.predictedWinnerTeamId === match.teamA?.id
              ? (match.teamA?.name ?? match.teamAPlaceholder ?? '?')
              : (match.teamB?.name ?? match.teamBPlaceholder ?? '?')}
          </span>
          {prediction.predictsPenalties && (
            <span className="ml-2 text-[11px] text-[#4A6458]">
              · {t('matchCard.penalties')}: {prediction.predictedPenaltyScoreA}–
              {prediction.predictedPenaltyScoreB}
            </span>
          )}
        </div>
      )}

      {prediction.isLocked && (
        <div className="mt-2 flex items-center justify-center gap-1.5">
          <FontAwesomeIcon icon={faLock} className="text-[10px] text-[#4A6458]" />
          <span className="text-[10px] text-[#4A6458] font-body">{t('predict.locked')}</span>
        </div>
      )}

      {match.status === 'scored' && prediction.totalPoints !== undefined && (
        <div className="mt-3 pt-3 border-t border-border/60 text-center">
          <span className="text-xs text-[#8BA898] font-body">{t('predict.pointsAwarded')}: </span>
          <span className="text-lg font-display text-gold-400">+{prediction.totalPoints}</span>
        </div>
      )}
    </div>
  )
}

// ─── Community Predictions Panel ──────────────────────────────────────────────

function CommunityPanel({ teamAName, teamBName }: { teamAName: string; teamBName: string }) {
  const { t } = useTranslation()
  // Shows post-match community prediction distribution
  return (
    <div className="elevated-card rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <FontAwesomeIcon icon={faTrophy} className="text-gold-400 text-sm" />
        <span className="text-xs font-heading uppercase tracking-widest text-[#8BA898]">
          {t('predict.communityPredictions')}
        </span>
      </div>
      <div className="space-y-2 text-sm font-body text-[#8BA898]">
        <div className="flex justify-between">
          <span>
            {teamAName} {t('predict.homeWin')}
          </span>
          <span className="text-white font-heading">—</span>
        </div>
        <div className="flex justify-between">
          <span>{t('predict.draw')}</span>
          <span className="text-white font-heading">—</span>
        </div>
        <div className="flex justify-between">
          <span>
            {teamBName} {t('predict.homeWin')}
          </span>
          <span className="text-white font-heading">—</span>
        </div>
      </div>
      <p className="text-[10px] text-[#4A6458] font-body mt-3">
        {t('predict.communityStatsAfter')}
      </p>
    </div>
  )
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export function PredictionPage() {
  const { t } = useTranslation()
  const { matchId } = useParams<{ matchId: string }>()
  const navigate = useNavigate()
  const { user } = useAuthContext()

  const { data: match, isLoading: matchLoading, error: matchError } = useMatch(matchId)
  const { data: prediction, isLoading: predLoading } = useMyPrediction(matchId)
  const savePrediction = useSavePrediction()

  const [editing, setEditing] = useState(false)
  const [scoreA, setScoreA] = useState(0)
  const [scoreB, setScoreB] = useState(0)
  const [winnerTeamId, setWinnerTeamId] = useState<string | undefined>()
  const [predPenalties, setPredPenalties] = useState(false)
  const [penaltyA, setPenaltyA] = useState(0)
  const [penaltyB, setPenaltyB] = useState(0)
  const [formError, setFormError] = useState<string | null>(null)

  const isKnockout = match?.stage !== 'group'
  const showForm = match?.status === 'open' && (editing || !prediction)

  // Pre-populate form when user clicks Edit — set state at the call site, not in an effect
  function startEditing() {
    if (prediction) {
      setScoreA(prediction.predictedScoreA)
      setScoreB(prediction.predictedScoreB)
      setWinnerTeamId(prediction.predictedWinnerTeamId ?? undefined)
      setPredPenalties(prediction.predictsPenalties ?? false)
      setPenaltyA(prediction.predictedPenaltyScoreA ?? 0)
      setPenaltyB(prediction.predictedPenaltyScoreB ?? 0)
    }
    setEditing(true)
  }

  function validate(): string | null {
    if (scoreA < 0 || scoreA > 20 || scoreB < 0 || scoreB > 20) return t('predict.invalidScore')
    if (isKnockout && !winnerTeamId) return t('predict.selectWinner')
    if (isKnockout && predPenalties) {
      if (penaltyA < 0 || penaltyB < 0) return t('predict.negPenalties')
      if (!winnerTeamId) return t('predict.penaltyWinnerRequired')
      const winnerByPenalty = penaltyA > penaltyB ? match?.teamA?.id : match?.teamB?.id
      if (winnerByPenalty !== winnerTeamId) return t('predict.penaltyWinnerMismatch')
    }
    return null
  }

  async function handleSubmit() {
    if (!match || !user) return
    const err = validate()
    if (err) {
      setFormError(err)
      return
    }
    setFormError(null)

    await savePrediction.mutateAsync({
      matchId: match.id,
      predictedScoreA: scoreA,
      predictedScoreB: scoreB,
      predictedWinnerTeamId: isKnockout ? winnerTeamId : undefined,
      predictsPenalties: isKnockout ? predPenalties : undefined,
      predictedPenaltyScoreA: isKnockout && predPenalties ? penaltyA : undefined,
      predictedPenaltyScoreB: isKnockout && predPenalties ? penaltyB : undefined,
    })
    setEditing(false)
  }

  if (matchLoading || predLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <FontAwesomeIcon icon={faSpinner} spin className="text-gold-400 text-3xl" />
      </div>
    )
  }

  if (matchError || !match) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-center px-4">
        <FontAwesomeIcon icon={faTriangleExclamation} className="text-locked text-3xl" />
        <div className="font-display text-3xl text-white">{t('predict.matchNotFound')}</div>
        <button
          onClick={() => navigate('/matches')}
          className="btn-gold px-6 py-2 rounded-xl text-sm mt-2"
        >
          {t('predict.backToMatches')}
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4 animate-fade-in">
      {/* Back nav */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-[#4A6458] hover:text-white transition-colors text-sm font-body"
      >
        <FontAwesomeIcon icon={faChevronLeft} className="text-xs" />
        {t('predict.back')}
      </button>

      {/* Page title */}
      <h1 className="font-display text-4xl text-white tracking-wider">{t('predict.title')}</h1>

      {/* Match header */}
      <MatchHeader match={match} />

      {/* Status banner */}
      <StatusBanner match={match} />

      {/* My current prediction (if exists and not editing) */}
      {prediction && !editing && (
        <MyPredictionPanel prediction={prediction} match={match} onEdit={startEditing} />
      )}

      {/* Prediction form */}
      {showForm && (
        <div className="elevated-card rounded-2xl p-6 space-y-6">
          <h2 className="font-heading text-lg font-semibold text-white uppercase tracking-wide">
            {prediction ? t('predict.editPrediction') : t('predict.yourPrediction')}
          </h2>

          {/* Score inputs */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-heading font-semibold text-[#8BA898] uppercase tracking-wider px-1">
              <span>{match.teamA?.shortName ?? match.teamAPlaceholder ?? '?'}</span>
              <span>{match.teamB?.shortName ?? match.teamBPlaceholder ?? '?'}</span>
            </div>
            <div className="flex items-center justify-center gap-6">
              <ScoreInput value={scoreA} onChange={setScoreA} />
              <span className="font-display text-3xl text-[#4A6458]">–</span>
              <ScoreInput value={scoreB} onChange={setScoreB} />
            </div>
          </div>

          {/* Knockout extras */}
          {isKnockout && (
            <div className="space-y-4">
              {/* Winner selector */}
              <div className="space-y-2">
                <div className="text-xs font-heading uppercase tracking-widest text-[#4A6458]">
                  {t('predict.whoAdvances')}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {([match.teamA, match.teamB] as const).filter(Boolean).map((team) => (
                    <button
                      key={team!.id}
                      onClick={() => setWinnerTeamId(team!.id)}
                      className={cn(
                        'flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all',
                        winnerTeamId === team!.id
                          ? 'border-gold-500 bg-gold-500/10 shadow-gold-sm'
                          : 'border-border bg-pitch-800 hover:border-border-glow',
                      )}
                    >
                      {team!.flagUrl && (
                        <img
                          src={team!.flagUrl}
                          alt={team!.name}
                          className="w-10 h-10 rounded-lg object-cover"
                        />
                      )}
                      <span
                        className={cn(
                          'text-xs font-heading font-semibold',
                          winnerTeamId === team!.id ? 'text-gold-400' : 'text-white',
                        )}
                      >
                        {team!.shortName}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Penalties toggle */}
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={predPenalties}
                  onChange={(e) => setPredPenalties(e.target.checked)}
                  className="w-4 h-4 accent-gold-400 rounded"
                />
                <span className="text-sm font-body text-[#8BA898]">
                  {t('predict.goesToPenalties')}
                </span>
              </label>

              {/* Penalty scores */}
              {predPenalties && (
                <div className="space-y-2 pl-4 border-l-2 border-gold-500/30">
                  <div className="text-xs font-heading uppercase tracking-widest text-[#4A6458]">
                    {t('predict.penaltyShootout')}
                  </div>
                  <div className="flex items-center justify-center gap-6">
                    <ScoreInput value={penaltyA} onChange={setPenaltyA} />
                    <span className="font-display text-3xl text-[#4A6458]">–</span>
                    <ScoreInput value={penaltyB} onChange={setPenaltyB} />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Error */}
          {(formError || savePrediction.isError) && (
            <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-locked/10 border border-locked/30">
              <FontAwesomeIcon
                icon={faTriangleExclamation}
                className="text-locked text-sm mt-0.5 flex-shrink-0"
              />
              <span className="text-sm font-body text-locked">
                {formError ?? t('predict.failedToSave')}
              </span>
            </div>
          )}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={savePrediction.isPending}
            className="btn-gold w-full py-4 rounded-xl text-base font-heading font-semibold uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {savePrediction.isPending ? (
              <FontAwesomeIcon icon={faSpinner} spin />
            ) : (
              <FontAwesomeIcon icon={faBullseye} />
            )}
            {savePrediction.isPending ? t('predict.saving') : t('predict.submitPrediction')}
          </button>

          {prediction && (
            <button
              onClick={() => {
                setEditing(false)
                setFormError(null)
              }}
              className="w-full py-2 text-sm font-body text-[#4A6458] hover:text-[#8BA898] transition-colors"
            >
              {t('predict.cancel')}
            </button>
          )}
        </div>
      )}

      {/* Points preview (only when form is visible) */}
      {showForm && (
        <PointsPreview
          match={match}
          scoreA={scoreA}
          scoreB={scoreB}
          winnerTeamId={winnerTeamId}
          predPenalties={predPenalties}
          penaltyA={penaltyA}
          penaltyB={penaltyB}
        />
      )}

      {/* Community predictions (after match ends) */}
      {(match.status === 'finished' || match.status === 'scored') && (
        <CommunityPanel
          teamAName={match.teamA?.name ?? match.teamAPlaceholder ?? '?'}
          teamBName={match.teamB?.name ?? match.teamBPlaceholder ?? '?'}
        />
      )}
    </div>
  )
}
