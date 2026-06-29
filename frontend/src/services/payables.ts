import api from './api'

export interface Payable {
  id: string
  billNo: string
  amount: number
  paidAmount: number
  status: string
  dueDate: string | null
  createdAt: string
  vendor: { id: string; name: string }
  purchaseOrder?: { id: string; orderNo: string } | null
}

export const payablesService = {
  getAll: () => api.get<Payable[]>('/finance/payables'),
  recordPayment: (id: string, amount: number) =>
    api.post<Payable>(`/finance/payables/${id}/payment`, { amount }),
}
