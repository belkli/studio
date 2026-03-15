import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { renderWithProviders, screen } from '../utils';
import { AssignMusicianSheet } from '@/components/dashboard/harmonia/assign-musician-sheet';
import type { PerformanceBooking, User } from '@/lib/types';

// Mock Sheet/portal components to render inline (avoids Radix portal issues in jsdom)
vi.mock('@/components/ui/sheet', () => ({
  Sheet: ({ children, open }: any) => open ? <div data-testid="mock-sheet">{children}</div> : null,
  SheetContent: ({ children }: any) => <div data-testid="sheet-content">{children}</div>,
  SheetHeader: ({ children }: any) => <div>{children}</div>,
  SheetTitle: ({ children }: any) => <h2>{children}</h2>,
  SheetDescription: ({ children }: any) => <p>{children}</p>,
}));

vi.mock('@/components/ui/scroll-area', () => ({
  ScrollArea: ({ children }: any) => <div>{children}</div>,
}));

vi.mock('@/components/ui/select', () => ({
  Select: ({ children, onValueChange, value }: any) => <div data-value={value}>{children}</div>,
  SelectTrigger: ({ children }: any) => <button>{children}</button>,
  SelectValue: ({ placeholder }: any) => <span>{placeholder}</span>,
  SelectContent: ({ children }: any) => <div>{children}</div>,
  SelectItem: ({ children, value }: any) => <option value={value}>{children}</option>,
}));

vi.mock('@/lib/placeholder-images', () => ({
  PlaceHolderImages: [],
}));

vi.mock('@/lib/tenant-filter', () => ({
  tenantUsers: (_users: User[], _current: any, role: string) =>
    _users.filter((u: User) => u.role === role),
}));

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

const adminUser: Partial<User> = {
  id: 'admin-1',
  name: 'Admin',
  email: 'admin@test.com',
  role: 'conservatorium_admin',
  conservatoriumId: 'cons-1',
};

function makePerformer(id: string, name: string, rate?: number): Partial<User> {
  return {
    id,
    name,
    email: `${id}@test.com`,
    role: 'teacher',
    conservatoriumId: 'cons-1',
    instruments: [{ instrument: 'Piano', level: 'advanced' }],
    availability: [
      { dayOfWeek: 'SUN', startTime: '09:00', endTime: '17:00' },
    ],
    performanceProfile: {
      isOptedIn: true,
      adminApproved: true,
      performanceRatePerHour: rate ?? 150,
    },
  };
}

const performer1 = makePerformer('perf-1', 'Alice Pianist', 200);
const performer2 = makePerformer('perf-2', 'Bob Violinist', 300);

