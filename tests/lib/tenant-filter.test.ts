import { describe, it, expect } from 'vitest';
import { tenantFilter, tenantUsers } from '@/lib/tenant-filter';
import type { User } from '@/lib/types';

// ---------------------------------------------------------------------------
// Test data helpers
// ---------------------------------------------------------------------------

const makeUser = (overrides: Partial<User> = {}): User => ({
  id: 'u1',
  email: 'u@test.com',
  name: 'Test',
  role: 'teacher',
  conservatoriumId: 'cons-1',
  conservatoriumName: 'Test Cons',
  approved: true,
  createdAt: new Date().toISOString(),
  ...overrides,
});

const makeItem = (conservatoriumId: string) => ({ id: 'x', conservatoriumId });

// Pre-built fixtures used across multiple groups
const ITEMS_CONS_1 = [makeItem('cons-1'), makeItem('cons-1'), makeItem('cons-1')];
const ITEMS_MIXED = [makeItem('cons-1'), makeItem('cons-2'), makeItem('cons-10')];

// ---------------------------------------------------------------------------
// Group 1: tenantFilter() core behaviour
// ---------------------------------------------------------------------------

describe('tenantFilter — site_admin and ministry_director see all data', () => {
  it('site_admin receives all items with no filtering applied', () => {
    const admin = makeUser({ role: 'site_admin', conservatoriumId: 'cons-1' });
    const result = tenantFilter(ITEMS_MIXED, admin);
    expect(result).toHaveLength(3);
    expect(result).toBe(ITEMS_MIXED); // exact same reference — no copy made
  });

  it('ministry_director receives all items with no filtering applied', () => {
    const director = makeUser({ role: 'ministry_director', conservatoriumId: 'cons-1' });
    const result = tenantFilter(ITEMS_MIXED, director);
    expect(result).toHaveLength(3);
    expect(result).toBe(ITEMS_MIXED);
  });

  it('site_admin with no conservatoriumId still sees all items', () => {
    const admin = makeUser({ role: 'site_admin', conservatoriumId: undefined as unknown as string });
    const result = tenantFilter(ITEMS_MIXED, admin);
    expect(result).toHaveLength(3);
  });

  it('ministry_director with no conservatoriumId still sees all items', () => {
    const director = makeUser({ role: 'ministry_director', conservatoriumId: undefined as unknown as string });
    const result = tenantFilter(ITEMS_MIXED, director);
    expect(result).toHaveLength(3);
  });
});

describe('tenantFilter — conservatorium_admin is restricted to own tenant', () => {
  it('conservatorium_admin cannot read another tenants data', () => {
    const admin = makeUser({ role: 'conservatorium_admin', conservatoriumId: 'cons-2' });
    const result = tenantFilter(ITEMS_MIXED, admin);
    expect(result).toHaveLength(1);
    expect(result[0].conservatoriumId).toBe('cons-2');
  });

  it('conservatorium_admin sees all items when every item belongs to their own tenant', () => {
    const admin = makeUser({ role: 'conservatorium_admin', conservatoriumId: 'cons-1' });
    const result = tenantFilter(ITEMS_CONS_1, admin);
    expect(result).toHaveLength(3);
  });

  it('conservatorium_admin with no conservatoriumId gets empty result — not all data', () => {
    const admin = makeUser({ role: 'conservatorium_admin', conservatoriumId: undefined as unknown as string });
    const result = tenantFilter(ITEMS_MIXED, admin);
    expect(result).toHaveLength(0);
  });
});

describe('tenantFilter — teacher is restricted to own tenant', () => {
  it('teacher sees only items from their own conservatorium', () => {
    const teacher = makeUser({ role: 'teacher', conservatoriumId: 'cons-1' });
    const result = tenantFilter(ITEMS_MIXED, teacher);
    expect(result).toHaveLength(1);
    expect(result[0].conservatoriumId).toBe('cons-1');
  });
});

