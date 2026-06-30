/**
 * Capture screenshots for USER_MANUAL.md (leads & contact reports).
 * Requires: frontend :5173, backend :3001, seeded DB.
 * Usage: node scripts/capture-leads-manual-screenshots.mjs
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { chromium } from '@playwright/test'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const outDir = path.join(__dirname, '..', 'docs', 'images')
const baseURL = process.env.E2E_BASE_URL || 'http://localhost:5173'

fs.mkdirSync(outDir, { recursive: true })

async function login(page, username, password) {
  await page.goto(`${baseURL}/login`)
  await page.evaluate(() => {
    localStorage.clear()
    localStorage.setItem('erp_lang', 'zh')
  })
  await page.reload()
  await page.getByPlaceholder('用户名').waitFor({ timeout: 20_000 })
  await page.getByPlaceholder('用户名').fill(username)
  await page.locator('input[type="password"]').fill(password)
  await page.getByTestId('login-submit').click()
  await page.getByTestId('dashboard-title').waitFor({ timeout: 20_000 })
}

async function selectAntOption(page, labelText) {
  const item = page.locator('.ant-form-item').filter({ has: page.locator('label', { hasText: labelText }) })
  await item.locator('.ant-select').click()
  await page.keyboard.press('ArrowDown')
  await page.keyboard.press('Enter')
}

const browser = await chromium.launch()
const context = await browser.newContext({
  viewport: { width: 1280, height: 900 },
  locale: 'zh-CN',
})
const page = await context.newPage()

await login(page, 'sales_clerk', process.env.E2E_CLERK_PASSWORD || 'demo123')

await page.goto(`${baseURL}/sales/leads/pool`)
await page.getByRole('heading', { name: '公海线索' }).waitFor()
await page.screenshot({ path: path.join(outDir, 'erp-leads-pool.png') })

await page.goto(`${baseURL}/sales/leads/mine`)
await page.getByRole('heading', { name: '我的线索' }).waitFor()
const reportBtn = page.getByRole('button', { name: '联系上报' }).first()
if (await reportBtn.isVisible().catch(() => false)) {
  await reportBtn.click()
  await page.getByText('跟进方式').waitFor()
  await selectAntOption(page, '跟进方式')
  await selectAntOption(page, '联系结果')
  await page.getByPlaceholder('客户反馈、意向、下次计划等').fill('客户有广告印刷需求，愿意进一步了解报价。')
  await page.screenshot({ path: path.join(outDir, 'erp-leads-contact-report.png') })
  await page.getByRole('button', { name: '关闭' }).click()
}
await page.screenshot({ path: path.join(outDir, 'erp-leads-mine.png') })

await login(page, 'admin', process.env.E2E_ADMIN_PASSWORD || 'admin123')

await page.goto(`${baseURL}/sales/leads/reports`)
await page.getByRole('heading', { name: '上报审核' }).waitFor()
await page.screenshot({ path: path.join(outDir, 'erp-leads-reports-pending.png') })

await page.getByRole('tab', { name: '联系统计' }).click()
await page.locator('.ant-statistic-title', { hasText: '上报总数' }).waitFor()
await page.screenshot({ path: path.join(outDir, 'erp-leads-reports-stats.png') })

await browser.close()
console.log('Screenshots saved to', outDir)
