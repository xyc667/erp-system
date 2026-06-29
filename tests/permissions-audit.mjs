/**
 * Permission audit: verify each permission code maps to a guarded API and role enforcement works.
 * Run: node tests/permissions-audit.mjs
 */
const BASE = process.env.API_BASE || 'http://localhost:3000/api'
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || process.env.E2E_ADMIN_PASSWORD || 'change-me-admin'
const DEMO_PASSWORD = process.env.SEED_DEMO_PASSWORD || 'change-me-demo'

/** One GET probe per permission code */
const PERMISSION_PROBES = {
  'user:manage': '/users',
  'user:view': '/users',
  'user:create': '/users', // guarded on POST; GET proves module access via view/manage
  'user:update': '/users',
  'user:delete': '/users',
  'role:manage': '/roles',
  'permission:manage': '/permissions',
  'system:config': '/system/config',
  'system:audit': '/system/audit-logs',
  'system:tenant': '/system/tenants',
  'file:manage': '/files',
  'finance:gl': '/finance/accounts',
  'finance:ar': '/finance/receivables',
  'finance:ap': '/finance/payables',
  'finance:asset': '/finance/assets',
  'finance:report': '/report/finance',
  'finance:budget': '/finance/budgets',
  'procurement:vendor': '/procurement/vendors',
  'procurement:request': '/procurement/requests',
  'procurement:order': '/procurement/orders',
  'procurement:receive': '/procurement/orders',
  'sales:customer': '/sales/customers',
  'sales:quote': '/sales/quotes',
  'sales:order': '/sales/orders',
  'sales:delivery': '/sales/orders',
  'sales:service': '/sales/service-tickets',
  'production:bom': '/production/boms',
  'production:plan': '/production/plans',
  'production:workorder': '/production/work-orders',
  'production:quality': '/production/inspections',
  'inventory:stock': '/inventory/stock',
  'inventory:inout': '/inventory/movements',
  'inventory:alert': '/inventory/alerts',
  'inventory:trace': '/inventory/trace/serials',
  'hr:employee': '/hr/employees',
  'hr:attendance': '/hr/attendance',
  'hr:salary': '/hr/salary',
  'hr:performance': '/hr/performance',
  'project:manage': '/projects',
  'report:center': '/report/overview',
  'integration:sync': '/integration/master-data',
}

async function login(username, password = DEMO_PASSWORD) {
  const res = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password, tenantCode: 'default' }),
  })
  if (!res.ok) throw new Error(`Login failed for ${username}: ${res.status}`)
  const data = await res.json()
  return { token: data.access_token, permissions: data.user.permissions }
}

async function probe(token, path) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  return res.status
}

async function main() {
  console.log('=== ERP Permission Audit ===\n')

  const admin = await login('admin', ADMIN_PASSWORD)
  const employee = await login('employee')

  console.log(`Admin permissions: ${admin.permissions.length}`)
  console.log(`Employee permissions: ${employee.permissions.join(', ')}\n`)

  const permListRes = await fetch(`${BASE}/permissions`, {
    headers: { Authorization: `Bearer ${admin.token}` },
  })
  const allPerms = await permListRes.json()
  const allCodes = allPerms.map((p) => p.code).sort()
  console.log(`Registered permissions in DB: ${allCodes.length}\n`)

  const missingProbe = allCodes.filter((c) => !PERMISSION_PROBES[c])
  if (missingProbe.length) {
    console.log('⚠ No API probe mapped:', missingProbe.join(', '))
  }

  console.log('--- Admin: all probes should NOT be 403 ---')
  let adminFail = []
  for (const [code, path] of Object.entries(PERMISSION_PROBES)) {
    const status = await probe(admin.token, path)
    const ok = status !== 403
    if (!ok) adminFail.push({ code, path, status })
    console.log(`${ok ? '✓' : '✗'} ${code.padEnd(22)} ${path} → ${status}`)
  }

  console.log('\n--- Employee (普通员工): allowed vs denied ---')
  const employeeSet = new Set(employee.permissions)
  let empMismatch = []
  for (const [code, path] of Object.entries(PERMISSION_PROBES)) {
    const status = await probe(employee.token, path)
    const shouldAllow = employeeSet.has(code)
      || (code === 'user:view' && employeeSet.has('user:manage'))
      || (code === 'procurement:receive' && employeeSet.has('procurement:order'))
      || (code === 'sales:delivery' && employeeSet.has('sales:order'))
    const allowed = status !== 403
    const ok = shouldAllow === allowed
    if (!ok) empMismatch.push({ code, path, status, shouldAllow, allowed })
    const mark = ok ? '✓' : '✗'
    const note = shouldAllow ? 'expect allow' : 'expect deny'
    console.log(`${mark} ${code.padEnd(22)} ${path} → ${status} (${note})`)
  }

  console.log('\n--- Route coverage (frontend ROUTE_PERMISSIONS codes) ---')
  const routeCodes = new Set([
    'finance:gl', 'finance:ar', 'finance:ap', 'finance:asset', 'finance:report', 'finance:budget',
    'procurement:vendor', 'procurement:request', 'procurement:order', 'procurement:receive',
    'sales:customer', 'sales:quote', 'sales:order', 'sales:delivery', 'sales:service',
    'production:bom', 'production:plan', 'production:workorder', 'production:quality',
    'inventory:stock', 'inventory:inout', 'inventory:alert', 'inventory:trace',
    'hr:employee', 'hr:attendance', 'hr:salary', 'hr:performance',
    'project:manage', 'report:center',
    'user:manage', 'user:view', 'role:manage', 'system:config', 'integration:sync',
    'system:audit', 'system:tenant', 'file:manage',
  ])
  const notInRoutes = allCodes.filter((c) => !routeCodes.has(c) && !c.startsWith('user:'))
  console.log('DB permissions not in menu routes (system-only):', notInRoutes.join(', ') || 'none')

  console.log('\n=== Summary ===')
  console.log(`Admin 403 failures: ${adminFail.length}`)
  console.log(`Employee enforcement mismatches: ${empMismatch.length}`)
  if (adminFail.length) console.log('Admin failures:', adminFail)
  if (empMismatch.length) console.log('Employee mismatches:', empMismatch)

  const exitCode = adminFail.length + empMismatch.length + missingProbe.length
  process.exit(exitCode > 0 ? 1 : 0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
