/**
 * Capture screenshots for USER_MANUAL.md (intelligence / smart analysis).
 * Requires: frontend :5173, backend :3001, seeded DB.
 * Usage: node scripts/capture-intelligence-manual-screenshots.mjs
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

async function ensureIntelligenceDemo(headers) {
  const products = (await apiJson(headers, 'GET', '/api/inventory/products')).data
  const fg = products.find((p) => p.code === 'FG001')
  const p1 = products.find((p) => p.code === 'P001')
  const backup = {
    fg: fg ? { id: fg.id, safetyStock: Number(fg.safetyStock ?? 50) } : null,
    p1: p1 ? { id: p1.id, safetyStock: Number(p1.safetyStock ?? 50) } : null,
  }
  if (fg) await apiJson(headers, 'PATCH', `/api/inventory/products/${fg.id}`, { safetyStock: 2000 })
  if (p1) await apiJson(headers, 'PATCH', `/api/inventory/products/${p1.id}`, { safetyStock: 2500 })
  return backup
}

async function restoreDemo(headers, backup) {
  if (backup.fg) {
    await apiJson(headers, 'PATCH', `/api/inventory/products/${backup.fg.id}`, {
      safetyStock: backup.fg.safetyStock,
    })
  }
  if (backup.p1) {
    await apiJson(headers, 'PATCH', `/api/inventory/products/${backup.p1.id}`, {
      safetyStock: backup.p1.safetyStock,
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

const headers = await apiLogin()
const backup = await ensureIntelligenceDemo(headers)

const browser = await chromium.launch()
const context = await browser.newContext({
  viewport: { width: 1400, height: 900 },
  locale: 'zh-CN',
})
const page = await context.newPage()

console.log('Logging in as admin...')
await login(page)

console.log('Capturing intelligence screenshots...')

await page.goto(`${baseURL}/report/intelligence`)
await page.getByRole('heading', { name: '智能分析' }).waitFor({ timeout: 20_000 })
await page.waitForTimeout(500)
await page.screenshot({ path: path.join(outDir, 'erp-intelligence.png') })
console.log('  ✓ erp-intelligence.png')

await page.getByRole('tab', { name: '智能补货' }).click()
await page.waitForTimeout(600)
await page.screenshot({ path: path.join(outDir, 'erp-intelligence-replenishment.png') })
console.log('  ✓ erp-intelligence-replenishment.png')

const tableWrap = page.locator('.ant-table-content').first()
if (await tableWrap.isVisible().catch(() => false)) {
  await tableWrap.evaluate((el) => { el.scrollLeft = el.scrollWidth })
  await page.waitForTimeout(300)
  await page.screenshot({ path: path.join(outDir, 'erp-intelligence-replenishment-detail.png') })
  console.log('  ✓ erp-intelligence-replenishment-detail.png')
}

await page.getByRole('tab', { name: '智能财务' }).click()
await page.waitForTimeout(600)
await page.screenshot({ path: path.join(outDir, 'erp-intelligence-finance.png') })
console.log('  ✓ erp-intelligence-finance.png')

await browser.close()
await restoreDemo(headers, backup)
console.log('Done. Screenshots saved to', outDir)
