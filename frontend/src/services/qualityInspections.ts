import api from './api'

export interface QualityInspection {
  id: string
  inspectionNo: string
  workOrderId: string
  inspectedQty: number
  passedQty: number
  failedQty: number
  status: string
  result: string | null
  inspectedAt: string | null
  workOrder: { orderNo: string; product: { name: string } }
  product: { name: string }
  inspectedBy: { name: string } | null
}

export const qualityInspectionsService = {
  getAll: () => api.get<QualityInspection[]>('/production/inspections'),
  create: (data: {
    workOrderId: string
    inspectedQty: number
    passedQty: number
    failedQty: number
    result?: string
  }) => api.post<QualityInspection>('/production/inspections', data),
  delete: (id: string) => api.delete(`/production/inspections/${id}`),
}
