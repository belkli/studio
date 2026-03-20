/**
 * @fileoverview Cardcom webhook handler.
 * Receives payment confirmation callbacks from Cardcom payment gateway.
 * Validates HMAC-SHA256 signature, updates invoice status, and triggers notifications.
 *
 * Environment variables:
 * - CARDCOM_WEBHOOK_SECRET: HMAC-SHA256 shared secret for signature verification
 */
import { type NextRequest, NextResponse } from 'next/server';
import { createHmac, timingSafeEqual } from 'crypto';
import { getDb } from '@/lib/db';

// Cardcom sends payment results as form-urlencoded POST
export async function POST(request: NextRequest) {
  const webhookSecret = process.env.CARDCOM_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('[Cardcom Webhook] CARDCOM_WEBHOOK_SECRET is not configured');
    return NextResponse.json(
      { error: 'Webhook not configured' },
      { status: 500 }
    );
  }

  // Read raw body for HMAC verification
  const rawBody = await request.text();

  // Verify HMAC-SHA256 signature
  const signatureHeader = request.headers.get('x-cardcom-signature')
    ?? request.headers.get('X-Cardcom-Signature');

  if (!signatureHeader) {
    console.warn('[Cardcom Webhook] Missing signature header');
    return NextResponse.json(
      { error: 'Missing signature' },
      { status: 401 }
    );
  }

  const expectedSignature = createHmac('sha256', webhookSecret)
    .update(rawBody)
    .digest('hex');

  // Timing-safe comparison to prevent timing attacks
  const signatureBuffer = Buffer.from(signatureHeader, 'hex');
  const expectedBuffer = Buffer.from(expectedSignature, 'hex');

  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    console.warn('[Cardcom Webhook] Invalid signature');
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 401 }
    );
  }

  // Parse the verified payload
  let payload: Record<string, string>;
  try {
    const contentType = request.headers.get('content-type') ?? '';
    if (contentType.includes('application/json')) {
      payload = JSON.parse(rawBody);
    } else {
      // Form-urlencoded (Cardcom default)
      const params = new URLSearchParams(rawBody);
      payload = Object.fromEntries(params.entries());
    }
  } catch {
    console.error('[Cardcom Webhook] Failed to parse payload');
    return NextResponse.json(
      { error: 'Invalid payload' },
      { status: 400 }
    );
  }

  const {
    lowProfileCode: _lowProfileCode,
    ResponseCode,
    InternalDealNumber,
    ReturnValue,
    CardSuffix,
    CardType,
    NumOfPayments,
    FirstPaymentTotal: _FirstPaymentTotal,
    PeriodicalPaymentTotal,
    Token: _cardToken,
    TokenExpiry: _cardTokenExpiry,
    ApprovalNumber,
    InvoiceNumber,
  } = payload;

  const invoiceId = ReturnValue;
  const responseCode = ResponseCode ?? payload.responseCode;
  const transactionId = InternalDealNumber ?? payload.transactionId;

  if (!invoiceId) {
    console.error('[Cardcom Webhook] No ReturnValue (invoiceId) in payload');
    return NextResponse.json(
      { error: 'Missing invoice reference' },
      { status: 400 }
    );
  }

  const db = await getDb();

  // Payment failed
  if (responseCode !== '0') {
    console.warn(
      `[Cardcom Webhook] Payment failed for invoice ${invoiceId}: code ${responseCode}`
    );

    try {
      const invoice = await db.payments.findById(invoiceId);
      if (invoice) {
        await db.payments.update(invoiceId, {
          status: 'OVERDUE',
          updatedAt: new Date().toISOString(),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any);
      }
    } catch (err) {
      console.error('[Cardcom Webhook] Error processing failed payment:', err);
    }

    // Return 200 to Cardcom so it doesn't retry
    return NextResponse.json({ received: true, status: 'payment_failed' });
  }

  // Payment succeeded
  try {
    const invoice = await db.payments.findById(invoiceId);
    if (!invoice) {
      console.error(`[Cardcom Webhook] Invoice not found: ${invoiceId}`);
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }

    const now = new Date().toISOString();
    const installmentCount = parseInt(NumOfPayments || '1', 10);

    await db.payments.update(invoiceId, {
      status: 'PAID' as const,
      paidAt: now,
      paidAmount: invoice.total,
      paymentMethod: 'CARDCOM' as const,
      cardcomTransactionId: transactionId,
      ...(InvoiceNumber ? { gatewayInvoiceNumber: InvoiceNumber } : {}),
      installments: installmentCount > 1 ? {
        count: installmentCount,
        monthlyAmount: parseFloat(PeriodicalPaymentTotal || '0'),
        paidInstallments: 1,
        nextPaymentDate: undefined,
      } : undefined,
      updatedAt: now,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    console.log(
      `[Cardcom Webhook] Invoice ${invoiceId} marked as PAID. ` +
      `Transaction: ${transactionId}, Card: *${CardSuffix || '****'} (${CardType || 'unknown'}), ` +
      `Approval: ${ApprovalNumber || 'N/A'}, Installments: ${installmentCount}`
    );

    // Post-payment notifications (in-app + email)
    try {
      const { buildPaymentNotifications, sendPaymentConfirmationEmail } = await import('@/lib/notifications/payment-notifications');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const inv = invoice as any;
      const notifications = buildPaymentNotifications({
        invoiceId,
        payerId: invoice.payerId ?? '',
        payerName: inv.payerName ?? 'Student',
        payerEmail: inv.payerEmail,
        teacherId: inv.teacherId,
        teacherName: inv.teacherName,
        conservatoriumId: invoice.conservatoriumId ?? '',
        amount: invoice.total ?? 0,
        currency: 'ILS',
        invoiceNumber: invoice.invoiceNumber,
        packageTitle: inv.packageTitle,
        transactionId,
      });
      // Notifications are built — in production, persist to DB here
      // For now, log them for observability
      if (notifications.length > 0) {
        console.log(`[Cardcom Webhook] ${notifications.length} notifications queued for payment ${invoiceId}`);
      }
      if (inv.payerEmail) {
        await sendPaymentConfirmationEmail({
          invoiceId,
          payerId: invoice.payerId ?? '',
          payerName: inv.payerName ?? 'Student',
          payerEmail: inv.payerEmail,
          amount: invoice.total ?? 0,
          currency: 'ILS',
          conservatoriumId: invoice.conservatoriumId ?? '',
          invoiceNumber: invoice.invoiceNumber,
          packageTitle: inv.packageTitle,
          transactionId,
        });
      }
    } catch (notifError) {
      console.error('[Cardcom Webhook] Notification dispatch failed:', notifError);
    }

    // Generate invoice PDF URL and persist it
    try {
      const { generateInvoicePdf } = await import('@/lib/pdf/generate-invoice-pdf');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const inv2 = invoice as any;
      const pdfUrl = await generateInvoicePdf({
        invoiceId,
        invoiceNumber: invoice.invoiceNumber,
        payerName: inv2.payerName ?? 'Student',
        payerEmail: inv2.payerEmail,
        amount: invoice.total ?? 0,
        currency: 'ILS',
        conservatoriumId: invoice.conservatoriumId ?? '',
        packageTitle: inv2.packageTitle,
        transactionId,
        paidAt: now,
      });
      if (pdfUrl) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await db.payments.update(invoiceId, { pdfUrl } as any);
        console.log(`[Cardcom Webhook] Invoice PDF URL generated: ${pdfUrl}`);
      } else {
        console.log(`[Cardcom Webhook] PDF generation disabled via feature flag`);
      }
    } catch (pdfError) {
      console.error('[Cardcom Webhook] PDF generation failed:', pdfError);
      // Non-fatal: payment is already marked as PAID
    }

  } catch (err) {
    console.error('[Cardcom Webhook] Error processing payment:', err);
    return NextResponse.json(
      { error: 'Internal processing error' },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true, status: 'payment_processed' });
}

// Cardcom may ping to verify the endpoint is alive
export async function GET() {
  return NextResponse.json({ status: 'ok', handler: 'cardcom-webhook' }, {
    headers: { 'Cache-Control': 'no-store' },
  });
}
