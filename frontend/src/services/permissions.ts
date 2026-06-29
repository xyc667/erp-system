import api from './api'

export interface Permission {
  id: string
  name: string
  code: string
  module: string
  description: string | null
  createdAt: string
  updatedAt: string
}

export interface CreatePermissionRequest {
  name: string
  code: string
  module: string
  description?: string
}

export interface UpdatePermissionRequest {
  name?: string
  code?: string
  module?: string
  description?: string
}

export const permissionsService = {
  getAll: () => api.get<Permission[]>('/permissions'),
  
  getById: (id: string) => api.get<Permission>(`/permissions/${id}`),
  
  getByModule: (module: string) => api.get<Permission[]>(`/permissions/module/${module}`),
  
  create: (data: CreatePermissionRequest) => api.post<Permission>('/permissions', data),
  
  update: (id: string, data: UpdatePermissionRequest) => api.patch<Permission>(`/permissions/${id}`, data),
  
  delete: (id: string) => api.delete(`/permissions/${id}`),
}