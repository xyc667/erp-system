export interface AuthUser {
  id: string
  username: string
  name: string
  role: string
  tenantId: string
  tenantCode: string
  tenantName: string
  permissions?: string[]
}

export interface LoginResponse {
  access_token: string
  refresh_token: string
  expires_in: number
  user: AuthUser
}

export interface Lead {
  id: string
  name: string
  phone?: string
  phoneBackup?: string
  address?: string
  district?: string
  category?: string
  lat?: number | string
  lng?: number | string
  status: string
  expireAt?: string
  followUpCount: number
  lastFollowAt?: string
}

export interface LeadListResponse {
  items: Lead[]
  total: number
  page: number
  pageSize: number
}

export interface LeadQuota {
  claimed: number
  limit: number
  remaining: number
}

export interface SubmitContactReportPayload {
  type: string
  result: string
  content: string
  nextActionAt?: string
  quality?: string
  recordingFileId?: string
}

export interface ContactReportLead {
  id: string
  name: string
  phone?: string
  district?: string
  category?: string
  address?: string
  lat?: number | string
  lng?: number | string
}

export interface ContactReport {
  id: string
  leadId: string
  type: string
  content: string
  result?: string
  nextActionAt?: string
  reviewStatus?: string
  reviewComment?: string
  reviewedAt?: string
  createdAt: string
  user?: { id: string; name: string }
  lead?: ContactReportLead
  recordingFile?: { id: string; fileName: string; mimeType?: string }
  reviewedBy?: { id: string; name: string }
}

export interface ContactReportListResponse {
  items: ContactReport[]
  total: number
  page: number
  pageSize: number
}

export interface AppNotification {
  id: string
  type: string
  title: string
  message: string
  read: boolean
  createdAt: string
}

export interface ReviewContactReportPayload {
  status: 'approved' | 'rejected'
  comment?: string
}
