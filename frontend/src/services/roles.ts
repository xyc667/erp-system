import api from './api'

export interface Role {
  id: string
  name: string
  description: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateRoleRequest {
  name: string
  description?: string
}

export interface UpdateRoleRequest {
  name?: string
  description?: string
}

export interface AssignPermissionsRequest {
  permissionIds: string[]
}

export const rolesService = {
  getAll: () => api.get<Role[]>('/roles'),
  
  getById: (id: string) => api.get<Role>(`/roles/${id}`),
  
  create: (data: CreateRoleRequest) => api.post<Role>('/roles', data),
  
  update: (id: string, data: UpdateRoleRequest) => api.patch<Role>(`/roles/${id}`, data),
  
  delete: (id: string) => api.delete(`/roles/${id}`),
  
  assignPermissions: (id: string, data: AssignPermissionsRequest) => {
    return api.post(`/roles/${id}/permissions`, data)
  },
}