import { describe, it, expect } from 'vitest';

// ---------------------------------------------------------------------------
// Tests for sanitizeCallbackUrl — the pure URL-sanitisation function defined
// in src/components/auth/login-form.tsx (FIX-13: open redirect mitigation).
//
// The component is "use client" so we cannot import it in Vitest directly.
// We re-implement the function here to test the exact logic:
//
//   function sanitizeCallbackUrl(url: string | null): string {
//     if (!url) return '/dashboard';
//     if (url.startsWith('/') && !url.startsWith('//')) return url;
//     return '/dashboard';
//   }
// ---------------------------------------------------------------------------

function sanitizeCallbackUrl(url: string | null): string {
  if (!url) return '/dashboard';
  // Must be a relative path (starts with /) and not a protocol-relative URL (//)
  if (url.startsWith('/') && !url.startsWith('//')) return url;
  return '/dashboard';
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('sanitizeCallbackUrl — null and empty inputs', () => {
  it('returns /dashboard for null', () => {
    expect(sanitizeCallbackUrl(null)).toBe('/dashboard');
  });

  it('returns /dashboard for empty string', () => {
    expect(sanitizeCallbackUrl('')).toBe('/dashboard');
  });
});

describe('sanitizeCallbackUrl — safe relative paths', () => {
  it('preserves /dashboard', () => {
    expect(sanitizeCallbackUrl('/dashboard')).toBe('/dashboard');
  });

  it('preserves /dashboard/schedule?tab=deals', () => {
    expect(sanitizeCallbackUrl('/dashboard/schedule?tab=deals')).toBe(
      '/dashboard/schedule?tab=deals'
    );
  });

  it('preserves /dashboard/student/repertoire', () => {
    expect(sanitizeCallbackUrl('/dashboard/student/repertoire')).toBe(
      '/dashboard/student/repertoire'
    );
  });

  it('preserves /he/dashboard (locale-prefixed path)', () => {
    expect(sanitizeCallbackUrl('/he/dashboard')).toBe('/he/dashboard');
  });

  it('preserves path with hash fragment', () => {
    expect(sanitizeCallbackUrl('/dashboard#section')).toBe('/dashboard#section');
  });

  it('preserves path with multiple query params', () => {
    expect(sanitizeCallbackUrl('/dashboard?a=1&b=2')).toBe('/dashboard?a=1&b=2');
  });
});

describe('sanitizeCallbackUrl — absolute URL attacks (open redirect)', () => {
  it('blocks https://evil.com', () => {
    expect(sanitizeCallbackUrl('https://evil.com')).toBe('/dashboard');
  });

  it('blocks http://evil.com', () => {
    expect(sanitizeCallbackUrl('http://evil.com')).toBe('/dashboard');
  });

  it('blocks //evil.com (protocol-relative URL)', () => {
    expect(sanitizeCallbackUrl('//evil.com')).toBe('/dashboard');
  });

  it('blocks //evil.com/steal?token=abc', () => {
    expect(sanitizeCallbackUrl('//evil.com/steal?token=abc')).toBe('/dashboard');
  });

  it('blocks https://harmonia.co.il.evil.com (subdomain attack)', () => {
    expect(sanitizeCallbackUrl('https://harmonia.co.il.evil.com')).toBe('/dashboard');
  });

  it('blocks javascript:alert(1) (XSS vector)', () => {
    expect(sanitizeCallbackUrl('javascript:alert(1)')).toBe('/dashboard');
  });

  it('blocks data:text/html,<script>... (data URI)', () => {
    expect(sanitizeCallbackUrl('data:text/html,<script>alert(1)</script>')).toBe('/dashboard');
  });
});

describe('sanitizeCallbackUrl — edge cases', () => {
  it('preserves root path /', () => {
    expect(sanitizeCallbackUrl('/')).toBe('/');
  });

  it('blocks a bare domain without protocol', () => {
    // "evil.com" does not start with "/" — falls through to /dashboard
    expect(sanitizeCallbackUrl('evil.com/path')).toBe('/dashboard');
  });

  it('preserves deeply nested path', () => {
    expect(sanitizeCallbackUrl('/a/b/c/d/e?x=1')).toBe('/a/b/c/d/e?x=1');
  });
});
