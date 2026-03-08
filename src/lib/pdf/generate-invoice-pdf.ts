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
 * Returns a URL that serves the invoice as a printable HTML page.
 * In production: would return a signed GCS/S3 URL to the rendered PDF.
 */
export async function generateInvoicePdf(input: InvoicePdfInput): Promise<string> {
  // In production: render HTML via puppeteer, upload to GCS, return signed URL
  // For demo: return URL to the HTML invoice endpoint
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002';
  return `${baseUrl}/api/invoice-pdf/${input.invoiceId}`;
}
