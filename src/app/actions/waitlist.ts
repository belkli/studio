'use server';
import { withAuth } from '@/lib/auth-utils';
import { z } from 'zod';

const OfferSlotSchema = z.object({
  entryId: z.string().min(1),
  slotId: z.string().min(1),
});

export const offerSlotToWaitlistedAction = withAuth(
  OfferSlotSchema,
  async (_data) => {
    const offerExpiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
    // In production: await db.offerWaitlistSlot(_data.entryId, _data.slotId, offerExpiresAt);
    return { success: true, offerExpiresAt };
  }
);

const AcceptOfferSchema = z.object({ entryId: z.string().min(1) });

export const acceptWaitlistOfferAction = withAuth(
  AcceptOfferSchema,
  async (data) => {
    // In production: fetch entry, check status + expiry, update to ACCEPTED
    return { success: true, entryId: data.entryId };
  }
);

const DeclineOfferSchema = z.object({ entryId: z.string().min(1) });

export const declineWaitlistOfferAction = withAuth(
  DeclineOfferSchema,
  async (data) => {
    // In production: update entry status to DECLINED
    return { success: true, entryId: data.entryId };
  }
);
