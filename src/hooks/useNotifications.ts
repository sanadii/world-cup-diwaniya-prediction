import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Notification } from '@/types/app'

interface RawNotification {
  id: string
  user_id: string
  type: string
  title: string
  body: string | null
  is_read: boolean
  data: Record<string, unknown> | null
  created_at: string
}

function mapNotification(raw: RawNotification): Notification {
  return {
    id: raw.id,
    userId: raw.user_id,
    type: raw.type,
    title: raw.title,
    body: raw.body,
    isRead: raw.is_read ?? false,
    data: raw.data,
    createdAt: raw.created_at,
  }
}

export function useNotifications() {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: async (): Promise<Notification[]> => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return []

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) throw error
      return (data as RawNotification[]).map(mapNotification)
    },
  })
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (notificationId: string): Promise<void> => {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)

      if (error) throw error
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}

export function useUnreadCount(): number {
  const { data: notifications = [] } = useNotifications()
  return notifications.filter((n) => !n.isRead).length
}
