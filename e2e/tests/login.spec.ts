import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('erp_lang', 'zh')
  })
})

test.describe('Login page', () => {
  test('renders login form', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByTestId('login-form')).toBeVisible()
    await expect(page.getByTestId('login-submit')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'ERP 系统' })).toBeVisible()
  })

  test('shows error on invalid credentials', async ({ page }) => {
    test.skip(!process.env.E2E_WITH_BACKEND, 'Requires backend API')

    await page.goto('/login')
    await page.getByPlaceholder('用户名').fill('invalid')
    await page.getByPlaceholder('密码').fill('wrong')
    await page.getByTestId('login-submit').click()
    await expect(page.getByText('用户名或密码错误').first()).toBeVisible()
  })
})

test.describe('Authentication', () => {
  test('admin can login and reach dashboard', async ({ page }) => {
    test.skip(!process.env.E2E_WITH_BACKEND, 'Requires backend API')

    await page.goto('/login')
    await page.getByPlaceholder('用户名').fill('admin')
    await page.getByPlaceholder('密码').fill(process.env.E2E_ADMIN_PASSWORD || 'admin123')
    await page.getByTestId('login-submit').click()
    await expect(page.getByTestId('dashboard-title')).toBeVisible({ timeout: 15_000 })
  })
})

test.describe('Navigation', () => {
  test('sidebar shows inventory menu after login', async ({ page }) => {
    test.skip(!process.env.E2E_WITH_BACKEND, 'Requires backend API')

    await page.goto('/login')
    await page.getByPlaceholder('用户名').fill('admin')
    await page.getByPlaceholder('密码').fill(process.env.E2E_ADMIN_PASSWORD || 'admin123')
    await page.getByTestId('login-submit').click()
    await expect(page.getByTestId('dashboard-title')).toBeVisible({ timeout: 15_000 })
    await expect(page.getByText('库存管理')).toBeVisible()
  })
})
