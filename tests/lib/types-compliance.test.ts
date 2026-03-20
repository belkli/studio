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
