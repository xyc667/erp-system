import api from './api'

export const inventoryTransferService = {
  transfer: (data: {
    productId: string
    fromWarehouseId: string
    toWarehouseId: string
    quantity: number
    referenceNo?: string
  }) => api.post('/inventory/transfers', data),
}
