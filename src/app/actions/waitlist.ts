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

/**
 * Accepts a waitlist offer using atomic compare-and-swap (BLOCKING-SEC-02).
 *
 * The underlying db.waitlist.acceptOffer() call guarantees that:
 *   - Only one concurrent caller can succeed for any given entryId.
 *   - If two requests race, the second receives CONFLICT.
 *   - If the offer has already expired, OFFER_EXPIRED is returned.
 *   - If the entry is not in OFFERED state (already accepted, declined, etc.),
 *     CONFLICT is returned with a clear "slot already taken" message.
 */
export const acceptWaitlistOfferAction = withAuth(
  AcceptOfferSchema,
  async (data) => {
    try {
      const db = await getDb();
      await db.waitlist.acceptOffer(data.entryId);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to accept offer';
      if (message === 'CONFLICT') {
        return {
          success: false,
          error: 'This slot has already been taken. Please check back for the next available slot.',
          code: 'CONFLICT',
        };
      }
      if (message === 'OFFER_EXPIRED') {
        return {
          success: false,
          error: 'This offer has expired. Please contact the conservatorium for further assistance.',
          code: 'OFFER_EXPIRED',
        };
      }
      if (message === 'NOT_FOUND') {
        return {
          success: false,
          error: 'Waitlist entry not found.',
          code: 'NOT_FOUND',
        };
      }
      return { success: false, error: message };
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
