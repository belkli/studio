import type { Notification } from '@/lib/types';

export interface PaymentNotificationData {
  invoiceId: string;
  payerId: string;
  payerName: string;
  payerEmail?: string;
  teacherId?: string;
  teacherName?: string;
  conservatoriumId: string;
  amount: number;
  currency: string;
  invoiceNumber?: string;
  packageTitle?: string;
  transactionId?: string;
}

function makeNotification(
  id: string,
  userId: string,
  conservatoriumId: string,
  title: string,
  message: string,
  link: string,
): Notification {
  return {
    id,
    userId,
    conservatoriumId,
    title,
    message,
    timestamp: new Date().toISOString(),
    link,
    read: false,
  };
}

/**
 * Creates in-app notification objects for post-payment events.
 * Returns notifications array for the caller to persist.
 * Does NOT call DB directly — the webhook caller handles persistence.
 */
export function buildPaymentNotifications(data: PaymentNotificationData): Notification[] {
  const notifications: Notification[] = [];
  const now = Date.now();

  // 1. Payment confirmation for payer
  notifications.push(makeNotification(
    `notif-pay-${data.invoiceId}-${now}`,
    data.payerId,
    data.conservatoriumId,
    'Payment received',
    `Payment of ${data.amount} ${data.currency} received for ${data.packageTitle ?? 'your subscription'}.`,
    '/dashboard/billing',
  ));

  // 2. New student enrolled — for teacher
  if (data.teacherId) {
    notifications.push(makeNotification(
      `notif-enroll-${data.invoiceId}-${now}`,
      data.teacherId,
      data.conservatoriumId,
      'New student enrolled',
      `${data.payerName} has completed payment and is now enrolled.`,
      '/dashboard/teacher',
    ));
  }

  return notifications;
}

export async function sendPaymentConfirmationEmail(data: PaymentNotificationData): Promise<void> {
  const apiKey = process.env.SENDGRID_API_KEY;
  const fromEmail = process.env.SENDGRID_FROM_EMAIL ?? 'noreply@harmonia.co.il';

  if (!apiKey) {
    console.warn('[Email] SENDGRID_API_KEY not configured — skipping payment confirmation email');
    return;
  }

  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [{
        to: [{ email: data.payerEmail }],
        dynamic_template_data: {
          payer_name: data.payerName,
          amount: data.amount,
          currency: data.currency,
          invoice_number: data.invoiceNumber,
          package_title: data.packageTitle,
          transaction_id: data.transactionId,
        },
      }],
      from: { email: fromEmail, name: 'Harmonia' },
      template_id: process.env.SENDGRID_PAYMENT_TEMPLATE_ID ?? undefined,
      subject: `Payment Confirmation - ${data.amount} ${data.currency}`,
      content: [{
        type: 'text/plain',
        value: `Dear ${data.payerName},\n\nYour payment of ${data.amount} ${data.currency} has been received.\nInvoice: ${data.invoiceNumber ?? 'N/A'}\n\nThank you,\nHarmonia`,
      }],
    }),
  });

  if (!response.ok) {
    console.error('[Email] SendGrid error:', response.status, await response.text());
  }
}
