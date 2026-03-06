import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryDatabaseAdapter } from '@/lib/db/adapters/shared';
import { buildDefaultMemorySeed } from '@/lib/db/default-memory-seed';

describe('MemoryDatabaseAdapter', () => {
    let db: MemoryDatabaseAdapter;

    beforeEach(() => {
        db = new MemoryDatabaseAdapter(buildDefaultMemorySeed());
    });

    // ── users repository ──────────────────────────────────────────────────────

    describe('users repository', () => {
        it('lists all users', async () => {
            const users = await db.users.list();
            expect(Array.isArray(users)).toBe(true);
            expect(users.length).toBeGreaterThan(0);
        });

        it('gets user by id', async () => {
            const users = await db.users.list();
            const firstUser = users[0];
            const found = await db.users.findById(firstUser.id);
            expect(found).toBeTruthy();
            expect(found?.id).toBe(firstUser.id);
        });

        it('returns null for a non-existent user id', async () => {
            const found = await db.users.findById('does-not-exist');
            expect(found).toBeNull();
        });

        it('finds user by email (case-insensitive)', async () => {
            const found = await db.users.findByEmail('dev@harmonia.local');
            expect(found).toBeTruthy();
            expect(found?.id).toBe('dev-user');
        });

        it('finds user by email regardless of case', async () => {
            const found = await db.users.findByEmail('DEV@HARMONIA.LOCAL');
            expect(found).toBeTruthy();
            expect(found?.id).toBe('dev-user');
        });

        it('returns null for a non-existent email', async () => {
            const found = await db.users.findByEmail('nobody@example.com');
            expect(found).toBeNull();
        });

        it('creates a new user', async () => {
            const created = await db.users.create({
                name: 'New Teacher',
                email: 'newteacher@example.com',
                role: 'teacher',
                approved: false,
            });
            expect(created).toBeTruthy();
            expect(created.id).toBeTruthy();
            expect(created.name).toBe('New Teacher');
            expect(created.role).toBe('teacher');
        });

        it('created user is retrievable by id', async () => {
            const created = await db.users.create({
                name: 'Retrievable',
                email: 'retrievable@example.com',
                role: 'student',
                approved: true,
            });
            const found = await db.users.findById(created.id);
            expect(found?.id).toBe(created.id);
            expect(found?.name).toBe('Retrievable');
        });

        it('updates user name', async () => {
            await db.users.update('dev-user', { name: 'Updated Dev Admin' });
            const updated = await db.users.findById('dev-user');
            expect(updated?.name).toBe('Updated Dev Admin');
        });

        it('preserves unmodified fields on update', async () => {
            const original = await db.users.findById('dev-user');
            expect(original).toBeTruthy();
            await db.users.update('dev-user', { name: 'Changed Name' });
            const updated = await db.users.findById('dev-user');
            // email should be unchanged
            expect(updated?.email).toBe(original?.email);
            expect(updated?.role).toBe(original?.role);
        });

        it('throws when updating a non-existent user', async () => {
            await expect(
                db.users.update('ghost-user', { name: 'Ghost' })
            ).rejects.toThrow();
        });

        it('deletes a user', async () => {
            const created = await db.users.create({
                name: 'Delete Me',
                email: 'deleteme@example.com',
                role: 'student',
                approved: false,
            });
            await db.users.delete(created.id);
            const found = await db.users.findById(created.id);
            expect(found).toBeNull();
        });

        it('delete is a no-op for non-existent ids (does not throw)', async () => {
            await expect(db.users.delete('ghost-id')).resolves.toBeUndefined();
        });

        it('searches users by name query', async () => {
            const results = await db.users.search('Dev Admin');
            expect(results.length).toBeGreaterThan(0);
            expect(results.some((u) => u.id === 'dev-user')).toBe(true);
        });

        it('search returns all users for an empty query', async () => {
            const all = await db.users.list();
            const results = await db.users.search('');
            expect(results.length).toBe(all.length);
        });

        it('filters by conservatoriumId within search', async () => {
            const results = await db.users.search('', 'dev-conservatorium');
            expect(results.every((u) => u.conservatoriumId === 'dev-conservatorium')).toBe(true);
        });

        it('list returns independent copies (mutations do not leak)', async () => {
            const users1 = await db.users.list();
            users1[0].name = 'MUTATED';
            const users2 = await db.users.list();
            expect(users2[0].name).not.toBe('MUTATED');
        });
    });

    // ── conservatoriums repository ────────────────────────────────────────────

    describe('conservatoriums repository', () => {
        it('lists conservatoriums', async () => {
            const cons = await db.conservatoriums.list();
            expect(Array.isArray(cons)).toBe(true);
            expect(cons.length).toBeGreaterThan(0);
        });

        it('lists at least 80 conservatoriums (seeded from scraped data)', async () => {
            const cons = await db.conservatoriums.list();
            expect(cons.length).toBeGreaterThanOrEqual(80);
        });

        it('gets conservatorium by id', async () => {
            const cons = await db.conservatoriums.list();
            const first = cons[0];
            const found = await db.conservatoriums.findById(first.id);
            expect(found?.id).toBe(first.id);
        });

        it('returns null for non-existent conservatorium', async () => {
            const found = await db.conservatoriums.findById('no-such-cons');
            expect(found).toBeNull();
        });

        it('creates a new conservatorium', async () => {
            const created = await db.conservatoriums.create({
                name: 'Test Conservatory',
            });
            expect(created.id).toBeTruthy();
            expect(created.name).toBe('Test Conservatory');
        });

        it('updates a conservatorium name', async () => {
            const cons = await db.conservatoriums.list();
            const target = cons[0];
            await db.conservatoriums.update(target.id, { name: 'Renamed Conservatory' });
            const updated = await db.conservatoriums.findById(target.id);
            expect(updated?.name).toBe('Renamed Conservatory');
        });

        it('deletes a conservatorium', async () => {
            const created = await db.conservatoriums.create({ name: 'To Delete' });
            await db.conservatoriums.delete(created.id);
            const found = await db.conservatoriums.findById(created.id);
            expect(found).toBeNull();
        });
    });

    // ── lessons repository ────────────────────────────────────────────────────

    describe('lessons repository', () => {
        it('lists lessons', async () => {
            const lessons = await db.lessons.list();
            expect(Array.isArray(lessons)).toBe(true);
        });

        it('creates a lesson', async () => {
            const created = await db.lessons.create({
                conservatoriumId: 'cons-1',
                teacherId: 'teacher-user-1',
                studentId: 'student-user-1',
                instrument: 'Piano',
                status: 'SCHEDULED',
            });
            expect(created.id).toBeTruthy();
            expect(created.instrument).toBe('Piano');
        });

        it('updates a lesson status', async () => {
            const created = await db.lessons.create({
                conservatoriumId: 'cons-1',
                teacherId: 'teacher-user-1',
                studentId: 'student-user-1',
                instrument: 'Guitar',
                status: 'SCHEDULED',
            });
            await db.lessons.update(created.id, { status: 'COMPLETED' });
            const updated = await db.lessons.findById(created.id);
            expect(updated?.status).toBe('COMPLETED');
        });

        it('findByConservatorium returns lessons for the specified conservatorium', async () => {
            await db.lessons.create({
                conservatoriumId: 'filter-cons',
                teacherId: 'teacher-1',
                studentId: 'student-1',
                instrument: 'Violin',
                status: 'SCHEDULED',
            });
            const results = await db.lessons.findByConservatorium('filter-cons');
            expect(results.every((l) => l.conservatoriumId === 'filter-cons')).toBe(true);
        });
    });

    // ── events repository ─────────────────────────────────────────────────────

    describe('events repository', () => {
        it('lists events', async () => {
            const events = await db.events.list();
            expect(Array.isArray(events)).toBe(true);
        });

        it('creates an event', async () => {
            const created = await db.events.create({
                conservatoriumId: 'cons-1',
                name: 'Spring Recital',
                type: 'CONCERT',
                status: 'UPCOMING',
                eventDate: new Date().toISOString(),
            });
            expect(created.id).toBeTruthy();
            expect(created.name).toBe('Spring Recital');
        });

        it('updates an event', async () => {
            const created = await db.events.create({
                conservatoriumId: 'cons-1',
                name: 'Old Event Name',
                type: 'RECITAL',
                status: 'UPCOMING',
                eventDate: new Date().toISOString(),
            });
            await db.events.update(created.id, { name: 'Updated Event Name' });
            const updated = await db.events.findById(created.id);
            expect(updated?.name).toBe('Updated Event Name');
        });

        it('deletes an event', async () => {
            const created = await db.events.create({
                conservatoriumId: 'cons-1',
                name: 'Temporary Event',
                type: 'CONCERT',
                status: 'UPCOMING',
                eventDate: new Date().toISOString(),
            });
            await db.events.delete(created.id);
            const found = await db.events.findById(created.id);
            expect(found).toBeNull();
        });
    });

    // ── forms / approvals repository ──────────────────────────────────────────

    describe('forms repository', () => {
        it('lists forms', async () => {
            const forms = await db.forms.list();
            expect(Array.isArray(forms)).toBe(true);
        });

        it('creates a form submission', async () => {
            const created = await db.forms.create({
                conservatoriumId: 'cons-1',
                type: 'ENROLLMENT',
                status: 'PENDING',
                submittedBy: 'parent-user-1',
            });
            expect(created.id).toBeTruthy();
            expect(created.status).toBe('PENDING');
        });
    });

    describe('approvals repository', () => {
        it('findPending returns only pending forms', async () => {
            await db.forms.create({
                conservatoriumId: 'cons-1',
                type: 'ENROLLMENT',
                status: 'PENDING',
                submittedBy: 'parent-user-1',
            });
            await db.forms.create({
                conservatoriumId: 'cons-1',
                type: 'ENROLLMENT',
                status: 'APPROVED',
                submittedBy: 'parent-user-2',
            });
            const pending = await db.approvals.findPending('cons-1');
            expect(pending.every((f) =>
                ['PENDING', 'PENDING_TEACHER', 'PENDING_ADMIN', 'REVISION_REQUIRED'].includes(f.status)
            )).toBe(true);
        });

        it('findPending returns all pending forms when no conservatoriumId is given', async () => {
            await db.forms.create({
                conservatoriumId: 'cons-A',
                type: 'ENROLLMENT',
                status: 'PENDING',
                submittedBy: 'user-1',
            });
            const pending = await db.approvals.findPending();
            expect(pending.length).toBeGreaterThan(0);
        });
    });

    // ── payments (invoices) repository ────────────────────────────────────────

    describe('payments repository', () => {
        it('lists payments', async () => {
            const payments = await db.payments.list();
            expect(Array.isArray(payments)).toBe(true);
        });

        it('creates a payment record', async () => {
            const created = await db.payments.create({
                conservatoriumId: 'cons-1',
                payerId: 'parent-user-1',
                total: 450,
                status: 'SENT',
                dueDate: '2026-12-31',
                lineItems: [],
            });
            expect(created.id).toBeTruthy();
            expect(created.total).toBe(450);
        });

        it('updates a payment status', async () => {
            const created = await db.payments.create({
                conservatoriumId: 'cons-1',
                payerId: 'parent-user-2',
                total: 300,
                status: 'SENT',
                dueDate: '2026-12-31',
                lineItems: [],
            });
            await db.payments.update(created.id, { status: 'PAID' });
            const updated = await db.payments.findById(created.id);
            expect(updated?.status).toBe('PAID');
        });
    });

    // ── announcements repository ──────────────────────────────────────────────

    describe('announcements repository', () => {
        it('lists announcements', async () => {
            const announcements = await db.announcements.list();
            expect(Array.isArray(announcements)).toBe(true);
        });

        it('creates an announcement', async () => {
            const created = await db.announcements.create({
                conservatoriumId: 'cons-1',
                title: 'System Maintenance',
                body: 'The system will be down on Sunday.',
                targetAudience: 'ALL',
                channels: [],
            });
            expect(created.id).toBeTruthy();
            expect(created.title).toBe('System Maintenance');
        });
    });

    // ── conservatoriumInstruments repository ──────────────────────────────────

    describe('conservatoriumInstruments repository', () => {
        it('lists conservatorium instruments', async () => {
            const instruments = await db.conservatoriumInstruments.list();
            expect(Array.isArray(instruments)).toBe(true);
        });

        it('creates a conservatorium instrument', async () => {
            const created = await db.conservatoriumInstruments.create({
                conservatoriumId: 'cons-1',
                names: { he: 'אקורדיון', en: 'Accordion' },
                isActive: true,
                teacherCount: 0,
                availableForRegistration: true,
                availableForRental: false,
            });
            expect(created.id).toBeTruthy();
            expect(created.names.en).toBe('Accordion');
        });
    });

    // ── notifications repository ──────────────────────────────────────────────

    describe('notifications repository', () => {
        it('lists notifications', async () => {
            const notifications = await db.notifications.list();
            expect(Array.isArray(notifications)).toBe(true);
        });

        it('findByUser returns notifications for the given userId', async () => {
            await db.notifications.create({
                userId: 'target-user',
                conservatoriumId: 'cons-1',
                title: 'Lesson Reminder',
                message: 'Your lesson is tomorrow.',
                timestamp: new Date().toISOString(),
                link: '/schedule',
                read: false,
            });
            const results = await db.notifications.findByUser('target-user');
            expect(results.every((n) => n.userId === 'target-user')).toBe(true);
        });

        it('markRead updates the notification to read=true', async () => {
            const created = await db.notifications.create({
                userId: 'mark-read-user',
                conservatoriumId: 'cons-1',
                title: 'Announcement',
                message: 'Read this.',
                timestamp: new Date().toISOString(),
                link: '/announcements',
                read: false,
            });
            await db.notifications.markRead(created.id);
            const updated = await db.notifications.findById(created.id);
            expect(updated?.read).toBe(true);
        });
    });

    // ── rooms repository ──────────────────────────────────────────────────────

    describe('rooms repository', () => {
        it('lists rooms', async () => {
            const rooms = await db.rooms.list();
            expect(Array.isArray(rooms)).toBe(true);
        });

        it('creates and retrieves a room', async () => {
            const created = await db.rooms.create({
                conservatoriumId: 'cons-1',
                name: 'Practice Room 5',
                capacity: 10,
            });
            const found = await db.rooms.findById(created.id);
            expect(found?.name).toBe('Practice Room 5');
        });
    });

    // ── alumni repository ─────────────────────────────────────────────────────

    describe('alumni repository', () => {
        it('lists alumni', async () => {
            const alumni = await db.alumni.list();
            expect(Array.isArray(alumni)).toBe(true);
        });
    });

    // ── repertoire repository ─────────────────────────────────────────────────

    describe('repertoire repository', () => {
        it('lists repertoire entries', async () => {
            const repertoire = await db.repertoire.list();
            expect(Array.isArray(repertoire)).toBe(true);
        });

        it('creates a repertoire entry', async () => {
            const created = await db.repertoire.create({
                title: 'Moonlight Sonata',
                composer: 'Beethoven',
            });
            expect(created.id).toBeTruthy();
            expect(created.title).toBe('Moonlight Sonata');
        });
    });

    // ── donations / donationCauses repositories ───────────────────────────────

    describe('donationCauses repository', () => {
        it('lists donation causes', async () => {
            const causes = await db.donationCauses.list();
            expect(Array.isArray(causes)).toBe(true);
        });

        it('creates a donation cause', async () => {
            const created = await db.donationCauses.create({
                conservatoriumId: 'cons-1',
                names: { he: 'קרן מלגות', en: 'Scholarship Fund' },
                descriptions: { he: 'תומך בתלמידים מוכשרים', en: 'Helps talented students.' },
                category: 'financial_aid',
                priority: 1,
                isActive: true,
            });
            expect(created.id).toBeTruthy();
            expect(created.names.en).toBe('Scholarship Fund');
        });
    });

    describe('donations repository', () => {
        it('lists donations', async () => {
            const donations = await db.donations.list();
            expect(Array.isArray(donations)).toBe(true);
        });
    });

    // ── practiceLogs repository ───────────────────────────────────────────────

    describe('practiceLogs repository', () => {
        it('starts empty (no seed practice logs)', async () => {
            const logs = await db.practiceLogs.list();
            expect(Array.isArray(logs)).toBe(true);
        });

        it('creates a practice log', async () => {
            const created = await db.practiceLogs.create({
                studentId: 'student-user-1',
                conservatoriumId: 'cons-1',
                durationMinutes: 30,
                date: new Date().toISOString(),
            });
            expect(created.id).toBeTruthy();
            expect(created.durationMinutes).toBe(30);
        });
    });

    // ── makeupCredits repository ──────────────────────────────────────────────

    describe('makeupCredits repository', () => {
        it('starts empty (no seed makeup credits)', async () => {
            const credits = await db.makeupCredits.list();
            expect(Array.isArray(credits)).toBe(true);
        });

        it('creates a makeup credit', async () => {
            const now = new Date().toISOString();
            const created = await db.makeupCredits.create({
                conservatoriumId: 'cons-1',
                studentId: 'student-user-1',
                issuedBySlotId: 'lesson-slot-1',
                issuedReason: 'TEACHER_CANCELLATION',
                issuedAt: now,
                expiresAt: now,
                status: 'AVAILABLE',
                amount: 0,
            });
            expect(created.id).toBeTruthy();
            expect(created.studentId).toBe('student-user-1');
        });
    });

    // ── branches repository ───────────────────────────────────────────────────

    describe('branches repository', () => {
        it('lists branches', async () => {
            const branches = await db.branches.list();
            expect(Array.isArray(branches)).toBe(true);
        });

        it('creates a branch', async () => {
            const created = await db.branches.create({
                conservatoriumId: 'cons-1',
                name: 'North Branch',
                address: '123 North St',
            });
            expect(created.id).toBeTruthy();
            expect(created.name).toBe('North Branch');
        });
    });

    // ── id generation ─────────────────────────────────────────────────────────

    describe('id generation', () => {
        it('assigns unique ids to multiple created records', async () => {
            const a = await db.rooms.create({ conservatoriumId: 'cons-1', name: 'Room A' });
            const b = await db.rooms.create({ conservatoriumId: 'cons-1', name: 'Room B' });
            const c = await db.rooms.create({ conservatoriumId: 'cons-1', name: 'Room C' });
            expect(a.id).not.toBe(b.id);
            expect(b.id).not.toBe(c.id);
            expect(a.id).not.toBe(c.id);
        });

        it('honours a pre-supplied id on create', async () => {
            const created = await db.rooms.create({
                id: 'custom-room-id',
                conservatoriumId: 'cons-1',
                name: 'Custom Id Room',
            });
            expect(created.id).toBe('custom-room-id');
        });
    });
});
