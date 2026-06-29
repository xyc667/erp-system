import api from './api'

export interface Vendor {
  id: string
  code: string
  name: string
  contactName: string | null
  contactPhone: string | null
  contactEmail: string | null
  address: string | null
  status: string
}

export const vendorsService = {
  getAll: () => api.get<Vendor[]>('/procurement/vendors'),
  create: (data: Partial<Vendor>) => api.post<Vendor>('/procurement/vendors', data),
  update: (id: string, data: Partial<Vendor>) => api.patch<Vendor>(`/procurement/vendors/${id}`, data),
  delete: (id: string) => api.delete(`/procurement/vendors/${id}`),
}
