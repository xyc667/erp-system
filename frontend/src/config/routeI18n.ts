/** Maps route paths to i18n keys under `routes.*` or `menu.*` */
export const ROUTE_I18N_KEYS: Record<string, string> = {
  '/dashboard': 'routes.dashboard',
  '/bi-screen': 'routes.biScreen',
  '/finance/gl': 'routes.financeGl',
  '/finance/ar': 'routes.financeAr',
  '/finance/ap': 'routes.financeAp',
  '/finance/assets': 'routes.financeAssets',
  '/finance/report': 'routes.financeReport',
  '/finance/budget': 'routes.financeBudget',
  '/procurement/vendor': 'routes.procurementVendor',
  '/procurement/request': 'routes.procurementRequest',
  '/procurement/order': 'routes.procurementOrder',
  '/procurement/receive': 'routes.procurementReceive',
  '/sales/customer': 'routes.salesCustomer',
  '/sales/quote': 'routes.salesQuote',
  '/sales/order': 'routes.salesOrder',
  '/sales/delivery': 'routes.salesDelivery',
  '/sales/service': 'routes.salesService',
  '/production/bom': 'routes.productionBom',
  '/production/plan': 'routes.productionPlan',
  '/production/work-order': 'routes.productionWorkOrder',
  '/production/quality': 'routes.productionQuality',
  '/inventory/stock': 'routes.inventoryStock',
  '/inventory/inout': 'routes.inventoryInout',
  '/inventory/alert': 'routes.inventoryAlert',
  '/inventory/stocktake': 'routes.inventoryStocktake',
  '/inventory/transfer': 'routes.inventoryTransfer',
  '/inventory/trace': 'routes.inventoryTrace',
  '/inventory/product': 'routes.inventoryProduct',
  '/inventory/warehouse': 'routes.inventoryWarehouse',
  '/hr/employee': 'routes.hrEmployee',
  '/hr/department': 'routes.hrDepartment',
  '/hr/position': 'routes.hrPosition',
  '/hr/attendance': 'routes.hrAttendance',
  '/hr/salary': 'routes.hrSalary',
  '/hr/performance': 'routes.hrPerformance',
  '/project': 'routes.project',
  '/report': 'routes.report',
  '/report/intelligence': 'routes.intelligence',
  '/system/user': 'routes.systemUser',
  '/system/role': 'routes.systemRole',
  '/system/config': 'routes.systemConfig',
  '/system/integration': 'routes.systemIntegration',
  '/system/audit': 'routes.systemAudit',
  '/system/tenant': 'routes.systemTenant',
  '/system/files': 'routes.systemFiles',
}

export const MODULE_I18N_KEYS: Record<string, string> = {
  finance: 'menu.finance',
  procurement: 'menu.procurement',
  sales: 'menu.sales',
  production: 'menu.production',
  inventory: 'menu.inventory',
  hr: 'menu.hr',
  report: 'menu.report',
  system: 'menu.system',
}

export const SORTED_ROUTE_PATHS = Object.keys(ROUTE_I18N_KEYS).sort(
  (a, b) => b.length - a.length,
)

export function matchRoutePath(pathname: string): string | undefined {
  return SORTED_ROUTE_PATHS.find(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  )
}

export function routeLabel(t: (key: string) => string, pathname: string): string {
  const matched = matchRoutePath(pathname)
  return matched ? t(ROUTE_I18N_KEYS[matched]) : t('common.page')
}
