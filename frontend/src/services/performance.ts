import api from './api'

export interface PerformanceReview {
  id: string
  period: string
  score: number
  grade: string | null
  comment: string | null
  employee: { name: string; employeeNo: string }
  reviewer: { name: string } | null
}

export const performanceService = {
  getAll: () => api.get<PerformanceReview[]>('/hr/performance'),
  create: (data: { employeeId: string; period: string; score: number; comment?: string }) =>
    api.post('/hr/performance', data),
  delete: (id: string) => api.delete(`/hr/performance/${id}`),
}
