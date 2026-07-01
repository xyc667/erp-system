import { api } from './client'
import type { AppNotification } from '../types/api'

export async function getNotifications() {
  const res = await api.get<AppNotification[]>('/notifications')
  return res.data
}

export async function getUnreadCount() {
  const res = await api.get<number>('/notifications/unread-count')
  return res.data
}

export async function markNotificationRead(id: string) {
  await api.patch(`/notifications/${id}/read`)
}

export async function markAllNotificationsRead() {
  await api.patch('/notifications/read-all')
}
