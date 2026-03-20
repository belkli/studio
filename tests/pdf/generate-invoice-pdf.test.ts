import { describe, it, expect, vi, afterEach } from 'vitest';

describe('generateInvoicePdf', () => {
  const input = {
    invoiceId: 'inv-1',
    invoiceNumber: 'INV-001',
    payerName: 'Test',
    amount: 1000,
    currency: 'ILS',
    conservatoriumId: 'cons-1',
  };

  afterEach(() => {
    delete process.env.LYRIOSA_INTERNAL_PDF_ENABLED;
    vi.resetModules();
  });

  it('returns a URL when flag is unset (default on)', async () => {
    const { generateInvoicePdf } = await import('@/lib/pdf/generate-invoice-pdf');
    const result = await generateInvoicePdf(input);
    expect(result).not.toBeNull();
    expect(result).toContain('/api/invoice-pdf/inv-1');
  });

  it('returns null when LYRIOSA_INTERNAL_PDF_ENABLED=false', async () => {
    process.env.LYRIOSA_INTERNAL_PDF_ENABLED = 'false';
    vi.resetModules();
    const { generateInvoicePdf } = await import('@/lib/pdf/generate-invoice-pdf');
    const result = await generateInvoicePdf(input);
    expect(result).toBeNull();
  });
});
