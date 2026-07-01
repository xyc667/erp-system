/**
 * Capture screenshots for USER_MANUAL.md (HR module).
 * Requires: frontend :5173, backend :3001, seeded DB.
 * Usage: node scripts/capture-hr-manual-screenshots.mjs
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

async function ensureHrDemo(headers) {
  const employees = (await apiJson(headers, 'GET', '/api/hr/employees')).data
  const emp = employees.find((e) => e.employeeNo === 'E001')
  if (!emp) throw new Error('seed employee E001 missing')

  const cleanup = { attendanceIds: [], salaryIds: [], perfId: null }

  const attendance = (await apiJson(headers, 'GET', '/api/hr/attendance')).data
  const hasPresent = attendance.some(
    (a) => a.employeeId === emp.id && a.status === 'present' && !a.checkOut,
  )
  if (!hasPresent) {
    const att = (
      await apiJson(headers, 'POST', '/api/hr/attendance', {
        employeeId: emp.id,
        date: '2026-06-30',
        status: 'present',
        remark: '手册演示出勤',
      })
    ).data
    cleanup.attendanceIds.push(att.id)
  }

  const hasLeave = attendance.some((a) => a.employeeId === emp.id && a.status === 'leave')
  if (!hasLeave) {
    const leave = (
      await apiJson(headers, 'POST', '/api/hr/attendance', {
        employeeId: emp.id,
        date: '2026-06-29',
        status: 'leave',
        remark: '年假',
      })
    ).data
    cleanup.attendanceIds.push(leave.id)
  }

  const salaries = (await apiJson(headers, 'GET', '/api/hr/salary')).data
  if (!salaries.some((s) => s.employeeId === emp.id && s.status === 'draft')) {
    const draft = (
      await apiJson(headers, 'POST', '/api/hr/salary', {
        employeeId: emp.id,
        yearMonth: '2026-06',
        baseSalary: 8000,
        bonus: 1000,
        deduction: 500,
      })
    ).data
    cleanup.salaryIds.push(draft.id)
  }
  if (!salaries.some((s) => s.employeeId === emp.id && s.status === 'paid')) {
    const paid = (
      await apiJson(headers, 'POST', '/api/hr/salary', {
        employeeId: emp.id,
        yearMonth: '2026-05',
        baseSalary: 8000,
        bonus: 500,
        deduction: 200,
      })
    ).data
    await apiJson(headers, 'POST', `/api/hr/salary/${paid.id}/pay`)
    cleanup.salaryIds.push(paid.id)
  }

  const perf = (await apiJson(headers, 'GET', '/api/hr/performance')).data
  if (!perf.some((p) => p.employeeId === emp.id && p.period === '2026-Q2')) {
    const review = (
      await apiJson(headers, 'POST', '/api/hr/performance', {
        employeeId: emp.id,
        period: '2026-Q2',
        score: 85,
        comment: '工作表现良好，团队协作佳',
      })
    ).data
    cleanup.perfId = review.id
  }

  return cleanup
}

async function restoreDemo(headers, cleanup) {
  if (cleanup.perfId) await apiJson(headers, 'DELETE', `/api/hr/performance/${cleanup.perfId}`)
  for (const id of cleanup.salaryIds) await apiJson(headers, 'DELETE', `/api/hr/salary/${id}`)
  for (const id of cleanup.attendanceIds) await apiJson(headers, 'DELETE', `/api/hr/attendance/${id}`)
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

async function openModalShot(page, url, heading, btnName, modalTitle, filename) {
  await page.goto(`${baseURL}${url}`)
  await page.getByRole('heading', { name: heading }).waitFor()
  await page.getByRole('button', { name: btnName }).click()
  await page.getByText(modalTitle).nth(1).waitFor({ timeout: 10_000 })
  await page.waitForTimeout(300)
  await page.screenshot({ path: path.join(outDir, filename) })
  console.log('  ✓', filename)
  await page.keyboard.press('Escape')
}

const headers = await apiLogin()
const cleanup = await ensureHrDemo(headers)

const browser = await chromium.launch()
const context = await browser.newContext({
  viewport: { width: 1280, height: 900 },
  locale: 'zh-CN',
})
const page = await context.newPage()

console.log('Logging in as admin...')
await login(page)

console.log('Capturing HR screenshots...')
await shot(page, '/hr/employee', '员工管理', 'erp-hr-employee.png')
await openModalShot(
  page,
  '/hr/employee',
  '员工管理',
  '添加员工',
  '添加员工',
  'erp-hr-employee-modal.png',
)

await shot(page, '/hr/department', '部门管理', 'erp-hr-department.png')
await shot(page, '/hr/position', '岗位管理', 'erp-hr-position.png')
await shot(page, '/hr/attendance', '考勤管理', 'erp-hr-attendance.png')
await openModalShot(
  page,
  '/hr/attendance',
  '考勤管理',
  '登记考勤',
  '登记考勤',
  'erp-hr-attendance-modal.png',
)

await shot(page, '/hr/salary', '薪资管理', 'erp-hr-salary.png')
await openModalShot(
  page,
  '/hr/salary',
  '薪资管理',
  '新建薪资单',
  '新建薪资单',
  'erp-hr-salary-modal.png',
)

await shot(page, '/hr/performance', '绩效管理', 'erp-hr-performance.png')

await page.goto(`${baseURL}/hr/performance`)
await page.getByRole('heading', { name: '绩效管理' }).waitFor()
await page.getByRole('button', { name: '新建考核' }).click()
await page.getByRole('dialog').waitFor({ timeout: 10_000 })
await page.waitForTimeout(300)
await page.screenshot({ path: path.join(outDir, 'erp-hr-performance-modal.png') })
console.log('  ✓ erp-hr-performance-modal.png')
await page.keyboard.press('Escape')

await browser.close()
await restoreDemo(headers, cleanup)
console.log('Done. Screenshots saved to', outDir)
