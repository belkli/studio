import { test as setup } from '@playwright/test';

/**
 * Global setup: warm up the Next.js dev server by visiting key routes.
 * This triggers Turbopack compilation so subsequent tests don't timeout.
 */
setup('warm up dev server routes', async ({ page }) => {
  setup.setTimeout(120_000); // Allow 2 minutes for initial compilation

  const WARMUP_ROUTES = [
    '/',
    '/en',
    '/ar',
    '/ru',
    '/login',
    '/about',
    '/contact',
    '/privacy',
    '/accessibility',
    '/register',
    '/dashboard',
    '/dashboard/settings',
    '/dashboard/billing',
    '/dashboard/schedule',
    '/dashboard/schedule/book',
    '/dashboard/practice',
    '/dashboard/teacher',
    '/dashboard/admin',
    '/dashboard/ministry',
    '/dashboard/ministry/repertoire',
    '/dashboard/messages',
    '/dashboard/notifications',
    '/dashboard/events',
    '/dashboard/forms',
    '/dashboard/approvals',
    '/dashboard/users',
    '/dashboard/admin/payroll',
    '/dashboard/admin/form-builder',
    '/en/dashboard',
    '/en/dashboard/settings',
    '/ar/dashboard',
    '/ru/dashboard',
  ];

  console.log(`Warming up ${WARMUP_ROUTES.length} routes...`);

  for (const route of WARMUP_ROUTES) {
    try {
      await page.goto(route, { timeout: 30_000 });
      await page.waitForLoadState('domcontentloaded');
    } catch {
      // Timeout on first compile is OK — route will be cached for real tests
      console.log(`Warmup: ${route} (slow compile, continuing...)`);
    }
  }

  console.log('Warmup complete!');
});
