import api from './api'

export interface Receivable {
  id: string
  billNo: string
  amount: number
  receivedAmount: number
  status: string
  dueDate: string | null
  createdAt: string
  customer: { id: string; name: string }
  salesOrder?: { id: string; orderNo: string } | null
}

export const receivablesService = {
  getAll: () => api.get<Receivable[]>('/finance/receivables'),
  recordReceipt: (id: string, amount: number) =>
    api.post<Receivable>(`/finance/receivables/${id}/receipt`, { amount }),
}
