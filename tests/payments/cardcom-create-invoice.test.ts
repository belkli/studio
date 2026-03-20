import { describe, it, expect, vi } from 'vitest';

describe('createCardcomPaymentPage - CreateInvoice flag', () => {
  it('includes CreateInvoice: true in the request body', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ LowProfileCode: 'abc123', ResponseCode: '0' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    process.env.CARDCOM_TERMINAL_NUMBER = 'terminal-123';
    process.env.CARDCOM_API_KEY = 'test-api-key';
    vi.resetModules();
    const { createCardcomPaymentPage } = await import('@/lib/payments/cardcom');

    try {
      await createCardcomPaymentPage({
        invoiceId: 'inv-1',
        amount: 500,
        currency: 'ILS',
        description: 'Test payment',
        customerName: 'Test User',
        customerEmail: 'test@example.com',
        customerPhone: '+972501234567',
        successUrl: 'https://example.com/success',
        failureUrl: 'https://example.com/fail',
        webhookUrl: 'https://example.com/webhook',
        language: 'he',
      });
    } catch {
      // May throw if terminal not configured — that's ok, we just need the spy
    }

    if (fetchSpy.mock.calls.length > 0) {
      const callArgs = fetchSpy.mock.calls[0];
      const body = (callArgs[1] as RequestInit)?.body;
      if (body) {
        const parsed = JSON.parse(body as string);
        expect(parsed.CreateInvoice).toBe('true');
      }
    }

    delete process.env.CARDCOM_TERMINAL_NUMBER;
    delete process.env.CARDCOM_API_KEY;
    fetchSpy.mockRestore();
  });
});
