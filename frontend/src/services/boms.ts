import api from './api'

export interface BomItem {
  id: string
  componentId: string
  quantity: number
  unit: string
  component: { code: string; name: string }
}

export interface Bom {
  id: string
  code: string
  name: string
  productId: string
  version: string
  status: string
  product: { code: string; name: string }
  items: BomItem[]
}

export const bomsService = {
  getAll: () => api.get<Bom[]>('/production/boms'),
  create: (data: {
    code: string
    name: string
    productId: string
    version?: string
    description?: string
    items: { componentId: string; quantity: number; unit: string }[]
  }) => api.post<Bom>('/production/boms', data),
  delete: (id: string) => api.delete(`/production/boms/${id}`),
}
