/**
 * Smoke-verify flows documented in USER_MANUAL.md (procurement + finance).
 * Usage: node scripts/verify-manual-flows.mjs
 */
const apiURL = process.env.E2E_API_URL || 'http://localhost:3001'
const adminPassword = process.env.E2E_ADMIN_PASSWORD || 'admin123'

async function login() {
  const res = await fetch(`${apiURL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: adminPassword, tenantCode: 'default' }),
  })
  if (!res.ok) throw new Error(`login failed: ${res.status}`)
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

const h = await login()
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

await step('intelligence replenishment API', async () => {
  const r = await api(h, 'GET', '/api/intelligence/replenishment')
  assert(r.ok, `status ${r.status}`)
  assert(Array.isArray(r.data), 'expected array')
})

await step('finance report API', async () => {
  const r = await api(h, 'GET', '/api/report/finance')
  assert(r.ok, `status ${r.status}`)
  assert(r.data.payables && r.data.receivables, 'missing summary')
})

await step('AP partial payment + cache refresh', async () => {
  const list = (await api(h, 'GET', '/api/finance/payables')).data
  const open = list.find((a) => a.status !== 'paid')
  assert(open, 'no open AP')
  const before = (await api(h, 'GET', '/api/report/finance')).data.payables.outstanding
  const pay = await api(h, 'POST', `/api/finance/payables/${open.id}/payment`, { amount: 1 })
  assert(pay.ok, pay.data?.message || `status ${pay.status}`)
  const after = (await api(h, 'GET', '/api/report/finance')).data.payables.outstanding
  assert(after < before, `report not updated: ${before} -> ${after}`)
})

await step('GL unbalanced journal rejected', async () => {
  const accounts = (await api(h, 'GET', '/api/finance/accounts')).data
  const cash = accounts.find((a) => a.code === '1001')
  const revenue = accounts.find((a) => a.code === '6001')
  assert(cash && revenue, 'missing accounts')
  const r = await api(h, 'POST', '/api/finance/journals', {
    date: '2026-07-01',
    type: 'manual',
    lines: [
      { accountId: cash.id, debit: 10, credit: 0 },
      { accountId: revenue.id, debit: 0, credit: 5 },
    ],
  })
  assert(r.status === 400, `expected 400 got ${r.status}`)
})

await step('procurement orders list', async () => {
  const r = await api(h, 'GET', '/api/procurement/orders')
  assert(r.ok && Array.isArray(r.data), 'orders list failed')
})

await step('budget blocks PO approval when exceeded', async () => {
  const budgets = (await api(h, 'GET', '/api/finance/budgets')).data
  const budget = budgets.find((b) => b.category === 'procurement' && b.status === 'active')
  assert(budget, 'no active procurement budget')
  const remaining = Number(budget.totalAmount) - Number(budget.usedAmount)
  const vendors = (await api(h, 'GET', '/api/procurement/vendors')).data
  const products = (await api(h, 'GET', '/api/inventory/products')).data
  const fg = products.find((p) => p.code === 'FG001')
  assert(fg && vendors[0], 'missing vendor/product')
  const qty = Math.ceil((remaining + 1000) / 500)
  const po = await api(h, 'POST', '/api/procurement/orders', {
    vendorId: vendors[0].id,
    items: [{ productId: fg.id, quantity: qty, unitPrice: 500 }],
  })
  assert(po.ok, po.data?.message || 'create PO failed')
  const approve = await api(h, 'POST', `/api/procurement/orders/${po.data.id}/approve`)
  assert(approve.status === 400, `expected 400 got ${approve.status}`)
  assert(String(approve.data?.message || '').includes('预算'), 'expected budget error message')
  await api(h, 'DELETE', `/api/procurement/orders/${po.data.id}`)
})

await step('fixed asset depreciation refreshes finance report cache', async () => {
  const assets = (await api(h, 'GET', '/api/finance/assets')).data
  const active = assets.find((a) => a.status === 'active')
  assert(active, 'no active fixed asset')
  const reportBefore = (await api(h, 'GET', '/api/report/finance')).data.fixedAssets.netValue
  const dep = await api(h, 'POST', `/api/finance/assets/${active.id}/depreciate`)
  assert(dep.ok, dep.data?.message || 'depreciate failed')
  const reportAfter = (await api(h, 'GET', '/api/report/finance')).data.fixedAssets.netValue
  const expectedNet =
    Number(active.originalValue) - Number(dep.data.accumulatedDepreciation)
  assert(Math.abs(reportAfter - expectedNet) < 0.01, `report ${reportAfter} != ${expectedNet}`)
  assert(reportAfter !== reportBefore, 'report net value should change after depreciate')
})

await step('production work order lifecycle', async () => {
  const products = (await api(h, 'GET', '/api/inventory/products')).data
  const boms = (await api(h, 'GET', '/api/production/boms')).data
  const wh = (await api(h, 'GET', '/api/inventory/warehouses')).data
  const fg = products.find((p) => p.code === 'FG001')
  const bom = boms.find((b) => b.code === 'BOM-FG001')
  assert(fg && bom && wh[0], 'missing production master data')
  const wo = await api(h, 'POST', '/api/production/work-orders', {
    bomId: bom.id,
    productId: fg.id,
    plannedQty: 1,
    warehouseId: wh[0].id,
  })
  assert(wo.ok, wo.data?.message || 'create WO failed')
  assert(await api(h, 'POST', `/api/production/work-orders/${wo.data.id}/release`).then((r) => r.ok))
  assert(await api(h, 'POST', `/api/production/work-orders/${wo.data.id}/start`).then((r) => r.ok))
  const done = await api(h, 'POST', `/api/production/work-orders/${wo.data.id}/complete`, {
    warehouseId: wh[0].id,
  })
  assert(done.ok && done.data.status === 'completed', 'complete WO failed')
})

await step('inventory stock ledger API', async () => {
  const r = await api(h, 'GET', '/api/inventory/stock')
  assert(r.ok && Array.isArray(r.data) && r.data.length > 0, 'stock list failed')
})

await step('inventory adjust in/out + insufficient stock guard', async () => {
  const products = (await api(h, 'GET', '/api/inventory/products')).data
  const wh = (await api(h, 'GET', '/api/inventory/warehouses')).data
  const fg = products.find((p) => p.code === 'FG001')
  const wh1 = wh.find((w) => w.code === 'WH001')
  assert(fg && wh1, 'missing FG001 or WH001')
  const inRes = await api(h, 'POST', '/api/inventory/movements', {
    productId: fg.id,
    warehouseId: wh1.id,
    quantity: 1,
    type: 'adjustment',
    referenceNo: 'VERIFY-IN',
  })
  assert(inRes.ok, inRes.data?.message || 'adjust in failed')
  const outRes = await api(h, 'POST', '/api/inventory/movements', {
    productId: fg.id,
    warehouseId: wh1.id,
    quantity: -999999,
    type: 'adjustment',
    referenceNo: 'VERIFY-OUT',
  })
  assert(outRes.status === 400, `expected 400 got ${outRes.status}`)
  await api(h, 'POST', '/api/inventory/movements', {
    productId: fg.id,
    warehouseId: wh1.id,
    quantity: -1,
    type: 'adjustment',
    referenceNo: 'VERIFY-ROLLBACK',
  })
})

await step('inventory transfer rejects same warehouse', async () => {
  const products = (await api(h, 'GET', '/api/inventory/products')).data
  const wh = (await api(h, 'GET', '/api/inventory/warehouses')).data
  const fg = products.find((p) => p.code === 'FG001')
  const wh1 = wh[0]
  assert(fg && wh1, 'missing product/warehouse')
  const r = await api(h, 'POST', '/api/inventory/transfers', {
    productId: fg.id,
    fromWarehouseId: wh1.id,
    toWarehouseId: wh1.id,
    quantity: 1,
  })
  assert(r.status === 400, `expected 400 got ${r.status}`)
})

await step('inventory alerts API', async () => {
  const r = await api(h, 'GET', '/api/inventory/alerts')
  assert(r.ok && Array.isArray(r.data), 'alerts list failed')
})

const failed = results.filter((r) => !r.ok)
console.log('\n---')
console.log(`${results.length - failed.length}/${results.length} passed`)
if (failed.length) {
  process.exit(1)
}
