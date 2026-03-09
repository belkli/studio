// tests/auth/extract-claims.test.ts

import { describe, it, expect } from 'vitest';
import { FirebaseServerAuthProvider } from '@/lib/auth/firebase-server-provider';
import { SupabaseServerAuthProvider } from '@/lib/auth/supabase-provider';

// Helper: build a fake JWT with a given payload (base64url, no real signing)
function fakeJwt(payload: Record<string, unknown>): string {
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${header}.${body}.fakesig`;
}

const futureExp = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
const pastExp = Math.floor(Date.now() / 1000) - 1;      // expired

// -- Firebase claims format -------------------------------------------------
describe('FirebaseServerAuthProvider.extractClaimsFromCookie', () => {
  const provider = new FirebaseServerAuthProvider();

  it('extracts claims from a valid Firebase JWT', async () => {
    const jwt = fakeJwt({
      sub: 'firebase-uid-123',
      email: 'test@example.com',
      role: 'teacher',
      conservatoriumId: 'cons-1',
      approved: true,
      exp: futureExp,
    });
    const claims = await provider.extractClaimsFromCookie(jwt);
    expect(claims).toEqual({
      uid: 'firebase-uid-123',
      email: 'test@example.com',
      role: 'teacher',
      conservatoriumId: 'cons-1',
      approved: true,
    });
  });

  it('returns null for expired token', async () => {
    const jwt = fakeJwt({ sub: 'uid', exp: pastExp });
    expect(await provider.extractClaimsFromCookie(jwt)).toBeNull();
  });

  it('returns null for malformed token', async () => {
    expect(await provider.extractClaimsFromCookie('not.a.jwt')).toBeNull();
    expect(await provider.extractClaimsFromCookie('')).toBeNull();
    expect(await provider.extractClaimsFromCookie('onepart')).toBeNull();
  });

  it('returns null when sub is missing', async () => {
    const jwt = fakeJwt({ email: 'test@example.com', exp: futureExp });
    expect(await provider.extractClaimsFromCookie(jwt)).toBeNull();
  });

  it('defaults role to empty string when missing', async () => {
    const jwt = fakeJwt({ sub: 'uid', exp: futureExp });
    const claims = await provider.extractClaimsFromCookie(jwt);
    expect(claims?.role).toBe('');
  });
});

// -- Supabase claims format -------------------------------------------------
describe('SupabaseServerAuthProvider.extractClaimsFromCookie', () => {
  const provider = new SupabaseServerAuthProvider();

  it('extracts claims from Supabase JWT with app_metadata', async () => {
    const jwt = fakeJwt({
      sub: 'supabase-uid-456',
      email: 'teacher@example.com',
      app_metadata: {
        role: 'conservatorium_admin',
        conservatoriumId: 'cons-5',
        approved: true,
      },
      exp: futureExp,
    });
    const claims = await provider.extractClaimsFromCookie(jwt);
    expect(claims).toEqual({
      uid: 'supabase-uid-456',
      email: 'teacher@example.com',
      role: 'conservatorium_admin',
      conservatoriumId: 'cons-5',
      approved: true,
    });
  });

  it('returns null for expired Supabase token', async () => {
    const jwt = fakeJwt({ sub: 'uid', exp: pastExp, app_metadata: {} });
    expect(await provider.extractClaimsFromCookie(jwt)).toBeNull();
  });

  it('defaults role to empty string when app_metadata missing', async () => {
    const jwt = fakeJwt({ sub: 'uid', exp: futureExp });
    const claims = await provider.extractClaimsFromCookie(jwt);
    expect(claims?.role).toBe('');
  });
});
