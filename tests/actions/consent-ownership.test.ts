import { describe, it, expect } from 'vitest';

// ---------------------------------------------------------------------------
// Pure-function helpers that mirror the ownership-check logic in
// src/app/actions/consent.ts  (saveConsentRecord + getConsentStatus).
//
// We cannot import the 'use server' module directly in Vitest, so we
// reproduce the guard logic here as standalone functions.
// ---------------------------------------------------------------------------

type Role = 'student' | 'parent' | 'teacher' | 'conservatorium_admin' | 'delegated_admin' | 'site_admin';

interface UserClaims {
  uid: string;
  role?: Role;
}

interface UserRecord {
  id: string;
  role: Role;
  childIds?: string[];
}

/**
 * Mirrors the ownership check in saveConsentRecord / getConsentStatus:
 *
 *   if (data.userId !== claims.uid) {
 *     const isParentOfTarget = user?.role === 'parent' && user?.childIds?.includes(data.userId);
 *     const isAdmin = ['site_admin', 'conservatorium_admin'].includes(claims.role ?? '');
 *     if (!isParentOfTarget && !isAdmin) return { success: false, error: 'Access denied' };
 *   }
 */
function checkConsentOwnership(
  targetUserId: string,
  authenticatedClaims: UserClaims,
  actorRecord: UserRecord
): { allowed: boolean; reason: string } {
  // Same user — always allowed
  if (targetUserId === authenticatedClaims.uid) {
    return { allowed: true, reason: 'same_user' };
  }

  // Parent of minor — allowed
  const isParentOfTarget =
    actorRecord.role === 'parent' && (actorRecord.childIds ?? []).includes(targetUserId);
  if (isParentOfTarget) {
    return { allowed: true, reason: 'parent_of_minor' };
  }

  // Admin bypass
  const isAdmin = ['site_admin', 'conservatorium_admin'].includes(authenticatedClaims.role ?? '');
  if (isAdmin) {
    return { allowed: true, reason: 'admin_bypass' };
  }

  return { allowed: false, reason: 'unauthorized' };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('checkConsentOwnership — same user', () => {
  it('allows when userId matches authenticated uid', () => {
    const result = checkConsentOwnership(
      'user-123',
      { uid: 'user-123', role: 'student' },
      { id: 'user-123', role: 'student' }
    );
    expect(result.allowed).toBe(true);
    expect(result.reason).toBe('same_user');
  });

  it('allows student accessing their own consent record', () => {
    const result = checkConsentOwnership(
      'student-001',
      { uid: 'student-001', role: 'student' },
      { id: 'student-001', role: 'student' }
    );
    expect(result.allowed).toBe(true);
  });
});

describe('checkConsentOwnership — parent-of-minor', () => {
  it('allows parent who has child in childIds', () => {
    const result = checkConsentOwnership(
      'student-child-007',
      { uid: 'parent-001', role: 'parent' },
      { id: 'parent-001', role: 'parent', childIds: ['student-child-007', 'student-child-008'] }
    );
    expect(result.allowed).toBe(true);
    expect(result.reason).toBe('parent_of_minor');
  });

  it('blocks parent whose childIds does not include the target user', () => {
    const result = checkConsentOwnership(
      'student-other-999',
      { uid: 'parent-001', role: 'parent' },
      { id: 'parent-001', role: 'parent', childIds: ['student-child-007'] }
    );
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('unauthorized');
  });

  it('blocks parent with empty childIds', () => {
    const result = checkConsentOwnership(
      'student-child-007',
      { uid: 'parent-001', role: 'parent' },
      { id: 'parent-001', role: 'parent', childIds: [] }
    );
    expect(result.allowed).toBe(false);
  });

  it('blocks parent with undefined childIds', () => {
    const result = checkConsentOwnership(
      'student-child-007',
      { uid: 'parent-001', role: 'parent' },
      { id: 'parent-001', role: 'parent' }
    );
    expect(result.allowed).toBe(false);
  });
});

describe('checkConsentOwnership — admin bypass', () => {
  it('allows site_admin to access any user consent', () => {
    const result = checkConsentOwnership(
      'student-unrelated-999',
      { uid: 'admin-001', role: 'site_admin' },
      { id: 'admin-001', role: 'site_admin' }
    );
    expect(result.allowed).toBe(true);
    expect(result.reason).toBe('admin_bypass');
  });

  it('allows conservatorium_admin to access consent records', () => {
    const result = checkConsentOwnership(
      'student-001',
      { uid: 'cons-admin-001', role: 'conservatorium_admin' },
      { id: 'cons-admin-001', role: 'conservatorium_admin' }
    );
    expect(result.allowed).toBe(true);
    expect(result.reason).toBe('admin_bypass');
  });

  it('blocks delegated_admin (not in admin bypass list)', () => {
    const result = checkConsentOwnership(
      'student-001',
      { uid: 'delegated-001', role: 'delegated_admin' },
      { id: 'delegated-001', role: 'delegated_admin' }
    );
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('unauthorized');
  });
});

describe('checkConsentOwnership — unauthorized user', () => {
  it('blocks a teacher trying to access another user consent', () => {
    const result = checkConsentOwnership(
      'student-001',
      { uid: 'teacher-001', role: 'teacher' },
      { id: 'teacher-001', role: 'teacher' }
    );
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('unauthorized');
  });

  it('blocks a student trying to access another student consent', () => {
    const result = checkConsentOwnership(
      'student-002',
      { uid: 'student-001', role: 'student' },
      { id: 'student-001', role: 'student' }
    );
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('unauthorized');
  });

  it('blocks parent with no childIds at all accessing an unrelated student', () => {
    const result = checkConsentOwnership(
      'student-999',
      { uid: 'parent-002', role: 'parent' },
      { id: 'parent-002', role: 'parent' }
    );
    expect(result.allowed).toBe(false);
  });
});
