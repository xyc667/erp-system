import api from './api'

export interface DashboardStats {
  stats: {
    salesTotal: number
    purchaseOrderCount: number
    salesOrderCount: number
    inventoryQuantity: number
    userCount: number
    employeeCount: number
    projectCount: number
    purchaseTotal: number
  }
  charts: {
    monthlySales: { month: string; amount: number }[]
    salesByStatus: { name: string; value: number }[]
    purchaseByStatus: { name: string; value: number }[]
  }
}

export const reportService = {
  getOverview: () => api.get<DashboardStats>('/report/overview'),
  getDashboardStats: () => api.get<DashboardStats>('/dashboard/stats'),
  getFinanceReport: () => api.get<FinanceReport>('/report/finance'),
}

export interface FinanceReport {
  receivables: { total: number; received: number; outstanding: number; openCount: number }
  payables: { total: number; paid: number; outstanding: number; openCount: number }
  fixedAssets: { originalValue: number; accumulatedDepreciation: number; netValue: number; count: number }
  trialBalance: { code: string; name: string; type: string; debit: number; credit: number; balance: number }[]
  summaryByType: Record<string, number>
}
