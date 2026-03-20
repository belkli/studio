import { it, expect } from 'vitest';
import type { ComplianceLog } from '@/lib/types';

it('ComplianceLog accepts new action values', () => {
  const log: ComplianceLog = {
    id: 'test-1',
    action: 'PII_READ',
    subjectId: 'user-1',
    reason: 'data fetch',
    performedAt: new Date().toISOString(),
    performedBy: 'user-1',
    conservatoriumId: 'cons-1',
  };
  expect(log.action).toBe('PII_READ');
});

// Compile-time coverage for all 4 new action values
const _a: ComplianceLog['action'] = 'SENSITIVE_DATA_ACCESS';
const _b: ComplianceLog['action'] = 'MARKETING_MESSAGE_SENT';
const _c: ComplianceLog['action'] = 'OTP_GENERATED';
void _a; void _b; void _c;
