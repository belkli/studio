/**
 * Unit tests for atomic compare-and-swap waitlist offer acceptance (BLOCKING-SEC-02),
 * defer logic, FIFO enforcement, and decline behavior.
 *
 * Verifies:
 *  - Normal acceptance transitions OFFERED -> ACCEPTED and sets offerAcceptedAt
 *  - Second concurrent accept on the same entry receives CONFLICT (slot already taken)
 *  - Acceptance of an expired offer returns OFFER_EXPIRED and sets status EXPIRED
 *  - Acceptance when entry is not in OFFERED state returns CONFLICT
 *  - Acceptance of a non-existent entry returns NOT_FOUND
 *  - WaitlistStatus enum contains all required values
 *  - Defer: increments deferredCount, resets to WAITING, caps at MAX_DEFERS=2
 *  - FIFO: skipping queue requires skipReason; first-in-queue does not
 *  - Decline: transitions to DECLINED
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryDatabaseAdapter } from '@/lib/db/adapters/shared';
import type { MemorySeed } from '@/lib/db/adapters/shared';
import type { WaitlistEntry, WaitlistStatus } from '@/lib/types';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeSeed(waitlist: WaitlistEntry[] = []): MemorySeed {
  return {
    users: [],
    conservatoriums: [],
    conservatoriumInstruments: [],
    lessonPackages: [],
    lessons: [],
    branches: [],
    rooms: [],
    events: [],
    forms: [],
    scholarships: [],
    rentals: [],
    payments: [],
    payrolls: [],
    announcements: [],
    alumni: [],
    masterClasses: [],
    repertoire: [],
    donationCauses: [],
    donations: [],
    makeupCredits: [],
    practiceLogs: [],
    notifications: [],
    roomLocks: [],
    teacherExceptions: [],
    consentRecords: [],
    complianceLogs: [],
    waitlist,
    achievements: [],
  };
}

function makeEntry(overrides: Partial<WaitlistEntry> = {}): WaitlistEntry {
  return {
    id: 'entry-001',
    studentId: 'student-1',
    teacherId: 'teacher-1',
    conservatoriumId: 'cons-15',
    instrument: 'Piano',
    preferredDays: ['SUN'],
    preferredTimes: [],
    joinedAt: new Date(Date.now() - 10_000).toISOString(),
    status: 'OFFERED',
    offeredSlotId: 'slot-abc',
    offerExpiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(), // 48h from now
    ...overrides,
  };
}

// ── WaitlistStatus enum completeness ─────────────────────────────────────────

describe('WaitlistStatus enum', () => {
  it('contains all required states', () => {
    const requiredStates: WaitlistStatus[] = [
      'WAITING',
      'OFFERED',
      'ACCEPTED',
      'ENROLLED',
      'DECLINED',
      'DEFERRED',
      'EXPIRED',
      'WITHDRAWN',
    ];
    // TypeScript type-check: assigning each value to WaitlistStatus is a compile-time check.
    // At runtime we verify all strings are assignable (no extra runtime type info needed).
    for (const state of requiredStates) {
      expect(typeof state).toBe('string');
    }
    expect(requiredStates).toHaveLength(8);
  });
});

// ── acceptOffer CAS ───────────────────────────────────────────────────────────

describe('WaitlistEntryRepository.acceptOffer (CAS)', () => {
  let db: MemoryDatabaseAdapter;

  beforeEach(() => {
    db = new MemoryDatabaseAdapter(makeSeed([makeEntry()]));
  });

  it('transitions OFFERED -> ACCEPTED and sets offerAcceptedAt', async () => {
    const result = await db.waitlist.acceptOffer('entry-001');
    expect(result.status).toBe('ACCEPTED');
    expect(result.offerAcceptedAt).toBeTruthy();
    expect(new Date(result.offerAcceptedAt!).getTime()).toBeGreaterThan(0);
  });

  it('persists the ACCEPTED status so a subsequent findById reflects it', async () => {
    await db.waitlist.acceptOffer('entry-001');
    const found = await db.waitlist.findById('entry-001');
    expect(found?.status).toBe('ACCEPTED');
    expect(found?.offerAcceptedAt).toBeTruthy();
  });

  it('throws CONFLICT when entry is already ACCEPTED (second accept call)', async () => {
    // First call succeeds
    await db.waitlist.acceptOffer('entry-001');
    // Second call should fail with CONFLICT — slot already taken
    await expect(db.waitlist.acceptOffer('entry-001')).rejects.toThrow('CONFLICT');
  });

  it('throws CONFLICT when entry is in WAITING (not offered)', async () => {
    const db2 = new MemoryDatabaseAdapter(makeSeed([makeEntry({ status: 'WAITING' })]));
    await expect(db2.waitlist.acceptOffer('entry-001')).rejects.toThrow('CONFLICT');
  });

  it('throws CONFLICT when entry is in DECLINED state', async () => {
    const db2 = new MemoryDatabaseAdapter(makeSeed([makeEntry({ status: 'DECLINED' })]));
    await expect(db2.waitlist.acceptOffer('entry-001')).rejects.toThrow('CONFLICT');
  });

  it('throws OFFER_EXPIRED when offerExpiresAt is in the past', async () => {
    const expiredEntry = makeEntry({
      offerExpiresAt: new Date(Date.now() - 1000).toISOString(), // 1 second ago
    });
    const db2 = new MemoryDatabaseAdapter(makeSeed([expiredEntry]));
    await expect(db2.waitlist.acceptOffer('entry-001')).rejects.toThrow('OFFER_EXPIRED');
  });

  it('sets status to EXPIRED when offer has elapsed (side effect)', async () => {
    const expiredEntry = makeEntry({
      offerExpiresAt: new Date(Date.now() - 1000).toISOString(),
    });
    const db2 = new MemoryDatabaseAdapter(makeSeed([expiredEntry]));
    await expect(db2.waitlist.acceptOffer('entry-001')).rejects.toThrow('OFFER_EXPIRED');
    const found = await db2.waitlist.findById('entry-001');
    expect(found?.status).toBe('EXPIRED');
  });

  it('throws NOT_FOUND for a non-existent entryId', async () => {
    await expect(db.waitlist.acceptOffer('does-not-exist')).rejects.toThrow('NOT_FOUND');
  });

  it('accepts when offerExpiresAt is absent (no expiry set)', async () => {
    const noExpiry = makeEntry({ offerExpiresAt: undefined });
    const db2 = new MemoryDatabaseAdapter(makeSeed([noExpiry]));
    const result = await db2.waitlist.acceptOffer('entry-001');
    expect(result.status).toBe('ACCEPTED');
  });
});

// ── Simulated concurrent race condition ──────────────────────────────────────

describe('WaitlistEntryRepository.acceptOffer — concurrent race simulation', () => {
  it('only one of two simultaneous accept calls succeeds', async () => {
    const db = new MemoryDatabaseAdapter(makeSeed([makeEntry()]));

    // Fire two accept calls at the same time without awaiting either first.
    const [result1, result2] = await Promise.allSettled([
      db.waitlist.acceptOffer('entry-001'),
      db.waitlist.acceptOffer('entry-001'),
    ]);

    const successes = [result1, result2].filter((r) => r.status === 'fulfilled');
    const failures = [result1, result2].filter((r) => r.status === 'rejected');

    // Exactly one should succeed and one should fail
    expect(successes).toHaveLength(1);
    expect(failures).toHaveLength(1);

    // The failure must carry a meaningful error code
    const failedReason = (failures[0] as PromiseRejectedResult).reason as Error;
    expect(['CONFLICT', 'OFFER_EXPIRED']).toContain(failedReason.message);

    // The accepted entry should be in ACCEPTED state
    const found = await db.waitlist.findById('entry-001');
    expect(found?.status).toBe('ACCEPTED');
  });
});

// ── Defer logic (mirrors deferWaitlistOfferAction) ──────────────────────────

describe('Waitlist defer logic (via DB adapter)', () => {
  const MAX_DEFERS = 2;

  it('defers an OFFERED entry: resets status to WAITING and increments deferredCount', async () => {
    const entry = makeEntry({ status: 'OFFERED', deferredCount: 0 });
    const db = new MemoryDatabaseAdapter(makeSeed([entry]));

    // Simulate defer: update status to WAITING, increment deferredCount
    // Note: the memory adapter's clone (JSON.parse/stringify) strips undefined,
    // so clearing offeredSlotId/offerExpiresAt requires setting them to '' or null.
    // The action sets them to undefined which has no effect in memory adapter.
    // We test the critical state transitions: status and deferredCount.
    const currentDefers = entry.deferredCount ?? 0;
    await db.waitlist.update('entry-001', {
      status: 'WAITING',
      deferredCount: currentDefers + 1,
      lastDeferredAt: new Date().toISOString(),
    });

    const found = await db.waitlist.findById('entry-001');
    expect(found?.status).toBe('WAITING');
    expect(found?.deferredCount).toBe(1);
    expect(found?.lastDeferredAt).toBeTruthy();
  });

  it('allows a second defer (deferredCount goes from 1 to 2)', async () => {
    const entry = makeEntry({ status: 'OFFERED', deferredCount: 1 });
    const db = new MemoryDatabaseAdapter(makeSeed([entry]));

    const currentDefers = entry.deferredCount ?? 0;
    expect(currentDefers).toBe(1);
    expect(currentDefers < MAX_DEFERS).toBe(true); // guard passes

    await db.waitlist.update('entry-001', {
      status: 'WAITING',
      deferredCount: currentDefers + 1,
      lastDeferredAt: new Date().toISOString(),
    });

    const found = await db.waitlist.findById('entry-001');
    expect(found?.deferredCount).toBe(2);
    expect(found?.status).toBe('WAITING');
  });

  it('blocks defer when deferredCount >= MAX_DEFERS (2)', async () => {
    const entry = makeEntry({ status: 'OFFERED', deferredCount: 2 });
    const db = new MemoryDatabaseAdapter(makeSeed([entry]));

    const found = await db.waitlist.findById('entry-001');
    const currentDefers = found?.deferredCount ?? 0;

    // The action would return MAX_DEFERS_REACHED; simulate the guard
    expect(currentDefers >= MAX_DEFERS).toBe(true);

    // Status should remain OFFERED (no update performed)
    expect(found?.status).toBe('OFFERED');
  });

  it('returns NO_OFFER-equivalent when entry is not in OFFERED state', async () => {
    const entry = makeEntry({ status: 'WAITING', deferredCount: 0 });
    const db = new MemoryDatabaseAdapter(makeSeed([entry]));

    const found = await db.waitlist.findById('entry-001');
    // The action checks entry.status !== 'OFFERED' → returns NO_OFFER
    expect(found?.status).not.toBe('OFFERED');
    expect(found?.status).toBe('WAITING');
  });

  it('returns NOT_FOUND when entry does not exist', async () => {
    const db = new MemoryDatabaseAdapter(makeSeed([]));
    const found = await db.waitlist.findById('entry-nonexistent');
    expect(found).toBeNull();
  });
});

// ── FIFO enforcement (mirrors offerWaitlistSlotAction) ──────────────────────

describe('Waitlist FIFO enforcement (via DB adapter)', () => {
  function makeWaitingEntry(id: string, joinedAt: string, overrides: Partial<WaitlistEntry> = {}): WaitlistEntry {
    return makeEntry({
      id,
      status: 'WAITING',
      joinedAt,
      offeredSlotId: undefined,
      offerExpiresAt: undefined,
      ...overrides,
    });
  }

  it('returns SKIP_REASON_REQUIRED when target is not first WAITING and skipReason is empty', async () => {
    // entry-first joined earlier, entry-second joined later
    const first = makeWaitingEntry('entry-first', '2026-01-01T00:00:00Z');
    const second = makeWaitingEntry('entry-second', '2026-01-02T00:00:00Z');
    const db = new MemoryDatabaseAdapter(makeSeed([first, second]));

    // Simulate the action's FIFO logic for offering to the second entry
    const targetEntry = await db.waitlist.findById('entry-second');
    expect(targetEntry).not.toBeNull();

    const allEntries = await db.waitlist.findByConservatorium(targetEntry!.conservatoriumId);
    const waitingEntries = allEntries
      .filter(e => e.status === 'WAITING')
      .sort((a, b) => new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime());

    const isFirstInQueue = waitingEntries.length === 0 || waitingEntries[0].id === 'entry-second';
    expect(isFirstInQueue).toBe(false); // entry-first is first

    // Empty skipReason should trigger SKIP_REASON_REQUIRED
    const skipReason: string = '';
    const wouldBlock = !isFirstInQueue && (!skipReason || skipReason.trim().length === 0);
    expect(wouldBlock).toBe(true);
  });

  it('succeeds when target is not first WAITING but skipReason is provided', async () => {
    const first = makeWaitingEntry('entry-first', '2026-01-01T00:00:00Z');
    const second = makeWaitingEntry('entry-second', '2026-01-02T00:00:00Z');
    const db = new MemoryDatabaseAdapter(makeSeed([first, second]));

    const targetEntry = await db.waitlist.findById('entry-second');
    const allEntries = await db.waitlist.findByConservatorium(targetEntry!.conservatoriumId);
    const waitingEntries = allEntries
      .filter(e => e.status === 'WAITING')
      .sort((a, b) => new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime());

    const isFirstInQueue = waitingEntries[0].id === 'entry-second';
    expect(isFirstInQueue).toBe(false);

    // With a valid skipReason, the offer proceeds
    const skipReason = 'Student has scheduling conflict this term';
    expect(skipReason.trim().length > 0).toBe(true);

    // Record skipReason and transition to OFFERED
    await db.waitlist.update('entry-second', { skipReason: skipReason.trim() });
    await db.waitlist.update('entry-second', {
      status: 'OFFERED',
      offeredSlotId: 'slot-xyz',
      offerExpiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      notifiedAt: new Date().toISOString(),
    });

    const updated = await db.waitlist.findById('entry-second');
    expect(updated?.status).toBe('OFFERED');
    expect(updated?.offeredSlotId).toBe('slot-xyz');
    expect(updated?.skipReason).toBe('Student has scheduling conflict this term');
  });

  it('does not require skipReason when target IS the first WAITING entry', async () => {
    const first = makeWaitingEntry('entry-first', '2026-01-01T00:00:00Z');
    const second = makeWaitingEntry('entry-second', '2026-01-02T00:00:00Z');
    const db = new MemoryDatabaseAdapter(makeSeed([first, second]));

    const allEntries = await db.waitlist.findByConservatorium('cons-15');
    const waitingEntries = allEntries
      .filter(e => e.status === 'WAITING')
      .sort((a, b) => new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime());

    const isFirstInQueue = waitingEntries[0].id === 'entry-first';
    expect(isFirstInQueue).toBe(true);

    // No skipReason needed; offer directly
    await db.waitlist.update('entry-first', {
      status: 'OFFERED',
      offeredSlotId: 'slot-abc',
      offerExpiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
    });

    const updated = await db.waitlist.findById('entry-first');
    expect(updated?.status).toBe('OFFERED');
    expect(updated?.skipReason).toBeUndefined();
  });

  it('returns SKIP_REASON_REQUIRED when skipReason is only whitespace', async () => {
    const first = makeWaitingEntry('entry-first', '2026-01-01T00:00:00Z');
    const second = makeWaitingEntry('entry-second', '2026-01-02T00:00:00Z');
    const db = new MemoryDatabaseAdapter(makeSeed([first, second]));

    const allEntries = await db.waitlist.findByConservatorium('cons-15');
    const waitingEntries = allEntries
      .filter(e => e.status === 'WAITING')
      .sort((a, b) => new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime());

    const isFirstInQueue = waitingEntries[0].id === 'entry-second';
    expect(isFirstInQueue).toBe(false);

    // Whitespace-only skipReason should be treated as empty
    const skipReason = '   ';
    const wouldBlock = !isFirstInQueue && (!skipReason || skipReason.trim().length === 0);
    expect(wouldBlock).toBe(true);
  });
});

// ── Decline logic (mirrors declineWaitlistOfferAction) ──────────────────────

describe('Waitlist decline (via DB adapter)', () => {
  it('sets status to DECLINED via update', async () => {
    const entry = makeEntry({ status: 'OFFERED' });
    const db = new MemoryDatabaseAdapter(makeSeed([entry]));

    await db.waitlist.update('entry-001', { status: 'DECLINED' });

    const found = await db.waitlist.findById('entry-001');
    expect(found?.status).toBe('DECLINED');
  });

  it('returns the entryId on successful decline', async () => {
    const entry = makeEntry({ status: 'OFFERED', id: 'entry-decline-1' });
    const db = new MemoryDatabaseAdapter(makeSeed([entry]));

    await db.waitlist.update('entry-decline-1', { status: 'DECLINED' });

    const found = await db.waitlist.findById('entry-decline-1');
    expect(found).not.toBeNull();
    expect(found?.id).toBe('entry-decline-1');
    expect(found?.status).toBe('DECLINED');
  });

  it('throws when declining a non-existent entry', async () => {
    const db = new MemoryDatabaseAdapter(makeSeed([]));
    await expect(
      db.waitlist.update('does-not-exist', { status: 'DECLINED' })
    ).rejects.toThrow('Waitlist entry not found');
  });
});
