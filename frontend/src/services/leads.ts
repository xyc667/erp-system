import api from './api'

export interface Lead {
  id: string
  name: string
  phone?: string
  phoneBackup?: string
  address?: string
  district?: string
  category?: string
  source: string
  status: string
  quality: string
  ownerUserId?: string
  claimedAt?: string
  expireAt?: string
  followUpCount: number
  lastFollowAt?: string
  convertedCustomerId?: string
  invalidReason?: string
  remark?: string
  createdAt: string
  owner?: { id: string; name: string }
  followUps?: LeadFollowUp[]
}

export interface LeadFollowUp {
  id: string
  type: string
  content: string
  result?: string
  isReport?: boolean
  nextActionAt?: string
  reviewStatus?: string
  reviewComment?: string
  createdAt: string
  user?: { id: string; name: string }
  reviewedBy?: { id: string; name: string }
  recordingFile?: { id: string; fileName: string; mimeType?: string }
}

export interface LeadListResponse {
  items: Lead[]
  total: number
  page: number
  pageSize: number
}

export interface LeadQuery {
  district?: string
  category?: string
  keyword?: string
  hasPhone?: string
  quality?: string
  expiringSoon?: string
  page?: number
  pageSize?: number
}

export interface ImportLeadItem {
  name: string
  phone?: string
  phoneBackup?: string
  address?: string
  district?: string
  category?: string
  poiCategoryRaw?: string
  lng?: number
  lat?: number
  source?: string
  sourceId?: string
  remark?: string
}

export const leadsService = {
  getPool: (params?: LeadQuery) => api.get<LeadListResponse>('/leads/pool', { params }),
  getMine: (params?: LeadQuery) => api.get<LeadListResponse>('/leads/mine', { params }),
  getStats: () => api.get('/leads/stats'),
  getQuota: () => api.get<{ claimed: number; limit: number; remaining: number }>('/leads/quota'),
  getById: (id: string) => api.get<Lead>(`/leads/${id}`),
  claim: (id: string) => api.post<Lead>(`/leads/${id}/claim`),
  claimBatch: (ids: string[]) => api.post('/leads/claim-batch', { ids }),
  release: (id: string) => api.post(`/leads/${id}/release`),
  addFollowUp: (id: string, data: { type: string; content: string; nextActionAt?: string; quality?: string }) =>
    api.post<Lead>(`/leads/${id}/follow-ups`, data),
  convert: (id: string, data: { name: string; code?: string; contactName?: string; contactPhone?: string; address?: string }) =>
    api.post(`/leads/${id}/convert`, data),
  invalidate: (id: string, data: { reason: string; remark?: string }) =>
    api.post(`/leads/${id}/invalidate`, data),
  import: (items: ImportLeadItem[]) => api.post('/leads/import', { items }),
}
