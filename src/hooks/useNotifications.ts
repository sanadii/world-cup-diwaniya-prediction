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

// Shared queryFn — used by both useNotifications and useUnreadCount so they
// share one cache entry (same queryKey) with zero duplicate network requests.
async function notificationsQueryFn(): Promise<Notification[]> {
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
}

export function useNotifications() {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: notificationsQueryFn,
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

// Uses select to derive count directly from the shared cache entry —
// no second subscription, no second network call.
export function useUnreadCount(): number {
  const { data = 0 } = useQuery({
    queryKey: ['notifications'],
    queryFn: notificationsQueryFn,
    select: (notifications) => notifications.filter((n) => !n.isRead).length,
  })
  return data
}
