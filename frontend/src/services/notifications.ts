import api from './api'

export interface Notification {
  id: string
  type: string
  title: string
  message: string
  read: boolean
  createdAt: string
}

export const notificationsService = {
  getAll: () => api.get<Notification[]>('/notifications'),
  getUnreadCount: () => api.get<number>('/notifications/unread-count'),
  markRead: (id: string) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all'),
}
