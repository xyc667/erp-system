/**
 * Capture screenshots for USER_MANUAL.md (finance module).
 * Requires: frontend :5173, backend :3001, seeded DB.
 * Usage: node scripts/capture-finance-manual-screenshots.mjs
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { chromium } from '@playwright/test'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const outDir = path.join(__dirname, '..', 'docs', 'images')
const baseURL = process.env.E2E_BASE_URL || 'http://localhost:5173'
const adminPassword = process.env.E2E_ADMIN_PASSWORD || 'admin123'

fs.mkdirSync(outDir, { recursive: true })

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

const browser = await chromium.launch()
const context = await browser.newContext({
  viewport: { width: 1280, height: 900 },
  locale: 'zh-CN',
})
const page = await context.newPage()

console.log('Logging in as admin...')
await login(page)

console.log('Capturing finance screenshots...')
await shot(page, '/finance/gl', '总账管理', 'erp-finance-gl-accounts.png')
await shot(
  page,
  '/finance/gl',
  '总账管理',
  'erp-finance-gl-journals.png',
  async (p) => {
    await p.getByRole('tab', { name: '凭证管理' }).click()
    await p.getByRole('button', { name: '新建凭证' }).waitFor()
  },
)
await shot(page, '/finance/ar', '应收管理', 'erp-finance-ar.png')
await shot(page, '/finance/ap', '应付管理', 'erp-finance-ap.png')
await shot(page, '/finance/assets', '固定资产', 'erp-finance-assets.png')
await shot(page, '/finance/assets', '固定资产', 'erp-finance-assets-active.png')
await shot(page, '/finance/budget', '预算管理', 'erp-finance-budget.png')
await shot(page, '/finance/budget', '预算管理', 'erp-finance-budget-usage.png')
await shot(page, '/finance/report', '财务报表', 'erp-finance-report.png')
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

await page.goto(`${baseURL}/finance/ar`)
await page.getByRole('heading', { name: '应收管理' }).waitFor()
const receiptBtn = page.getByRole('button', { name: '收款' }).first()
if (await receiptBtn.isVisible().catch(() => false)) {
  await receiptBtn.click()
  await page.getByText('登记收款').waitFor()
  await page.waitForTimeout(300)
  await page.screenshot({ path: path.join(outDir, 'erp-finance-ar-receipt.png') })
  console.log('  ✓ erp-finance-ar-receipt.png')
  await page.keyboard.press('Escape')
} else {
  console.log('  ⚠ skip erp-finance-ar-receipt.png (no open AR)')
}

await page.goto(`${baseURL}/finance/ap`)
await page.getByRole('heading', { name: '应付管理' }).waitFor()
const payBtn = page.getByRole('button', { name: '付款' }).first()
if (await payBtn.isVisible().catch(() => false)) {
  await payBtn.click()
  await page.getByText('登记付款').waitFor()
  await page.waitForTimeout(300)
  await page.screenshot({ path: path.join(outDir, 'erp-finance-ap-payment.png') })
  console.log('  ✓ erp-finance-ap-payment.png')
  await page.keyboard.press('Escape')
} else {
  console.log('  ⚠ skip erp-finance-ap-payment.png (no open AP)')
}

await page.goto(`${baseURL}/finance/gl`)
await page.getByRole('heading', { name: '总账管理' }).waitFor()
await page.getByRole('tab', { name: '凭证管理' }).click()
const expandBtn = page.getByRole('button', { name: '展开行' }).first()
if (await expandBtn.isVisible().catch(() => false)) {
  await expandBtn.click()
  await page.waitForTimeout(300)
  await page.screenshot({ path: path.join(outDir, 'erp-finance-gl-journal-detail.png') })
  console.log('  ✓ erp-finance-gl-journal-detail.png')
}

await browser.close()
console.log('Done. Screenshots saved to', outDir)
