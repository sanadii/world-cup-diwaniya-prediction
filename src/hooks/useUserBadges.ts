import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { BadgeType } from '@/types/app'

interface UserBadge {
  badgeType: BadgeType
  awardedAt: string
}

interface RawUserBadge {
  awarded_at: string
  badge: { badge_type: string }[] | { badge_type: string } | null
}

export function useUserBadges(userId?: string) {
  return useQuery({
    queryKey: ['user-badges', userId],
    enabled: !!userId,
    staleTime: 60_000,
    queryFn: async (): Promise<UserBadge[]> => {
      const { data, error } = await supabase
        .from('user_badges')
        .select('awarded_at, badge:badges(badge_type)')
        .eq('user_id', userId!)
        .order('awarded_at', { ascending: false })

      if (error) throw error
      return (data as RawUserBadge[])
        .map((r) => {
          const badge = Array.isArray(r.badge) ? r.badge[0] : r.badge
          return badge?.badge_type
            ? { badgeType: badge.badge_type as BadgeType, awardedAt: r.awarded_at }
            : null
        })
        .filter((x): x is UserBadge => x !== null)
    },
  })
}
