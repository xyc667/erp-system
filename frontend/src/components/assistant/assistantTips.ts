import { matchRoutePath } from '../../config/routeI18n'

/** 路由 → assistant.tips.* 的 i18n 键后缀 */
export const ROUTE_TIP_KEYS: Record<string, string> = {
  '/dashboard': 'dashboard',
  '/bi-screen': 'biScreen',
  '/finance/gl': 'financeGl',
  '/finance/ar': 'financeAr',
  '/finance/ap': 'financeAp',
  '/finance/assets': 'financeAssets',
  '/finance/report': 'financeReport',
  '/finance/budget': 'financeBudget',
  '/procurement/vendor': 'procurementVendor',
  '/procurement/request': 'procurementRequest',
  '/procurement/order': 'procurementOrder',
  '/procurement/receive': 'procurementReceive',
  '/sales/customer': 'salesCustomer',
  '/sales/quote': 'salesQuote',
  '/sales/order': 'salesOrder',
  '/sales/delivery': 'salesDelivery',
  '/sales/service': 'salesService',
  '/sales/leads/pool': 'leadPool',
  '/sales/leads/mine': 'leadMine',
  '/sales/leads/stats': 'leadStats',
  '/sales/leads/reports': 'leadReports',
  '/production/bom': 'productionBom',
  '/production/plan': 'productionPlan',
  '/production/work-order': 'productionWorkOrder',
  '/production/quality': 'productionQuality',
  '/inventory/stock': 'inventoryStock',
  '/inventory/inout': 'inventoryInout',
  '/inventory/alert': 'inventoryAlert',
  '/inventory/stocktake': 'inventoryStocktake',
  '/inventory/transfer': 'inventoryTransfer',
  '/inventory/trace': 'inventoryTrace',
  '/inventory/product': 'inventoryProduct',
  '/inventory/warehouse': 'inventoryWarehouse',
  '/hr/employee': 'hrEmployee',
  '/hr/department': 'hrDepartment',
  '/hr/position': 'hrPosition',
  '/hr/attendance': 'hrAttendance',
  '/hr/salary': 'hrSalary',
  '/hr/performance': 'hrPerformance',
  '/project': 'project',
  '/report': 'reportCenter',
  '/report/intelligence': 'intelligence',
  '/system/user': 'systemUser',
  '/system/role': 'systemRole',
  '/system/config': 'systemConfig',
  '/system/integration': 'systemIntegration',
  '/system/audit': 'systemAudit',
  '/system/tenant': 'systemTenant',
  '/system/files': 'systemFiles',
  '/system/leads/import': 'leadImport',
}

const MODULE_TIP_KEYS: Record<string, string> = {
  finance: 'finance',
  procurement: 'procurement',
  sales: 'sales',
  production: 'production',
  inventory: 'inventory',
  hr: 'hr',
  project: 'project',
  report: 'report',
  system: 'system',
}

export type AssistantTipSource = 'unread' | 'route' | 'module' | 'quip'

export interface AssistantTip {
  text: string
  source: AssistantTipSource
  actionPath: string | null
}

function quipIndex(pathname: string, count: number): number {
  if (count <= 0) return 0
  let hash = 0
  for (let i = 0; i < pathname.length; i += 1) {
    hash = (hash + pathname.charCodeAt(i) * (i + 1)) % count
  }
  return hash
}

function moduleDefaultPath(module: string): string | null {
  const prefix = module === 'report' ? '/report' : `/${module}/`
  const paths = Object.keys(ROUTE_TIP_KEYS).filter((path) => path.startsWith(prefix))
  return paths[0] ?? null
}

export function resolveAssistantTip(
  pathname: string,
  unread: number,
  t: (key: string, options?: Record<string, unknown>) => string,
  unreadActionPath: string | null = null,
): AssistantTip {
  if (unread > 0) {
    return {
      text: t('assistant.tips.unread', { count: unread }),
      source: 'unread',
      actionPath: unreadActionPath,
    }
  }

  const matched = matchRoutePath(pathname)
  if (matched) {
    const routeKey = ROUTE_TIP_KEYS[matched]
    if (routeKey) {
      const text = t(`assistant.tips.${routeKey}`, { defaultValue: '' })
      if (text) {
        return { text, source: 'route', actionPath: matched }
      }
    }

    const module = matched.split('/').filter(Boolean)[0]
    if (module && MODULE_TIP_KEYS[module]) {
      return {
        text: t(`assistant.tips.module.${MODULE_TIP_KEYS[module]}`),
        source: 'module',
        actionPath: moduleDefaultPath(module),
      }
    }
  }

  const quips = t('assistant.quips', { returnObjects: true, defaultValue: [] }) as string[] | string
  const list = Array.isArray(quips) ? quips : []
  if (list.length > 0) {
    return {
      text: list[quipIndex(pathname, list.length)],
      source: 'quip',
      actionPath: null,
    }
  }

  return { text: t('assistant.tips.default'), source: 'quip', actionPath: null }
}
