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

export function getBadgeInfo(badge: BadgeType): { label: string; icon: string; color: string } {
  const badges: Record<BadgeType, { label: string; icon: string; color: string }> = {
    exact_score_king: { label: 'Exact Score King', icon: '🎯', color: 'text-gold-400' },
    penalty_genius: { label: 'Penalty Genius', icon: '⚽', color: 'text-emerald-400' },
    comeback_master: { label: 'Comeback Master', icon: '🔄', color: 'text-blue-400' },
    final_boss: { label: 'Final Boss', icon: '👑', color: 'text-gold-400' },
    underdog_whisperer: { label: 'Underdog Whisperer', icon: '🌟', color: 'text-purple-400' },
    last_minute_predictor: { label: 'Last Minute', icon: '⏱️', color: 'text-orange-400' },
    best_streak: { label: 'Best Streak', icon: '🔥', color: 'text-orange-500' },
    unlucky: { label: 'Unlucky Predictor', icon: '😭', color: 'text-gray-400' },
    late_predictor: { label: 'Late Predictor', icon: '🐢', color: 'text-teal-400' },
  }
  return badges[badge]
}

export function formatMinute(minute: number): string {
  if (minute > 90) return `90+${minute - 90}'`
  return `${minute}'`
}

export function getRankSuffix(rank: number): string {
  if (rank === 1) return 'st'
  if (rank === 2) return 'nd'
  if (rank === 3) return 'rd'
  return 'th'
}

export function formatKuwaitTime(
  utcDate: string,
  format: 'time' | 'date' | 'datetime' = 'datetime',
): string {
  // Kuwait is UTC+3
  const date = new Date(utcDate)
  const kuwaitOffset = 3 * 60
  const localOffset = date.getTimezoneOffset()
  const kuwait = new Date(date.getTime() + (kuwaitOffset + localOffset) * 60000)

  if (format === 'time')
    return kuwait.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
  if (format === 'date')
    return kuwait.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  return kuwait.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
}
