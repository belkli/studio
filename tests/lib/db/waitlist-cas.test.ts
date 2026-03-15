/**
 * Unit tests for atomic compare-and-swap waitlist offer acceptance (BLOCKING-SEC-02).
 *
 * Verifies:
 *  - Normal acceptance transitions OFFERED -> ACCEPTED and sets offerAcceptedAt
 *  - Second concurrent accept on the same entry receives CONFLICT (slot already taken)
 *  - Acceptance of an expired offer returns OFFER_EXPIRED and sets status EXPIRED
 *  - Acceptance when entry is not in OFFERED state returns CONFLICT
 *  - Acceptance of a non-existent entry returns NOT_FOUND
 *  - WaitlistStatus enum contains all required values
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
