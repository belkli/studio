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

/**
 * Offer a waitlist slot with FIFO enforcement (SEC-WAIT-09).
 *
 * When the target entry is NOT the first WAITING entry (by joinedAt),
 * a non-empty skipReason is required. If skipReason is missing the action
 * returns { success: false, code: 'SKIP_REASON_REQUIRED' }.
 */
const OfferWaitlistSlotSchema = z.object({
  entryId: z.string().min(1),
  slotId: z.string().min(1),
  offerExpiresAt: z.string().min(1),
  skipReason: z.string().optional(),
});

export const offerWaitlistSlotAction = withAuth(
  OfferWaitlistSlotSchema,
  async (data) => {
    try {
      const db = await getDb();
      const entry = await db.waitlist.findById(data.entryId);
      if (!entry) {
        return { success: false, error: 'Waitlist entry not found.', code: 'NOT_FOUND' };
      }

      // FIFO check: find the earliest WAITING entry for the same conservatorium
      const allEntries = await db.waitlist.findByConservatorium(entry.conservatoriumId);
      const waitingEntries = allEntries
        .filter(e => e.status === 'WAITING')
        .sort((a, b) => new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime());

      const isFirstInQueue = waitingEntries.length === 0 || waitingEntries[0].id === data.entryId;

      if (!isFirstInQueue) {
        if (!data.skipReason || data.skipReason.trim().length === 0) {
          return {
            success: false,
            error: 'A reason is required when skipping FIFO order.',
            code: 'SKIP_REASON_REQUIRED',
          };
        }
        // Record skipReason on the entry
        await db.waitlist.update(data.entryId, { skipReason: data.skipReason.trim() });
      }

      await db.waitlist.update(data.entryId, {
        status: 'OFFERED',
        offeredSlotId: data.slotId,
        offerExpiresAt: data.offerExpiresAt,
        notifiedAt: new Date().toISOString(),
      });
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Failed to offer slot' };
    }
    return { success: true, offerExpiresAt: data.offerExpiresAt };
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

const DeferOfferSchema = z.object({ entryId: z.string().min(1) });

/** Maximum number of times a parent/student may defer a waitlist offer. */
const MAX_DEFERS = 2;

/**
 * Defer a waitlist offer. The entry returns to WAITING status and the student
 * keeps their queue position. Maximum of 2 defers per entry.
 */
export const deferWaitlistOfferAction = withAuth(
  DeferOfferSchema,
  async (data) => {
    try {
      const db = await getDb();
      const entry = await db.waitlist.findById(data.entryId);
      if (!entry) {
        return { success: false, error: 'Waitlist entry not found.', code: 'NOT_FOUND' };
      }
      if (entry.status !== 'OFFERED') {
        return { success: false, error: 'No active offer to defer.', code: 'NO_OFFER' };
      }
      const currentDefers = entry.deferredCount ?? 0;
      if (currentDefers >= MAX_DEFERS) {
        return { success: false, error: 'Maximum defers reached.', code: 'MAX_DEFERS_REACHED' };
      }
      await db.waitlist.update(data.entryId, {
        status: 'WAITING',
        deferredCount: currentDefers + 1,
        lastDeferredAt: new Date().toISOString(),
        offeredSlotId: undefined,
        offeredSlotTime: undefined,
        offerExpiresAt: undefined,
      });
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Failed to defer offer' };
    }
    return { success: true, entryId: data.entryId };
  }
);
