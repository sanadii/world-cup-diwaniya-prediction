import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { MatchStage, BadgeType } from '@/types/app'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getFlagUrl(countryCode: string, size: 'w40' | 'w80' | 'w160' = 'w80'): string {
  return `https://flagcdn.com/${size}/${countryCode.toLowerCase()}.png`
}

export function getStageName(stage: MatchStage): string {
  const names: Record<MatchStage, string> = {
    group: 'Group Stage',
    round_of_32: 'Round of 32',
    round_of_16: 'Round of 16',
    quarterfinal: 'Quarterfinal',
    semifinal: 'Semifinal',
    third_place: 'Third Place',
    final: 'Final',
  }
  return names[stage]
}

/** Returns the i18n key for a stage name (use with t() for translated display). */
export function getStageKey(stage: MatchStage): string {
  const keys: Record<MatchStage, string> = {
    group: 'matches.groupStage',
    round_of_32: 'matches.roundOf32',
    round_of_16: 'matches.roundOf16',
    quarterfinal: 'matches.quarterFinals',
    semifinal: 'matches.semiFinals',
    third_place: 'matches.thirdPlace',
    final: 'matches.final',
  }
  return keys[stage]
}

export function getBadgeInfo(badge: BadgeType): { label: string; icon: string; color: string } {
  const badges: Record<BadgeType, { label: string; icon: string; color: string }> = {
    exact_score_king: { label: 'Exact Score King', icon: 'target', color: 'text-gold-400' },
    penalty_genius: { label: 'Penalty Genius', icon: 'soccer', color: 'text-emerald-400' },
    comeback_master: { label: 'Comeback Master', icon: 'sync', color: 'text-blue-400' },
    final_boss: { label: 'Final Boss', icon: 'crown', color: 'text-gold-400' },
    underdog_whisperer: { label: 'Underdog Whisperer', icon: 'star', color: 'text-purple-400' },
    last_minute_predictor: { label: 'Last Minute', icon: 'timer', color: 'text-orange-400' },
    best_streak: { label: 'Best Streak', icon: 'fire', color: 'text-orange-500' },
    unlucky: { label: 'Unlucky Predictor', icon: 'sad', color: 'text-gray-400' },
    late_predictor: { label: 'Late Predictor', icon: 'turtle', color: 'text-teal-400' },
  }
  return badges[badge]
}

export function formatMinute(minute: number): string {
  if (minute > 90) return `90+${minute - 90}'`
  return `${minute}'`
}

export function getRankSuffix(rank: number, lang?: string): string {
  if (lang === 'ar') return ''
  if (rank === 1) return 'st'
  if (rank === 2) return 'nd'
  if (rank === 3) return 'rd'
  return 'th'
}

export function formatKuwaitTime(
  utcDate: string,
  mode: 'time' | 'date' | 'relative' | 'datetime' = 'datetime',
): string {
  const date = new Date(utcDate)
  if (mode === 'time') {
    return date.toLocaleTimeString('en-US', {
      timeZone: 'Asia/Kuwait',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
  }
  if (mode === 'date') {
    return date.toLocaleDateString('en-US', {
      timeZone: 'Asia/Kuwait',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }
  if (mode === 'relative') {
    const diffMs = Date.now() - date.getTime()
    const diffMin = Math.floor(diffMs / 60000)
    if (diffMin < 1) return 'just now'
    if (diffMin < 60) return `${diffMin}m ago`
    const diffHrs = Math.floor(diffMin / 60)
    if (diffHrs < 24) return `${diffHrs}h ago`
    return `${Math.floor(diffHrs / 24)}d ago`
  }
  return date.toLocaleString('en-US', {
    timeZone: 'Asia/Kuwait',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}
