import { describe, it, expect } from 'vitest';
import type { ConsentType } from '@/lib/types';

// ---------------------------------------------------------------------------
// Tests for consent action logic (LC-16..LC-18)
//
// src/app/actions/consent.ts has 'use server' — cannot be imported directly.
// We reproduce the pure logic here to verify correctness.
// ---------------------------------------------------------------------------

// ── ConsentType resolution (LC-16) ─────────────────────────────────────────

/**
 * Mirrors the consentTypes array construction in saveConsentRecord:
 *
 *   const consentTypes: ConsentType[] = [
 *     ...(consentDataProcessing ? ['DATA_PROCESSING'] : []),
 *     ...(consentTerms ? ['TERMS'] : []),
 *     ...(consentMarketing ? ['MARKETING'] : []),
 *     ...(consentVideoRecording ? ['VIDEO_RECORDING'] : []),
 *     ...(consentPhotos ? ['PHOTOS'] : []),
 *   ];
 */
function resolveConsentTypes(flags: {
  consentDataProcessing?: boolean;
  consentTerms?: boolean;
  consentMarketing?: boolean;
  consentVideoRecording?: boolean;
  consentPhotos?: boolean;
}): ConsentType[] {
  return [
    ...(flags.consentDataProcessing ? ['DATA_PROCESSING' as ConsentType] : []),
    ...(flags.consentTerms ? ['TERMS' as ConsentType] : []),
    ...(flags.consentMarketing ? ['MARKETING' as ConsentType] : []),
    ...(flags.consentVideoRecording ? ['VIDEO_RECORDING' as ConsentType] : []),
    ...(flags.consentPhotos ? ['PHOTOS' as ConsentType] : []),
  ];
}

describe('resolveConsentTypes — basic flags (LC-16)', () => {
  it('returns empty array when all flags are false/undefined', () => {
    expect(resolveConsentTypes({})).toHaveLength(0);
  });

  it('includes DATA_PROCESSING when consentDataProcessing=true', () => {
    const types = resolveConsentTypes({ consentDataProcessing: true });
    expect(types).toContain('DATA_PROCESSING');
  });

  it('includes TERMS when consentTerms=true', () => {
    const types = resolveConsentTypes({ consentTerms: true });
    expect(types).toContain('TERMS');
  });

  it('includes MARKETING when consentMarketing=true', () => {
    const types = resolveConsentTypes({ consentMarketing: true });
    expect(types).toContain('MARKETING');
  });

  it('includes VIDEO_RECORDING when consentVideoRecording=true', () => {
    const types = resolveConsentTypes({ consentVideoRecording: true });
    expect(types).toContain('VIDEO_RECORDING');
  });

  it('includes PHOTOS when consentPhotos=true', () => {
    const types = resolveConsentTypes({ consentPhotos: true });
    expect(types).toContain('PHOTOS');
  });

  it('returns all 5 types when all flags are true', () => {
    const types = resolveConsentTypes({
      consentDataProcessing: true,
      consentTerms: true,
      consentMarketing: true,
      consentVideoRecording: true,
      consentPhotos: true,
    });
    expect(types).toHaveLength(5);
    expect(types).toContain('DATA_PROCESSING');
    expect(types).toContain('TERMS');
    expect(types).toContain('MARKETING');
    expect(types).toContain('VIDEO_RECORDING');
    expect(types).toContain('PHOTOS');
  });

  it('returns only mandatory types for a standard adult registration', () => {
    // Typical adult: dataProcessing + terms, no marketing or video
    const types = resolveConsentTypes({
      consentDataProcessing: true,
      consentTerms: true,
      consentMarketing: false,
    });
    expect(types).toContain('DATA_PROCESSING');
    expect(types).toContain('TERMS');
    expect(types).not.toContain('MARKETING');
    expect(types).toHaveLength(2);
  });
});

// ── Target user resolution (LC-17) ─────────────────────────────────────────

/**
 * Mirrors: const targetUserId = data.minorUserId || data.userId;
 */
function resolveTargetUserId(userId: string, minorUserId?: string): string {
  return minorUserId || userId;
}

