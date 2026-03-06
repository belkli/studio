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
    lowProfileCode,
    ResponseCode,
    InternalDealNumber,
    ReturnValue,
    CardSuffix,
    CardType,
    NumOfPayments,
    FirstPaymentTotal,
    PeriodicalPaymentTotal,
    Token: cardToken,
    TokenExpiry: cardTokenExpiry,
    ApprovalNumber,
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
        } as any);
      }
    } catch (err) {
      console.error('[Cardcom Webhook] Failed to update invoice on failure:', err);
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
      installments: installmentCount > 1 ? {
        count: installmentCount,
        monthlyAmount: parseFloat(PeriodicalPaymentTotal || '0'),
        paidInstallments: 1,
        nextPaymentDate: undefined,
      } : undefined,
      updatedAt: now,
    } as any);

    console.log(
      `[Cardcom Webhook] Invoice ${invoiceId} marked as PAID. ` +
      `Transaction: ${transactionId}, Card: *${CardSuffix || '****'} (${CardType || 'unknown'}), ` +
      `Approval: ${ApprovalNumber || 'N/A'}, Installments: ${installmentCount}`
    );

    // TODO: When notification dispatcher is wired with Twilio credentials,
    // send payment confirmation to payer:
    // await dispatchNotification({
    //   userId: invoice.payerId,
    //   type: 'PAYMENT_CONFIRMATION',
    //   title: 'Payment Received',
    //   titleHe: 'התשלום התקבל',
    //   body: `Payment of ${invoice.total} ILS received for invoice ${invoice.invoiceNumber}.`,
    //   bodyHe: `התשלום בסך ${invoice.total} ש"ח התקבל עבור חשבונית ${invoice.invoiceNumber}.`,
    //   priority: 'NORMAL',
    // });

    // TODO: Generate invoice PDF and update pdfUrl
    // const pdfUrl = await generateInvoicePdf(invoice);
    // await db.payments.update(invoiceId, { pdfUrl } as any);

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
  return NextResponse.json({ status: 'ok', handler: 'cardcom-webhook' });
}
