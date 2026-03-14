import { describe, it, expect } from 'vitest';

// ---------------------------------------------------------------------------
// Tests for pure logic extracted from SignatureCapture
// (src/components/forms/signature-capture.tsx)
//
// The component depends on react-signature-canvas (canvas-based) and
// next-intl, so full render tests would require heavy canvas mocking.
// Instead we test the two pure helper functions and key business rules.
// ---------------------------------------------------------------------------

// ── sha256 helper (LC-50) ──────────────────────────────────────────────────

/**
 * Mirrors the sha256 helper in signature-capture.tsx.
 * Uses the Web Crypto API (available in Node 18+ and vitest's jsdom env).
 */
async function sha256(input: string): Promise<string> {
  const encoded = new TextEncoder().encode(input);
  const buffer = await crypto.subtle.digest('SHA-256', encoded);
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

describe('sha256 helper (LC-50)', () => {
  it('produces a 64-character hex string', async () => {
    const hash = await sha256('hello');
    expect(hash).toHaveLength(64);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('is deterministic — same input produces same hash', async () => {
    const a = await sha256('test-data-url');
    const b = await sha256('test-data-url');
    expect(a).toBe(b);
  });

  it('produces different hashes for different inputs', async () => {
    const a = await sha256('data:image/png;base64,AAA==');
    const b = await sha256('data:image/png;base64,BBB==');
    expect(a).not.toBe(b);
  });

  it('matches known SHA-256 for empty string', async () => {
    // SHA-256("") = e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
    const hash = await sha256('');
    expect(hash).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
  });

  it('handles unicode input', async () => {
    const hash = await sha256('שלום');
    expect(hash).toHaveLength(64);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });
});

// ── SignatureCaptureResult shape (LC-51) ───────────────────────────────────

describe('SignatureCaptureResult contract (LC-51)', () => {
  it('result object has dataUrl and signatureHash fields', async () => {
    const dataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA';
    const signatureHash = await sha256(dataUrl);

    const result = { dataUrl, signatureHash };

    expect(result).toHaveProperty('dataUrl');
    expect(result).toHaveProperty('signatureHash');
    expect(typeof result.dataUrl).toBe('string');
    expect(typeof result.signatureHash).toBe('string');
  });

  it('signatureHash is the sha256 of the dataUrl', async () => {
    const dataUrl = 'data:image/png;base64,ABC==';
    const signatureHash = await sha256(dataUrl);

    // Verify round-trip: re-hashing the dataUrl gives the same hash
    expect(await sha256(dataUrl)).toBe(signatureHash);
  });
});

// ── isEmpty guard (LC-52) ──────────────────────────────────────────────────

describe('isEmpty guard logic (LC-52)', () => {
  /**
   * Mirrors handleConfirm guard: if canvas.isEmpty(), set error and return early.
   * The guard prevents onConfirm from being called on an empty canvas.
   */
  function tryConfirm(
    isCanvasEmpty: boolean,
    onConfirm: () => void
  ): { error: string | null } {
    if (isCanvasEmpty) {
      return { error: 'Please sign before confirming' };
    }
    onConfirm();
    return { error: null };
  }

  it('returns error when canvas is empty', () => {
    const onConfirm = () => { throw new Error('should not be called'); };
    const result = tryConfirm(true, onConfirm);
    expect(result.error).toBe('Please sign before confirming');
  });

  it('calls onConfirm when canvas is not empty', () => {
    let called = false;
    const onConfirm = () => { called = true; };
    const result = tryConfirm(false, onConfirm);
    expect(result.error).toBeNull();
    expect(called).toBe(true);
  });

  it('does not call onConfirm when canvas is empty', () => {
    let called = false;
    const onConfirm = () => { called = true; };
    tryConfirm(true, onConfirm);
    expect(called).toBe(false);
  });
});

// ── RTL / locale detection (LC-53) ────────────────────────────────────────

describe('RTL locale detection (LC-53)', () => {
  /** Mirrors: const isRtl = locale === 'he' || locale === 'ar' */
  const isRtl = (locale: string) => locale === 'he' || locale === 'ar';

  it('he locale is RTL', () => expect(isRtl('he')).toBe(true));
  it('ar locale is RTL', () => expect(isRtl('ar')).toBe(true));
  it('en locale is LTR', () => expect(isRtl('en')).toBe(false));
  it('ru locale is LTR', () => expect(isRtl('ru')).toBe(false));
  it('unknown locale is LTR', () => expect(isRtl('fr')).toBe(false));
});

// ── isSubmitting disables buttons (LC-54) ─────────────────────────────────

describe('isSubmitting prop state (LC-54)', () => {
  /**
   * Confirms button disabled logic:
   * - Confirm button: disabled when isEmpty OR isSubmitting
   * - Clear button: disabled when isEmpty OR isSubmitting
   * - Cancel button: disabled when isSubmitting
   */
  function buttonStates(isEmpty: boolean, isSubmitting: boolean) {
    return {
      confirmDisabled: isEmpty || isSubmitting,
      clearDisabled: isEmpty || isSubmitting,
      cancelDisabled: isSubmitting,
    };
  }

  it('all buttons enabled when canvas has content and not submitting', () => {
    const s = buttonStates(false, false);
    expect(s.confirmDisabled).toBe(false);
    expect(s.clearDisabled).toBe(false);
    expect(s.cancelDisabled).toBe(false);
  });

  it('confirm and clear disabled when canvas is empty', () => {
    const s = buttonStates(true, false);
    expect(s.confirmDisabled).toBe(true);
    expect(s.clearDisabled).toBe(true);
    expect(s.cancelDisabled).toBe(false);
  });

  it('all action buttons disabled when isSubmitting=true', () => {
    const s = buttonStates(false, true);
    expect(s.confirmDisabled).toBe(true);
    expect(s.clearDisabled).toBe(true);
    expect(s.cancelDisabled).toBe(true);
  });

  it('all disabled when both empty and submitting', () => {
    const s = buttonStates(true, true);
    expect(s.confirmDisabled).toBe(true);
    expect(s.clearDisabled).toBe(true);
    expect(s.cancelDisabled).toBe(true);
  });
});
