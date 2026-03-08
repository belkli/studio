import { describe, it, expect } from 'vitest';
import { AuthDomainContext } from '@/hooks/domains/auth-domain';

describe('AuthDomainContext', () => {
  it('context exists and is created', () => {
    expect(AuthDomainContext).toBeDefined();
  });
});
