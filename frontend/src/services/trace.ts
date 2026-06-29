import api from './api'

export interface SerialNumber {
  id: string
  serialNo: string
  batchNo?: string
  status: string
  product: { code: string; name: string }
  warehouse?: { name: string }
}

export const traceService = {
  listSerials: () => api.get<SerialNumber[]>('/inventory/trace/serials'),
  traceBatch: (batchNo: string) => api.get(`/inventory/trace/batch/${batchNo}`),
  traceSerial: (serialNo: string) => api.get(`/inventory/trace/serial/${serialNo}`),
  registerSerial: (data: {
    serialNo: string
    productId: string
    batchNo?: string
    warehouseId?: string
  }) => api.post('/inventory/trace/serials', data),
}
