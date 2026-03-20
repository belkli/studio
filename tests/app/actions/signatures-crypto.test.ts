import { describe, it, expect } from 'vitest';

describe('crypto security utilities', () => {
  it('crypto.randomUUID produces valid UUID format', () => {
    const id = crypto.randomUUID();
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  });

  it('crypto.randomUUID produces unique values', () => {
    const ids = new Set(Array.from({ length: 100 }, () => crypto.randomUUID()));
    expect(ids.size).toBe(100);
  });
});
