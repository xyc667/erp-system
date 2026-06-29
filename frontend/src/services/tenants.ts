import api from './api'

export interface Tenant {
  id: string
  code: string
  name: string
}

export const tenantsService = {
  listPublic: () => api.get<Tenant[]>('/system/tenants/public', { silent: true }),
  getAll: () => api.get<Tenant[]>('/system/tenants'),
  create: (data: { code: string; name: string }) => api.post('/system/tenants', data),
}
