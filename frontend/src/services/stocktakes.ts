import api from './api'

export interface StocktakeItem {
  id: string
  productId: string
  systemQty: number
  countedQty: number | null
  difference: number | null
  product: { id: string; name: string; code: string }
}

export interface Stocktake {
  id: string
  stocktakeNo: string
  warehouseId: string
  status: string
  remark: string | null
  createdAt: string
  warehouse: { id: string; name: string }
  createdBy: { id: string; name: string }
  items: StocktakeItem[]
}

export const stocktakesService = {
  getAll: () => api.get<Stocktake[]>('/inventory/stocktakes'),
  getById: (id: string) => api.get<Stocktake>(`/inventory/stocktakes/${id}`),
  create: (data: { warehouseId: string; remark?: string }) =>
    api.post<Stocktake>('/inventory/stocktakes', data),
  updateItem: (stocktakeId: string, itemId: string, countedQty: number) =>
    api.patch<StocktakeItem>(`/inventory/stocktakes/${stocktakeId}/items/${itemId}`, { countedQty }),
  complete: (id: string) => api.post<Stocktake>(`/inventory/stocktakes/${id}/complete`),
  delete: (id: string) => api.delete(`/inventory/stocktakes/${id}`),
}
