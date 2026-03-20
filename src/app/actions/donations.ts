'use server';

/**
 * @fileoverview Server Actions for public donation payment flow.
 * These actions are intentionally NOT wrapped in `withAuth()` — donors
 * are anonymous public visitors and do not need to be logged in.
 *
 * S7-T6-9: Donation Module — /donate page + payment flow
 */

import { z } from 'zod';
import { getDb } from '@/lib/db';
import { logAccess } from '@/lib/compliance-log';
import { createCardcomPaymentPage } from '@/lib/payments/cardcom';

// ── Input schema ───────────────────────────────────────────────────────────

const CreateDonationSchema = z.object({
  conservatoriumId: z.string().min(1),
  donorName: z.string().min(1),
  donorEmail: z.string().email(),
  donorIdNumber: z.string().optional(),
  anonymous: z.boolean().default(false),
  amount: z.number().min(10).max(1_000_000),
  recurringFrequency: z.enum(['MONTHLY', 'QUARTERLY', 'ANNUAL']).optional(),
});

export type CreateDonationInput = z.infer<typeof CreateDonationSchema>;

// ── Server Action ──────────────────────────────────────────────────────────

/**
 * Creates a Donation record with status PENDING, then redirects to Cardcom.
 * If Cardcom is not configured, returns a mock success URL.
 */
export async function createDonationAction(
  input: CreateDonationInput
): Promise<{ donationId: string; paymentUrl: string } | { error: string }> {
  // 1. Validate
  const parsed = CreateDonationSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues.map(i => i.message).join(', ') };
  }
  const data = parsed.data;

  // 2. Generate donation ID
  const donationId = `don-${crypto.randomUUID()}`;

  // 3. Create donation record in DB (graceful fallback if method not available)
  try {
    const db = await getDb();
    const donation = {
      id: donationId,
      conservatoriumId: data.conservatoriumId,
      donorName: data.donorName,
      donorEmail: data.donorEmail,
      donorIdNumber: data.donorIdNumber,
      anonymous: data.anonymous,
      amount: data.amount,
      status: 'PENDING' as const,
      recurringFrequency: data.recurringFrequency,
      createdAt: new Date().toISOString(),
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const donations = (db as any).donations;
    if (donations?.create) {
      await donations.create(donation);
    }
  } catch (err) {
    console.warn('[Donation] DB write skipped:', err);
  }

  // 4. Create Cardcom payment page (falls back to mock if not configured)
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  try {
    const { url } = await createCardcomPaymentPage({
      invoiceId: donationId,
      amount: data.amount,
      currency: 'ILS',
      description: `Donation to conservatorium ${data.conservatoriumId}`,
      customerName: data.donorName,
      customerEmail: data.donorEmail,
      customerPhone: '', // not collected for donations
      successUrl: `${baseUrl}/donate/success?donationId=${donationId}`,
      failureUrl: `${baseUrl}/donate?error=payment_failed`,
      webhookUrl: `${baseUrl}/api/cardcom-webhook`,
      language: 'he',
    });

    // If Cardcom returned an empty URL (error), use mock fallback
    const paymentUrl = url || `/donate/success?donationId=${donationId}`;

    // 5. Compliance log
    await logAccess({
      userId: 'anonymous',
      conservatoriumId: data.conservatoriumId,
      resourceType: 'donation',
      resourceId: donationId,
      action: 'PII_READ',
      reason: 'donation_initiated',
    });

    return { donationId, paymentUrl };
  } catch {
    // Payment gateway unavailable — return mock success URL
    return {
      donationId,
      paymentUrl: `/donate/success?donationId=${donationId}`,
    };
  }
}
