/**
 * @fileoverview Invoice PDF generation utilities.
 * In production: uses puppeteer/playwright to render HTML to PDF.
 * In demo/dev: returns a data URL pointing to the HTML invoice endpoint.
 */

export interface InvoicePdfInput {
  invoiceId: string;
  invoiceNumber: string | undefined;
  payerName: string;
  payerEmail?: string;
  amount: number;
  currency: string;
  conservatoriumId: string;
  packageTitle?: string;
  transactionId?: string;
  paidAt?: string;
}

/**
 * Generates (or queues generation of) an invoice PDF.
 * Returns a URL that serves the invoice as a printable HTML page,
 * or null if PDF generation is disabled via feature flag.
 *
 * Set LYRIOSA_INTERNAL_PDF_ENABLED=false to disable.
 * Default: enabled (when unset or any value other than 'false').
 */
export async function generateInvoicePdf(input: InvoicePdfInput): Promise<string | null> {
  // TODO: disable once all payment gateways confirmed issuing invoices
  if (process.env.LYRIOSA_INTERNAL_PDF_ENABLED === 'false') return null;

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002';
  return `${baseUrl}/api/invoice-pdf/${input.invoiceId}`;
}
