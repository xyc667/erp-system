import api from './api'

export const integrationService = {
  exportMasterData: () => api.get('/integration/master-data'),
  exportOrders: (type?: 'sales' | 'purchase') =>
    api.get('/integration/orders', { params: type ? { type } : undefined }),
  exportInventory: () => api.get('/integration/inventory'),
}
