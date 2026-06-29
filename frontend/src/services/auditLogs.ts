import api from './api'

export interface AuditLog {
  id: string
  category: string
  action: string
  resource?: string
  resourceId?: string
  userId?: string
  username?: string
  role?: string
  ipAddress?: string
  userAgent?: string
  result: string
  detail?: string
  createdAt: string
}

export interface AuditLogQuery {
  category?: string
  action?: string
  username?: string
  result?: string
  startDate?: string
  endDate?: string
  page?: number
  pageSize?: number
}

export interface AuditLogResponse {
  items: AuditLog[]
  total: number
  page: number
  pageSize: number
}

export const auditLogsService = {
  getAll: (params?: AuditLogQuery) =>
    api.get<AuditLogResponse>('/system/audit-logs', { params }),
}
