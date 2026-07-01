/**
 * Capture screenshots for USER_MANUAL.md (production module).
 * Requires: frontend :5173, backend :3001, seeded DB.
 * Usage: node scripts/capture-production-manual-screenshots.mjs
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { chromium } from '@playwright/test'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const outDir = path.join(__dirname, '..', 'docs', 'images')
const baseURL = process.env.E2E_BASE_URL || 'http://localhost:5173'
const apiURL = process.env.E2E_API_URL || 'http://localhost:3001'
const adminPassword = process.env.E2E_ADMIN_PASSWORD || 'admin123'

fs.mkdirSync(outDir, { recursive: true })

async function apiLogin() {
  const res = await fetch(`${apiURL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: adminPassword, tenantCode: 'default' }),
  })
  const data = await res.json()
  return { Authorization: `Bearer ${data.access_token}`, 'Content-Type': 'application/json' }
}

async function apiJson(headers, method, path, body) {
  const res = await fetch(`${apiURL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })
  return { status: res.status, data: await res.json().catch(() => null) }
}

/** Ensure demo rows for screenshots: approved plan, draft WO, in-progress WO. */
async function ensureProductionDemo(headers) {
  const [products, boms, plans, orders, wh] = await Promise.all([
    apiJson(headers, 'GET', '/api/inventory/products'),
    apiJson(headers, 'GET', '/api/production/boms'),
    apiJson(headers, 'GET', '/api/production/plans'),
    apiJson(headers, 'GET', '/api/production/work-orders'),
    apiJson(headers, 'GET', '/api/inventory/warehouses'),
  ])

  const fg = products.data.find((p) => p.code === 'FG001')
  const bom = boms.data.find((b) => b.code === 'BOM-FG001')
  const warehouse = wh.data[0]
  if (!fg || !bom || !warehouse) return

  let plan = plans.data.find((p) => p.status === 'approved')
  if (!plan) {
    const created = (
      await apiJson(headers, 'POST', '/api/production/plans', {
        name: '演示生产计划',
        productId: fg.id,
        plannedQty: 10,
        startDate: '2026-07-01',
        endDate: '2026-07-31',
      })
    ).data
    await apiJson(headers, 'POST', `/api/production/plans/${created.id}/approve`)
    plan = (await apiJson(headers, 'GET', `/api/production/plans/${created.id}`)).data
  }

  const hasDraft = orders.data.some((o) => o.status === 'draft')
  if (!hasDraft) {
    await apiJson(headers, 'POST', '/api/production/work-orders', {
      bomId: bom.id,
      productId: fg.id,
      planId: plan.id,
      plannedQty: 5,
      warehouseId: warehouse.id,
    })
  }

  const hasInProgress = orders.data.some((o) => o.status === 'in_progress')
  if (!hasInProgress) {
    const wo = (
      await apiJson(headers, 'POST', '/api/production/work-orders', {
        bomId: bom.id,
        productId: fg.id,
        planId: plan.id,
        plannedQty: 3,
        warehouseId: warehouse.id,
      })
    ).data
    await apiJson(headers, 'POST', `/api/production/work-orders/${wo.id}/release`)
    await apiJson(headers, 'POST', `/api/production/work-orders/${wo.id}/start`)
  }

  // Always keep one in-progress WO for 完工入库 modal screenshot
  const woForModal = (
    await apiJson(headers, 'POST', '/api/production/work-orders', {
      bomId: bom.id,
      productId: fg.id,
      planId: plan.id,
      plannedQty: 1,
      warehouseId: warehouse.id,
    })
  ).data
  await apiJson(headers, 'POST', `/api/production/work-orders/${woForModal.id}/release`)
  await apiJson(headers, 'POST', `/api/production/work-orders/${woForModal.id}/start`)

  const hasCompleted = orders.data.some((o) => o.status === 'completed')
  if (!hasCompleted) {
    const wo = (
      await apiJson(headers, 'POST', '/api/production/work-orders', {
        bomId: bom.id,
        productId: fg.id,
        planId: plan.id,
        plannedQty: 2,
        warehouseId: warehouse.id,
      })
    ).data
    await apiJson(headers, 'POST', `/api/production/work-orders/${wo.id}/release`)
    await apiJson(headers, 'POST', `/api/production/work-orders/${wo.id}/start`)
    await apiJson(headers, 'POST', `/api/production/work-orders/${wo.id}/complete`, {
      warehouseId: warehouse.id,
    })
  }
}

async function login(page) {
  await page.goto(`${baseURL}/login`)
  await page.evaluate(() => {
    localStorage.clear()
    localStorage.setItem('erp_lang', 'zh')
  })
  await page.reload()
  await page.getByPlaceholder('用户名').waitFor({ timeout: 20_000 })
  await page.getByPlaceholder('用户名').fill('admin')
  await page.locator('input[type="password"]').fill(adminPassword)
  await page.getByTestId('login-submit').click()
  await page.getByTestId('dashboard-title').waitFor({ timeout: 20_000 })
}

async function shot(page, url, heading, filename, before) {
  await page.goto(`${baseURL}${url}`)
  await page.getByRole('heading', { name: heading }).waitFor({ timeout: 20_000 })
  if (before) await before(page)
  await page.waitForTimeout(400)
  const file = path.join(outDir, filename)
  await page.screenshot({ path: file })
  console.log('  ✓', filename)
}

const headers = await apiLogin()
await ensureProductionDemo(headers)

const browser = await chromium.launch()
const context = await browser.newContext({
  viewport: { width: 1280, height: 900 },
  locale: 'zh-CN',
})
const page = await context.newPage()

console.log('Logging in as admin...')
await login(page)

console.log('Capturing production screenshots...')
await shot(page, '/production/bom', 'BOM 管理', 'erp-production-bom.png')
await shot(
  page,
  '/production/bom',
  'BOM 管理',
  'erp-production-bom-detail.png',
  async (p) => {
    const expand = p.getByRole('button', { name: '展开行' }).first()
    if (await expand.isVisible().catch(() => false)) await expand.click()
  },
)
await shot(page, '/production/plan', '生产计划', 'erp-production-plan.png')
await shot(page, '/production/work-order', '工单管理', 'erp-production-work-order.png')

await page.goto(`${baseURL}/production/work-order`)
await page.getByRole('heading', { name: '工单管理' }).waitFor()
await page.waitForTimeout(800)
const completeBtn = page.locator('button').filter({ hasText: '完工' })
if ((await completeBtn.count()) > 0) {
  await completeBtn.first().click()
  await page.getByRole('button', { name: '确认完工' }).waitFor({ timeout: 10_000 })
  await page.waitForTimeout(300)
  await page.screenshot({ path: path.join(outDir, 'erp-production-work-order-complete.png') })
  console.log('  ✓ erp-production-work-order-complete.png')
  await page.keyboard.press('Escape')
} else {
  console.log('  ⚠ skip erp-production-work-order-complete.png (no 完工 button)')
}

await shot(page, '/production/quality', '质量管理', 'erp-production-quality.png')

await page.goto(`${baseURL}/production/quality`)
await page.getByRole('heading', { name: '质量管理' }).waitFor()
const createQi = page.getByRole('button', { name: '新建质检单' })
if (await createQi.isVisible().catch(() => false)) {
  await createQi.click()
  await page.getByText('新建质检单').nth(1).waitFor()
  await page.waitForTimeout(300)
  await page.screenshot({ path: path.join(outDir, 'erp-production-quality-form.png') })
  console.log('  ✓ erp-production-quality-form.png')
  await page.keyboard.press('Escape')
}

await browser.close()
console.log('Done. Screenshots saved to', outDir)
