import { api } from './client'
import type {
  ContactReportListResponse,
  Lead,
  LeadListResponse,
  LeadQuota,
  SubmitContactReportPayload,
  ReviewContactReportPayload,
  ContactReport,
} from '../types/api'

export interface LeadQuery {
  district?: string
  category?: string
  keyword?: string
  hasPhone?: string
  page?: number
  pageSize?: number
}

export async function getPool(params?: LeadQuery) {
  const res = await api.get<LeadListResponse>('/leads/pool', { params })
  return res.data
}

export async function getMine(params?: LeadQuery) {
  const res = await api.get<LeadListResponse>('/leads/mine', { params })
  return res.data
}

export async function getQuota() {
  const res = await api.get<LeadQuota>('/leads/quota')
  return res.data
}

export async function claimLead(id: string) {
  const res = await api.post<Lead>(`/leads/${id}/claim`)
  return res.data
}

export async function claimBatch(ids: string[]) {
  const res = await api.post<{ claimed: number; items: Lead[] }>('/leads/claim-batch', { ids })
  return res.data
}

export async function submitContactReport(leadId: string, data: SubmitContactReportPayload) {
  const res = await api.post<Lead>(`/leads/${leadId}/contact-reports`, data)
  return res.data
}

export interface MyReportsQuery {
  reviewStatus?: string
  page?: number
  pageSize?: number
}

export async function getMyContactReports(params?: MyReportsQuery) {
  const res = await api.get<ContactReportListResponse>('/leads/contact-reports/mine', { params })
  return res.data
}

export async function getPendingContactReports(params?: MyReportsQuery) {
  const res = await api.get<ContactReportListResponse>('/leads/contact-reports', {
    params: { ...params, reviewStatus: 'pending' },
  })
  return res.data
}

export async function reviewContactReport(reportId: string, data: ReviewContactReportPayload) {
  const res = await api.post<ContactReport>(`/leads/contact-reports/${reportId}/review`, data)
  return res.data
}

export async function getRecordingUrl(reportId: string) {
  const res = await api.get<{ url: string | null; fileName: string }>(
    `/leads/contact-reports/${reportId}/recording-url`,
  )
  return res.data
}

export async function uploadRecording(uri: string, fileName: string, mimeType = 'audio/mp4') {
  const form = new FormData()
  form.append('file', {
    uri,
    name: fileName,
    type: mimeType,
  } as unknown as Blob)
  const res = await api.post<{ id: string; fileName: string }>('/leads/upload-recording', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res.data
}
