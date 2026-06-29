import api from './api'

export interface SystemConfig {
  id: string
  key: string
  value: string
  description: string | null
  group: string
  createdAt: string
  updatedAt: string
}

export interface Dictionary {
  id: string
  code: string
  name: string
  description: string | null
  items: DictionaryItem[]
}

export interface DictionaryItem {
  id: string
  label: string
  value: string
  sortOrder: number
  status: string
}

export const systemService = {
  getConfigs: () => api.get<SystemConfig[]>('/system/config'),
  createConfig: (data: { key: string; value: string; description?: string; group?: string }) =>
    api.post<SystemConfig>('/system/config', data),
  updateConfig: (id: string, data: { value?: string; description?: string; group?: string }) =>
    api.patch<SystemConfig>(`/system/config/${id}`, data),
  deleteConfig: (id: string) => api.delete(`/system/config/${id}`),

  getDictionaries: () => api.get<Dictionary[]>('/system/dictionaries'),
  createDictionary: (data: { code: string; name: string; description?: string }) =>
    api.post<Dictionary>('/system/dictionaries', data),
  deleteDictionary: (id: string) => api.delete(`/system/dictionaries/${id}`),
  addDictionaryItem: (dictionaryId: string, data: { label: string; value: string; sortOrder?: number }) =>
    api.post(`/system/dictionaries/${dictionaryId}/items`, data),
  deleteDictionaryItem: (id: string) => api.delete(`/system/dictionary-items/${id}`),
}
