import api from './api'

export interface User {
  id: string
  username: string
  name: string
  email: string | null
  phone: string | null
  roleId: string
  status: 'active' | 'inactive'
  createdAt: string
  updatedAt: string
  role: {
    id: string
    name: string
  }
}

export interface CreateUserRequest {
  username: string
  password: string
  name: string
  email?: string
  phone?: string
  roleId: string
}

export interface UpdateUserRequest {
  name?: string
  email?: string
  phone?: string
  roleId?: string
  status?: 'active' | 'inactive'
  password?: string
}

export const usersService = {
  getAll: () => api.get<User[]>('/users'),
  
  getById: (id: string) => api.get<User>(`/users/${id}`),
  
  create: (data: CreateUserRequest) => api.post<User>('/users', data),
  
  update: (id: string, data: UpdateUserRequest) => api.patch<User>(`/users/${id}`, data),
  
  delete: (id: string) => api.delete(`/users/${id}`),
}