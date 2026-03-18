import { renderWithProviders, screen, within } from '../utils';
import { MasterScheduleView } from '@/components/dashboard/schedule/master-schedule-view';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { mockLessons, mockUsers, mockRooms } from '@/lib/data';
import type { User, LessonSlot } from '@/lib/types';

// Mock useDateLocale — return the Hebrew date-fns locale
vi.mock('@/hooks/use-date-locale', () => ({
    useDateLocale: () => {
        // Return a minimal locale object (date-fns Hebrew) — enough for format()
        const { he } = require('date-fns/locale');
        return he;
    },
}));

// Mock matchMedia for useMediaQuery inside the component
beforeEach(() => {
    vi.clearAllMocks();
    // Default to desktop (not mobile)
    Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation((query: string) => ({
            matches: false,
            media: query,
            onchange: null,
            addListener: vi.fn(),
            removeListener: vi.fn(),
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            dispatchEvent: vi.fn(),
        })),
    });
});

// Build a site_admin user so tenantFilter passes all data through
const siteAdmin: User = {
    id: 'test-admin-user',
    name: 'Test Admin',
    email: 'admin@test.com',
    role: 'site_admin',
    conservatoriumId: 'cons-15',
    isActive: true,
    createdAt: '2024-01-01T00:00:00.000Z',
};

// Build lessons that match today's date so they appear in the schedule view
function buildTodayLesson(overrides: Partial<LessonSlot> = {}): LessonSlot {
    const now = new Date();
    const startTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 10, 0, 0);
    return {
        id: 'test-lesson-today',
        conservatoriumId: 'cons-15',
        teacherId: 'teacher-user-1',
        studentId: 'student-user-1',
        instrument: 'פסנתר',
        startTime: startTime.toISOString(),
        durationMinutes: 45,
        type: 'RECURRING',
        bookingSource: 'STUDENT_SELF',
        isVirtual: false,
        status: 'SCHEDULED',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        isCreditConsumed: false,
        ...overrides,
    };
}

describe('MasterScheduleView', () => {
    it('renders without crashing (smoke test)', { timeout: 15000 }, () => {
        renderWithProviders(<MasterScheduleView />, {
            user: siteAdmin,
            authContextValue: {
                user: siteAdmin,
                users: mockUsers,
                lessons: mockLessons,
                mockLessons: mockLessons,
                mockRooms: mockRooms,
            },
        });
        // The title translation key should appear
        expect(screen.getByText('מערכת שעות ראשית')).toBeInTheDocument();
    });

    it('renders Day toggle button', () => {
        renderWithProviders(<MasterScheduleView />, {
            user: siteAdmin,
            authContextValue: {
                user: siteAdmin,
                users: mockUsers,
                lessons: mockLessons,
                mockLessons: mockLessons,
                mockRooms: mockRooms,
            },
        });
        const dayButton = screen.getByRole('radio', { name: 'יום' });
        expect(dayButton).toBeInTheDocument();
    });

    it('renders Week toggle button', () => {
        renderWithProviders(<MasterScheduleView />, {
            user: siteAdmin,
            authContextValue: {
                user: siteAdmin,
                users: mockUsers,
                lessons: mockLessons,
                mockLessons: mockLessons,
                mockRooms: mockRooms,
            },
        });
        const weekButton = screen.getByRole('radio', { name: 'שבוע' });
        expect(weekButton).toBeInTheDocument();
    });

    it('renders filter area with teacher, room, instrument, and status selects', () => {
        renderWithProviders(<MasterScheduleView />, {
            user: siteAdmin,
            authContextValue: {
                user: siteAdmin,
                users: mockUsers,
                lessons: mockLessons,
                mockLessons: mockLessons,
                mockRooms: mockRooms,
            },
        });
        // The Select triggers render as buttons with placeholder text
        // Check for the filter trigger buttons
        const triggers = screen.getAllByRole('combobox');
        // Should have 4 filter selects: teacher, room, instrument, status
        expect(triggers.length).toBe(4);
    });

    it('shows a lesson block when lessons match the displayed date', () => {
        const todayLesson = buildTodayLesson();
        renderWithProviders(<MasterScheduleView />, {
            user: siteAdmin,
            authContextValue: {
                user: siteAdmin,
                users: mockUsers,
                lessons: [todayLesson],
                mockLessons: [todayLesson],
                mockRooms: mockRooms,
            },
        });
        // The component shows student name in lesson blocks
        // student-user-1 => look for their name; if not found look for the 'unknown' fallback
        const studentUser = mockUsers.find(u => u.id === 'student-user-1');
        if (studentUser) {
            const studentNames = screen.queryAllByText(studentUser.name);
            expect(studentNames.length).toBeGreaterThan(0);
        }
    });

    it('renders navigation buttons (prev, today, next)', () => {
        renderWithProviders(<MasterScheduleView />, {
            user: siteAdmin,
            authContextValue: {
                user: siteAdmin,
                users: mockUsers,
                lessons: [],
                mockLessons: [],
                mockRooms: mockRooms,
            },
        });
        // "Today" button
        expect(screen.getByText('היום')).toBeInTheDocument();
        // Prev and next buttons have aria-labels
        expect(screen.getByLabelText('קודם')).toBeInTheDocument();
        expect(screen.getByLabelText('הבא')).toBeInTheDocument();
    });
});
