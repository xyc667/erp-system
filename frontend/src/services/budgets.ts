import api from './api'

export interface Budget {
  id: string
  code: string
  name: string
  year: number
  category: string
  totalAmount: number
  usedAmount: number
  status: string
  department?: { name: string }
  usages?: { amount: number; referenceNo?: string; createdAt: string }[]
}

export const budgetsService = {
  getAll: () => api.get<Budget[]>('/finance/budgets'),
  getById: (id: string) => api.get<Budget>(`/finance/budgets/${id}`),
  create: (data: Partial<Budget>) => api.post('/finance/budgets', data),
  update: (id: string, data: Partial<Budget>) => api.patch(`/finance/budgets/${id}`, data),
  delete: (id: string) => api.delete(`/finance/budgets/${id}`),
}
