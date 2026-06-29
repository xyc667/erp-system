import api from './api'

export interface SalesQuoteItem {
  id: string
  productId: string
  quantity: number
  unitPrice: number
  amount: number
  product: { id: string; name: string; code: string }
}

export interface SalesQuote {
  id: string
  quoteNo: string
  customerId: string
  totalAmount: number
  validUntil: string | null
  status: string
  createdAt: string
  customer: { id: string; name: string }
  items: SalesQuoteItem[]
  createdBy: { id: string; name: string }
  salesOrder?: { id: string; orderNo: string } | null
}

export const salesQuotesService = {
  getAll: () => api.get<SalesQuote[]>('/sales/quotes'),
  create: (data: {
    customerId: string
    validUntil?: string
    items: { productId: string; quantity: number; unitPrice: number }[]
  }) => api.post<SalesQuote>('/sales/quotes', data),
  approve: (id: string) => api.post<SalesQuote>(`/sales/quotes/${id}/approve`),
  convert: (id: string) => api.post(`/sales/quotes/${id}/convert`),
  delete: (id: string) => api.delete(`/sales/quotes/${id}`),
}
