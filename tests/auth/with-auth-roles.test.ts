/**
 * @fileoverview Unit tests for withAuth() roles parameter enforcement.
 *
 * Tests BLOCKING-SEC-01: verify that withAuth() correctly enforces the optional
 * `roles` parameter, blocking unauthorized roles and allowing authorized ones.
 *
 * Note: actions.ts has 'use server' so it cannot be imported in tests.
 * We test the withAuth() function directly from auth-utils.ts.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Helper: build a mock headers() that returns given claims ──────────────────

function makeHeadersMock(overrides: Partial<Record<string, string>> = {}) {
  const defaults: Record<string, string> = {
    'x-user-id': 'dev-user',
    'x-user-role': 'site_admin',
    'x-user-conservatorium-id': 'dev-conservatorium',
    'x-user-approved': 'true',
    'x-user-email': 'dev@harmonia.local',
  };
  const merged = { ...defaults, ...overrides };
  return {
    headers: vi.fn(async () => ({ get: (k: string) => merged[k] ?? null })),
    cookies: vi.fn(async () => ({ get: vi.fn(() => undefined) })),
  };
}

// ── Shared setup: no Firebase Admin (uses header-based auth) ──────────────────

beforeEach(() => {
  vi.resetModules();
  vi.doMock('@/lib/firebase-admin', () => ({
    getAdminAuth: vi.fn(() => null),
  }));
});

// ─────────────────────────────────────────────────────────────────────────────

describe('withAuth() roles parameter enforcement (BLOCKING-SEC-01)', () => {
  // ── Backward compatibility ─────────────────────────────────────────────────

  describe('backward compatibility — no roles option', () => {
    it('allows any authenticated user when roles is not specified', async () => {
      vi.doMock('next/headers', () => makeHeadersMock({ 'x-user-role': 'student' }));
      const { withAuth } = await import('@/lib/auth-utils');
      const { z } = await import('zod');

      const schema = z.object({ name: z.string() });
      const action = vi.fn(async () => 'ok');
      const wrapped = withAuth(schema, action);

      await expect(wrapped({ name: 'test' })).resolves.toBe('ok');
    });

    it('allows any authenticated user when roles is explicitly undefined', async () => {
      vi.doMock('next/headers', () => makeHeadersMock({ 'x-user-role': 'parent' }));
      const { withAuth } = await import('@/lib/auth-utils');
      const { z } = await import('zod');

      const schema = z.string();
      const action = vi.fn(async () => 'done');
      const wrapped = withAuth(schema, action, undefined);

      await expect(wrapped('input')).resolves.toBe('done');
    });

    it('allows any authenticated user when roles is an empty array', async () => {
      vi.doMock('next/headers', () => makeHeadersMock({ 'x-user-role': 'teacher' }));
      const { withAuth } = await import('@/lib/auth-utils');
      const { z } = await import('zod');

      const schema = z.string();
      const action = vi.fn(async () => 'done');
      const wrapped = withAuth(schema, action, { roles: [] });

      await expect(wrapped('input')).resolves.toBe('done');
    });
  });

  // ── Role enforcement — allowed roles ──────────────────────────────────────

  describe('role enforcement — user role is in the allowed list', () => {
    it('allows site_admin when roles includes site_admin', async () => {
      vi.doMock('next/headers', () => makeHeadersMock({ 'x-user-role': 'site_admin' }));
      const { withAuth } = await import('@/lib/auth-utils');
      const { z } = await import('zod');

      const schema = z.string();
      const action = vi.fn(async () => 'admin action result');
      const wrapped = withAuth(schema, action, { roles: ['site_admin', 'superadmin'] });

      await expect(wrapped('payload')).resolves.toBe('admin action result');
    });

    it('allows conservatorium_admin when roles includes conservatorium_admin', async () => {
      vi.doMock('next/headers', () =>
        makeHeadersMock({ 'x-user-role': 'conservatorium_admin' })
      );
      const { withAuth } = await import('@/lib/auth-utils');
      const { z } = await import('zod');

      const schema = z.object({ x: z.number() });
      const action = vi.fn(async () => 42);
      const wrapped = withAuth(schema, action, {
        roles: ['conservatorium_admin', 'delegated_admin', 'site_admin'],
      });

      await expect(wrapped({ x: 1 })).resolves.toBe(42);
    });

    it('allows teacher when roles includes teacher', async () => {
      vi.doMock('next/headers', () => makeHeadersMock({ 'x-user-role': 'teacher' }));
      const { withAuth } = await import('@/lib/auth-utils');
      const { z } = await import('zod');

      const schema = z.string();
      const action = vi.fn(async () => 'report drafted');
      const wrapped = withAuth(schema, action, {
        roles: ['teacher', 'conservatorium_admin', 'delegated_admin', 'site_admin'],
      });

      await expect(wrapped('student-id')).resolves.toBe('report drafted');
    });
  });

  // ── Role enforcement — forbidden roles ────────────────────────────────────

  describe('role enforcement — user role is NOT in the allowed list', () => {
    it('throws FORBIDDEN message when student calls an admin-only action', async () => {
      vi.doMock('next/headers', () => makeHeadersMock({ 'x-user-role': 'student' }));
      const { withAuth } = await import('@/lib/auth-utils');
      const { z } = await import('zod');

      const schema = z.string();
      const action = vi.fn(async () => 'should not reach here');
      const wrapped = withAuth(schema, action, { roles: ['site_admin', 'superadmin'] });

      await expect(wrapped('payload')).rejects.toThrow(
        'You do not have permission to perform this action.'
      );
      expect(action).not.toHaveBeenCalled();
    });

    it('throws FORBIDDEN message when parent calls a teacher-only action', async () => {
      vi.doMock('next/headers', () => makeHeadersMock({ 'x-user-role': 'parent' }));
      const { withAuth } = await import('@/lib/auth-utils');
      const { z } = await import('zod');

      const schema = z.object({ id: z.string() });
      const action = vi.fn(async () => 'report');
      const wrapped = withAuth(schema, action, {
        roles: ['teacher', 'conservatorium_admin', 'site_admin'],
      });

      await expect(wrapped({ id: 'student-1' })).rejects.toThrow(
        'You do not have permission to perform this action.'
      );
      expect(action).not.toHaveBeenCalled();
    });

    it('throws FORBIDDEN message when teacher calls a site_admin-only action', async () => {
      vi.doMock('next/headers', () => makeHeadersMock({ 'x-user-role': 'teacher' }));
      const { withAuth } = await import('@/lib/auth-utils');
      const { z } = await import('zod');

      const schema = z.string();
      const action = vi.fn(async () => 'conservatorium data');
      const wrapped = withAuth(schema, action, { roles: ['site_admin', 'superadmin'] });

      await expect(wrapped('cons-1')).rejects.toThrow(
        'You do not have permission to perform this action.'
      );
      expect(action).not.toHaveBeenCalled();
    });

    it('throws FORBIDDEN message when conservatorium_admin calls a ministry-only action', async () => {
      vi.doMock('next/headers', () =>
        makeHeadersMock({ 'x-user-role': 'conservatorium_admin' })
      );
      const { withAuth } = await import('@/lib/auth-utils');
      const { z } = await import('zod');

      const schema = z.string();
      const action = vi.fn(async () => 'ministry data');
      const wrapped = withAuth(schema, action, { roles: ['ministry_director', 'site_admin'] });

      await expect(wrapped('report-id')).rejects.toThrow(
        'You do not have permission to perform this action.'
      );
      expect(action).not.toHaveBeenCalled();
    });
  });

  // ── Dev bypass — site_admin passes all checks ──────────────────────────────

  describe('dev bypass — site_admin passes role checks', () => {
    it('dev site_admin passes single-role restriction', async () => {
      // Default mock already has site_admin
      vi.doMock('next/headers', () => makeHeadersMock());
      const { withAuth } = await import('@/lib/auth-utils');
      const { z } = await import('zod');

      const schema = z.string();
      const action = vi.fn(async () => 'super-secret');
      const wrapped = withAuth(schema, action, { roles: ['site_admin'] });

      await expect(wrapped('x')).resolves.toBe('super-secret');
    });

    it('dev site_admin passes admin-level restriction', async () => {
      vi.doMock('next/headers', () => makeHeadersMock());
      const { withAuth } = await import('@/lib/auth-utils');
      const { z } = await import('zod');

      const schema = z.object({ conservatoriumId: z.string() });
      const action = vi.fn(async () => ({ id: 'cons-new' }));
      const wrapped = withAuth(schema, action, {
        roles: ['site_admin', 'superadmin'],
      });

      await expect(wrapped({ conservatoriumId: 'cons-1' })).resolves.toEqual({ id: 'cons-new' });
    });
  });

  // ── Role check fires before action body runs ───────────────────────────────

  describe('role check fires before action body', () => {
    it('action is never called when role check fails', async () => {
      vi.doMock('next/headers', () => makeHeadersMock({ 'x-user-role': 'student' }));
      const { withAuth } = await import('@/lib/auth-utils');
      const { z } = await import('zod');

      const sideEffect = vi.fn();
      const schema = z.string();
      const action = vi.fn(async () => {
        sideEffect(); // Should never be called
        return 'result';
      });
      const wrapped = withAuth(schema, action, { roles: ['site_admin'] });

      await expect(wrapped('data')).rejects.toThrow(
        'You do not have permission to perform this action.'
      );
      expect(action).not.toHaveBeenCalled();
      expect(sideEffect).not.toHaveBeenCalled();
    });

    it('action is called when role check passes', async () => {
      vi.doMock('next/headers', () => makeHeadersMock({ 'x-user-role': 'site_admin' }));
      const { withAuth } = await import('@/lib/auth-utils');
      const { z } = await import('zod');

      const sideEffect = vi.fn();
      const schema = z.string();
      const action = vi.fn(async () => {
        sideEffect();
        return 'result';
      });
      const wrapped = withAuth(schema, action, { roles: ['site_admin'] });

      await expect(wrapped('data')).resolves.toBe('result');
      expect(action).toHaveBeenCalledOnce();
      expect(sideEffect).toHaveBeenCalledOnce();
    });
  });

  // ── Input validation still runs after role check ───────────────────────────

  describe('Zod validation still runs after role check passes', () => {
    it('throws validation error for invalid input even when role passes', async () => {
      vi.doMock('next/headers', () => makeHeadersMock({ 'x-user-role': 'site_admin' }));
      const { withAuth } = await import('@/lib/auth-utils');
      const { z } = await import('zod');

      const schema = z.object({ count: z.number() });
      const action = vi.fn(async () => 'ok');
      const wrapped = withAuth(schema, action, { roles: ['site_admin'] });

      await expect(
        wrapped({ count: 'not-a-number' as unknown as number })
      ).rejects.toThrow('Invalid input provided to server action.');
    });
  });
});
