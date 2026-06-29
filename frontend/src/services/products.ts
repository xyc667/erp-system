import api from './api'

export interface Product {
  id: string
  code: string
  name: string
  categoryId: string | null
  unit: string
  price: number | null
  safetyStock?: number | null
  description: string | null
  category?: { id: string; name: string } | null
}

export interface ProductCategory {
  id: string
  code: string
  name: string
}

export const productsService = {
  getAll: () => api.get<Product[]>('/inventory/products'),
  getCategories: () => api.get<ProductCategory[]>('/inventory/products/categories/list'),
  create: (data: Partial<Product>) => api.post<Product>('/inventory/products', data),
  update: (id: string, data: Partial<Product>) => api.patch<Product>(`/inventory/products/${id}`, data),
  delete: (id: string) => api.delete(`/inventory/products/${id}`),
}
