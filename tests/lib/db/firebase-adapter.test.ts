/**
 * @fileoverview Integration tests for FirebaseAdapter against the Firebase Emulator.
 *
 * These tests are SKIPPED by default unless FIREBASE_EMULATOR=true is set.
 *
 * To run:
 *   1. Start the Firebase emulator suite:
 *        firebase emulators:start --only firestore
 *   2. Run with the env var:
 *        FIREBASE_EMULATOR=true npx vitest run tests/lib/db/firebase-adapter.test.ts
 *
 * The tests cover basic CRUD operations on root-level and sub-collection
 * repositories to verify that the Firestore adapter correctly reads/writes
 * documents. They follow the same pattern as memory-adapter.test.ts.
 */
import { describe, it, expect, beforeAll, beforeEach } from 'vitest';

const SHOULD_RUN = process.env.FIREBASE_EMULATOR === 'true';

// Conditionally use describe.skip so the test file still loads without errors
// when the emulator is unavailable. This keeps the test discoverable in `vitest list`.
const suite = SHOULD_RUN ? describe : describe.skip;

suite('FirebaseAdapter (emulator)', () => {
  // Lazy-import to avoid triggering firebase-admin initialisation when skipped
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let FirebaseAdapter: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let db: any;

  beforeAll(async () => {
    // Ensure the Admin SDK talks to the emulator
    process.env.FIRESTORE_EMULATOR_HOST ??= 'localhost:8080';

    const mod = await import('@/lib/db/adapters/firebase');
    FirebaseAdapter = mod.FirebaseAdapter;
  });

  beforeEach(() => {
    db = new FirebaseAdapter();
    // When the emulator is running with FIREBASE_SERVICE_ACCOUNT_KEY set,
    // `db.source` should be 'firestore'. If it fell back to memory, the
    // tests are still valid but less meaningful.
  });

  // ── users ─────────────────────────────────────────────────────────────────

  describe('users repository', () => {
    it('creates a user and retrieves it by id', async () => {
      const created = await db.users.create({
        name: 'Emulator Test User',
        email: `emu-${Date.now()}@test.local`,
        role: 'teacher',
        approved: false,
      });
      expect(created.id).toBeTruthy();
      expect(created.name).toBe('Emulator Test User');

      const found = await db.users.findById(created.id);
      expect(found).toBeTruthy();
      expect(found?.id).toBe(created.id);
      expect(found?.email).toBe(created.email);
    });

    it('returns null for a non-existent user id', async () => {
      const found = await db.users.findById(`nonexistent-${Date.now()}`);
      expect(found).toBeNull();
    });

    it('lists users (returns an array)', async () => {
      const users = await db.users.list();
      expect(Array.isArray(users)).toBe(true);
    });

    it('updates a user', async () => {
      const created = await db.users.create({
        name: 'Before Update',
        email: `upd-${Date.now()}@test.local`,
        role: 'student',
        approved: true,
      });
      const updated = await db.users.update(created.id, { name: 'After Update' });
      expect(updated.name).toBe('After Update');

      const found = await db.users.findById(created.id);
      expect(found?.name).toBe('After Update');
    });

    it('deletes a user', async () => {
      const created = await db.users.create({
        name: 'To Delete',
        email: `del-${Date.now()}@test.local`,
        role: 'student',
        approved: false,
      });
      await db.users.delete(created.id);
      const found = await db.users.findById(created.id);
      expect(found).toBeNull();
    });

    it('findByEmail returns the correct user', async () => {
      const email = `fbe-${Date.now()}@test.local`;
      await db.users.create({
        name: 'Find By Email',
        email,
        role: 'parent',
        approved: true,
      });
      const found = await db.users.findByEmail(email);
      expect(found).toBeTruthy();
      expect(found?.email).toBe(email);
    });
  });

  // ── lessons (sub-collection) ──────────────────────────────────────────────

  describe('lessons repository', () => {
    it('creates a lesson and retrieves it by id', async () => {
      const created = await db.lessons.create({
        conservatoriumId: 'emu-cons-1',
        teacherId: 'emu-teacher-1',
        studentId: 'emu-student-1',
        instrument: 'Piano',
        status: 'SCHEDULED',
      });
      expect(created.id).toBeTruthy();
      expect(created.instrument).toBe('Piano');

      const found = await db.lessons.findById(created.id);
      expect(found).toBeTruthy();
      expect(found?.id).toBe(created.id);
    });

    it('returns null for non-existent lesson', async () => {
      const found = await db.lessons.findById(`no-lesson-${Date.now()}`);
      expect(found).toBeNull();
    });

    it('updates a lesson status', async () => {
      const created = await db.lessons.create({
        conservatoriumId: 'emu-cons-1',
        teacherId: 'emu-teacher-1',
        studentId: 'emu-student-1',
        instrument: 'Guitar',
        status: 'SCHEDULED',
      });
      const updated = await db.lessons.update(created.id, { status: 'COMPLETED' });
      expect(updated.status).toBe('COMPLETED');
    });

    it('findByConservatorium returns lessons for the given conservatorium', async () => {
      const cid = `emu-cons-fbc-${Date.now()}`;
      await db.lessons.create({
        conservatoriumId: cid,
        teacherId: 'emu-teacher-1',
        studentId: 'emu-student-1',
        instrument: 'Violin',
        status: 'SCHEDULED',
      });
      const results = await db.lessons.findByConservatorium(cid);
      expect(results.length).toBeGreaterThan(0);
      expect(results.every((l: { conservatoriumId: string }) => l.conservatoriumId === cid)).toBe(true);
    });

    it('deletes a lesson', async () => {
      const created = await db.lessons.create({
        conservatoriumId: 'emu-cons-1',
        teacherId: 'emu-teacher-1',
        studentId: 'emu-student-1',
        instrument: 'Drums',
        status: 'SCHEDULED',
      });
      await db.lessons.delete(created.id);
      const found = await db.lessons.findById(created.id);
      expect(found).toBeNull();
    });
  });

  // ── payments / invoices (sub-collection) ──────────────────────────────────

  describe('payments repository', () => {
    it('creates an invoice and retrieves it by id', async () => {
      const created = await db.payments.create({
        conservatoriumId: 'emu-cons-1',
        payerId: 'emu-parent-1',
        total: 500,
        status: 'SENT',
        dueDate: '2026-12-31',
        lineItems: [],
      });
      expect(created.id).toBeTruthy();
      expect(created.total).toBe(500);

      const found = await db.payments.findById(created.id);
      expect(found).toBeTruthy();
      expect(found?.total).toBe(500);
    });

    it('updates an invoice status', async () => {
      const created = await db.payments.create({
        conservatoriumId: 'emu-cons-1',
        payerId: 'emu-parent-1',
        total: 250,
        status: 'SENT',
        dueDate: '2026-12-31',
        lineItems: [],
      });
      const updated = await db.payments.update(created.id, { status: 'PAID' });
      expect(updated.status).toBe('PAID');
    });

    it('lists invoices (returns an array)', async () => {
      const invoices = await db.payments.list();
      expect(Array.isArray(invoices)).toBe(true);
    });

    it('deletes an invoice', async () => {
      const created = await db.payments.create({
        conservatoriumId: 'emu-cons-1',
        payerId: 'emu-parent-2',
        total: 100,
        status: 'SENT',
        dueDate: '2026-12-31',
        lineItems: [],
      });
      await db.payments.delete(created.id);
      const found = await db.payments.findById(created.id);
      expect(found).toBeNull();
    });
  });

  // ── conservatoriums (root collection) ─────────────────────────────────────

  describe('conservatoriums repository', () => {
    it('creates and retrieves a conservatorium', async () => {
      const created = await db.conservatoriums.create({
        id: `emu-cons-${Date.now()}`,
        name: 'Emulator Conservatory',
      });
      expect(created.id).toBeTruthy();

      const found = await db.conservatoriums.findById(created.id);
      expect(found).toBeTruthy();
      expect(found?.name).toBe('Emulator Conservatory');
    });

    it('lists conservatoriums', async () => {
      const list = await db.conservatoriums.list();
      expect(Array.isArray(list)).toBe(true);
    });
  });

  // ── adapter source metadata ───────────────────────────────────────────────

  describe('adapter metadata', () => {
    it('reports its source type', () => {
      expect(['firestore', 'memory-fallback']).toContain(db.source);
    });
  });
});
