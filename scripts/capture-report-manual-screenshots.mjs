/**
 * Capture screenshots for USER_MANUAL.md (report center module).
 * Requires: frontend :5173, backend :3001, seeded DB.
 * Usage: node scripts/capture-report-manual-screenshots.mjs
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

async function ensureReportDemo(headers) {
  const products = (await apiJson(headers, 'GET', '/api/inventory/products')).data
  const fg = products.find((p) => p.code === 'FG001')
  if (!fg) return null

  const backup = { fgId: fg.id, fgSafety: Number(fg.safetyStock ?? 50) }
  const alerts = (await apiJson(headers, 'GET', '/api/intelligence/replenishment')).data
  if (!alerts.length) {
    await apiJson(headers, 'PATCH', `/api/inventory/products/${fg.id}`, { safetyStock: 2000 })
  }
  return backup
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

const headers = await apiLogin()
const backup = await ensureReportDemo(headers)

const browser = await chromium.launch()
const context = await browser.newContext({
  viewport: { width: 1280, height: 900 },
  locale: 'zh-CN',
})
const page = await context.newPage()

await page.goto(`${baseURL}/login`)
await page.evaluate(() => {
  localStorage.clear()
  localStorage.setItem('erp_lang', 'zh')
})
await page.reload()
await page.getByPlaceholder('用户名').waitFor({ timeout: 20_000 })
await page.waitForTimeout(500)
await page.screenshot({ path: path.join(outDir, 'erp-login.png') })
console.log('  ✓ erp-login.png')

console.log('Logging in as admin...')
await login(page)

await page.goto(`${baseURL}/dashboard`)
await page.getByTestId('dashboard-title').waitFor({ timeout: 20_000 })
await page.waitForTimeout(1000)
await page.screenshot({ path: path.join(outDir, 'erp-dashboard.png') })
console.log('  ✓ erp-dashboard.png')

console.log('Capturing report center screenshots...')

await page.goto(`${baseURL}/report`)
await page.getByRole('heading', { name: '报表中心' }).waitFor({ timeout: 20_000 })
await page.waitForTimeout(800)
await page.screenshot({ path: path.join(outDir, 'erp-report-center.png') })
console.log('  ✓ erp-report-center.png')

await page.evaluate(() => window.scrollTo(0, 420))
await page.waitForTimeout(500)
await page.screenshot({ path: path.join(outDir, 'erp-report-center-charts.png') })
console.log('  ✓ erp-report-center-charts.png')

await page.goto(`${baseURL}/report/intelligence`)
await page.getByRole('heading', { name: '智能分析' }).waitFor()
await page.getByRole('tab', { name: '智能补货' }).click()
await page.waitForTimeout(600)
await page.screenshot({ path: path.join(outDir, 'erp-intelligence-replenishment.png') })
console.log('  ✓ erp-intelligence-replenishment.png')

await page.getByRole('tab', { name: '智能财务' }).click()
await page.waitForTimeout(600)
await page.screenshot({ path: path.join(outDir, 'erp-intelligence-finance.png') })
console.log('  ✓ erp-intelligence-finance.png')

await page.goto(`${baseURL}/bi-screen`)
await page.locator('.bi-screen__title').filter({ hasText: '运营 BI 大屏' }).waitFor({ timeout: 20_000 })
await page.locator('.bi-screen__kpi').first().waitFor({ timeout: 20_000 })
await page.waitForTimeout(1500)
await page.screenshot({ path: path.join(outDir, 'erp-bi-screen.png') })
console.log('  ✓ erp-bi-screen.png')

await browser.close()
await restoreDemo(headers, backup)
console.log('Done. Screenshots saved to', outDir)
