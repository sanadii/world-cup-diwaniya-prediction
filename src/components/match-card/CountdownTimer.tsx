import { useState, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faClock } from '@fortawesome/free-solid-svg-icons'
import { useTranslation } from 'react-i18next'

interface CountdownTimerProps {
  targetUtc: string
  label?: string
  compact?: boolean
}

interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
  total: number
}

function getTimeLeft(targetUtc: string): TimeLeft {
  const target = new Date(targetUtc).getTime()
  const now = Date.now()
  const total = Math.max(0, target - now)
  const totalSec = Math.floor(total / 1000)

  return {
    total,
    days: Math.floor(totalSec / 86400),
    hours: Math.floor((totalSec % 86400) / 3600),
    minutes: Math.floor((totalSec % 3600) / 60),
    seconds: totalSec % 60,
  }
}

export function CountdownTimer({
  targetUtc,
  label = 'Next match in',
  compact = false,
}: CountdownTimerProps) {
  const { t } = useTranslation()
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(getTimeLeft(targetUtc))

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(getTimeLeft(targetUtc))
    }, 1000)
    return () => clearInterval(timer)
  }, [targetUtc])

  const pad = (n: number) => String(n).padStart(2, '0')

  if (compact) {
    const compactStr =
      timeLeft.days > 0
        ? `${timeLeft.days}d ${pad(timeLeft.hours)}:${pad(timeLeft.minutes)}:${pad(timeLeft.seconds)}`
        : `${pad(timeLeft.hours)}:${pad(timeLeft.minutes)}:${pad(timeLeft.seconds)}`
    return (
      <div className="flex items-center gap-1.5 text-secondary">
        <FontAwesomeIcon icon={faClock} className="text-xs text-gold-400/70" />
        <span className="font-heading text-sm font-semibold text-white">{compactStr}</span>
      </div>
    )
  }

  const units = [
    ...(timeLeft.days > 0 ? [{ value: timeLeft.days, label: t('matchCard.days') }] : []),
    { value: timeLeft.hours, label: t('matchCard.hrs') },
    { value: timeLeft.minutes, label: t('matchCard.min') },
    { value: timeLeft.seconds, label: t('matchCard.sec') },
  ]

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-center gap-1.5 text-secondary">
        <FontAwesomeIcon icon={faClock} className="text-xs text-gold-400/60" />
        <span className="text-xs font-body uppercase tracking-widest text-muted">{label}</span>
      </div>

      <div className="flex items-center gap-2">
        {units.map((unit, i) => (
          <div key={unit.label} className="flex items-center gap-2">
            <div className="flex flex-col items-center">
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center"
                style={{
                  background: 'rgba(255,255,255,0.07)',
                  border: '1px solid rgba(212,175,55,0.38)',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.10)',
                }}
              >
                <span className="font-display text-3xl text-white tracking-wider">
                  {pad(unit.value)}
                </span>
              </div>
              <span className="text-[9px] font-body text-muted mt-1.5 tracking-widest">
                {unit.label}
              </span>
            </div>
            {i < units.length - 1 && (
              <span className="font-display text-2xl text-muted mb-5 select-none">:</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
