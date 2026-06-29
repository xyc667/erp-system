import api from './api'

export interface WorkOrderItem {
  id: string
  productId: string
  requiredQty: number
  consumedQty: number
  product: { code: string; name: string }
}

export interface WorkOrder {
  id: string
  orderNo: string
  productId: string
  plannedQty: number
  completedQty: number
  status: string
  product: { code: string; name: string }
  bom?: { code: string; name: string } | null
  plan?: { planNo: string; name: string } | null
  items: WorkOrderItem[]
}

export const workOrdersService = {
  getAll: () => api.get<WorkOrder[]>('/production/work-orders'),
  create: (data: {
    bomId?: string
    productId: string
    planId?: string
    plannedQty: number
    warehouseId?: string
  }) => api.post<WorkOrder>('/production/work-orders', data),
  release: (id: string) => api.post(`/production/work-orders/${id}/release`),
  start: (id: string) => api.post(`/production/work-orders/${id}/start`),
  complete: (id: string, warehouseId: string) =>
    api.post(`/production/work-orders/${id}/complete`, { warehouseId }),
  delete: (id: string) => api.delete(`/production/work-orders/${id}`),
}
