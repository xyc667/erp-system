/**
 * Capture screenshots for USER_MANUAL.md (system management module).
 * Requires: frontend :5173, backend :3001, seeded DB.
 * Usage: node scripts/capture-system-manual-screenshots.mjs
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

async function ensureSystemDemo(headers) {
  const cleanup = { configId: null }

  const configs = (await apiJson(headers, 'GET', '/api/system/config')).data
  if (!configs.some((c) => c.key === 'manual.demo.flag')) {
    const cfg = (
      await apiJson(headers, 'POST', '/api/system/config', {
        key: 'manual.demo.flag',
        value: 'screenshot',
        description: '手册截图演示项',
        group: 'demo',
      })
    ).data
    cleanup.configId = cfg.id
  }

  return cleanup
}

async function restoreDemo(headers, cleanup) {
  if (cleanup.configId) await apiJson(headers, 'DELETE', `/api/system/config/${cleanup.configId}`)
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

async function openModalShot(page, url, heading, btnName, filename, dialogMatch) {
  await page.goto(`${baseURL}${url}`)
  await page.getByRole('heading', { name: heading }).waitFor()
  await page.getByRole('button', { name: btnName }).click()
  await page.getByRole('dialog').filter({ hasText: dialogMatch }).waitFor({ timeout: 10_000 })
  await page.waitForTimeout(300)
  await page.screenshot({ path: path.join(outDir, filename) })
  console.log('  ✓', filename)
  await page.keyboard.press('Escape')
}

const headers = await apiLogin()
const cleanup = await ensureSystemDemo(headers)

const browser = await chromium.launch()
const context = await browser.newContext({
  viewport: { width: 1280, height: 900 },
  locale: 'zh-CN',
})
const page = await context.newPage()

console.log('Logging in as admin...')
await login(page)

console.log('Capturing system management screenshots...')
await shot(page, '/system/user', '用户管理', 'erp-system-user.png')
await openModalShot(page, '/system/user', '用户管理', '添加用户', 'erp-system-user-modal.png', '添加用户')

await shot(page, '/system/role', '角色管理', 'erp-system-role.png')
// backward compat for §4.3 reference
await shot(page, '/system/role', '角色管理', 'erp-role-management.png')

await page.goto(`${baseURL}/system/role`)
await page.getByRole('heading', { name: '角色管理' }).waitFor()
await page.getByRole('button', { name: '权限' }).first().click()
await page.getByRole('dialog').filter({ hasText: '分配权限' }).waitFor({ timeout: 10_000 })
await page.waitForTimeout(300)
await page.screenshot({ path: path.join(outDir, 'erp-system-role-perm.png') })
console.log('  ✓ erp-system-role-perm.png')
await page.keyboard.press('Escape')

await shot(page, '/system/config', '系统配置', 'erp-system-config.png')
await page.goto(`${baseURL}/system/config`)
await page.getByRole('heading', { name: '系统配置' }).waitFor()
await page.getByRole('tab', { name: '数据字典' }).click()
await page.waitForTimeout(400)
await page.screenshot({ path: path.join(outDir, 'erp-system-config-dict.png') })
console.log('  ✓ erp-system-config-dict.png')

await shot(page, '/system/audit', '审计日志', 'erp-system-audit.png')
await shot(page, '/system/tenant', '租户管理', 'erp-system-tenant.png')
await openModalShot(page, '/system/tenant', '租户管理', '新增租户', 'erp-system-tenant-modal.png', '新增租户')

await shot(page, '/system/files', '文件中心', 'erp-system-files.png')

await shot(page, '/system/integration', '系统集成', 'erp-system-integration.png')
await page.goto(`${baseURL}/system/integration`)
await page.getByRole('heading', { name: '系统集成' }).waitFor()
await page.getByRole('button', { name: '预览导出数据' }).first().click()
await page.getByRole('dialog').waitFor({ timeout: 15_000 })
await page.waitForTimeout(500)
await page.screenshot({ path: path.join(outDir, 'erp-system-integration-preview.png') })
console.log('  ✓ erp-system-integration-preview.png')
await page.keyboard.press('Escape')

await shot(page, '/system/leads/import', '线索导入', 'erp-system-leads-import.png')

await browser.close()
await restoreDemo(headers, cleanup)
console.log('Done. Screenshots saved to', outDir)
