import { describe, it, expect } from 'vitest';
import {
  computeConservatoriumSourceHash,
  computeUserSourceHash,
} from '@/lib/utils/translation-hash';

describe('computeConservatoriumSourceHash', () => {
  it('returns a 16-character hex string', () => {
    const hash = computeConservatoriumSourceHash({ name: 'Test School' });
    expect(hash).toHaveLength(16);
    expect(hash).toMatch(/^[0-9a-f]{16}$/);
  });

  it('returns consistent hash for the same input', () => {
    const input = { name: 'School A', about: 'About text' };
    const h1 = computeConservatoriumSourceHash(input);
    const h2 = computeConservatoriumSourceHash(input);
    expect(h1).toBe(h2);
  });

  it('returns different hashes for different names', () => {
    const h1 = computeConservatoriumSourceHash({ name: 'School A' });
    const h2 = computeConservatoriumSourceHash({ name: 'School B' });
    expect(h1).not.toBe(h2);
  });

  it('handles empty conservatorium object (all fields undefined)', () => {
    const hash = computeConservatoriumSourceHash({});
    expect(hash).toHaveLength(16);
  });

  it('incorporates departments into the hash', () => {
    const base = { name: 'School' };
    const withDepts = { name: 'School', departments: [{ name: 'Piano' }] };
    expect(computeConservatoriumSourceHash(base)).not.toBe(
      computeConservatoriumSourceHash(withDepts)
    );
  });

  it('incorporates programs into the hash', () => {
    const h1 = computeConservatoriumSourceHash({ name: 'X', programs: ['Jazz'] });
    const h2 = computeConservatoriumSourceHash({ name: 'X', programs: ['Classical'] });
    expect(h1).not.toBe(h2);
  });

  it('incorporates branchesInfo into the hash', () => {
    const h1 = computeConservatoriumSourceHash({
      name: 'X',
      branchesInfo: [{ name: 'Branch A', address: 'Addr 1' }],
    });
    const h2 = computeConservatoriumSourceHash({
      name: 'X',
      branchesInfo: [{ name: 'Branch B', address: 'Addr 2' }],
    });
    expect(h1).not.toBe(h2);
  });

  it('incorporates leadingTeam into the hash', () => {
    const h1 = computeConservatoriumSourceHash({
      name: 'X',
      leadingTeam: [{ name: 'Alice', role: 'Director', bio: 'Bio A' }],
    });
    const h2 = computeConservatoriumSourceHash({
      name: 'X',
      leadingTeam: [{ name: 'Bob', role: 'Manager', bio: 'Bio B' }],
    });
    expect(h1).not.toBe(h2);
  });

  it('incorporates manager fields into the hash', () => {
    const h1 = computeConservatoriumSourceHash({ name: 'X', manager: { role: 'Dir', bio: 'Bio 1', name: 'Alice' } });
    const h2 = computeConservatoriumSourceHash({ name: 'X', manager: { role: 'Dir', bio: 'Bio 2', name: 'Alice' } });
    expect(h1).not.toBe(h2);
  });

  it('incorporates pedagogicalCoordinator fields into the hash', () => {
    const h1 = computeConservatoriumSourceHash({
      name: 'X',
      pedagogicalCoordinator: { role: 'Coord', bio: 'Bio 1', name: 'Z' },
    });
    const h2 = computeConservatoriumSourceHash({
      name: 'X',
      pedagogicalCoordinator: { role: 'Coord', bio: 'Bio 2', name: 'Z' },
    });
    expect(h1).not.toBe(h2);
  });
});

describe('computeUserSourceHash', () => {
  it('returns a 16-character hex string', () => {
    const hash = computeUserSourceHash('A bio', 'Teacher');
    expect(hash).toHaveLength(16);
    expect(hash).toMatch(/^[0-9a-f]{16}$/);
  });

  it('returns consistent hash for the same inputs', () => {
    const h1 = computeUserSourceHash('bio text', 'pianist');
    const h2 = computeUserSourceHash('bio text', 'pianist');
    expect(h1).toBe(h2);
  });

  it('returns different hashes for different bios', () => {
    const h1 = computeUserSourceHash('bio A', 'role');
    const h2 = computeUserSourceHash('bio B', 'role');
    expect(h1).not.toBe(h2);
  });

  it('returns different hashes for different roles', () => {
    const h1 = computeUserSourceHash('bio', 'teacher');
    const h2 = computeUserSourceHash('bio', 'director');
    expect(h1).not.toBe(h2);
  });

  it('handles undefined bio and role', () => {
    const hash = computeUserSourceHash(undefined, undefined);
    expect(hash).toHaveLength(16);
  });

  it('handles only bio provided', () => {
    const hash = computeUserSourceHash('some bio');
    expect(hash).toHaveLength(16);
  });
});
