import api from './api'

export interface PurchaseRequestItem {
  id: string
  productId: string
  quantity: number
  estimatedPrice: number | null
  product: { id: string; name: string; code: string; price: number | null }
}

export interface PurchaseRequest {
  id: string
  requestNo: string
  title: string | null
  reason: string | null
  status: string
  createdAt: string
  items: PurchaseRequestItem[]
  createdBy: { id: string; name: string }
  approvedBy?: { id: string; name: string } | null
  purchaseOrder?: { id: string; orderNo: string } | null
}

export const purchaseRequestsService = {
  getAll: () => api.get<PurchaseRequest[]>('/procurement/requests'),
  create: (data: {
    title?: string
    reason?: string
    items: { productId: string; quantity: number; estimatedPrice?: number }[]
  }) => api.post<PurchaseRequest>('/procurement/requests', data),
  approve: (id: string) => api.post<PurchaseRequest>(`/procurement/requests/${id}/approve`),
  convert: (id: string, vendorId: string) =>
    api.post(`/procurement/requests/${id}/convert`, { vendorId }),
  delete: (id: string) => api.delete(`/procurement/requests/${id}`),
}
