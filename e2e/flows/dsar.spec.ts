import { test, expect } from '@playwright/test';

/**
 * DSAR (Data Subject Access Request) E2E tests.
 *
 * Tests the Privacy & Data section of /dashboard/settings.
 * The section renders three actions:
 *   - Export My Data (shows a success toast)
 *   - Request Data Deletion (shows a destructive toast)
 *   - Withdraw Data Processing Consent (shows a success toast)
 *
 * All tests run under dev-bypass (site_admin injected by proxy).
 */
test.describe('DSAR — Privacy & Data section in settings', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/settings');
    await expect(page).not.toHaveURL(/login/);
    await expect(page.locator('main').first()).toBeVisible({ timeout: 15000 });
  });

  test('Privacy & Data section is visible in /dashboard/settings', async ({ page }) => {
    // The card title uses the DSAR.title key: "פרטיות ונתונים" (HE) / "Privacy & Data" (EN)
    const dsarHeading = page.getByRole('heading').filter({ hasText: /פרטיות ונתונים|Privacy & Data/i });
    await expect(dsarHeading).toBeVisible({ timeout: 10000 });
  });

  test('Export Data button is present and clickable', async ({ page }) => {
    // Matches "ייצוא הנתונים שלי" (HE) or "Export My Data" (EN)
    const exportBtn = page.getByRole('button').filter({ hasText: /ייצוא הנתונים שלי|Export My Data/i });
    await expect(exportBtn).toBeVisible({ timeout: 10000 });
    await exportBtn.click();

    // A toast should appear — the shadcn Toaster renders into [data-radix-toast-viewport]
    // or with role="status"; look for the toast title text
    const toastRegion = page.locator('[data-radix-toast-viewport], [role="region"]').filter({
      hasText: /ייצוא הנתונים שלי|Export My Data/i,
    });
    await expect(toastRegion).toBeVisible({ timeout: 5000 });
  });

  test('Delete Request button is present and clickable', async ({ page }) => {
    // Matches "בקשת מחיקת נתונים" (HE) or "Request Data Deletion" (EN)
    const deleteBtn = page.getByRole('button').filter({ hasText: /בקשת מחיקת נתונים|Request Data Deletion/i });
    await expect(deleteBtn).toBeVisible({ timeout: 10000 });
    await deleteBtn.click();

    // Toast should appear containing the button label text
    const toastRegion = page.locator('[data-radix-toast-viewport], [role="region"]').filter({
      hasText: /בקשת מחיקת נתונים|Request Data Deletion/i,
    });
    await expect(toastRegion).toBeVisible({ timeout: 5000 });
  });

  test('Withdraw Consent button is present and clickable', async ({ page }) => {
    // Matches "ביטול הסכמה לעיבוד נתונים" (HE) or "Withdraw Data Processing Consent" (EN)
    const withdrawBtn = page.getByRole('button').filter({
      hasText: /ביטול הסכמה לעיבוד נתונים|Withdraw Data Processing Consent/i,
    });
    await expect(withdrawBtn).toBeVisible({ timeout: 10000 });
    await withdrawBtn.click();

    // Toast should appear containing the section title text
    const toastRegion = page.locator('[data-radix-toast-viewport], [role="region"]').filter({
      hasText: /ביטול הסכמה|Withdraw Consent/i,
    });
    await expect(toastRegion).toBeVisible({ timeout: 5000 });
  });

  test('settings page has all three DSAR action buttons', async ({ page }) => {
    const exportBtn = page.getByRole('button').filter({ hasText: /ייצוא הנתונים שלי|Export My Data/i });
    const deleteBtn = page.getByRole('button').filter({ hasText: /בקשת מחיקת נתונים|Request Data Deletion/i });
    const withdrawBtn = page.getByRole('button').filter({
      hasText: /ביטול הסכמה לעיבוד נתונים|Withdraw Data Processing Consent/i,
    });

    await expect(exportBtn).toBeVisible({ timeout: 10000 });
    await expect(deleteBtn).toBeVisible({ timeout: 10000 });
    await expect(withdrawBtn).toBeVisible({ timeout: 10000 });
  });
});
