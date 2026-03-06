import { test, expect } from '@playwright/test';

/**
 * API Routes E2E tests.
 *
 * These tests use Playwright's APIRequestContext to hit the
 * Next.js API routes directly without a browser.
 *
 * /api/bootstrap  - returns full app data (users, conservatoriums, lessons, etc.)
 *                   Falls back to in-memory mock seed when no DB is configured.
 * /api/auth/login - POST endpoint for Firebase session cookie creation.
 * /api/auth/logout - POST endpoint for clearing the session cookie.
 */
test.describe('API Routes', () => {
  test('GET /api/bootstrap returns 200 with data', async ({ request }) => {
    const response = await request.get('/api/bootstrap');
    expect(response.status()).toBe(200);
    const data = await response.json();
    // Core collections must be present
    expect(data).toHaveProperty('users');
    expect(data).toHaveProperty('conservatoriums');
    expect(Array.isArray(data.conservatoriums)).toBe(true);
    // Mock seed contains many conservatoriums
    expect(data.conservatoriums.length).toBeGreaterThan(0);
  });

  test('GET /api/bootstrap has meta field with backend info', async ({ request }) => {
    const response = await request.get('/api/bootstrap');
    const data = await response.json();
    expect(data).toHaveProperty('meta');
    expect(data.meta).toHaveProperty('backend');
    // backend should be one of the known adapter types
    expect(['postgres', 'supabase', 'mock']).toContain(data.meta.backend);
    expect(data.meta).toHaveProperty('source');
  });

  test('GET /api/bootstrap includes all expected data collections', async ({ request }) => {
    const response = await request.get('/api/bootstrap');
    const data = await response.json();
    const requiredCollections = [
      'users',
      'conservatoriums',
      'lessonPackages',
      'lessons',
      'events',
      'rooms',
      'branches',
      'payments',
    ];
    for (const key of requiredCollections) {
      expect(data, `missing collection: ${key}`).toHaveProperty(key);
      expect(Array.isArray(data[key]), `${key} should be an array`).toBe(true);
    }
  });

  test('POST /api/auth/login with missing idToken returns 400', async ({ request }) => {
    const response = await request.post('/api/auth/login', {
      data: {},
    });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body).toHaveProperty('error');
  });

  test('POST /api/auth/login with invalid idToken returns 401', async ({ request }) => {
    const response = await request.post('/api/auth/login', {
      data: { idToken: 'not-a-real-firebase-token' },
    });
    // Firebase will reject the invalid token
    expect(response.status()).toBe(401);
  });

  test('POST /api/auth/logout returns 200', async ({ request }) => {
    const response = await request.post('/api/auth/logout');
    // Logout should succeed even without an active session
    expect([200, 204]).toContain(response.status());
  });
});
