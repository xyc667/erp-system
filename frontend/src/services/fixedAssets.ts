import api from './api'

export interface FixedAsset {
  id: string
  assetNo: string
  name: string
  category: string | null
  originalValue: number
  accumulatedDepreciation: number
  usefulLifeMonths: number
  startDate: string
  location: string | null
  status: string
}

export const fixedAssetsService = {
  getAll: () => api.get<FixedAsset[]>('/finance/assets'),
  create: (data: Partial<FixedAsset>) => api.post<FixedAsset>('/finance/assets', data),
  depreciate: (id: string) => api.post<FixedAsset>(`/finance/assets/${id}/depreciate`),
  dispose: (id: string) => api.post<FixedAsset>(`/finance/assets/${id}/dispose`),
  delete: (id: string) => api.delete(`/finance/assets/${id}`),
}
