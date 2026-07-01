/**
 * Intelligence center smoke test — replenishment + finance insights.
 * Usage: node scripts/test-intelligence-flow.mjs
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
const cleanup = { prIds: [], fgSafety: null, fgId: null }

async function ensureReplenishmentRow() {
  const products = (await api(h, 'GET', '/api/inventory/products')).data
  const fg = products.find((p) => p.code === 'FG001')
  assert(fg, 'FG001 missing')
  cleanup.fgId = fg.id
  cleanup.fgSafety = Number(fg.safetyStock ?? 50)

  let rows = (await api(h, 'GET', '/api/intelligence/replenishment')).data
  if (!rows.length) {
    await api(h, 'PATCH', `/api/inventory/products/${fg.id}`, { safetyStock: 2000 })
    rows = (await api(h, 'GET', '/api/intelligence/replenishment')).data
  }
  assert(rows.length > 0, 'no replenishment rows after seeding alert')
  return rows
}

await step('replenishment rows match inventory alerts', async () => {
  const [repl, alerts] = await Promise.all([
    api(h, 'GET', '/api/intelligence/replenishment'),
    api(h, 'GET', '/api/inventory/alerts'),
  ])
  assert(repl.ok && alerts.ok, 'API failed')
  assert(repl.data.length === alerts.data.length, `count ${repl.data.length} vs alerts ${alerts.data.length}`)
  if (repl.data.length) {
    const r = repl.data[0]
    assert(r.shortage > 0, 'shortage should be positive')
    assert(r.suggestedQty >= r.shortage, 'suggestedQty should cover shortage')
    assert(['high', 'medium', 'low'].includes(r.priority), 'invalid priority')
    assert(['velocity_and_safety', 'safety_stock_only'].includes(r.reasonCode), 'invalid reasonCode')
  }
})

await step('replenishment calculation fields', async () => {
  const rows = await ensureReplenishmentRow()
  const row = rows.find((r) => r.productCode === 'FG001') || rows[0]
  assert(row.currentQty < row.safetyStock, 'should be below safety stock')
  assert(typeof row.dailyConsumption === 'number', 'dailyConsumption missing')
  assert(row.suggestedQty >= 1, 'suggestedQty min 1')
  if (row.dailyConsumption > 0) {
    assert(row.coverageDays != null, 'coverageDays expected when consumption > 0')
  }
})

await step('finance insights structure + codes', async () => {
  const r = await api(h, 'GET', '/api/intelligence/finance')
  assert(r.ok, `status ${r.status}`)
  const { insights, finance, overview } = r.data
  assert(Array.isArray(insights) && insights.length > 0, 'no insights')
  assert(finance.receivables && finance.payables, 'embedded finance missing')
  assert(typeof overview.salesTotal === 'number', 'embedded overview missing')

  for (const item of insights) {
    assert(item.code && item.severity && item.params, `insight shape: ${item.code}`)
    assert(['info', 'warning', 'success'].includes(item.severity), `severity ${item.severity}`)
  }
  const codes = insights.map((i) => i.code)
  assert(codes.includes('net_cash_position'), 'missing net_cash_position')
})

await step('finance insights net position matches report', async () => {
  const [intel, report] = await Promise.all([
    api(h, 'GET', '/api/intelligence/finance'),
    api(h, 'GET', '/api/report/finance'),
  ])
  const netInsight = intel.data.insights.find((i) => i.code === 'net_cash_position')
  const expected =
    report.data.receivables.outstanding - report.data.payables.outstanding
  const actual = Number(netInsight.params.net)
  assert(Math.abs(actual - expected) < 0.02, `net ${actual} != ${expected}`)
  assert(
    Math.abs(intel.data.finance.receivables.outstanding - report.data.receivables.outstanding) < 0.02,
    'AR mismatch between intelligence and report',
  )
})

await step('create-request single product', async () => {
  const rows = await ensureReplenishmentRow()
  const target = rows[0]
  const created = await api(h, 'POST', '/api/intelligence/replenishment/create-request', {
    productIds: [target.productId],
  })
  assert(created.ok, created.data?.message || `status ${created.status}`)
  assert(created.data.requestNo?.startsWith('PR-'), 'invalid requestNo')
  assert(created.data.items?.length === 1, 'expected 1 item')
  assert(Number(created.data.items[0].quantity) >= target.suggestedQty, 'qty below suggestion')
  cleanup.prIds.push(created.data.id)
})

await step('create-request all products', async () => {
  const rows = await ensureReplenishmentRow()
  if (rows.length < 1) return
  const created = await api(h, 'POST', '/api/intelligence/replenishment/create-request', {})
  assert(created.ok, created.data?.message || `status ${created.status}`)
  assert(created.data.items?.length >= 1, 'expected items')
  cleanup.prIds.push(created.data.id)
})

await step('create-request rejects when no alerts', async () => {
  const products = (await api(h, 'GET', '/api/inventory/products')).data
  for (const p of products) {
    await api(h, 'PATCH', `/api/inventory/products/${p.id}`, { safetyStock: 0 })
  }
  const empty = await api(h, 'POST', '/api/intelligence/replenishment/create-request', {})
  assert(empty.status === 400, `expected 400 got ${empty.status}`)
  assert(String(empty.data?.message || '').includes('采购申请'), 'expected error message')
  if (cleanup.fgId) {
    await api(h, 'PATCH', `/api/inventory/products/${cleanup.fgId}`, {
      safetyStock: cleanup.fgSafety,
    })
  }
})

await step('employee can read replenishment (report:center)', async () => {
  const empH = await login('employee', demoPassword)
  const r = await api(empH, 'GET', '/api/intelligence/replenishment')
  assert(r.ok, `employee replenishment ${r.status}`)
})

await step('employee can create replenishment request (procurement:request)', async () => {
  await ensureReplenishmentRow()
  const empH = await login('employee', demoPassword)
  const rows = (await api(empH, 'GET', '/api/intelligence/replenishment')).data
  if (!rows.length) return
  const created = await api(empH, 'POST', '/api/intelligence/replenishment/create-request', {
    productIds: [rows[0].productId],
  })
  assert(created.ok, created.data?.message || `status ${created.status}`)
  cleanup.prIds.push(created.data.id)
})

await step('procurement_clerk denied replenishment read', async () => {
  const clerkH = await login('procurement_clerk', demoPassword)
  const r = await api(clerkH, 'GET', '/api/intelligence/replenishment')
  assert(r.status === 403, `expected 403 got ${r.status}`)
})

await step('finance_clerk can read finance insights', async () => {
  const finH = await login('finance_clerk', demoPassword)
  const r = await api(finH, 'GET', '/api/intelligence/finance')
  assert(r.ok && r.data.insights?.length > 0, 'finance_clerk insights failed')
})

for (const id of cleanup.prIds) await api(h, 'DELETE', `/api/procurement/requests/${id}`)
if (cleanup.fgId && cleanup.fgSafety != null) {
  await api(h, 'PATCH', `/api/inventory/products/${cleanup.fgId}`, {
    safetyStock: cleanup.fgSafety,
  })
}

const failed = results.filter((r) => !r.ok)
console.log('\n---')
console.log(`${results.length - failed.length}/${results.length} passed`)
if (failed.length) process.exit(1)
