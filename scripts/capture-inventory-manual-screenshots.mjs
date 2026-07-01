/**
 * Capture screenshots for USER_MANUAL.md (inventory module).
 * Requires: frontend :5173, backend :3001, seeded DB.
 * Usage: node scripts/capture-inventory-manual-screenshots.mjs
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

async function ensureInventoryDemo(headers) {
  const products = (await apiJson(headers, 'GET', '/api/inventory/products')).data
  const wh = (await apiJson(headers, 'GET', '/api/inventory/warehouses')).data
  const fg = products.find((p) => p.code === 'FG001')
  const p1 = products.find((p) => p.code === 'P001')
  const wh1 = wh.find((w) => w.code === 'WH001')
  let wh2 = wh.find((w) => w.code === 'WH002')
  if (!wh2) {
    wh2 = (
      await apiJson(headers, 'POST', '/api/inventory/warehouses', {
        code: 'WH002',
        name: '副仓库',
        address: '演示副仓',
      })
    ).data
  }

  const backup = { fgSafety: Number(fg?.safetyStock ?? 50) }
  if (fg) {
    await apiJson(headers, 'PATCH', `/api/inventory/products/${fg.id}`, { safetyStock: 2000 })
  }

  const batchNo = 'BATCH-DEMO-001'
  const hasBatch = (await apiJson(headers, 'GET', '/api/inventory/stock')).data.some(
    (s) => s.batchNo === batchNo,
  )
  if (!hasBatch && p1 && wh1) {
    await apiJson(headers, 'POST', '/api/inventory/movements', {
      productId: p1.id,
      warehouseId: wh1.id,
      quantity: 50,
      type: 'adjustment',
      batchNo,
      referenceNo: 'DEMO-BATCH',
    })
  }

  const stocktakes = (await apiJson(headers, 'GET', '/api/inventory/stocktakes')).data
  const hasCounting = stocktakes.some((s) => s.status === 'counting')
  if (!hasCounting && wh1) {
    const st = (
      await apiJson(headers, 'POST', '/api/inventory/stocktakes', {
        warehouseId: wh1.id,
        remark: '手册演示盘点',
      })
    ).data
    if (st?.items?.length) {
      for (const item of st.items) {
        await apiJson(headers, 'PATCH', `/api/inventory/stocktakes/${st.id}/items/${item.id}`, {
          countedQty: Number(item.systemQty),
        })
      }
    }
  }

  return { backup, fgId: fg?.id, batchNo }
}

async function restoreDemo(headers, backup) {
  if (backup?.fgId) {
    await apiJson(headers, 'PATCH', `/api/inventory/products/${backup.fgId}`, {
      safetyStock: backup.fgSafety,
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
  await page.screenshot({ path: path.join(outDir, filename) })
  console.log('  ✓', filename)
}

const headers = await apiLogin()
const demoBackup = await ensureInventoryDemo(headers)

const browser = await chromium.launch()
const context = await browser.newContext({
  viewport: { width: 1280, height: 900 },
  locale: 'zh-CN',
})
const page = await context.newPage()

console.log('Logging in as admin...')
await login(page)

console.log('Capturing inventory screenshots...')
await shot(page, '/inventory/stock', '库存台账', 'erp-inventory-stock.png')
await shot(page, '/inventory/inout', '出入库管理', 'erp-inventory-inout.png')

await page.goto(`${baseURL}/inventory/inout`)
await page.getByRole('heading', { name: '出入库管理' }).waitFor()
const adjustBtn = page.getByRole('button', { name: '库存调整' })
if (await adjustBtn.isVisible().catch(() => false)) {
  await adjustBtn.click()
  await page.getByText('库存调整').nth(1).waitFor({ timeout: 10_000 })
  await page.waitForTimeout(300)
  await page.screenshot({ path: path.join(outDir, 'erp-inventory-inout-modal.png') })
  console.log('  ✓ erp-inventory-inout-modal.png')
  await page.keyboard.press('Escape')
}

await shot(page, '/inventory/transfer', '库存调拨', 'erp-inventory-transfer.png')
await shot(page, '/inventory/stocktake', '库存盘点', 'erp-inventory-stocktake.png')

await page.goto(`${baseURL}/inventory/stocktake`)
await page.getByRole('heading', { name: '库存盘点' }).waitFor()
const detailBtn = page.getByRole('button', { name: '明细' }).first()
if (await detailBtn.isVisible().catch(() => false)) {
  await detailBtn.click()
  await page.waitForTimeout(600)
  await page.screenshot({ path: path.join(outDir, 'erp-inventory-stocktake-detail.png') })
  console.log('  ✓ erp-inventory-stocktake-detail.png')
  await page.keyboard.press('Escape')
}

await shot(page, '/inventory/alert', '库存预警', 'erp-inventory-alert.png')

await page.goto(`${baseURL}/inventory/trace`)
await page.getByRole('heading', { name: '批次追溯' }).waitFor()
await page.getByPlaceholder('输入批次号').fill(demoBackup.batchNo)
await page.getByRole('button', { name: '查询' }).click()
await page.waitForTimeout(800)
await page.screenshot({ path: path.join(outDir, 'erp-inventory-trace-batch.png') })
console.log('  ✓ erp-inventory-trace-batch.png')

await shot(
  page,
  '/inventory/trace',
  '批次追溯',
  'erp-inventory-trace-serial.png',
  async (p) => {
    await p.getByRole('tab', { name: '序列号追溯' }).click()
    await p.waitForTimeout(400)
  },
)

await shot(page, '/inventory/product', '产品管理', 'erp-inventory-product.png')
await shot(page, '/inventory/warehouse', '仓库管理', 'erp-inventory-warehouse.png')

await browser.close()
await restoreDemo(headers, demoBackup)
console.log('Done. Screenshots saved to', outDir)
