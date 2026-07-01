/**
 * Capture screenshots for USER_MANUAL.md (procurement & intelligence).
 * Requires: frontend :5173, backend :3001, seeded DB.
 * Usage: node scripts/capture-procurement-manual-screenshots.mjs
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

/** Temporarily raise safety stock so replenishment tab has demo rows. */
async function ensureReplenishmentDemo(headers) {
  const products = (await apiJson(headers, 'GET', '/api/inventory/products')).data
  const fg = products.find((p) => p.code === 'FG001')
  const raw = products.find((p) => p.code === 'P001')
  if (!fg || !raw) return null

  const backup = {
    fg: { id: fg.id, safetyStock: Number(fg.safetyStock ?? 50) },
    raw: { id: raw.id, safetyStock: Number(raw.safetyStock ?? 50) },
  }
  await apiJson(headers, 'PATCH', `/api/inventory/products/${fg.id}`, { safetyStock: 1000 })
  await apiJson(headers, 'PATCH', `/api/inventory/products/${raw.id}`, { safetyStock: 2500 })
  return backup
}

async function restoreSafetyStock(headers, backup) {
  if (!backup) return
  await apiJson(headers, 'PATCH', `/api/inventory/products/${backup.fg.id}`, {
    safetyStock: backup.fg.safetyStock,
  })
  await apiJson(headers, 'PATCH', `/api/inventory/products/${backup.raw.id}`, {
    safetyStock: backup.raw.safetyStock,
  })
}

/** Ensure one approved PO exists for receive-modal screenshot. */
async function ensureApprovedPo(headers) {
  const orders = (await apiJson(headers, 'GET', '/api/procurement/orders')).data
  const approved = orders.find((o) => o.status === 'approved')
  if (approved) return approved.id

  const vendors = (await apiJson(headers, 'GET', '/api/procurement/vendors')).data
  const products = (await apiJson(headers, 'GET', '/api/inventory/products')).data
  const fg = products.find((p) => p.code === 'FG001')
  const vendor = vendors[0]
  if (!vendor || !fg) return null

  const created = (
    await apiJson(headers, 'POST', '/api/procurement/orders', {
      vendorId: vendor.id,
      items: [{ productId: fg.id, quantity: 10, unitPrice: 500 }],
    })
  ).data
  await apiJson(headers, 'POST', `/api/procurement/orders/${created.id}/approve`)
  return created.id
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
const safetyBackup = await ensureReplenishmentDemo(headers)
const approvedPoId = await ensureApprovedPo(headers)

const browser = await chromium.launch()
const context = await browser.newContext({
  viewport: { width: 1280, height: 900 },
  locale: 'zh-CN',
})
const page = await context.newPage()

console.log('Logging in as admin...')
await login(page)

console.log('Capturing procurement & intelligence screenshots...')
await shot(page, '/report/intelligence', '智能分析', 'erp-intelligence.png')
await shot(
  page,
  '/report/intelligence',
  '智能分析',
  'erp-intelligence-replenishment.png',
  async (p) => {
    await p.getByRole('tab', { name: '智能补货' }).click()
    await p.getByRole('button', { name: '一键全部转采购申请' }).waitFor({ timeout: 15_000 })
  },
)
await shot(
  page,
  '/report/intelligence',
  '智能分析',
  'erp-intelligence-finance.png',
  async (p) => {
    await p.getByRole('tab', { name: '智能财务' }).click()
    await p.waitForTimeout(600)
  },
)
await shot(page, '/procurement/request', '采购申请', 'erp-procurement.png')
await shot(page, '/procurement/order', '采购订单', 'erp-procurement-order.png')

await page.goto(`${baseURL}/procurement/order`)
await page.getByRole('heading', { name: '采购订单' }).waitFor()
const receiveBtn = page.getByRole('button', { name: '收货' }).first()
if (await receiveBtn.isVisible().catch(() => false)) {
  await receiveBtn.click()
  await page.getByText('收货入库').waitFor()
  await page.waitForTimeout(300)
  await page.screenshot({ path: path.join(outDir, 'erp-procurement-receive.png') })
  console.log('  ✓ erp-procurement-receive.png')
  await page.keyboard.press('Escape')
} else if (approvedPoId) {
  console.log('  ⚠ no visible 收货 button; approved PO id:', approvedPoId)
}

await browser.close()
await restoreSafetyStock(headers, safetyBackup)
console.log('Done. Screenshots saved to', outDir)
