import { useCallback, useEffect, useState } from 'react'
import { notificationsService, Notification } from '../services/notifications'
import { useNotificationSocket } from './useNotificationSocket'

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unread, setUnread] = useState(0)

  const loadNotifications = useCallback(async () => {
    try {
      const [listRes, countRes] = await Promise.all([
        notificationsService.getAll(),
        notificationsService.getUnreadCount(),
      ])
      setNotifications(listRes.data)
      setUnread(typeof countRes.data === 'number' ? countRes.data : 0)
    } catch {
      setNotifications([])
      setUnread(0)
    }
  }, [])

  useNotificationSocket(loadNotifications)

  useEffect(() => {
    loadNotifications()
    const timer = setInterval(loadNotifications, 60_000)
    return () => clearInterval(timer)
  }, [loadNotifications])

  const markRead = useCallback(async (id: string) => {
    await notificationsService.markRead(id)
    await loadNotifications()
  }, [loadNotifications])

  const markAllRead = useCallback(async () => {
    await notificationsService.markAllRead()
    await loadNotifications()
  }, [loadNotifications])

  return {
    notifications,
    unread,
    loadNotifications,
    markRead,
    markAllRead,
  }
}

export function notificationRoute(type: string): string | null {
  if (type.startsWith('lead.report')) return '/sales/leads/reports'
  return null
}
