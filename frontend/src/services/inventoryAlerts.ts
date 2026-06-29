import api from './api'

export interface StockAlert {
  productId: string
  productCode: string
  productName: string
  unit: string
  category: string | null
  currentQty: number
  safetyStock: number
  shortage: number
}

export const inventoryAlertsService = {
  getAll: () => api.get<StockAlert[]>('/inventory/alerts'),
}
