'use server';
import { withAuth } from '@/lib/auth-utils';
import { z } from 'zod';

// NOTE: DatabaseAdapter has no `waitlist` repository.
// All three actions return success stubs until the interface is extended.
// TODO: Add WaitlistEntryRepository to DatabaseAdapter and wire:
//   offerSlotToWaitlistedAction  → db.waitlist.update(entryId, { status: 'OFFERED', offeredSlotId, offerExpiresAt })
//   acceptWaitlistOfferAction    → db.waitlist.update(entryId, { status: 'ACCEPTED' })
//   declineWaitlistOfferAction   → db.waitlist.update(entryId, { status: 'DECLINED' })

const OfferSlotSchema = z.object({
  entryId: z.string().min(1),
  slotId: z.string().min(1),
});

export const offerSlotToWaitlistedAction = withAuth(
  OfferSlotSchema,
  async (_data) => {
    const offerExpiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
    return { success: true, offerExpiresAt };
  }
);

const AcceptOfferSchema = z.object({ entryId: z.string().min(1) });

export const acceptWaitlistOfferAction = withAuth(
  AcceptOfferSchema,
  async (data) => {
    return { success: true, entryId: data.entryId };
  }
);

const DeclineOfferSchema = z.object({ entryId: z.string().min(1) });

export const declineWaitlistOfferAction = withAuth(
  DeclineOfferSchema,
  async (data) => {
    return { success: true, entryId: data.entryId };
  }
);
