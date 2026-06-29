import api from './api'

export interface PurchaseOrderItem {
  id: string
  productId: string
  quantity: number
  unitPrice: number
  amount: number
  product: { code: string; name: string }
}

export interface PurchaseOrder {
  id: string
  orderNo: string
  vendorId: string
  totalAmount: number
  status: string
  createdAt: string
  vendor: { name: string }
  items: PurchaseOrderItem[]
}

export interface CreatePurchaseOrderRequest {
  vendorId: string
  items: { productId: string; quantity: number; unitPrice: number }[]
}

export const purchaseOrdersService = {
  getAll: () => api.get<PurchaseOrder[]>('/procurement/orders'),
  getById: (id: string) => api.get<PurchaseOrder>(`/procurement/orders/${id}`),
  create: (data: CreatePurchaseOrderRequest) => api.post<PurchaseOrder>('/procurement/orders', data),
  approve: (id: string) => api.post(`/procurement/orders/${id}/approve`),
  receive: (id: string, warehouseId: string) =>
    api.post(`/procurement/orders/${id}/receive`, { warehouseId }),
  delete: (id: string) => api.delete(`/procurement/orders/${id}`),
}
