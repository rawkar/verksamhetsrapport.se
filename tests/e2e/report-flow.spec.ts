import { test, expect } from '@playwright/test'

test.describe('Public pages', () => {
  test('landing page loads and shows hero', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('h1')).toContainText('verksamhetsberättelse')
    await expect(page.locator('text=Kom igång gratis')).toBeVisible()
  })

  test('landing page shows pricing section', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('#pricing')).toBeVisible()
    await expect(page.locator('text=Gratis')).toBeVisible()
    await expect(page.locator('text=Bas')).toBeVisible()
    await expect(page.locator('text=Pro')).toBeVisible()
  })

  test('login page loads', async ({ page }) => {
    await page.goto('/login')
    await expect(page.locator('text=Logga in')).toBeVisible()
  })

  test('health endpoint returns ok', async ({ request }) => {
    const res = await request.get('/api/health')
    expect(res.ok()).toBeTruthy()
    const data = await res.json()
    expect(data.status).toBe('ok')
    expect(data.timestamp).toBeTruthy()
  })
})

test.describe('Auth-protected pages redirect to login', () => {
  test('dashboard redirects unauthenticated users', async ({ page }) => {
    await page.goto('/dashboard')
    // Should redirect to login
    await expect(page).toHaveURL(/\/login/)
  })

  test('settings redirects unauthenticated users', async ({ page }) => {
    await page.goto('/settings')
    await expect(page).toHaveURL(/\/login/)
  })

  test('report/new redirects unauthenticated users', async ({ page }) => {
    await page.goto('/report/new')
    await expect(page).toHaveURL(/\/login/)
  })
})

test.describe('API auth protection', () => {
  test('GET /api/organizations returns 401 without auth', async ({ request }) => {
    const res = await request.get('/api/organizations')
    expect(res.status()).toBe(401)
  })

  test('GET /api/reports returns 401 without auth', async ({ request }) => {
    const res = await request.get('/api/reports')
    expect(res.status()).toBe(401)
  })

  test('GET /api/templates returns data (global templates are public)', async ({ request }) => {
    const res = await request.get('/api/templates')
    // Templates endpoint may allow unauthenticated access for global templates
    const data = await res.json()
    expect(Array.isArray(data.data)).toBeTruthy()
  })
})
