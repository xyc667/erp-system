import api from './api'

export interface StockRecord {
  id: string
  productId: string
  warehouseId: string
  quantity: number
  unit: string
  batchNo: string | null
  product: { id: string; code: string; name: string }
  warehouse: { id: string; code: string; name: string }
}

export interface StockMovement {
  id: string
  type: string
  quantity: number
  referenceNo: string | null
  createdAt: string
  product: { code: string; name: string }
  warehouse: { name: string }
  createdBy: { name: string }
}

export const inventoryService = {
  getStock: () => api.get<StockRecord[]>('/inventory/stock'),
  createStock: (data: { productId: string; warehouseId: string; quantity: number; unit: string; batchNo?: string }) =>
    api.post('/inventory/stock', data),
  deleteStock: (id: string) => api.delete(`/inventory/stock/${id}`),
  getMovements: () => api.get<StockMovement[]>('/inventory/movements'),
  adjustStock: (data: {
    productId: string
    warehouseId: string
    quantity: number
    type: string
    referenceNo?: string
  }) => api.post('/inventory/movements', data),
}