describe('tenantFilter — student is restricted to own tenant', () => {
  it('student sees only items from their own conservatorium', () => {
    const student = makeUser({ role: 'student', conservatoriumId: 'cons-1' });
    const result = tenantFilter(ITEMS_MIXED, student);
    expect(result).toHaveLength(1);
    expect(result[0].conservatoriumId).toBe('cons-1');
  });
});

describe('tenantFilter — parent is restricted to own tenant', () => {
  it('parent sees only items from their own conservatorium', () => {
    const parent = makeUser({ role: 'parent', conservatoriumId: 'cons-2' });
    const result = tenantFilter(ITEMS_MIXED, parent);
    expect(result).toHaveLength(1);
    expect(result[0].conservatoriumId).toBe('cons-2');
  });
});

describe('tenantFilter — items with missing conservatoriumId', () => {
  it('item with undefined conservatoriumId is excluded for conservatorium_admin', () => {
    const admin = makeUser({ role: 'conservatorium_admin', conservatoriumId: 'cons-1' });
    const items = [
      makeItem('cons-1'),
      { id: 'no-cons', conservatoriumId: undefined as unknown as string },
    ];
    const result = tenantFilter(items, admin);
    expect(result).toHaveLength(1);
    expect(result[0].conservatoriumId).toBe('cons-1');
  });

  it('item with null conservatoriumId is excluded for conservatorium_admin', () => {
    const admin = makeUser({ role: 'conservatorium_admin', conservatoriumId: 'cons-1' });
    const items = [
      makeItem('cons-1'),
      { id: 'null-cons', conservatoriumId: null as unknown as string },
    ];
    const result = tenantFilter(items, admin);
    expect(result).toHaveLength(1);
    expect(result[0].conservatoriumId).toBe('cons-1');
  });

  it('item with undefined conservatoriumId is included for site_admin (global bypass)', () => {
    const admin = makeUser({ role: 'site_admin' });
    const items = [
      makeItem('cons-1'),
      { id: 'no-cons', conservatoriumId: undefined as unknown as string },
    ];
    const result = tenantFilter(items, admin);
    expect(result).toHaveLength(2);
  });
});

