import api from './api'

export interface ProductionPlan {
  id: string
  planNo: string
  name: string
  productId: string
  plannedQty: number
  startDate: string
  endDate: string | null
  status: string
  product: { code: string; name: string }
}

export const productionPlansService = {
  getAll: () => api.get<ProductionPlan[]>('/production/plans'),
  create: (data: { name: string; productId: string; plannedQty: number; startDate: string; endDate?: string }) =>
    api.post<ProductionPlan>('/production/plans', data),
  approve: (id: string) => api.post(`/production/plans/${id}/approve`),
  delete: (id: string) => api.delete(`/production/plans/${id}`),
}
