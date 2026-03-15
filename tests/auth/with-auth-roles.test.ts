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

  // ── Edge case: multiple roles in the allowed list ─────────────────────────

  describe('multiple roles in the allowed list — any matching role passes', () => {
    it('allows student when roles list includes student among others', async () => {
      vi.doMock('next/headers', () => makeHeadersMock({ 'x-user-role': 'student' }));
      const { withAuth } = await import('@/lib/auth-utils');
      const { z } = await import('zod');

      const schema = z.string();
      const action = vi.fn(async () => 'student result');
      const wrapped = withAuth(schema, action, {
        roles: ['student', 'parent', 'teacher', 'conservatorium_admin'],
      });

      await expect(wrapped('data')).resolves.toBe('student result');
    });

    it('allows parent when roles list includes parent among others', async () => {
      vi.doMock('next/headers', () => makeHeadersMock({ 'x-user-role': 'parent' }));
      const { withAuth } = await import('@/lib/auth-utils');
      const { z } = await import('zod');

      const schema = z.object({ childId: z.string() });
      const action = vi.fn(async () => 'parent result');
      const wrapped = withAuth(schema, action, {
        roles: ['student', 'parent', 'teacher'],
      });

      await expect(wrapped({ childId: 's-1' })).resolves.toBe('parent result');
    });

    it('allows ministry_director when roles list includes ministry_director', async () => {
      vi.doMock('next/headers', () =>
        makeHeadersMock({ 'x-user-role': 'ministry_director' })
      );
      const { withAuth } = await import('@/lib/auth-utils');
      const { z } = await import('zod');

      const schema = z.string();
      const action = vi.fn(async () => 'ministry data');
      const wrapped = withAuth(schema, action, {
        roles: ['ministry_director', 'site_admin', 'superadmin'],
      });

      await expect(wrapped('report')).resolves.toBe('ministry data');
    });

    it('rejects delegated_admin when not in the allowed list', async () => {
      vi.doMock('next/headers', () =>
        makeHeadersMock({ 'x-user-role': 'delegated_admin' })
      );
      const { withAuth } = await import('@/lib/auth-utils');
      const { z } = await import('zod');

      const schema = z.string();
      const action = vi.fn(async () => 'should not run');
      const wrapped = withAuth(schema, action, {
        roles: ['student', 'parent', 'teacher'],
      });

      await expect(wrapped('data')).rejects.toThrow(
        'You do not have permission to perform this action.'
      );
      expect(action).not.toHaveBeenCalled();
    });
  });

  // ── Edge case: FORBIDDEN error has correct shape ──────────────────────────

  describe('FORBIDDEN error shape', () => {
    it('thrown error is an instance of Error', async () => {
      vi.doMock('next/headers', () => makeHeadersMock({ 'x-user-role': 'student' }));
      const { withAuth } = await import('@/lib/auth-utils');
      const { z } = await import('zod');

      const schema = z.string();
      const action = vi.fn(async () => 'nope');
      const wrapped = withAuth(schema, action, { roles: ['site_admin'] });

      try {
        await wrapped('x');
        expect.fail('Expected an error to be thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(Error);
        expect((err as Error).message).toBe(
          'You do not have permission to perform this action.'
        );
      }
    });

    it('error message is exactly the permission denial string', async () => {
      vi.doMock('next/headers', () => makeHeadersMock({ 'x-user-role': 'parent' }));
      const { withAuth } = await import('@/lib/auth-utils');
      const { z } = await import('zod');

      const schema = z.number();
      const action = vi.fn(async () => 0);
      const wrapped = withAuth(schema, action, { roles: ['teacher'] });

      await expect(wrapped(1)).rejects.toThrowError(
        'You do not have permission to perform this action.'
      );
    });

    it('error message does not leak the internal FORBIDDEN code', async () => {
      vi.doMock('next/headers', () => makeHeadersMock({ 'x-user-role': 'student' }));
      const { withAuth } = await import('@/lib/auth-utils');
      const { z } = await import('zod');

      const schema = z.string();
      const action = vi.fn(async () => 'nope');
      const wrapped = withAuth(schema, action, { roles: ['site_admin'] });

      try {
        await wrapped('x');
        expect.fail('Expected an error to be thrown');
      } catch (err) {
        expect((err as Error).message).not.toBe('FORBIDDEN');
        expect((err as Error).message).toBe(
          'You do not have permission to perform this action.'
        );
      }
    });
  });

  // ── Edge case: site_admin role behavior with role restrictions ─────────────

  describe('site_admin behavior with role restrictions', () => {
    it('site_admin passes when explicitly listed in roles array', async () => {
      vi.doMock('next/headers', () => makeHeadersMock({ 'x-user-role': 'site_admin' }));
      const { withAuth } = await import('@/lib/auth-utils');
      const { z } = await import('zod');

      const schema = z.string();
      const action = vi.fn(async () => 'admin ok');
      const wrapped = withAuth(schema, action, {
        roles: ['teacher', 'site_admin'],
      });

      await expect(wrapped('data')).resolves.toBe('admin ok');
    });

    it('site_admin is blocked when NOT listed in the roles array', async () => {
      // withAuth() uses a simple includes() check — no implicit bypass for site_admin
      vi.doMock('next/headers', () => makeHeadersMock({ 'x-user-role': 'site_admin' }));
      const { withAuth } = await import('@/lib/auth-utils');
      const { z } = await import('zod');

      const schema = z.string();
      const action = vi.fn(async () => 'should not run');
      const wrapped = withAuth(schema, action, {
        roles: ['student', 'parent'],
      });

      await expect(wrapped('data')).rejects.toThrow(
        'You do not have permission to perform this action.'
      );
      expect(action).not.toHaveBeenCalled();
    });

    it('superadmin is blocked when NOT listed in the roles array', async () => {
      vi.doMock('next/headers', () => makeHeadersMock({ 'x-user-role': 'superadmin' }));
      const { withAuth } = await import('@/lib/auth-utils');
      const { z } = await import('zod');

      const schema = z.string();
      const action = vi.fn(async () => 'should not run');
      const wrapped = withAuth(schema, action, {
        roles: ['student', 'teacher'],
      });

      await expect(wrapped('data')).rejects.toThrow(
        'You do not have permission to perform this action.'
      );
      expect(action).not.toHaveBeenCalled();
    });

    it('site_admin passes when roles array is only [site_admin]', async () => {
      vi.doMock('next/headers', () => makeHeadersMock({ 'x-user-role': 'site_admin' }));
      const { withAuth } = await import('@/lib/auth-utils');
      const { z } = await import('zod');

      const schema = z.object({ target: z.string() });
      const action = vi.fn(async () => ({ deleted: true }));
      const wrapped = withAuth(schema, action, { roles: ['site_admin'] });

      await expect(wrapped({ target: 'cons-1' })).resolves.toEqual({ deleted: true });
    });
  });

  // ── Edge case: dev mode bypass with roles set ─────────────────────────────

  describe('dev mode bypass — synthetic site_admin with roles set', () => {
    it('dev bypass user (site_admin) passes when site_admin is in the roles array', async () => {
      // Default headers mock has 'x-user-role': 'site_admin' — simulates dev bypass
      vi.doMock('next/headers', () => makeHeadersMock());
      const { withAuth } = await import('@/lib/auth-utils');
      const { z } = await import('zod');

      const schema = z.string();
      const action = vi.fn(async () => 'dev admin ok');
      const wrapped = withAuth(schema, action, {
        roles: ['conservatorium_admin', 'site_admin'],
      });

      await expect(wrapped('test')).resolves.toBe('dev admin ok');
    });

    it('dev bypass user (site_admin) is blocked when site_admin is NOT in the roles array', async () => {
      // Even the dev bypass user is subject to withAuth() role checking
      vi.doMock('next/headers', () => makeHeadersMock());
      const { withAuth } = await import('@/lib/auth-utils');
      const { z } = await import('zod');

      const schema = z.string();
      const action = vi.fn(async () => 'should not run');
      const wrapped = withAuth(schema, action, {
        roles: ['student', 'parent'],
      });

      await expect(wrapped('test')).rejects.toThrow(
        'You do not have permission to perform this action.'
      );
      expect(action).not.toHaveBeenCalled();
    });

    it('dev bypass user passes when no roles option is set (backward compat)', async () => {
      vi.doMock('next/headers', () => makeHeadersMock());
      const { withAuth } = await import('@/lib/auth-utils');
      const { z } = await import('zod');

      const schema = z.string();
      const action = vi.fn(async () => 'open action ok');
      const wrapped = withAuth(schema, action);

      await expect(wrapped('test')).resolves.toBe('open action ok');
    });

    it('dev bypass user passes when roles is empty array (backward compat)', async () => {
      vi.doMock('next/headers', () => makeHeadersMock());
      const { withAuth } = await import('@/lib/auth-utils');
      const { z } = await import('zod');

      const schema = z.string();
      const action = vi.fn(async () => 'open action ok');
      const wrapped = withAuth(schema, action, { roles: [] });

      await expect(wrapped('test')).resolves.toBe('open action ok');
    });
  });
});
