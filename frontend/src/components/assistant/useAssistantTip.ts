import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router-dom'
import { notificationRoute } from '../../hooks/useNotifications'
import type { Notification } from '../../services/notifications'
import { resolveAssistantTip } from './assistantTips'

export function useAssistantTip(unread: number, notifications: Notification[] = []) {
  const { t } = useTranslation()
  const { pathname } = useLocation()

  const unreadActionPath = useMemo(() => {
    const firstUnread = notifications.find((item) => !item.read)
    if (!firstUnread) return null
    return notificationRoute(firstUnread.type)
  }, [notifications])

  return useMemo(
    () => resolveAssistantTip(pathname, unread, t, unreadActionPath),
    [pathname, unread, t, unreadActionPath],
  )
}
