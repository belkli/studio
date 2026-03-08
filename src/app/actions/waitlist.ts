'use server';
import { withAuth } from '@/lib/auth-utils';
import { getDb } from '@/lib/db';
import { z } from 'zod';

const OfferSlotSchema = z.object({
  entryId: z.string().min(1),
  slotId: z.string().min(1),
});

export const offerSlotToWaitlistedAction = withAuth(
  OfferSlotSchema,
  async (data) => {
    const offerExpiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
    try {
      const db = await getDb();
      await db.waitlist.update(data.entryId, {
        status: 'OFFERED',
        offeredSlotId: data.slotId,
        offerExpiresAt,
      });
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Failed to offer slot' };
    }
    return { success: true, offerExpiresAt };
  }
);

const AcceptOfferSchema = z.object({ entryId: z.string().min(1) });

export const acceptWaitlistOfferAction = withAuth(
  AcceptOfferSchema,
  async (data) => {
    try {
      const db = await getDb();
      await db.waitlist.update(data.entryId, { status: 'ACCEPTED' });
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Failed to accept offer' };
    }
    return { success: true, entryId: data.entryId };
  }
);

const DeclineOfferSchema = z.object({ entryId: z.string().min(1) });

export const declineWaitlistOfferAction = withAuth(
  DeclineOfferSchema,
  async (data) => {
    try {
      const db = await getDb();
      await db.waitlist.update(data.entryId, { status: 'DECLINED' });
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Failed to decline offer' };
    }
    return { success: true, entryId: data.entryId };
  }
);
