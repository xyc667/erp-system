/** Route path → required permission codes (any match grants access). null = authenticated only. */
export const ROUTE_PERMISSIONS: Record<string, string[] | null> = {
  '/': null,
  '/dashboard': null,
  '/bi-screen': null,
  '/finance/gl': ['finance:gl'],
  '/finance/ar': ['finance:ar'],
  '/finance/ap': ['finance:ap'],
  '/finance/assets': ['finance:asset'],
  '/finance/report': ['finance:report', 'report:center'],
  '/finance/budget': ['finance:budget'],
  '/procurement/vendor': ['procurement:vendor'],
  '/procurement/request': ['procurement:request'],
  '/procurement/order': ['procurement:order'],
  '/procurement/receive': ['procurement:receive', 'procurement:order'],
  '/sales/customer': ['sales:customer'],
  '/sales/quote': ['sales:quote'],
  '/sales/order': ['sales:order'],
  '/sales/delivery': ['sales:delivery', 'sales:order'],
  '/sales/service': ['sales:service'],
  '/sales/leads/pool': ['lead:view'],
  '/sales/leads/mine': ['lead:view'],
  '/sales/leads/stats': ['lead:view', 'lead:manage'],
  '/sales/leads/reports': ['lead:review', 'lead:manage'],
  '/production/bom': ['production:bom'],
  '/production/plan': ['production:plan'],
  '/production/work-order': ['production:workorder'],
  '/production/quality': ['production:quality'],
  '/inventory/stock': ['inventory:stock'],
  '/inventory/inout': ['inventory:inout'],
  '/inventory/alert': ['inventory:alert'],
  '/inventory/stocktake': ['inventory:inout'],
  '/inventory/transfer': ['inventory:inout'],
  '/inventory/trace': ['inventory:trace'],
  '/inventory/product': ['inventory:stock'],
  '/inventory/warehouse': ['inventory:stock'],
  '/hr/employee': ['hr:employee'],
  '/hr/department': ['hr:employee'],
  '/hr/position': ['hr:employee'],
  '/hr/attendance': ['hr:attendance'],
  '/hr/salary': ['hr:salary'],
  '/hr/performance': ['hr:performance'],
  '/project': ['project:manage'],
  '/report': ['report:center'],
  '/report/intelligence': ['report:center', 'inventory:alert', 'finance:report'],
  '/system/user': ['user:manage', 'user:view'],
  '/system/role': ['role:manage'],
  '/system/config': ['system:config'],
  '/system/integration': ['integration:sync'],
  '/system/audit': ['system:audit'],
  '/system/tenant': ['system:tenant'],
  '/system/files': ['file:manage', 'system:config'],
  '/system/leads/import': ['lead:import'],
}

const sortedPaths = Object.keys(ROUTE_PERMISSIONS).sort((a, b) => b.length - a.length)

export function resolveRoutePath(pathname: string): string {
  const exact = ROUTE_PERMISSIONS[pathname]
  if (exact !== undefined) return pathname
  const matched = sortedPaths.find(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  )
  return matched ?? pathname
}

export function canAccessRoute(
  pathname: string,
  hasPermission: (...codes: string[]) => boolean,
): boolean {
  const routePath = resolveRoutePath(pathname)
  const required = ROUTE_PERMISSIONS[routePath]
  if (required === null || required === undefined) return true
  return hasPermission(...required)
}
