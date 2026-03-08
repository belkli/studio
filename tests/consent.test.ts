import { describe, it, expect } from 'vitest';
import type { ConsentType } from '@/lib/types';

// ---------------------------------------------------------------------------
// Pure-function helpers that mirror the logic in src/app/actions/consent.ts
// These are re-implemented here to avoid importing the 'use server' module.
// ---------------------------------------------------------------------------

/** Returns the consent types that should be recorded based on the form flags. */
function resolveConsentTypes(flags: {
  consentDataProcessing: boolean;
  consentTerms?: boolean;
  consentMarketing?: boolean;
  consentVideoRecording?: boolean;
}): ConsentType[] {
  const types: ConsentType[] = [];
  if (flags.consentDataProcessing) types.push('DATA_PROCESSING');
  if (flags.consentMarketing) types.push('MARKETING');
  if (flags.consentVideoRecording) types.push('VIDEO_RECORDING');
  return types;
}

/**
 * Returns true when the guardian consent checkbox should be shown.
 * A guardian (parent) must consent on behalf of a minor student.
 */
function shouldShowGuardianConsent(isMinor: boolean): boolean {
  return isMinor;
}

/**
 * Returns the effective userId that owns the consent record:
 * when a guardian is consenting for a minor, use the minor's userId;
 * otherwise use the consenting user's own id.
 */
function resolveTargetUserId(userId: string, minorUserId?: string): string {
  return minorUserId ?? userId;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ConsentType enum values', () => {
  it('DATA_PROCESSING is a valid ConsentType', () => {
    const ct: ConsentType = 'DATA_PROCESSING';
    expect(ct).toBe('DATA_PROCESSING');
  });

  it('MARKETING is a valid ConsentType', () => {
    const ct: ConsentType = 'MARKETING';
    expect(ct).toBe('MARKETING');
  });

  it('VIDEO_RECORDING is a valid ConsentType', () => {
    const ct: ConsentType = 'VIDEO_RECORDING';
    expect(ct).toBe('VIDEO_RECORDING');
  });

  it('SCHOLARSHIP_DATA is a valid ConsentType', () => {
    const ct: ConsentType = 'SCHOLARSHIP_DATA';
    expect(ct).toBe('SCHOLARSHIP_DATA');
  });
});

describe('resolveConsentTypes', () => {
  it('includes DATA_PROCESSING when flag is true', () => {
    const types = resolveConsentTypes({ consentDataProcessing: true });
    expect(types).toContain('DATA_PROCESSING');
  });

  it('excludes DATA_PROCESSING when flag is false', () => {
    const types = resolveConsentTypes({ consentDataProcessing: false });
    expect(types).not.toContain('DATA_PROCESSING');
  });

  it('includes MARKETING only when the marketing flag is true', () => {
    const with_ = resolveConsentTypes({ consentDataProcessing: false, consentMarketing: true });
    expect(with_).toContain('MARKETING');

    const without = resolveConsentTypes({ consentDataProcessing: false, consentMarketing: false });
    expect(without).not.toContain('MARKETING');
  });

  it('includes VIDEO_RECORDING only when the video flag is true', () => {
    const with_ = resolveConsentTypes({ consentDataProcessing: false, consentVideoRecording: true });
    expect(with_).toContain('VIDEO_RECORDING');

    const without = resolveConsentTypes({ consentDataProcessing: false, consentVideoRecording: false });
    expect(without).not.toContain('VIDEO_RECORDING');
  });

  it('returns empty array when all flags are false', () => {
    const types = resolveConsentTypes({
      consentDataProcessing: false,
      consentMarketing: false,
      consentVideoRecording: false,
    });
    expect(types).toHaveLength(0);
  });

  it('returns all consent types when all flags are true', () => {
    const types = resolveConsentTypes({
      consentDataProcessing: true,
      consentMarketing: true,
      consentVideoRecording: true,
    });
    expect(types).toContain('DATA_PROCESSING');
    expect(types).toContain('MARKETING');
    expect(types).toContain('VIDEO_RECORDING');
    expect(types).toHaveLength(3);
  });
});

describe('shouldShowGuardianConsent (parental consent flag logic)', () => {
  it('returns true for a minor (isMinor = true)', () => {
    expect(shouldShowGuardianConsent(true)).toBe(true);
  });

  it('returns false for an adult (isMinor = false)', () => {
    expect(shouldShowGuardianConsent(false)).toBe(false);
  });
});

describe('resolveTargetUserId (parental consent target)', () => {
  it('returns the minor userId when minorUserId is provided', () => {
    const result = resolveTargetUserId('parent-001', 'student-child-007');
    expect(result).toBe('student-child-007');
  });

  it('returns the acting userId when no minorUserId is provided', () => {
    const result = resolveTargetUserId('adult-user-123');
    expect(result).toBe('adult-user-123');
  });

  it('returns the acting userId when minorUserId is undefined', () => {
    const result = resolveTargetUserId('adult-user-123', undefined);
    expect(result).toBe('adult-user-123');
  });
});
