'use server';

import { randomInt } from 'crypto';
import { z } from 'zod';
import { withAuth } from '@/lib/auth-utils';

// In production: store OTPs in Redis/DB with TTL. For demo: use a simple in-memory map.
// The key is the rental token, value is { code, expiresAt }
const otpStore = new Map<string, { code: string; expiresAt: number }>();

const SendOtpSchema = z.object({
  rentalToken: z.string().min(1),
  phoneHint: z.string().optional(), // last 4 digits of phone for confirmation
});

const VerifyOtpSchema = z.object({
  rentalToken: z.string().min(1),
  code: z.string().min(4).max(6),
});

/** Generates and "sends" a 6-digit OTP for the rental signing flow. */
export const sendRentalOtpAction = withAuth(
  SendOtpSchema,
  async (data) => {
    // Generate 6-digit OTP
    const code = String(randomInt(100000, 1000000));
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
    otpStore.set(data.rentalToken, { code, expiresAt });

    // In production: await sendSms(phone, `קוד האימות שלך: ${code}`);
    console.log(`[RentalOTP] OTP for token ${data.rentalToken}: ${code} (expires in 10 min)`);

    return { success: true as const, message: 'OTP sent' };
  }
);

/** Verifies the OTP entered by the user. */
export const verifyRentalOtpAction = withAuth(
  VerifyOtpSchema,
  async (data) => {
    const entry = otpStore.get(data.rentalToken);

    if (!entry) {
      return { success: false as const, error: 'OTP_NOT_FOUND' as const };
    }

    if (Date.now() > entry.expiresAt) {
      otpStore.delete(data.rentalToken);
      return { success: false as const, error: 'OTP_EXPIRED' as const };
    }

    if (data.code.trim() !== entry.code) {
      return { success: false as const, error: 'OTP_INVALID' as const };
    }

    // Clear OTP after successful verification (single-use)
    otpStore.delete(data.rentalToken);
    return { success: true as const };
  }
);
