import api from './api'

export interface Department {
  id: string
  code: string
  name: string
  parentId: string | null
}

export const departmentsService = {
  getAll: () => api.get<Department[]>('/hr/departments'),
  create: (data: Partial<Department>) => api.post<Department>('/hr/departments', data),
  update: (id: string, data: Partial<Department>) => api.patch<Department>(`/hr/departments/${id}`, data),
  delete: (id: string) => api.delete(`/hr/departments/${id}`),
}
