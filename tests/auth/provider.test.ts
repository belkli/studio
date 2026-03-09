// tests/auth/provider.test.ts

import { describe, it, expect, beforeEach, vi } from 'vitest';

// We test the factory behaviour — not the providers themselves (those have their own tests)
describe('getServerAuthProvider factory', () => {
  beforeEach(async () => {
    // Reset module cache between tests
    vi.resetModules();
    // Reset the singleton cache
    const mod = await import('@/lib/auth/server-provider');
    mod._resetServerProviderCache();
  });

  it('returns FirebaseServerAuthProvider when AUTH_PROVIDER=firebase', async () => {
    process.env.AUTH_PROVIDER = 'firebase';
    const { getServerAuthProvider } = await import('@/lib/auth/server-provider');
    const provider = await getServerAuthProvider();
    expect(provider.constructor.name).toBe('FirebaseServerAuthProvider');
  });

  it('returns FirebaseServerAuthProvider by default (no AUTH_PROVIDER set)', async () => {
    delete process.env.AUTH_PROVIDER;
    const { getServerAuthProvider } = await import('@/lib/auth/server-provider');
    const provider = await getServerAuthProvider();
    expect(provider.constructor.name).toBe('FirebaseServerAuthProvider');
  });

  it('returns SupabaseServerAuthProvider when AUTH_PROVIDER=supabase', async () => {
    process.env.AUTH_PROVIDER = 'supabase';
    const { getServerAuthProvider } = await import('@/lib/auth/server-provider');
    const provider = await getServerAuthProvider();
    expect(provider.constructor.name).toBe('SupabaseServerAuthProvider');
  });

  it('caches the provider after first call', async () => {
    process.env.AUTH_PROVIDER = 'firebase';
    const { getServerAuthProvider } = await import('@/lib/auth/server-provider');
    const p1 = await getServerAuthProvider();
    const p2 = await getServerAuthProvider();
    expect(p1).toBe(p2);
  });
});
