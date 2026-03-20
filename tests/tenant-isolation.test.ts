import { describe, it, expect } from 'vitest';
import { tenantUsers } from '@/lib/tenant-filter';
import { mockUsers } from '@/lib/data';

describe('tenant isolation — tenantUsers()', () => {
  it('returns only users from the specified conservatoriumId', () => {
    const consId = mockUsers.find(u => u.conservatoriumId)?.conservatoriumId ?? 'cons-1';
    const currentUser = { conservatoriumId: consId, role: 'conservatorium_admin' as const };
    const result = tenantUsers(mockUsers, currentUser, 'teacher');
    expect(result.every(u => u.conservatoriumId === consId)).toBe(true);
    expect(result.every(u => u.role === 'teacher')).toBe(true);
  });

  it('returns empty array for unknown conservatoriumId', () => {
    const currentUser = { conservatoriumId: 'cons-NONEXISTENT', role: 'conservatorium_admin' as const };
    const result = tenantUsers(mockUsers, currentUser, 'teacher');
    expect(result).toHaveLength(0);
  });

  it('site_admin sees all users regardless of conservatoriumId', () => {
    const currentUser = { conservatoriumId: 'cons-1', role: 'site_admin' as const };
    const result = tenantUsers(mockUsers, currentUser, 'teacher');
    const allTeachers = mockUsers.filter(u => u.role === 'teacher');
    expect(result.length).toBeGreaterThan(0);
    expect(result).toHaveLength(allTeachers.length);
  });

  it('ministry_director sees all users regardless of conservatoriumId', () => {
    const currentUser = { conservatoriumId: 'cons-1', role: 'ministry_director' as const };
    const result = tenantUsers(mockUsers, currentUser, 'student');
    const allStudents = mockUsers.filter(u => u.role === 'student');
    expect(result).toHaveLength(allStudents.length);
  });

  it('filters multiple roles at once', () => {
    const consId = mockUsers.find(u => u.conservatoriumId)?.conservatoriumId ?? 'cons-1';
    const currentUser = { conservatoriumId: consId, role: 'conservatorium_admin' as const };
    const result = tenantUsers(mockUsers, currentUser, 'teacher', 'student');
    expect(result.every(u => u.conservatoriumId === consId)).toBe(true);
    expect(result.every(u => u.role === 'teacher' || u.role === 'student')).toBe(true);
  });
});
