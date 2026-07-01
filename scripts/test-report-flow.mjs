/**
 * Report center smoke test — overview, finance, intelligence APIs.
 * Usage: node scripts/test-report-flow.mjs
 */
const apiURL = process.env.E2E_API_URL || 'http://localhost:3001'
const adminPassword = process.env.E2E_ADMIN_PASSWORD || 'admin123'
const demoPassword = process.env.E2E_DEMO_PASSWORD || process.env.SEED_DEMO_PASSWORD || 'demo123'

async function login(username = 'admin', password = adminPassword) {
  const res = await fetch(`${apiURL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password, tenantCode: 'default' }),
  })
  if (!res.ok) throw new Error(`login ${username} failed: ${res.status}`)
  const data = await res.json()
  return { Authorization: `Bearer ${data.access_token}`, 'Content-Type': 'application/json' }
}

async function api(h, method, path, body) {
  const res = await fetch(`${apiURL}${path}`, {
    method,
    headers: h,
    body: body ? JSON.stringify(body) : undefined,
  })
  return { status: res.status, ok: res.ok, data: await res.json().catch(() => null) }
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg)
}

const results = []
async function step(name, fn) {
  try {
    await fn()
    results.push({ name, ok: true })
    console.log('✓', name)
  } catch (e) {
    results.push({ name, ok: false, error: e.message })
    console.log('✗', name, '-', e.message)
  }
}

const h = await login()

await step('report overview API structure', async () => {
  const r = await api(h, 'GET', '/api/report/overview')
  assert(r.ok, `status ${r.status}`)
  assert(r.data.stats && r.data.charts, 'missing stats/charts')
  assert(typeof r.data.stats.salesTotal === 'number', 'salesTotal missing')
  assert(Array.isArray(r.data.charts.monthlySales), 'monthlySales missing')
  assert(Array.isArray(r.data.charts.salesByStatus), 'salesByStatus missing')
  assert(typeof r.data.stats.employeeCount === 'number', 'employeeCount missing')
})

await step('dashboard stats API (authenticated)', async () => {
  const r = await api(h, 'GET', '/api/dashboard/stats')
  assert(r.ok, `status ${r.status}`)
  assert(r.data.stats && r.data.charts, 'dashboard stats shape')
})

await step('finance report API structure', async () => {
  const r = await api(h, 'GET', '/api/report/finance')
  assert(r.ok, `status ${r.status}`)
  assert(r.data.receivables && r.data.payables && r.data.fixedAssets, 'missing sections')
  assert(Array.isArray(r.data.trialBalance), 'trialBalance missing')
  assert(typeof r.data.receivables.outstanding === 'number', 'AR outstanding missing')
})

await step('intelligence replenishment API', async () => {
  const r = await api(h, 'GET', '/api/intelligence/replenishment')
  assert(r.ok, `status ${r.status}`)
  assert(Array.isArray(r.data), 'expected array')
  if (r.data.length) {
    const row = r.data[0]
    assert(row.productCode && row.suggestedQty != null, 'replenishment row shape')
    assert(['high', 'medium', 'low'].includes(row.priority), 'priority missing')
  }
})

await step('intelligence finance insights API', async () => {
  const r = await api(h, 'GET', '/api/intelligence/finance')
  assert(r.ok, `status ${r.status}`)
  assert(Array.isArray(r.data.insights), 'insights missing')
  assert(r.data.finance && r.data.overview, 'embedded finance/overview missing')
  const codes = r.data.insights.map((i) => i.code)
  assert(codes.includes('net_cash_position'), 'net_cash_position insight missing')
})

await step('overview cache returns consistent data', async () => {
  const a = (await api(h, 'GET', '/api/report/overview')).data
  const b = (await api(h, 'GET', '/api/report/overview')).data
  assert(a.stats.salesTotal === b.stats.salesTotal, 'cache inconsistent salesTotal')
  assert(a.stats.salesOrderCount === b.stats.salesOrderCount, 'cache inconsistent order count')
})

await step('employee with report:center can read overview', async () => {
  const empH = await login('employee', demoPassword)
  const r = await api(empH, 'GET', '/api/report/overview')
  assert(r.ok, `employee overview ${r.status}`)
})

await step('procurement_clerk denied report overview', async () => {
  const clerkH = await login('procurement_clerk', demoPassword)
  const r = await api(clerkH, 'GET', '/api/report/overview')
  assert(r.status === 403, `expected 403 got ${r.status}`)
})

await step('finance_clerk can read finance report + insights', async () => {
  const finH = await login('finance_clerk', demoPassword)
  const report = await api(finH, 'GET', '/api/report/finance')
  assert(report.ok, `finance report ${report.status}`)
  const insights = await api(finH, 'GET', '/api/intelligence/finance')
  assert(insights.ok && insights.data.insights?.length > 0, 'finance insights failed')
})

await step('replenishment create-request (admin)', async () => {
  const alerts = (await api(h, 'GET', '/api/intelligence/replenishment')).data
  if (!alerts.length) {
    console.log('  (skip: no replenishment rows)')
    return
  }
  const created = await api(h, 'POST', '/api/intelligence/replenishment/create-request', {
    productIds: [alerts[0].productId],
  })
  assert(created.ok, created.data?.message || `create-request ${created.status}`)
  assert(created.data.requestNo, 'missing requestNo')
  await api(h, 'DELETE', `/api/procurement/requests/${created.data.id}`)
})

const failed = results.filter((r) => !r.ok)
console.log('\n---')
console.log(`${results.length - failed.length}/${results.length} passed`)
if (failed.length) process.exit(1)