describe('resolveTargetUserId — parental consent target (LC-17)', () => {
  it('returns userId when no minorUserId', () => {
    expect(resolveTargetUserId('parent-001')).toBe('parent-001');
  });

  it('returns userId when minorUserId is undefined', () => {
    expect(resolveTargetUserId('adult-user', undefined)).toBe('adult-user');
  });

  it('returns minorUserId when provided', () => {
    expect(resolveTargetUserId('parent-001', 'student-child-007')).toBe('student-child-007');
  });

  it('returns minorUserId even when userId is a valid string', () => {
    expect(resolveTargetUserId('parent-002', 'minor-student-999')).toBe('minor-student-999');
  });
});

// ── Ownership check logic (LC-18) ──────────────────────────────────────────

/**
 * Mirrors the ownership guard in saveConsentRecord / getConsentStatus:
 *
 *   if (data.userId !== claims.uid) {
 *     const isParentOfTarget = user?.role === 'parent' && user?.childIds?.includes(data.userId);
 *     const isAdmin = ['site_admin', 'conservatorium_admin'].includes(claims.role ?? '');
 *     if (!isParentOfTarget && !isAdmin) return { success: false, error: '...' };
 *   }
 */
function checkOwnership(
  targetUserId: string,
  authenticatedUid: string,
  authenticatedRole: string,
  actorRole: string,
  actorChildIds: string[] = []
): boolean {
  if (targetUserId === authenticatedUid) return true;

  const isParentOfTarget =
    actorRole === 'parent' && actorChildIds.includes(targetUserId);
  const isAdmin = ['site_admin', 'conservatorium_admin'].includes(authenticatedRole);

  return isParentOfTarget || isAdmin;
}

describe('checkOwnership — same user (LC-18a)', () => {
  it('allows same user accessing their own record', () => {
    expect(checkOwnership('user-1', 'user-1', 'student', 'student', [])).toBe(true);
  });
});

describe('checkOwnership — parental consent (LC-18b)', () => {
  it('allows parent with child in childIds', () => {
    expect(checkOwnership('child-1', 'parent-1', 'parent', 'parent', ['child-1', 'child-2'])).toBe(true);
  });

  it('blocks parent whose childIds does not include the target', () => {
    expect(checkOwnership('child-99', 'parent-1', 'parent', 'parent', ['child-1'])).toBe(false);
  });

  it('blocks parent with empty childIds', () => {
    expect(checkOwnership('child-1', 'parent-1', 'parent', 'parent', [])).toBe(false);
  });
});

describe('checkOwnership — admin bypass (LC-18c)', () => {
  it('allows site_admin to access any user', () => {
    expect(checkOwnership('student-999', 'admin-1', 'site_admin', 'site_admin', [])).toBe(true);
  });

  it('allows conservatorium_admin to access users', () => {
    expect(checkOwnership('student-1', 'ca-1', 'conservatorium_admin', 'conservatorium_admin', [])).toBe(true);
  });

  it('blocks teacher from accessing other user consent', () => {
    expect(checkOwnership('student-1', 'teacher-1', 'teacher', 'teacher', [])).toBe(false);
  });

  it('blocks delegated_admin (not in bypass list)', () => {
    expect(checkOwnership('student-1', 'da-1', 'delegated_admin', 'delegated_admin', [])).toBe(false);
  });
});

// ── isMinorConsent audit log annotation (LC-18d) ───────────────────────────

describe('isMinorConsent audit annotation (LC-18d)', () => {
  /**
   * Mirrors the reason string in complianceLogs.create:
   *   `Consent recorded for types: ...${data.isMinorConsent ? ' (parental consent on behalf of minor)' : ''}`
   */
  function buildAuditReason(consentTypes: ConsentType[], isMinorConsent: boolean): string {
    return `Consent recorded for types: ${consentTypes.join(', ')}${
      isMinorConsent ? ' (parental consent on behalf of minor)' : ''
    }`;
  }

  it('appends parental consent note for minor', () => {
    const reason = buildAuditReason(['DATA_PROCESSING', 'TERMS'], true);
    expect(reason).toContain('(parental consent on behalf of minor)');
  });

  it('does not append parental consent note for adult', () => {
    const reason = buildAuditReason(['DATA_PROCESSING', 'TERMS'], false);
    expect(reason).not.toContain('parental consent');
  });

  it('includes consent type list in reason', () => {
    const reason = buildAuditReason(['DATA_PROCESSING', 'VIDEO_RECORDING'], true);
    expect(reason).toContain('DATA_PROCESSING');
    expect(reason).toContain('VIDEO_RECORDING');
  });
});
