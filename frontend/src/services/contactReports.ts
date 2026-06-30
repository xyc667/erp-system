import api from './api'
import type { Lead } from './leads'

export interface ContactReport {
  id: string
  leadId: string
  type: string
  result: string
  content: string
  nextActionAt?: string
  reviewStatus?: string
  reviewComment?: string
  createdAt: string
  reviewedAt?: string
  user?: { id: string; name: string }
  reviewedBy?: { id: string; name: string }
  recordingFile?: { id: string; fileName: string; mimeType?: string }
  lead?: { id: string; name: string; phone?: string; district?: string; category?: string }
}

export interface ContactReportListResponse {
  items: ContactReport[]
  total: number
  page: number
  pageSize: number
}

export interface ContactReportStats {
  total: number
  pending: number
  connectedRate: number
  interestedRate: number
  byResult: { result: string | null; count: number }[]
  byUser: { userId: string; userName: string; count: number }[]
}

export interface SubmitContactReportPayload {
  type: string
  result: string
  content: string
  nextActionAt?: string
  quality?: string
  recordingFileId?: string
}

export const contactReportsService = {
  submit: (leadId: string, data: SubmitContactReportPayload) =>
    api.post<Lead>(`/leads/${leadId}/contact-reports`, data),

  uploadRecording: (file: File) => {
    const form = new FormData()
    form.append('file', file)
    return api.post<{ id: string; fileName: string }>('/leads/upload-recording', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  list: (params?: { reviewStatus?: string; page?: number; pageSize?: number }) =>
    api.get<ContactReportListResponse>('/leads/contact-reports', { params }),

  review: (reportId: string, data: { status: 'approved' | 'rejected'; comment?: string }) =>
    api.post<ContactReport>(`/leads/contact-reports/${reportId}/review`, data),

  getStats: () => api.get<ContactReportStats>('/leads/contact-reports/stats'),

  getRecordingUrl: (reportId: string) =>
    api.get<{ url: string | null; fileName: string }>(`/leads/contact-reports/${reportId}/recording-url`),
}
