/**
 * Capture screenshots for USER_MANUAL.md (project module).
 * Requires: frontend :5173, backend :3001, seeded DB.
 * Usage: node scripts/capture-project-manual-screenshots.mjs
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

async function ensureProjectDemo(headers) {
  const employees = (await apiJson(headers, 'GET', '/api/hr/employees')).data
  const mgr = employees.find((e) => e.employeeNo === 'E001')
  if (!mgr) throw new Error('seed employee E001 missing')

  const projects = (await apiJson(headers, 'GET', '/api/projects')).data
  const prj001 = projects.find((p) => p.code === 'PRJ001')
  const backup = {
    prj001Id: prj001?.id,
    prj001Status: prj001?.status,
    prj001Progress: prj001?.progress,
    createdIds: [],
  }

  if (prj001 && prj001.status === 'completed') {
    await apiJson(headers, 'PATCH', `/api/projects/${prj001.id}`, {
      status: 'active',
      progress: 30,
    })
  }

  const ensure = async (code, status) => {
    let p = projects.find((x) => x.code === code)
    if (!p) {
      p = (
        await apiJson(headers, 'POST', '/api/projects', {
          code,
          name: code === 'PRJ-DEMO-PLAN' ? '演示规划项目' : '演示进行中项目',
          description: '手册演示用',
          managerId: mgr.id,
          budget: 200000,
          tasks: [{ name: '需求调研', assigneeId: mgr.id }],
        })
      ).data
      backup.createdIds.push(p.id)
    }
    if (status === 'active' && p.status === 'planning') {
      await apiJson(headers, 'POST', `/api/projects/${p.id}/activate`)
    }
    if (status === 'planning' && p.status !== 'planning') {
      await apiJson(headers, 'PATCH', `/api/projects/${p.id}`, { status: 'planning', progress: 0 })
    }
  }

  await ensure('PRJ-DEMO-PLAN', 'planning')
  await ensure('PRJ-DEMO-ACT', 'active')

  return backup
}

async function restoreDemo(headers, backup) {
  for (const id of backup.createdIds) {
    await apiJson(headers, 'DELETE', `/api/projects/${id}`)
  }
  if (backup.prj001Id && backup.prj001Status === 'completed') {
    await apiJson(headers, 'PATCH', `/api/projects/${backup.prj001Id}`, {
      status: backup.prj001Status,
      progress: backup.prj001Progress,
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
const backup = await ensureProjectDemo(headers)

const browser = await chromium.launch()
const context = await browser.newContext({
  viewport: { width: 1280, height: 900 },
  locale: 'zh-CN',
})
const page = await context.newPage()

console.log('Logging in as admin...')
await login(page)

console.log('Capturing project screenshots...')
await shot(page, '/project', '项目管理', 'erp-project-list.png')

await page.goto(`${baseURL}/project`)
await page.getByRole('heading', { name: '项目管理' }).waitFor()
const expandBtn = page.getByRole('button', { name: '展开行' }).first()
if (await expandBtn.isVisible().catch(() => false)) {
  await expandBtn.click()
  await page.waitForTimeout(600)
  await page.screenshot({ path: path.join(outDir, 'erp-project-tasks.png') })
  console.log('  ✓ erp-project-tasks.png')
}

await page.goto(`${baseURL}/project`)
await page.getByRole('heading', { name: '项目管理' }).waitFor()
await page.getByRole('button', { name: '新建项目' }).click()
await page.getByRole('dialog').waitFor({ timeout: 10_000 })
await page.waitForTimeout(300)
await page.screenshot({ path: path.join(outDir, 'erp-project-create-modal.png') })
console.log('  ✓ erp-project-create-modal.png')
await page.keyboard.press('Escape')

await browser.close()
await restoreDemo(headers, backup)
console.log('Done. Screenshots saved to', outDir)
