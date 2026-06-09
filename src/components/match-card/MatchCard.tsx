import { memo, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faLocationDot,
  faLock,
  faCirclePlay,
  faCheckCircle,
  faStarHalfStroke,
  faClock,
  faBullseye,
  faXmark,
  faPen,
} from '@fortawesome/free-solid-svg-icons'
import { useTranslation } from 'react-i18next'
import { cn, getStageKey } from '@/lib/utils'
import { getTeamNameAr } from '@/lib/teamNamesAr'
import { PredictModal } from './PredictModal'
import type { Match, Prediction } from '@/types/app'

interface MatchCardProps {
  match: Match
  prediction?: Prediction
  showPredictButton?: boolean
  compact?: boolean
  animationClass?: string
}

export const MatchCard = memo(function MatchCard({
  match,
  prediction,
  showPredictButton = true,
  compact = false,
  animationClass,
}: MatchCardProps) {
  const { t, i18n } = useTranslation()
  const [modalOpen, setModalOpen] = useState(false)
  const isAr = i18n.language === 'ar'

  function teamName(en: string | null | undefined, placeholder: string | null | undefined): string {
    const raw = en ?? placeholder ?? '?'
    return isAr && en ? getTeamNameAr(en) : raw
  }

  const statusConfig = useMemo(
    () => ({
      scheduled: {
        label: t('matchCard.statusScheduled'),
        className: 'badge-finished',
        icon: faClock,
      },
      open: { label: t('matchCard.statusOpen'), className: 'badge-open', icon: faCirclePlay },
      locked: { label: t('matchCard.statusLocked'), className: 'badge-locked', icon: faLock },
      live: { label: t('matchCard.statusLive'), className: 'badge-live', icon: faCirclePlay },
      finished: {
        label: t('matchCard.statusFinished'),
        className: 'badge-finished',
        icon: faCheckCircle,
      },
      scored: {
        label: t('matchCard.statusScored'),
        className: 'badge-scored',
        icon: faStarHalfStroke,
      },
      postponed: {
        label: t('matchCard.statusPostponed'),
        className: 'badge-finished',
        icon: faClock,
      },
      cancelled: {
        label: t('matchCard.statusCancelled'),
        className: 'badge-locked',
        icon: faXmark,
      },
    }),
    [t],
  )

  const isLive = match.status === 'live'
  const hasScore = match.fullTimeScoreA !== undefined && match.fullTimeScoreB !== undefined
  const canPredict = match.status === 'open'
  const hasPrediction = !!prediction
  const status = statusConfig[match.status] ?? statusConfig.scheduled

  return (
    <>
      <div className={cn('elevated-card rounded-2xl overflow-hidden group', animationClass)}>
        {/* Top bar: stage + status */}
        <div className="flex items-center justify-between gap-2 px-4 pt-3.5 pb-2.5 border-b border-border/60 min-w-0">
          <span className="text-[10px] font-heading font-semibold uppercase text-muted truncate min-w-0">
            {t(getStageKey(match.stage))}
            {match.groupName && ` · ${t('matchCard.groupLabel')} ${match.groupName}`}
          </span>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {hasPrediction && !isLive && (
              <span className="flex items-center gap-1 text-[9px] font-heading font-semibold uppercase px-2 py-0.5 rounded-full bg-gold-400/12 border border-gold-400/25 text-gold-400">
                <FontAwesomeIcon icon={faCheckCircle} className="text-[8px]" />
                {t('matchCard.predicted')}
              </span>
            )}
            {isLive && (
              <div className="flex items-center gap-1.5">
                <div className="live-dot" />
                <span className="text-[11px] font-heading font-semibold text-live">
                  {t('matchCard.statusLive')}
                </span>
              </div>
            )}
            <span
              className={cn(
                'flex items-center gap-1 text-[10px] font-heading font-semibold uppercase px-2 py-0.5 rounded-full',
                status.className,
              )}
            >
              <FontAwesomeIcon icon={status.icon} className="text-[9px]" />
              {status.label}
            </span>
          </div>
        </div>

        {/* Match body */}
        <Link
          to={`/matches/${match.id}`}
          className="block px-4 py-4 hover:bg-pitch-800/50 transition-colors"
        >
          <div className="flex items-center justify-between gap-3">
            {/* Team A */}
            <TeamDisplay
              name={teamName(match.teamA?.name, match.teamAPlaceholder)}
              shortName={match.teamA?.shortName ?? match.teamAPlaceholder ?? '?'}
              flagUrl={match.teamA?.flagUrl ?? null}
              compact={compact}
              align="left"
            />

            {/* Score / VS */}
            <div className="flex-shrink-0 flex flex-col items-center gap-1">
              {hasScore ? (
                <div
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-xl',
                    isLive ? 'bg-live/10 border border-live/20' : 'bg-pitch-800/60',
                  )}
                >
                  <span
                    className={cn(
                      'font-display text-3xl tracking-wider',
                      isLive ? 'text-white' : 'text-white/90',
                    )}
                  >
                    {match.fullTimeScoreA}
                  </span>
                  <span className="font-display text-xl text-muted">:</span>
                  <span
                    className={cn(
                      'font-display text-3xl tracking-wider',
                      isLive ? 'text-white' : 'text-white/90',
                    )}
                  >
                    {match.fullTimeScoreB}
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <span className="font-display text-2xl text-secondary/60 tracking-widest">
                    VS
                  </span>
                  <span className="text-[11px] font-body text-muted mt-1 whitespace-nowrap">
                    {new Date(match.kickoffUtc).toLocaleDateString('en-US', {
                      timeZone: 'Asia/Kuwait',
                      month: 'short',
                      day: 'numeric',
                    })}
                    {' · '}
                    {new Date(match.kickoffUtc).toLocaleTimeString('en-US', {
                      timeZone: 'Asia/Kuwait',
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true,
                    })}{' '}
                    {t('dashboard.kwt')}
                  </span>
                </div>
              )}

              {/* Prediction result if scored */}
              {prediction && match.status === 'scored' && prediction.totalPoints !== undefined && (
                <span className="text-xs font-heading font-semibold text-gold-400 mt-1">
                  +{prediction.totalPoints} {t('leaderboard.pts')}
                </span>
              )}
            </div>

            {/* Team B */}
            <TeamDisplay
              name={teamName(match.teamB?.name, match.teamBPlaceholder)}
              shortName={match.teamB?.shortName ?? match.teamBPlaceholder ?? '?'}
              flagUrl={match.teamB?.flagUrl ?? null}
              compact={compact}
              align="right"
            />
          </div>

          {/* Venue */}
          {!compact && (match.venue ?? match.city) && (
            <div className="flex items-center justify-center gap-1.5 mt-3">
              <FontAwesomeIcon icon={faLocationDot} className="text-[10px] text-muted" />
              <span className="text-[11px] text-muted font-body">
                {[match.venue, match.city].filter(Boolean).join(' · ')}
              </span>
            </div>
          )}
        </Link>

        {/* Prediction bar */}
        {prediction && (
          <div className="mx-4 mb-3 px-3 py-2 rounded-xl bg-pitch-800/60 border border-white/8 flex items-center justify-between">
            <span className="text-[11px] text-secondary font-body">
              {t('matchCard.yourPrediction')}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs font-heading font-semibold text-white">
                {prediction.predictedScoreA} – {prediction.predictedScoreB}
              </span>
              {prediction.isLocked && (
                <FontAwesomeIcon icon={faLock} className="text-[10px] text-muted" />
              )}
            </div>
          </div>
        )}

        {/* CTA button */}
        {showPredictButton && canPredict && (
          <div className="px-4 pb-4">
            <button
              onClick={() => setModalOpen(true)}
              className={cn(
                'w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-heading font-semibold tracking-wide transition-all',
                hasPrediction
                  ? 'bg-pitch-800/60 border border-white/10 hover:border-white/20 text-secondary hover:text-white'
                  : 'btn-gold',
              )}
            >
              <FontAwesomeIcon icon={hasPrediction ? faPen : faBullseye} className="text-xs" />
              {hasPrediction ? t('matchCard.update') : t('matchCard.predict')}
            </button>
          </div>
        )}
      </div>

      {/* Inline predict modal — no page navigation */}
      {modalOpen && (
        <PredictModal match={match} prediction={prediction} onClose={() => setModalOpen(false)} />
      )}
    </>
  )
})

function TeamDisplay({
  name,
  shortName,
  flagUrl,
  compact,
  align,
}: {
  name: string
  shortName: string
  flagUrl: string | null
  compact: boolean
  align: 'left' | 'right'
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center gap-2 flex-1 min-w-0',
        align === 'left' ? 'items-start sm:items-center' : 'items-end sm:items-center',
      )}
    >
      <div
        className={cn(
          'rounded-full overflow-hidden border-2 border-white/10 shadow-card flex-shrink-0 bg-pitch-700',
          compact ? 'w-10 h-10' : 'w-14 h-14',
        )}
      >
        {flagUrl && (
          <img src={flagUrl} alt={name} className="w-full h-full object-cover" loading="lazy" />
        )}
      </div>
      <div
        className={cn(
          'text-center',
          align === 'left' ? 'sm:text-center text-left' : 'sm:text-center text-right',
        )}
      >
        <div
          className={cn(
            'font-heading font-semibold text-white leading-none',
            compact ? 'text-xs' : 'text-sm',
          )}
        >
          {compact ? shortName : name}
        </div>
        {!compact && <div className="text-[10px] text-muted font-body mt-0.5">{shortName}</div>}
      </div>
    </div>
  )
}
