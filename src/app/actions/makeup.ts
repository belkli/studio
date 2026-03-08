'use server';
import { withAuth } from '@/lib/auth-utils';
import { z } from 'zod';

const ExtendMakeupSchema = z.object({
  creditId: z.string().min(1),
  newExpiresAt: z.string().datetime(),
});

export const extendMakeupWindowAction = withAuth(
  ExtendMakeupSchema,
  async (data) => {
    // In production: await db.updateMakeupCreditExpiry(data.creditId, data.newExpiresAt);
    console.log('[extendMakeupWindowAction] creditId:', data.creditId, 'newExpiresAt:', data.newExpiresAt);
    return { success: true };
  }
);
