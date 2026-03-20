import { describe, it, expect } from 'vitest';
import { createHash } from 'crypto';

describe('documentHash computation', () => {
  it('SHA-256 produces 64-char hex string', () => {
    const content = 'Test document content';
    const hash = createHash('sha256').update(content).digest('hex');
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('empty string produces consistent hash', () => {
    const hash1 = createHash('sha256').update('').digest('hex');
    const hash2 = createHash('sha256').update('').digest('hex');
    expect(hash1).toBe(hash2);
  });

  it('different inputs produce different hashes', () => {
    const hash1 = createHash('sha256').update('document A').digest('hex');
    const hash2 = createHash('sha256').update('document B').digest('hex');
    expect(hash1).not.toBe(hash2);
  });

  it('JSON.stringify of form produces valid hash for audit trail', () => {
    const form = {
      id: 'form-123',
      studentName: 'Test Student',
      formType: 'רסיטל בגרות',
      status: 'PENDING_APPROVAL',
    };
    const hash = createHash('sha256').update(JSON.stringify(form)).digest('hex');
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
    expect(hash).toHaveLength(64);
  });
});
