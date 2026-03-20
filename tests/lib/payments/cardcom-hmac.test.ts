import { describe, it, expect } from 'vitest';
import { createHmac } from 'crypto';

describe('verifyCardcomHmac', () => {
  const secret = 'test-secret-123';
  const body = '{"LowProfileCode":"abc","ResponseCode":"0","Amount":"500"}';

  it('returns true for valid HMAC signature', async () => {
    const { verifyCardcomHmac } = await import('@/lib/payments/cardcom');
    const sig = createHmac('sha256', secret).update(body).digest('hex');
    expect(verifyCardcomHmac(body, sig, secret)).toBe(true);
  });

  it('returns false for tampered body', async () => {
    const { verifyCardcomHmac } = await import('@/lib/payments/cardcom');
    const sig = createHmac('sha256', secret).update(body).digest('hex');
    expect(verifyCardcomHmac(body + 'tampered', sig, secret)).toBe(false);
  });

  it('returns false for wrong secret', async () => {
    const { verifyCardcomHmac } = await import('@/lib/payments/cardcom');
    const sig = createHmac('sha256', 'wrong-secret').update(body).digest('hex');
    expect(verifyCardcomHmac(body, sig, secret)).toBe(false);
  });

  it('returns false for missing signature', async () => {
    const { verifyCardcomHmac } = await import('@/lib/payments/cardcom');
    expect(verifyCardcomHmac(body, '', secret)).toBe(false);
  });
});
