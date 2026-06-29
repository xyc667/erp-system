import api from './api'

export interface Customer {
  id: string
  code: string
  name: string
  contactName: string | null
  contactPhone: string | null
  contactEmail: string | null
  address: string | null
  creditLimit: number | null
  status: string
}

export const customersService = {
  getAll: () => api.get<Customer[]>('/sales/customers'),
  create: (data: Partial<Customer>) => api.post<Customer>('/sales/customers', data),
  update: (id: string, data: Partial<Customer>) => api.patch<Customer>(`/sales/customers/${id}`, data),
  delete: (id: string) => api.delete(`/sales/customers/${id}`),
}
