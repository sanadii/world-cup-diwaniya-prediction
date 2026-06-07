import { useState, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faClock } from '@fortawesome/free-solid-svg-icons'

interface CountdownTimerProps {
  targetUtc: string
  label?: string
  compact?: boolean
}

interface TimeLeft {
  hours: number
  minutes: number
  seconds: number
  total: number
}

function getTimeLeft(targetUtc: string): TimeLeft {
  const target = new Date(targetUtc).getTime()
  const now = Date.now()
  const total = Math.max(0, target - now)

  return {
    total,
    hours: Math.floor(total / (1000 * 60 * 60)),
    minutes: Math.floor((total % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((total % (1000 * 60)) / 1000),
  }
}

export function CountdownTimer({ targetUtc, label = 'Next match in', compact = false }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(getTimeLeft(targetUtc))

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(getTimeLeft(targetUtc))
    }, 1000)
    return () => clearInterval(timer)
  }, [targetUtc])

  const pad = (n: number) => String(n).padStart(2, '0')

  if (compact) {
    return (
      <div className="flex items-center gap-1.5 text-[#8BA898]">
        <FontAwesomeIcon icon={faClock} className="text-xs text-gold-400/70" />
        <span className="font-heading text-sm font-semibold text-white">
          {pad(timeLeft.hours)}:{pad(timeLeft.minutes)}:{pad(timeLeft.seconds)}
        </span>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-center gap-1.5 text-[#8BA898]">
        <FontAwesomeIcon icon={faClock} className="text-xs text-gold-400/60" />
        <span className="text-xs font-body uppercase tracking-widest text-[#4A6458]">{label}</span>
      </div>

      <div className="flex items-center gap-2">
        {[
          { value: timeLeft.hours, label: 'HRS' },
          { value: timeLeft.minutes, label: 'MIN' },
          { value: timeLeft.seconds, label: 'SEC' },
        ].map((unit, i) => (
          <div key={unit.label} className="flex items-center gap-2">
            <div className="flex flex-col items-center">
              <div className="w-14 h-14 rounded-xl bg-pitch-800 border border-border flex items-center justify-center shadow-card">
                <span className="font-display text-3xl text-white tracking-wider">{pad(unit.value)}</span>
              </div>
              <span className="text-[9px] font-body text-[#4A6458] mt-1.5 tracking-widest">{unit.label}</span>
            </div>
            {i < 2 && (
              <span className="font-display text-2xl text-[#4A6458] mb-5 select-none">:</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
