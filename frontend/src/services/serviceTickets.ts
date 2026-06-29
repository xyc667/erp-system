import api from './api'

export interface ServiceTicket {
  id: string
  ticketNo: string
  customerId: string
  salesOrderId: string | null
  type: string
  priority: string
  description: string | null
  status: string
  resolution: string | null
  createdAt: string
  customer: { id: string; name: string }
  salesOrder?: { id: string; orderNo: string } | null
  createdBy: { id: string; name: string }
}

export const serviceTicketsService = {
  getAll: () => api.get<ServiceTicket[]>('/sales/service-tickets'),
  create: (data: {
    customerId: string
    salesOrderId?: string
    type?: string
    priority?: string
    description?: string
  }) => api.post<ServiceTicket>('/sales/service-tickets', data),
  updateStatus: (id: string, status: string) =>
    api.patch<ServiceTicket>(`/sales/service-tickets/${id}/status`, { status }),
  resolve: (id: string, resolution?: string) =>
    api.post<ServiceTicket>(`/sales/service-tickets/${id}/resolve`, { resolution }),
  delete: (id: string) => api.delete(`/sales/service-tickets/${id}`),
}
