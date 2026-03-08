import { describe, it, expect } from 'vitest';
import {
  AuthDomainContext,
  UsersDomainContext,
  LessonsDomainContext,
  RepertoireDomainContext,
  CommsDomainContext,
  InstrumentsDomainContext,
  EventsDomainContext,
  AdminDomainContext,
} from '@/hooks/domains';

describe('domain context isolation', () => {
  it('each domain has its own React context object', () => {
    const contexts = [
      AuthDomainContext,
      UsersDomainContext,
      LessonsDomainContext,
      RepertoireDomainContext,
      CommsDomainContext,
      InstrumentsDomainContext,
      EventsDomainContext,
      AdminDomainContext,
    ];
    // All 8 contexts exist
    contexts.forEach(ctx => expect(ctx).toBeDefined());
    // All 8 contexts are distinct objects (isolation guarantee)
    const unique = new Set(contexts);
    expect(unique.size).toBe(8);
  });
});
