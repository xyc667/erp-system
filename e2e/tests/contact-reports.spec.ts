import { test, expect, type APIRequestContext } from '@playwright/test'

const API_BASE = process.env.E2E_API_URL || 'http://localhost:3001/api'
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD || 'admin123'
const CLERK_PASSWORD = process.env.E2E_CLERK_PASSWORD || 'demo123'

async function apiLogin(request: APIRequestContext, username: string, password: string) {
  const res = await request.post(`${API_BASE}/auth/login`, {
    data: { username, password, tenantCode: 'default' },
  })
  expect(res.ok()).toBeTruthy()
  const body = await res.json()
  return body.access_token as string
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('erp_lang', 'zh')
  })
})

test.describe('Contact reports', () => {
  test('admin can review a pending report submitted by sales clerk', async ({
    page,
    request,
  }) => {
    test.skip(!process.env.E2E_WITH_BACKEND, 'Requires backend API')

    const clerkToken = await apiLogin(request, 'sales_clerk', CLERK_PASSWORD)
    const poolRes = await request.get(`${API_BASE}/leads/pool?page=1&pageSize=1`, {
      headers: { Authorization: `Bearer ${clerkToken}` },
    })
    expect(poolRes.ok()).toBeTruthy()
    const pool = await poolRes.json()
    const leadId = pool.items[0]?.id as string
    expect(leadId).toBeTruthy()

    const claimRes = await request.post(`${API_BASE}/leads/${leadId}/claim`, {
      headers: { Authorization: `Bearer ${clerkToken}` },
    })
    expect(claimRes.ok()).toBeTruthy()

    const marker = `E2E-${Date.now()}`
    const reportRes = await request.post(`${API_BASE}/leads/${leadId}/contact-reports`, {
      headers: { Authorization: `Bearer ${clerkToken}` },
      data: {
        type: 'call',
        result: 'connected',
        content: `${marker} 自动化测试上报`,
      },
    })
    expect(reportRes.ok()).toBeTruthy()

    await page.goto('/login')
    await page.getByPlaceholder('用户名').fill('admin')
    await page.getByPlaceholder('密码').fill(ADMIN_PASSWORD)
    await page.getByTestId('login-submit').click()
    await expect(page.getByTestId('dashboard-title')).toBeVisible({ timeout: 15_000 })

    await page.goto('/sales/leads/reports')
    await expect(page.getByRole('tab', { name: /待审核/ })).toBeVisible()
    await expect(page.getByText(marker)).toBeVisible({ timeout: 15_000 })

    await page.getByRole('button', { name: '通过' }).click()
    await page.getByRole('button', { name: '确 定' }).click()
    await expect(page.getByRole('tab', { name: /待审核 \(0\)/ })).toBeVisible({ timeout: 15_000 })

    await page.getByRole('tab', { name: '全部上报' }).click()
    await expect(page.getByText(marker)).toBeVisible({ timeout: 15_000 })
    await expect(page.getByText('已通过').first()).toBeVisible()
  })

  test('sales clerk cannot access report review page', async ({ page }) => {
    test.skip(!process.env.E2E_WITH_BACKEND, 'Requires backend API')

    await page.goto('/login')
    await page.getByPlaceholder('用户名').fill('sales_clerk')
    await page.getByPlaceholder('密码').fill(CLERK_PASSWORD)
    await page.getByTestId('login-submit').click()
    await expect(page.getByTestId('dashboard-title')).toBeVisible({ timeout: 15_000 })

    await page.goto('/sales/leads/reports')
    await expect(page.getByText('403')).toBeVisible({ timeout: 10_000 })
  })
})