const mockBooking: PerformanceBooking = {
  id: 'booking-1',
  conservatoriumId: 'cons-1',
  status: 'MUSICIANS_NEEDED',
  inquiryReceivedAt: '2026-03-01T00:00:00.000Z',
  eventName: 'Spring Gala',
  eventType: 'CONCERT',
  eventDate: '2026-04-05', // Sunday
  eventTime: '19:00',
  clientName: 'Client',
  clientEmail: 'c@test.com',
  clientPhone: '050',
  totalQuote: 5000,
  eventDurationHours: 2,
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('AssignMusicianSheet', () => {
  const onOpenChange = vi.fn();
  const onConfirm = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not render content when open=false', () => {
    renderWithProviders(
      <AssignMusicianSheet
        booking={mockBooking}
        open={false}
        onOpenChange={onOpenChange}
        onConfirm={onConfirm}
      />,
      {
        user: adminUser as User,
        authContextValue: {
          user: adminUser,
          users: [adminUser, performer1, performer2] as User[],
          lessons: [],
          performanceBookings: [],
        },
      }
    );

    expect(screen.queryByTestId('mock-sheet')).not.toBeInTheDocument();
  });

  it('renders sheet with title and event info when open', () => {
    renderWithProviders(
      <AssignMusicianSheet
        booking={mockBooking}
        open={true}
        onOpenChange={onOpenChange}
        onConfirm={onConfirm}
      />,
      {
        user: adminUser as User,
        authContextValue: {
          user: adminUser,
          users: [adminUser, performer1, performer2] as User[],
          lessons: [],
          performanceBookings: [],
        },
      }
    );

    expect(screen.getByTestId('mock-sheet')).toBeInTheDocument();
    // Title is "שיבוץ מוזיקאים"
    expect(screen.getByText('שיבוץ מוזיקאים')).toBeInTheDocument();
    // Event name should appear
    expect(screen.getByText('Spring Gala')).toBeInTheDocument();
  });

  it('displays available performers by name', () => {
    renderWithProviders(
      <AssignMusicianSheet
        booking={mockBooking}
        open={true}
        onOpenChange={onOpenChange}
        onConfirm={onConfirm}
      />,
      {
        user: adminUser as User,
        authContextValue: {
          user: adminUser,
          users: [adminUser, performer1, performer2] as User[],
          lessons: [],
          performanceBookings: [],
        },
      }
    );

    expect(screen.getByText('Alice Pianist')).toBeInTheDocument();
    expect(screen.getByText('Bob Violinist')).toBeInTheDocument();
  });

  it('shows availability badges', () => {
    renderWithProviders(
      <AssignMusicianSheet
        booking={mockBooking}
        open={true}
        onOpenChange={onOpenChange}
        onConfirm={onConfirm}
      />,
      {
        user: adminUser as User,
        authContextValue: {
          user: adminUser,
          users: [adminUser, performer1, performer2] as User[],
          lessons: [],
          performanceBookings: [],
        },
      }
    );

    // Both performers are available on Sunday, so should see "זמין" badges
    const availableBadges = screen.getAllByText('זמין');
    expect(availableBadges.length).toBeGreaterThanOrEqual(2);
  });

  it('shows rate per hour for performers', () => {
    renderWithProviders(
      <AssignMusicianSheet
        booking={mockBooking}
        open={true}
        onOpenChange={onOpenChange}
        onConfirm={onConfirm}
      />,
      {
        user: adminUser as User,
        authContextValue: {
          user: adminUser,
          users: [adminUser, performer1, performer2] as User[],
          lessons: [],
          performanceBookings: [],
        },
      }
    );

    // Should display ₪200 and ₪300 rates
    expect(screen.getByText(/₪200/)).toBeInTheDocument();
    expect(screen.getByText(/₪300/)).toBeInTheDocument();
  });

  it('shows cancel and confirm buttons', () => {
    renderWithProviders(
      <AssignMusicianSheet
        booking={mockBooking}
        open={true}
        onOpenChange={onOpenChange}
        onConfirm={onConfirm}
      />,
      {
        user: adminUser as User,
        authContextValue: {
          user: adminUser,
          users: [adminUser, performer1, performer2] as User[],
          lessons: [],
          performanceBookings: [],
        },
      }
    );

    // Cancel button: "ביטול"
    expect(screen.getByText('ביטול')).toBeInTheDocument();
    // Confirm button uses count: "0 מוזיקאים - שבץ"
    expect(screen.getByText(/שבץ/)).toBeInTheDocument();
  });

  it('shows "no musicians" message when no performers match', () => {
    renderWithProviders(
      <AssignMusicianSheet
        booking={mockBooking}
        open={true}
        onOpenChange={onOpenChange}
        onConfirm={onConfirm}
      />,
      {
        user: adminUser as User,
        authContextValue: {
          user: adminUser,
          users: [adminUser] as User[], // no performers
          lessons: [],
          performanceBookings: [],
        },
      }
    );

    expect(screen.getByText('לא נמצאו מוזיקאים')).toBeInTheDocument();
  });

  it('shows filter controls', () => {
    renderWithProviders(
      <AssignMusicianSheet
        booking={mockBooking}
        open={true}
        onOpenChange={onOpenChange}
        onConfirm={onConfirm}
      />,
      {
        user: adminUser as User,
        authContextValue: {
          user: adminUser,
          users: [adminUser, performer1, performer2] as User[],
          lessons: [],
          performanceBookings: [],
        },
      }
    );

    // Filter heading
    expect(screen.getByText('סינון')).toBeInTheDocument();
    // Search placeholder
    expect(screen.getByPlaceholderText('חיפוש לפי שם...')).toBeInTheDocument();
  });
});
