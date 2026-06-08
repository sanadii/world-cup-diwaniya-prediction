import { Link } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faLocationDot,
  faLock,
  faCirclePlay,
  faCheckCircle,
  faStarHalfStroke,
  faClock,
} from '@fortawesome/free-solid-svg-icons'
import { cn, getStageName } from '@/lib/utils'
import type { Match, Prediction } from '@/types/app'

interface MatchCardProps {
  match: Match
  prediction?: Prediction
  showPredictButton?: boolean
  compact?: boolean
  animationClass?: string
}

const statusConfig = {
  scheduled: { label: 'Scheduled', className: 'badge-finished', icon: faClock },
  open: { label: 'Open', className: 'badge-open', icon: faCirclePlay },
  locked: { label: 'Locked', className: 'badge-locked', icon: faLock },
  live: { label: 'Live', className: 'badge-live', icon: faCirclePlay },
  finished: { label: 'Finished', className: 'badge-finished', icon: faCheckCircle },
  scored: { label: 'Scored', className: 'badge-scored', icon: faStarHalfStroke },
  postponed: { label: 'Postponed', className: 'badge-finished', icon: faClock },
  cancelled: { label: 'Cancelled', className: 'badge-locked', icon: faXmark },
}

import { faXmark } from '@fortawesome/free-solid-svg-icons'

export function MatchCard({
  match,
  prediction,
  showPredictButton = true,
  compact = false,
  animationClass,
}: MatchCardProps) {
  const isLive = match.status === 'live'
  const hasScore = match.fullTimeScoreA !== undefined && match.fullTimeScoreB !== undefined
  const canPredict = match.status === 'open'
  const status = statusConfig[match.status] ?? statusConfig.scheduled

  return (
    <div className={cn('elevated-card rounded-2xl overflow-hidden group', animationClass)}>
      {/* Top bar: stage + status */}
      <div className="flex items-center justify-between px-4 pt-3.5 pb-2.5 border-b border-border/60">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-heading font-semibold tracking-widest uppercase text-[#4A6458]">
            {getStageName(match.stage)}
            {match.groupName && ` · Group ${match.groupName}`}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {isLive && (
            <div className="flex items-center gap-1.5">
              <div className="live-dot" />
              <span className="text-[11px] font-heading font-semibold text-live tracking-wide">
                LIVE
              </span>
            </div>
          )}
          <span
            className={cn(
              'flex items-center gap-1 text-[10px] font-heading font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full',
              status.className,
            )}
          >
            <FontAwesomeIcon icon={status.icon} className="text-[9px]" />
            {status.label}
          </span>
        </div>
      </div>

      {/* Match body */}
      <div className="px-4 py-4">
        <div className="flex items-center justify-between gap-3">
          {/* Team A */}
          <TeamDisplay
            name={match.teamA?.name ?? match.teamAPlaceholder ?? '?'}
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
                  isLive ? 'bg-live/10 border border-live/20' : 'bg-pitch-700/60',
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
                <span className="font-display text-xl text-[#4A6458]">:</span>
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
                <span className="font-display text-2xl text-[#8BA898]/60 tracking-widest">VS</span>
                <span className="text-[11px] font-body text-[#4A6458] mt-1 whitespace-nowrap">
                  {new Date(match.kickoffUtc).toLocaleString('en-KW', {
                    timeZone: 'Asia/Kuwait',
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </span>
              </div>
            )}

            {/* Prediction result if scored */}
            {prediction && match.status === 'scored' && prediction.totalPoints !== undefined && (
              <span className="text-xs font-heading font-semibold text-gold-400 mt-1">
                +{prediction.totalPoints} pts
              </span>
            )}
          </div>

          {/* Team B */}
          <TeamDisplay
            name={match.teamB?.name ?? match.teamBPlaceholder ?? '?'}
            shortName={match.teamB?.shortName ?? match.teamBPlaceholder ?? '?'}
            flagUrl={match.teamB?.flagUrl ?? null}
            compact={compact}
            align="right"
          />
        </div>

        {/* Venue */}
        {!compact && (
          <div className="flex items-center justify-center gap-1.5 mt-3">
            <FontAwesomeIcon icon={faLocationDot} className="text-[10px] text-[#4A6458]" />
            <span className="text-[11px] text-[#4A6458] font-body">
              {match.venue} · {match.city}
            </span>
          </div>
        )}
      </div>

      {/* Prediction bar */}
      {prediction && (
        <div className="mx-4 mb-3 px-3 py-2 rounded-xl bg-pitch-900/80 border border-border/60 flex items-center justify-between">
          <span className="text-[11px] text-[#8BA898] font-body">Your prediction</span>
          <div className="flex items-center gap-2">
            <span className="text-xs font-heading font-semibold text-white">
              {prediction.predictedScoreA} – {prediction.predictedScoreB}
            </span>
            {prediction.isLocked && (
              <FontAwesomeIcon icon={faLock} className="text-[10px] text-[#4A6458]" />
            )}
          </div>
        </div>
      )}

      {/* CTA button */}
      {showPredictButton && canPredict && (
        <div className="px-4 pb-4">
          <Link
            to={`/predict/${match.id}`}
            className="btn-gold w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm"
          >
            <FontAwesomeIcon icon={faBullseye} className="text-xs" />
            Make Prediction
          </Link>
        </div>
      )}
    </div>
  )
}

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
          'rounded-xl overflow-hidden border-2 border-border/60 shadow-card flex-shrink-0',
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
        {!compact && <div className="text-[10px] text-[#4A6458] font-body mt-0.5">{shortName}</div>}
      </div>
    </div>
  )
}

import { faBullseye } from '@fortawesome/free-solid-svg-icons'
