import { test, expect } from '@playwright/test'

test.describe('Dashboard theme isolation', () => {
  test('dashboard always uses Candidate A theme regardless of LANDING_THEME env', async ({ page }) => {
    // Set up auth (dev bypass)
    await page.goto('/he/dashboard')

    // Wait for dashboard to load
    await page.waitForSelector('[data-theme="a"]')

    // Verify data-theme="a" is present on a dashboard ancestor
    const sidebarProvider = page.locator('[data-theme="a"]').first()
    await expect(sidebarProvider).toBeVisible()

    // Verify primary color resolves to indigo (Candidate A), not gold (Candidate B)
    const primaryColor = await page.evaluate(() => {
      const el = document.querySelector('[data-theme="a"]')
      if (!el) return ''
      return getComputedStyle(el).getPropertyValue('--primary').trim()
    })

    // Candidate A primary is indigo: 240 59% 50%
    expect(primaryColor).toContain('240')
  })
})
