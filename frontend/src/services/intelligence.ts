import api from './api'

export interface ReplenishmentSuggestion {
  productId: string
  productCode: string
  productName: string
  unit: string
  currentQty: number
  safetyStock: number
  shortage: number
  suggestedQty: number
  dailyConsumption: number
  coverageDays: number | null
  outbound30: number
  priority: 'high' | 'medium' | 'low'
  reasonCode: string
}

export interface FinanceInsight {
  code: string
  severity: 'info' | 'warning' | 'success'
  params: Record<string, number | string>
}

export const intelligenceService = {
  getReplenishment: () => api.get<ReplenishmentSuggestion[]>('/intelligence/replenishment'),
  getFinance: () => api.get<{ insights: FinanceInsight[] }>('/intelligence/finance'),
  createReplenishmentRequest: (productIds?: string[]) =>
    api.post('/intelligence/replenishment/create-request', { productIds }),
}
