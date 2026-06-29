import api from './api'

export interface Position {
  id: string
  code: string
  name: string
  description: string | null
}

export const positionsService = {
  getAll: () => api.get<Position[]>('/hr/positions'),
  create: (data: Partial<Position>) => api.post<Position>('/hr/positions', data),
  update: (id: string, data: Partial<Position>) => api.patch<Position>(`/hr/positions/${id}`, data),
  delete: (id: string) => api.delete(`/hr/positions/${id}`),
}
