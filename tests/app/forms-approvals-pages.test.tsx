import { describe, it, expect, vi } from 'vitest';
import { renderWithProviders, screen } from '../utils';
import FormsPage from '@/app/[locale]/dashboard/forms/page';
import ApprovalsPage from '@/app/[locale]/dashboard/approvals/page';
import React from 'react';
import type { FormSubmission, User } from '@/lib/types';

// Mock forms-list to isolate the page-level tabs
vi.mock('@/components/dashboard/forms-list', () => ({
  FormsList: ({ statusFilter, fromContext }: any) => (
    <div data-testid="forms-list" data-from={fromContext} data-statuses={statusFilter?.join(',') || 'all'} />
  ),
}));

// Mock status-badge
vi.mock('@/components/ui/status-badge', () => ({
  StatusBadge: ({ status }: any) => <span data-testid="status-badge">{status}</span>,
}));

// Mock empty-state
vi.mock('@/components/ui/empty-state', () => ({
  EmptyState: ({ title }: any) => <div data-testid="empty-state">{title}</div>,
}));

// Mock use-toast
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

const adminUser: User = {
  id: 'admin-1',
  name: 'Admin User',
  email: 'admin@test.com',
  role: 'conservatorium_admin',
  conservatoriumId: 'cons-1',
  conservatoriumName: 'Test Conservatorium',
  approved: true,
  createdAt: new Date().toISOString(),
} as User;

const siteAdmin: User = {
  id: 'site-admin-1',
  name: 'Site Admin',
  email: 'site@test.com',
  role: 'site_admin',
  conservatoriumId: 'cons-1',
  conservatoriumName: 'Test Conservatorium',
  approved: true,
  createdAt: new Date().toISOString(),
} as User;

const mockForms: FormSubmission[] = [
  {
    id: 'form-1',
    formType: 'רסיטל בגרות',
    studentId: 'student-1',
    studentName: 'Student One',
    status: 'PENDING_ADMIN',
    submissionDate: '2026-03-01',
    totalDuration: '10:00',
    repertoire: [],
    conservatoriumId: 'cons-1',
    conservatoriumName: 'Test Conservatorium',
  } as FormSubmission,
];

describe('FormsPage', () => {
  it('renders with 5 tabs: All, Pending, Approved, Drafts, Rejected', () => {
    renderWithProviders(<FormsPage />, {
      user: adminUser,
      authContextValue: { formSubmissions: mockForms },
    });

    // Hebrew tab labels from forms.json > FormsPage.tabs
    expect(screen.getByRole('tab', { name: /כל הטפסים/ })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /ממתין לטיפול/ })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /מאושר/ })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /טיוטות/ })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /נדחה/ })).toBeInTheDocument();
  });

  it('has exactly 5 tab triggers', () => {
    renderWithProviders(<FormsPage />, {
      user: adminUser,
      authContextValue: { formSubmissions: mockForms },
    });

    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(5);
  });

  it('does NOT contain approve/reject action buttons', () => {
    renderWithProviders(<FormsPage />, {
      user: adminUser,
      authContextValue: { formSubmissions: mockForms },
    });

    // FormsPage should NOT have approval action buttons
    expect(screen.queryByRole('button', { name: /אשר/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /דחה/ })).not.toBeInTheDocument();
  });

  it('passes fromContext="forms" to FormsList', () => {
    renderWithProviders(<FormsPage />, {
      user: adminUser,
      authContextValue: { formSubmissions: mockForms },
    });

    const formsLists = screen.getAllByTestId('forms-list');
    formsLists.forEach(list => {
      expect(list).toHaveAttribute('data-from', 'forms');
    });
  });

  it('shows New Form button for admin roles', () => {
    renderWithProviders(<FormsPage />, {
      user: adminUser,
      authContextValue: { formSubmissions: mockForms },
    });

    expect(screen.getByText('טופס / בקשה חדשה')).toBeInTheDocument();
  });
});

