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

export interface BiFeedOrder {
  id: string
  orderNo: string
  type: 'sales' | 'purchase'
  partyName: string
  totalAmount: number
  status: string
  createdAt: string
}

export interface BiFeedEvent {
  id: string
  kind: 'sales_order' | 'purchase_order' | 'lead_convert' | 'audit'
  title: string
  detail: string
  status?: string
  amount?: number
  actor?: string
  createdAt: string
}

export interface BiFeedMapPoint {
  name: string
  district: string | null
  lng: number
  lat: number
  category: string | null
}

export interface BiFeedMapDistrict {
  district: string
  count: number
  lng: number
  lat: number
}

export interface BiFeed {
  orders: BiFeedOrder[]
  events: BiFeedEvent[]
  map: {
    districts: BiFeedMapDistrict[]
    points: BiFeedMapPoint[]
  }
}

export const reportService = {
  getOverview: () => api.get<DashboardStats>('/report/overview'),
  getDashboardStats: () => api.get<DashboardStats>('/dashboard/stats'),
  getBiFeed: () => api.get<BiFeed>('/dashboard/feed'),
  getFinanceReport: () => api.get<FinanceReport>('/report/finance'),
}

export interface FinanceReport {
  receivables: { total: number; received: number; outstanding: number; openCount: number }
  payables: { total: number; paid: number; outstanding: number; openCount: number }
  fixedAssets: { originalValue: number; accumulatedDepreciation: number; netValue: number; count: number }
  trialBalance: { code: string; name: string; type: string; debit: number; credit: number; balance: number }[]
  summaryByType: Record<string, number>
}
