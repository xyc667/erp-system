import api from './api'

export interface SalesOrderItem {
  id: string
  productId: string
  quantity: number
  unitPrice: number
  amount: number
  product: { code: string; name: string }
}

export interface SalesOrder {
  id: string
  orderNo: string
  customerId: string
  totalAmount: number
  status: string
  createdAt: string
  customer: { name: string }
  items: SalesOrderItem[]
}

export interface CreateSalesOrderRequest {
  customerId: string
  items: { productId: string; quantity: number; unitPrice: number }[]
}

export const salesOrdersService = {
  getAll: () => api.get<SalesOrder[]>('/sales/orders'),
  create: (data: CreateSalesOrderRequest) => api.post<SalesOrder>('/sales/orders', data),
  approve: (id: string) => api.post(`/sales/orders/${id}/approve`),
  ship: (id: string, warehouseId: string) =>
    api.post(`/sales/orders/${id}/ship`, { warehouseId }),
  delete: (id: string) => api.delete(`/sales/orders/${id}`),
}