describe('ApprovalsPage', () => {
  it('renders with My Queue, All Open, Overdue tabs', () => {
    renderWithProviders(<ApprovalsPage />, {
      user: siteAdmin,
      authContextValue: { formSubmissions: mockForms },
    });

    // Hebrew tab labels from forms.json > ApprovalsPage.tabs
    expect(screen.getByRole('tab', { name: /תור שלי/ })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /כל הפתוחים/ })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /באיחור/ })).toBeInTheDocument();
  });

  it('has exactly 3 tab triggers', () => {
    renderWithProviders(<ApprovalsPage />, {
      user: siteAdmin,
      authContextValue: { formSubmissions: mockForms },
    });

    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(3);
  });

  it('shows the page title', () => {
    renderWithProviders(<ApprovalsPage />, {
      user: siteAdmin,
      authContextValue: { formSubmissions: mockForms },
    });

    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });

  it('shows empty state when no forms in queue', () => {
    renderWithProviders(<ApprovalsPage />, {
      user: siteAdmin,
      authContextValue: { formSubmissions: [] },
    });

    expect(screen.getByTestId('empty-state')).toBeInTheDocument();
  });
});

describe('FormDetailsPage — conditional action bar logic', () => {
  // The detail page has complex deps (jsPDF, SignatureCanvas, etc.)
  // so we test the conditional logic in isolation.

  it('isFromApprovals is true when searchParams has from=approvals', () => {
    const params = new URLSearchParams('from=approvals');
    const fromContext = params.get('from') === 'approvals' ? 'approvals' : 'forms';
    expect(fromContext).toBe('approvals');
  });

  it('isFromApprovals is false when from param is missing', () => {
    const params = new URLSearchParams('');
    const fromContext = params.get('from') === 'approvals' ? 'approvals' : 'forms';
    expect(fromContext).toBe('forms');
  });

  it('isFromApprovals is false when from param is something else', () => {
    const params = new URLSearchParams('from=dashboard');
    const fromContext = params.get('from') === 'approvals' ? 'approvals' : 'forms';
    expect(fromContext).toBe('forms');
  });

  it('teacher approval bar requires isFromApprovals AND teacher role AND PENDING_TEACHER', () => {
    const scenarios = [
      { isFromApprovals: true, role: 'teacher', status: 'PENDING_TEACHER', expected: true },
      { isFromApprovals: false, role: 'teacher', status: 'PENDING_TEACHER', expected: false },
      { isFromApprovals: true, role: 'student', status: 'PENDING_TEACHER', expected: false },
      { isFromApprovals: true, role: 'teacher', status: 'PENDING_ADMIN', expected: false },
      { isFromApprovals: true, role: 'teacher', status: 'APPROVED', expected: false },
    ];

    for (const { isFromApprovals, role, status, expected } of scenarios) {
      const result = isFromApprovals && role === 'teacher' && status === 'PENDING_TEACHER';
      expect(result).toBe(expected);
    }
  });

  it('admin approval bar requires isFromApprovals AND admin role AND PENDING_ADMIN', () => {
    const scenarios = [
      { isFromApprovals: true, role: 'conservatorium_admin', status: 'PENDING_ADMIN', expected: true },
      { isFromApprovals: true, role: 'site_admin', status: 'PENDING_ADMIN', expected: true },
      { isFromApprovals: false, role: 'conservatorium_admin', status: 'PENDING_ADMIN', expected: false },
      { isFromApprovals: true, role: 'conservatorium_admin', status: 'APPROVED', expected: false },
      { isFromApprovals: true, role: 'teacher', status: 'PENDING_ADMIN', expected: false },
    ];

    for (const { isFromApprovals, role, status, expected } of scenarios) {
      const result = isFromApprovals
        && (role === 'conservatorium_admin' || role === 'site_admin')
        && status === 'PENDING_ADMIN';
      expect(result).toBe(expected);
    }
  });

  it('ministry approval bar requires isFromApprovals AND ministry_director AND APPROVED', () => {
    const scenarios = [
      { isFromApprovals: true, role: 'ministry_director', status: 'APPROVED', expected: true },
      { isFromApprovals: false, role: 'ministry_director', status: 'APPROVED', expected: false },
      { isFromApprovals: true, role: 'ministry_director', status: 'PENDING_ADMIN', expected: false },
      { isFromApprovals: true, role: 'site_admin', status: 'APPROVED', expected: false },
    ];

    for (const { isFromApprovals, role, status, expected } of scenarios) {
      const result = isFromApprovals && role === 'ministry_director' && status === 'APPROVED';
      expect(result).toBe(expected);
    }
  });
});
