import { describe, it, expect, vi } from 'vitest';

const { mockCreate } = vi.hoisted(() => ({
  mockCreate: vi.fn().mockResolvedValue({ id: 'log-1' }),
}));

vi.mock('@/lib/db', () => ({
  getDb: vi.fn().mockResolvedValue({
    complianceLogs: {
      create: mockCreate,
    },
  }),
}));

import { logAccess } from '@/lib/compliance-log';

describe('logAccess', () => {
  it('calls db.complianceLogs.create with correct fields', async () => {
    await logAccess({
      userId: 'user-1',
      conservatoriumId: 'cons-1',
      resourceType: 'ScholarshipApplication',
      resourceId: 'app-42',
      action: 'SENSITIVE_DATA_ACCESS',
    });
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'SENSITIVE_DATA_ACCESS',
        subjectId: 'app-42',
        performedBy: 'user-1',
        conservatoriumId: 'cons-1',
      })
    );
  });

  it('does not throw on db failure — fire-and-forget', async () => {
    mockCreate.mockRejectedValueOnce(new Error('DB down'));
    await expect(logAccess({
      userId: 'user-1',
      conservatoriumId: 'cons-1',
      resourceType: 'Teacher',
      resourceId: 'teacher-1',
      action: 'PII_READ',
    })).resolves.not.toThrow();
  });
});
