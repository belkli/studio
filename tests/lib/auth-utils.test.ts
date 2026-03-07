import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock Firebase Admin — simulates no Admin SDK (local dev)
vi.mock('@/lib/firebase-admin', () => ({
    getAdminAuth: vi.fn(() => null),
}));

// Mock next/headers — inject synthetic middleware-style headers
vi.mock('next/headers', () => ({
    headers: vi.fn(async () => ({
        get: (key: string) => {
            const map: Record<string, string> = {
                'x-user-id': 'dev-user',
                'x-user-role': 'site_admin',
                'x-user-conservatorium-id': 'dev-conservatorium',
                'x-user-approved': 'true',
                'x-user-email': 'dev@harmonia.local',
            };
            return map[key] ?? null;
        },
    })),
    cookies: vi.fn(async () => ({ get: vi.fn(() => undefined) })),
}));

describe('auth-utils', () => {
    const originalNodeEnv = process.env.NODE_ENV;

    afterEach(() => {
        // Restore NODE_ENV after each test
        vi.unstubAllEnvs();
        vi.resetModules();
    });

    describe('verifyAuth - dev mode fallback (no Admin SDK, no headers)', () => {
        beforeEach(() => {
            // Reset modules so verifyAuth re-reads the mocked getAdminAuth
            vi.resetModules();
            // Remove the service account key so getAdminAuth returns null
            delete process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
        });

        it('returns a session when no Firebase Admin is configured (header-based fallback)', async () => {
            const { verifyAuth } = await import('@/lib/auth-utils');
            const session = await verifyAuth();

            expect(session).toBeTruthy();
            expect(session.uid).toBe('dev-user');
            expect(session.role).toBe('site_admin');
            expect(session.email).toBe('dev@harmonia.local');
            expect(session.conservatoriumId).toBe('dev-conservatorium');
            expect(session.approved).toBe(true);
        });

        it('returns a session with required shape fields', async () => {
            const { verifyAuth } = await import('@/lib/auth-utils');
            const session = await verifyAuth();

            expect(typeof session.uid).toBe('string');
            expect(session.uid.length).toBeGreaterThan(0);
            expect(typeof session.role).toBe('string');
            expect(typeof session.email).toBe('string');
            expect(typeof session.conservatoriumId).toBe('string');
            expect(typeof session.approved).toBe('boolean');
        });
    });

    describe('verifyAuth - synthetic dev fallback (NODE_ENV !== production)', () => {
        it('returns synthetic site_admin session when no Admin SDK and no middleware headers', async () => {
            // Override headers to return no user headers (simulate missing middleware)
            vi.doMock('next/headers', () => ({
                headers: vi.fn(async () => ({
                    get: (_key: string) => null,
                })),
                cookies: vi.fn(async () => ({ get: vi.fn(() => undefined) })),
            }));
            vi.doMock('@/lib/firebase-admin', () => ({
                getAdminAuth: vi.fn(() => null),
            }));

            const { verifyAuth } = await import('@/lib/auth-utils');

            // NODE_ENV is 'test' (not 'production'), so the dev fallback should activate
            const session = await verifyAuth();

            expect(session).toBeTruthy();
            expect(session.uid).toBe('dev-user');
            expect(session.role).toBe('site_admin');
            expect(session.approved).toBe(true);
        });
    });

    describe('getClaimsFromRequest', () => {
        beforeEach(() => {
            vi.resetModules();
            // Re-establish the next/headers mock with dev headers
            vi.doMock('next/headers', () => ({
                headers: vi.fn(async () => ({
                    get: (key: string) => {
                        const map: Record<string, string> = {
                            'x-user-id': 'dev-user',
                            'x-user-role': 'site_admin',
                            'x-user-conservatorium-id': 'dev-conservatorium',
                            'x-user-approved': 'true',
                            'x-user-email': 'dev@harmonia.local',
                        };
                        return map[key] ?? null;
                    },
                })),
                cookies: vi.fn(async () => ({ get: vi.fn(() => undefined) })),
            }));
        });

        it('returns claims parsed from injected request headers', async () => {
            const { getClaimsFromRequest } = await import('@/lib/auth-utils');
            const claims = await getClaimsFromRequest();

            expect(claims).not.toBeNull();
            expect(claims?.uid).toBe('dev-user');
            expect(claims?.role).toBe('site_admin');
            expect(claims?.email).toBe('dev@harmonia.local');
            expect(claims?.conservatoriumId).toBe('dev-conservatorium');
            expect(claims?.approved).toBe(true);
        });

        it('returns null when x-user-id header is absent', async () => {
            vi.doMock('next/headers', () => ({
                headers: vi.fn(async () => ({
                    get: (key: string) => {
                        if (key === 'x-user-id') return null;
                        return 'some-value';
                    },
                })),
                cookies: vi.fn(async () => ({ get: vi.fn(() => undefined) })),
            }));

            vi.resetModules();
            const { getClaimsFromRequest } = await import('@/lib/auth-utils');
            const claims = await getClaimsFromRequest();

            expect(claims).toBeNull();
        });

        it('returns null when x-user-role header is absent', async () => {
            vi.doMock('next/headers', () => ({
                headers: vi.fn(async () => ({
                    get: (key: string) => {
                        if (key === 'x-user-role') return null;
                        if (key === 'x-user-id') return 'some-uid';
                        return null;
                    },
                })),
                cookies: vi.fn(async () => ({ get: vi.fn(() => undefined) })),
            }));

            vi.resetModules();
            const { getClaimsFromRequest } = await import('@/lib/auth-utils');
            const claims = await getClaimsFromRequest();

            expect(claims).toBeNull();
        });
    });

    describe('requireRole', () => {
        it('returns claims when role is in the allowed list', async () => {
            const { requireRole } = await import('@/lib/auth-utils');
            const claims = await requireRole(['site_admin', 'superadmin']);

            expect(claims).toBeTruthy();
            expect(claims.role).toBe('site_admin');
        });

        it('throws FORBIDDEN when role is not in allowed list', async () => {
            const { requireRole } = await import('@/lib/auth-utils');

            await expect(requireRole(['teacher'])).rejects.toThrow('FORBIDDEN');
        });

        it('throws FORBIDDEN when role is not in allowed list (student)', async () => {
            const { requireRole } = await import('@/lib/auth-utils');

            await expect(requireRole(['student', 'parent'])).rejects.toThrow('FORBIDDEN');
        });

        it('does not throw TENANT_MISMATCH for site_admin even with a conservatoriumId constraint', async () => {
            const { requireRole } = await import('@/lib/auth-utils');
            // site_admin is a global admin role — bypasses tenant isolation
            const claims = await requireRole(['site_admin'], 'some-other-conservatorium');

            expect(claims).toBeTruthy();
            expect(claims.role).toBe('site_admin');
        });

        it('throws TENANT_MISMATCH for non-global admin when conservatoriumId does not match', async () => {
            // Override headers to simulate a conservatorium_admin (non-global)
            vi.doMock('next/headers', () => ({
                headers: vi.fn(async () => ({
                    get: (key: string) => {
                        const map: Record<string, string> = {
                            'x-user-id': 'admin-user',
                            'x-user-role': 'conservatorium_admin',
                            'x-user-conservatorium-id': 'cons-1',
                            'x-user-approved': 'true',
                            'x-user-email': 'admin@example.com',
                        };
                        return map[key] ?? null;
                    },
                })),
                cookies: vi.fn(async () => ({ get: vi.fn(() => undefined) })),
            }));
            vi.doMock('@/lib/firebase-admin', () => ({
                getAdminAuth: vi.fn(() => null),
            }));

            vi.resetModules();
            const { requireRole } = await import('@/lib/auth-utils');

            await expect(
                requireRole(['conservatorium_admin'], 'cons-9999')
            ).rejects.toThrow('TENANT_MISMATCH');
        });
    });

    describe('withAuth', () => {
        it('calls the action with parsed input when authenticated', async () => {
            const { withAuth } = await import('@/lib/auth-utils');
            const { z } = await import('zod');

            const schema = z.object({ name: z.string() });
            const action = vi.fn(async (input: { name: string }) => `Hello ${input.name}`);
            const wrapped = withAuth(schema, action);

            const result = await wrapped({ name: 'World' });

            expect(result).toBe('Hello World');
            expect(action).toHaveBeenCalledWith({ name: 'World' });
        });

        it('throws validation error message for invalid schema input', async () => {
            const { withAuth } = await import('@/lib/auth-utils');
            const { z } = await import('zod');

            const schema = z.object({ count: z.number() });
            const action = vi.fn(async (input: { count: number }) => input.count * 2);
            const wrapped = withAuth(schema, action);

            // Passing a string where a number is expected
            await expect(wrapped({ count: 'not-a-number' as unknown as number }))
                .rejects.toThrow('Invalid input provided to server action.');
        });

        it('wraps FORBIDDEN error with a human-readable message', async () => {
            vi.doMock('next/headers', () => ({
                headers: vi.fn(async () => ({
                    get: (key: string) => {
                        const map: Record<string, string> = {
                            'x-user-id': 'teacher-user',
                            'x-user-role': 'teacher',
                            'x-user-conservatorium-id': 'cons-1',
                            'x-user-approved': 'true',
                            'x-user-email': 'teacher@example.com',
                        };
                        return map[key] ?? null;
                    },
                })),
                cookies: vi.fn(async () => ({ get: vi.fn(() => undefined) })),
            }));
            vi.doMock('@/lib/firebase-admin', () => ({
                getAdminAuth: vi.fn(() => null),
            }));

            vi.resetModules();
            const { withAuth, requireRole } = await import('@/lib/auth-utils');
            const { z } = await import('zod');

            const schema = z.object({});
            // Action that enforces site_admin — teacher should get FORBIDDEN
            const action = async () => {
                await requireRole(['site_admin']);
                return 'ok';
            };
            const wrapped = withAuth(schema, action);

            await expect(wrapped({})).rejects.toThrow(
                'You do not have permission to perform this action.'
            );
        });
    });

    describe('createSessionCookie / revokeSession - no Admin SDK', () => {
        it('createSessionCookie throws when Admin SDK is not configured', async () => {
            const { createSessionCookie } = await import('@/lib/auth-utils');
            await expect(createSessionCookie('fake-id-token')).rejects.toThrow(
                'Firebase Admin SDK is not configured'
            );
        });

        it('revokeSession throws when Admin SDK is not configured', async () => {
            const { revokeSession } = await import('@/lib/auth-utils');
            await expect(revokeSession('uid-123')).rejects.toThrow(
                'Firebase Admin SDK is not configured'
            );
        });
    });
});
