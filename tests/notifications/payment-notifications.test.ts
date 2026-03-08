import { describe, it, expect } from 'vitest';
import { buildPaymentNotifications } from '@/lib/notifications/payment-notifications';

const mockData = {
  invoiceId: 'inv-123',
  payerId: 'student-1',
  payerName: 'Test Student',
  payerEmail: 'test@example.com',
  teacherId: 'teacher-1',
  teacherName: 'Test Teacher',
  conservatoriumId: 'cons-15',
  amount: 500,
  currency: 'ILS',
  invoiceNumber: 'INV-2026-001',
  packageTitle: 'Monthly Package',
};

describe('buildPaymentNotifications', () => {
  it('creates payer notification', () => {
    const notifications = buildPaymentNotifications(mockData);
    const payerNotif = notifications.find(n => n.userId === 'student-1');
    expect(payerNotif).toBeTruthy();
    expect(payerNotif?.title).toBe('Payment received');
    expect(payerNotif?.message).toContain('500');
    expect(payerNotif?.link).toBe('/dashboard/billing');
  });

  it('creates teacher notification when teacherId provided', () => {
    const notifications = buildPaymentNotifications(mockData);
    const teacherNotif = notifications.find(n => n.userId === 'teacher-1');
    expect(teacherNotif).toBeTruthy();
    expect(teacherNotif?.title).toBe('New student enrolled');
    expect(teacherNotif?.message).toContain('Test Student');
  });

  it('skips teacher notification when teacherId not provided', () => {
    const { teacherId: _, ...dataWithoutTeacher } = mockData;
    const notifications = buildPaymentNotifications(dataWithoutTeacher);
    expect(notifications.length).toBe(1);
    expect(notifications[0].userId).toBe('student-1');
  });

  it('generates unique notification IDs', () => {
    const n1 = buildPaymentNotifications({ ...mockData, invoiceId: 'inv-a' });
    const n2 = buildPaymentNotifications({ ...mockData, invoiceId: 'inv-b' });
    const ids1 = n1.map(n => n.id);
    const ids2 = n2.map(n => n.id);
    expect(ids1).not.toEqual(ids2);
  });
});