describe('tenantFilter — empty array edge cases', () => {
  it('returns empty array for site_admin when input is empty', () => {
    const admin = makeUser({ role: 'site_admin' });
    expect(tenantFilter([], admin)).toHaveLength(0);
  });

  it('returns empty array for conservatorium_admin when input is empty', () => {
    const admin = makeUser({ role: 'conservatorium_admin', conservatoriumId: 'cons-1' });
    expect(tenantFilter([], admin)).toHaveLength(0);
  });

  it('returns empty array for teacher when input is empty', () => {
    const teacher = makeUser({ role: 'teacher', conservatoriumId: 'cons-1' });
    expect(tenantFilter([], teacher)).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Group 2: tenantUsers() role + tenant filtering
// ---------------------------------------------------------------------------

describe('tenantUsers — filters by role AND tenant simultaneously', () => {
  const pool: User[] = [
    makeUser({ id: 'teacher-a1', role: 'teacher', conservatoriumId: 'cons-1' }),
    makeUser({ id: 'teacher-a2', role: 'teacher', conservatoriumId: 'cons-1' }),
    makeUser({ id: 'teacher-b1', role: 'teacher', conservatoriumId: 'cons-2' }),
    makeUser({ id: 'student-a1', role: 'student', conservatoriumId: 'cons-1' }),
    makeUser({ id: 'student-b1', role: 'student', conservatoriumId: 'cons-2' }),
    makeUser({ id: 'admin-a1',   role: 'conservatorium_admin', conservatoriumId: 'cons-1' }),
  ];

  it('conservatorium_admin returns only own-tenant teachers when role="teacher"', () => {
    const admin = makeUser({ role: 'conservatorium_admin', conservatoriumId: 'cons-1' });
    const result = tenantUsers(pool, admin, 'teacher');
    expect(result).toHaveLength(2);
    result.forEach(u => {
      expect(u.role).toBe('teacher');
      expect(u.conservatoriumId).toBe('cons-1');
    });
  });

  it('conservatorium_admin cannot read teachers from another tenant', () => {
    const admin = makeUser({ role: 'conservatorium_admin', conservatoriumId: 'cons-1' });
    const result = tenantUsers(pool, admin, 'teacher');
    const crossTenantTeachers = result.filter(u => u.conservatoriumId !== 'cons-1');
    expect(crossTenantTeachers).toHaveLength(0);
  });

  it('conservatorium_admin sees only own-tenant students when role="student"', () => {
    const admin = makeUser({ role: 'conservatorium_admin', conservatoriumId: 'cons-1' });
    const result = tenantUsers(pool, admin, 'student');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('student-a1');
  });

  it('site_admin returns all teachers across all tenants when role="teacher"', () => {
    const admin = makeUser({ role: 'site_admin' });
    const result = tenantUsers(pool, admin, 'teacher');
    expect(result).toHaveLength(3);
  });

  it('ministry_director returns all students across all tenants when role="student"', () => {
    const director = makeUser({ role: 'ministry_director' });
    const result = tenantUsers(pool, director, 'student');
    expect(result).toHaveLength(2);
  });

  it('with no roles arg: filters by tenant only (returns all roles from own tenant)', () => {
    const admin = makeUser({ role: 'conservatorium_admin', conservatoriumId: 'cons-1' });
    const result = tenantUsers(pool, admin);
    expect(result).toHaveLength(4); // teacher-a1, teacher-a2, student-a1, admin-a1
    result.forEach(u => expect(u.conservatoriumId).toBe('cons-1'));
  });

  it('with no roles arg and site_admin: returns entire user pool', () => {
    const admin = makeUser({ role: 'site_admin' });
    const result = tenantUsers(pool, admin);
    expect(result).toHaveLength(pool.length);
  });

  it('returns empty when no users match the requested role in this tenant', () => {
    const admin = makeUser({ role: 'conservatorium_admin', conservatoriumId: 'cons-1' });
    // There are no 'ministry_director' users in pool
    const result = tenantUsers(pool, admin, 'ministry_director');
    expect(result).toHaveLength(0);
  });

  it('returns empty when no users match the role across ANY tenant for conservatorium_admin with no matching tenant', () => {
    const admin = makeUser({ role: 'conservatorium_admin', conservatoriumId: 'cons-999' });
    const result = tenantUsers(pool, admin, 'teacher');
    expect(result).toHaveLength(0);
  });

  it('supports multiple role arguments simultaneously', () => {
    const admin = makeUser({ role: 'conservatorium_admin', conservatoriumId: 'cons-1' });
    const result = tenantUsers(pool, admin, 'teacher', 'student');
    expect(result).toHaveLength(3); // teacher-a1, teacher-a2, student-a1
    result.forEach(u => expect(u.conservatoriumId).toBe('cons-1'));
  });
});

// ---------------------------------------------------------------------------
// Group 3: Edge cases / security boundary
// ---------------------------------------------------------------------------

describe('tenantFilter — security boundary: exact conservatoriumId match only', () => {
  it('cons-1 admin cannot read items belonging to cons-10 (prefix collision rejected)', () => {
    const admin = makeUser({ role: 'conservatorium_admin', conservatoriumId: 'cons-1' });
    const items = [
      makeItem('cons-1'),
      makeItem('cons-10'),
      makeItem('cons-100'),
      makeItem('cons-1000'),
    ];
    const result = tenantFilter(items, admin);
    expect(result).toHaveLength(1);
    expect(result[0].conservatoriumId).toBe('cons-1');
  });

  it('cons-10 admin cannot read items belonging to cons-1 (reverse prefix collision rejected)', () => {
    const admin = makeUser({ role: 'conservatorium_admin', conservatoriumId: 'cons-10' });
    const items = [makeItem('cons-1'), makeItem('cons-10'), makeItem('cons-100')];
    const result = tenantFilter(items, admin);
    expect(result).toHaveLength(1);
    expect(result[0].conservatoriumId).toBe('cons-10');
  });

  it('conservatoriumId comparison is case-sensitive: CONS-1 does not match cons-1', () => {
    const admin = makeUser({ role: 'conservatorium_admin', conservatoriumId: 'cons-1' });
    const items = [makeItem('cons-1'), makeItem('CONS-1'), makeItem('Cons-1')];
    const result = tenantFilter(items, admin);
    expect(result).toHaveLength(1);
    expect(result[0].conservatoriumId).toBe('cons-1');
  });

  it('conservatoriumId comparison is case-sensitive: uppercase admin cannot read lowercase items', () => {
    const admin = makeUser({ role: 'conservatorium_admin', conservatoriumId: 'CONS-1' });
    const items = [makeItem('cons-1'), makeItem('CONS-1')];
    const result = tenantFilter(items, admin);
    expect(result).toHaveLength(1);
    expect(result[0].conservatoriumId).toBe('CONS-1');
  });

  it('conservatorium_admin with no conservatoriumId (undefined) gets empty result — not all data leaked', () => {
    const admin = makeUser({ role: 'conservatorium_admin', conservatoriumId: undefined as unknown as string });
    const items = [makeItem('cons-1'), makeItem('cons-2'), makeItem('cons-3')];
    const result = tenantFilter(items, admin);
    expect(result).toHaveLength(0);
  });

  it('whitespace in conservatoriumId does not accidentally match (no trimming)', () => {
    const admin = makeUser({ role: 'conservatorium_admin', conservatoriumId: 'cons-1' });
    const items = [makeItem('cons-1'), makeItem(' cons-1'), makeItem('cons-1 ')];
    const result = tenantFilter(items, admin);
    expect(result).toHaveLength(1);
    expect(result[0].conservatoriumId).toBe('cons-1');
  });
});

// ---------------------------------------------------------------------------
// Group 4: Cross-component regression — the 37 audit violations
// ---------------------------------------------------------------------------

describe('regression: patterns from 37-violation audit', () => {
  // Simulates data from two conservatoriums that would exist in a real DB read
  const allUsers: User[] = [
    makeUser({ id: 'teacher-cons-a-1', role: 'teacher', conservatoriumId: 'cons-A', approved: true }),
    makeUser({ id: 'teacher-cons-a-2', role: 'teacher', conservatoriumId: 'cons-A', approved: true }),
    makeUser({ id: 'student-cons-a-1', role: 'student', conservatoriumId: 'cons-A', approved: true }),
    makeUser({ id: 'student-cons-a-2', role: 'student', conservatoriumId: 'cons-A', approved: false }),
    makeUser({ id: 'teacher-cons-b-1', role: 'teacher', conservatoriumId: 'cons-B', approved: true }),
    makeUser({ id: 'student-cons-b-1', role: 'student', conservatoriumId: 'cons-B', approved: true }),
    makeUser({ id: 'parent-cons-b-1',  role: 'parent',  conservatoriumId: 'cons-B', approved: true }),
  ];

  describe('violation pattern: users.filter(u => u.role === "teacher") without tenant check', () => {
    it('role-only filter exposes cross-tenant teachers to a cons-B admin — demonstrating the leak', () => {
      // This is the BROKEN pattern that caused the violations.
      // A cons-B admin running this query would incorrectly receive cons-A teachers.
      const consB_admin = makeUser({ role: 'conservatorium_admin', conservatoriumId: 'cons-B' });
      const brokenResult = allUsers.filter(u => u.role === 'teacher');

      // Prove the leak: cons-A data is visible
      const leakedItems = brokenResult.filter(u => u.conservatoriumId !== consB_admin.conservatoriumId);
      expect(leakedItems.length).toBeGreaterThan(0); // leak confirmed
    });

    it('tenantFilter applied after role-only filter eliminates cross-tenant teacher leak', () => {
      const consB_admin = makeUser({ role: 'conservatorium_admin', conservatoriumId: 'cons-B' });
      const teachers = allUsers.filter(u => u.role === 'teacher');
      const result = tenantFilter(teachers, consB_admin);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('teacher-cons-b-1');
      result.forEach(u => expect(u.conservatoriumId).toBe('cons-B'));
    });

    it('tenantUsers() instead of role-only filter produces the same safe result', () => {
      const consB_admin = makeUser({ role: 'conservatorium_admin', conservatoriumId: 'cons-B' });
      const result = tenantUsers(allUsers, consB_admin, 'teacher');

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('teacher-cons-b-1');
    });
  });

  describe('violation pattern: users.filter(u => u.role === "student" && u.approved) without tenant check', () => {
    it('role+approved filter exposes cross-tenant students to a cons-B admin — demonstrating the leak', () => {
      const consB_admin = makeUser({ role: 'conservatorium_admin', conservatoriumId: 'cons-B' });
      const brokenResult = allUsers.filter(u => u.role === 'student' && u.approved);

      // Proves cons-A students leak through to cons-B admin
      const leakedItems = brokenResult.filter(u => u.conservatoriumId !== consB_admin.conservatoriumId);
      expect(leakedItems.length).toBeGreaterThan(0); // leak confirmed
    });

    it('tenantFilter applied after role+approved filter eliminates cross-tenant student leak', () => {
      const consB_admin = makeUser({ role: 'conservatorium_admin', conservatoriumId: 'cons-B' });
      const approvedStudents = allUsers.filter(u => u.role === 'student' && u.approved);
      const result = tenantFilter(approvedStudents, consB_admin);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('student-cons-b-1');
      result.forEach(u => {
        expect(u.conservatoriumId).toBe('cons-B');
        expect(u.approved).toBe(true);
      });
    });

    it('tenantUsers() + post-filter for approved produces same safe result', () => {
      const consB_admin = makeUser({ role: 'conservatorium_admin', conservatoriumId: 'cons-B' });
      const result = tenantUsers(allUsers, consB_admin, 'student').filter(u => u.approved);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('student-cons-b-1');
    });
  });

  describe('global admins are never restricted by tenant isolation', () => {
    it('site_admin using tenantFilter still sees all teachers across both conservatoriums', () => {
      const siteAdmin = makeUser({ role: 'site_admin', conservatoriumId: 'cons-A' });
      const result = tenantUsers(allUsers, siteAdmin, 'teacher');
      expect(result).toHaveLength(3); // both cons-A and cons-B teachers
    });

    it('ministry_director using tenantFilter still sees all students across both conservatoriums', () => {
      const director = makeUser({ role: 'ministry_director', conservatoriumId: 'cons-A' });
      const result = tenantUsers(allUsers, director, 'student');
      expect(result).toHaveLength(3); // student-cons-a-1, student-cons-a-2, student-cons-b-1
    });
  });

  describe('cons-A admin is symmetrically isolated from cons-B data', () => {
    it('cons-A admin cannot read cons-B teachers', () => {
      const consA_admin = makeUser({ role: 'conservatorium_admin', conservatoriumId: 'cons-A' });
      const result = tenantUsers(allUsers, consA_admin, 'teacher');
      result.forEach(u => expect(u.conservatoriumId).toBe('cons-A'));
      expect(result.find(u => u.conservatoriumId === 'cons-B')).toBeUndefined();
    });

    it('cons-A admin cannot read cons-B parents', () => {
      const consA_admin = makeUser({ role: 'conservatorium_admin', conservatoriumId: 'cons-A' });
      const result = tenantUsers(allUsers, consA_admin, 'parent');
      expect(result).toHaveLength(0); // cons-A has no parents in this dataset
    });
  });
});
