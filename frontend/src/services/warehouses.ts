import api from './api'

export interface Warehouse {
  id: string
  code: string
  name: string
  address: string | null
  status: string
}

export const warehousesService = {
  getAll: () => api.get<Warehouse[]>('/inventory/warehouses'),
  create: (data: Partial<Warehouse>) => api.post<Warehouse>('/inventory/warehouses', data),
  update: (id: string, data: Partial<Warehouse>) => api.patch<Warehouse>(`/inventory/warehouses/${id}`, data),
  delete: (id: string) => api.delete(`/inventory/warehouses/${id}`),
}
