/**
 * Unit tests for WaitlistOfferBanner component.
 *
 * Verifies:
 *  - Returns null when user is null
 *  - Returns null when no active OFFERED entries for this user
 *  - Renders offer card when user has an OFFERED entry with future expiry
 *  - Shows countdown text ("expiresIn")
 *  - Links to /dashboard/waitlist/offer/{id}
 *  - Shows deferredCount text when deferredCount > 0
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import type { WaitlistEntry, User } from '@/lib/types';

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockUseAuth = vi.fn();

vi.mock('@/hooks/use-auth', () => ({
  useAuth: () => mockUseAuth(),
  AuthContext: React.createContext(null),
}));

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string, params?: Record<string, unknown>) => {
    if (params) {
      // Return key with params for verification
      return `${key}:${JSON.stringify(params)}`;
    }
    return key;
  },
}));

vi.mock('@/i18n/routing', () => ({
  Link: ({ href, children, ...rest }: any) => (
    <a href={href} data-testid="link" {...rest}>
      {children}
    </a>
  ),
}));

vi.mock('lucide-react', () => ({
  Clock: (props: any) => <svg data-testid="clock-icon" {...props} />,
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

const parentUser: User = {
  id: 'parent-user-1',
  name: 'Test Parent',
  email: 'parent@test.com',
  role: 'parent',
  conservatoriumId: 'cons-15',
  childIds: ['student-user-1'],
} as User;

const teacherUser: User = {
  id: 'teacher-1',
  name: 'Mrs. Teacher',
  email: 'teacher@test.com',
  role: 'teacher',
  conservatoriumId: 'cons-15',
} as User;

const studentUser: User = {
  id: 'student-user-1',
  name: 'Little Student',
  email: 'student@test.com',
  role: 'student',
  conservatoriumId: 'cons-15',
} as User;

function makeOfferedEntry(overrides: Partial<WaitlistEntry> = {}): WaitlistEntry {
  return {
    id: 'wl-entry-100',
    studentId: 'student-user-1',
    teacherId: 'teacher-1',
    conservatoriumId: 'cons-15',
    instrument: 'Piano',
    preferredDays: ['SUN'],
    preferredTimes: [],
    joinedAt: new Date(Date.now() - 86400000).toISOString(),
    status: 'OFFERED',
    offeredSlotId: 'slot-abc',
    offeredSlotTime: 'Sun 14:00',
    offerExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24h from now
    ...overrides,
  };
}

function setupAuth(overrides: Record<string, unknown> = {}) {
  mockUseAuth.mockReturnValue({
    user: parentUser,
    waitlist: [],
    users: [parentUser, teacherUser, studentUser],
    ...overrides,
  });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

// Lazy import so mocks are registered before the module loads
let WaitlistOfferBanner: React.FC;

beforeEach(async () => {
  vi.clearAllMocks();
  const mod = await import('@/components/dashboard/waitlist-offer-banner');
  WaitlistOfferBanner = mod.WaitlistOfferBanner;
});

describe('WaitlistOfferBanner', () => {
  it('returns null when user is null', () => {
    setupAuth({ user: null });
    const { container } = render(<WaitlistOfferBanner />);
    expect(container.innerHTML).toBe('');
  });

  it('returns null when no active OFFERED entries for this user', () => {
    setupAuth({ waitlist: [] });
    const { container } = render(<WaitlistOfferBanner />);
    expect(container.innerHTML).toBe('');
  });

  it('returns null when all entries are in non-OFFERED status', () => {
    setupAuth({
      waitlist: [
        makeOfferedEntry({ status: 'WAITING' }),
        makeOfferedEntry({ id: 'wl-entry-200', status: 'ACCEPTED' }),
      ],
    });
    const { container } = render(<WaitlistOfferBanner />);
    expect(container.innerHTML).toBe('');
  });

  it('returns null when OFFERED entry has expired offerExpiresAt', () => {
    setupAuth({
      waitlist: [
        makeOfferedEntry({
          offerExpiresAt: new Date(Date.now() - 60_000).toISOString(), // expired 1 min ago
        }),
      ],
    });
    const { container } = render(<WaitlistOfferBanner />);
    expect(container.innerHTML).toBe('');
  });

  it('renders offer card when user has an OFFERED entry with future expiry', () => {
    setupAuth({
      waitlist: [makeOfferedEntry()],
    });
    render(<WaitlistOfferBanner />);
    // The banner title text key
    expect(screen.getByText('offerBanner')).toBeInTheDocument();
    // Instrument and teacher info
    expect(screen.getByText(/Piano/)).toBeInTheDocument();
    expect(screen.getByText(/Mrs. Teacher/)).toBeInTheDocument();
  });

  it('shows countdown text (expiresIn)', () => {
    setupAuth({
      waitlist: [makeOfferedEntry()],
    });
    render(<WaitlistOfferBanner />);
    // The countdown renders "expiresIn: Xh Xm Xs"
    expect(screen.getByText(/expiresIn/)).toBeInTheDocument();
  });

  it('links to /dashboard/waitlist/offer/{id}', () => {
    setupAuth({
      waitlist: [makeOfferedEntry()],
    });
    render(<WaitlistOfferBanner />);
    const link = screen.getByTestId('link');
    expect(link).toHaveAttribute('href', '/dashboard/waitlist/offer/wl-entry-100');
    // Link contains the CTA text key
    expect(link).toHaveTextContent('reviewAndRespond');
  });

  it('shows deferredCount text when deferredCount > 0', () => {
    setupAuth({
      waitlist: [makeOfferedEntry({ deferredCount: 1 })],
    });
    render(<WaitlistOfferBanner />);
    // The deferred count message includes both count and max
    expect(screen.getByText(/deferredCount/)).toBeInTheDocument();
    expect(screen.getByText(/\"count\":1/)).toBeInTheDocument();
    expect(screen.getByText(/\"max\":2/)).toBeInTheDocument();
  });

  it('does not show deferredCount text when deferredCount is 0', () => {
    setupAuth({
      waitlist: [makeOfferedEntry({ deferredCount: 0 })],
    });
    render(<WaitlistOfferBanner />);
    expect(screen.queryByText(/deferredCount/)).not.toBeInTheDocument();
  });

  it('shows student name when entry is for a child (not user themselves)', () => {
    setupAuth({
      waitlist: [makeOfferedEntry()],
    });
    render(<WaitlistOfferBanner />);
    // studentUser.name should appear since studentId !== user.id
    expect(screen.getByText(/Little Student/)).toBeInTheDocument();
  });

  it('shows slot time when offeredSlotTime is present', () => {
    setupAuth({
      waitlist: [makeOfferedEntry({ offeredSlotTime: 'Sun 14:00' })],
    });
    render(<WaitlistOfferBanner />);
    expect(screen.getByText(/Sun 14:00/)).toBeInTheDocument();
  });

  it('renders multiple offers when user has multiple OFFERED entries', () => {
    setupAuth({
      waitlist: [
        makeOfferedEntry({ id: 'wl-entry-100', instrument: 'Piano' }),
        makeOfferedEntry({ id: 'wl-entry-200', instrument: 'Guitar' }),
      ],
    });
    render(<WaitlistOfferBanner />);
    const links = screen.getAllByTestId('link');
    expect(links).toHaveLength(2);
    expect(links[0]).toHaveAttribute('href', '/dashboard/waitlist/offer/wl-entry-100');
    expect(links[1]).toHaveAttribute('href', '/dashboard/waitlist/offer/wl-entry-200');
  });
});
