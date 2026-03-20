import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { renderWithProviders, screen, fireEvent, waitFor } from '../utils';
import { AnnouncementComposer } from '@/components/dashboard/harmonia/announcement-composer';
import type { User } from '@/lib/types';

// Mock translateAnnouncement server action
vi.mock('@/app/actions/translate', () => ({
  translateAnnouncement: vi.fn(),
}));

// Mock useToast
const mockToast = vi.fn();
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

import { translateAnnouncement } from '@/app/actions/translate';

const adminUser: User = {
  id: 'admin-1',
  name: 'Test Admin',
  email: 'admin@test.com',
  role: 'conservatorium_admin',
  conservatoriumId: 'cons-1',
  createdAt: new Date().toISOString(),
  conservatoriumName: 'Test Conservatorium',
  approved: true,
};

describe('AnnouncementComposer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the textarea and Translate button', () => {
    renderWithProviders(<AnnouncementComposer />, {
      user: adminUser,
      authContextValue: {
        announcements: [],
        mockAnnouncements: [],
        addAnnouncement: vi.fn(),
      },
    });

    // Title input (Hebrew placeholder from messages)
    expect(screen.getByPlaceholderText(/לדוגמה: תזכורת על חופשת חנוכה/)).toBeInTheDocument();
    // Body textarea (Hebrew placeholder "גוּף")
    expect(screen.getByPlaceholderText('גוּף')).toBeInTheDocument();
    // Auto-translate button text
    expect(screen.getByText(/תרגם אוטומטית עם AI/)).toBeInTheDocument();
  });

  it('shows translation preview section with empty state text', () => {
    renderWithProviders(<AnnouncementComposer />, {
      user: adminUser,
      authContextValue: {
        announcements: [],
        mockAnnouncements: [],
        addAnnouncement: vi.fn(),
      },
    });

    // Translation preview title
    expect(screen.getByText(/תצוגה מקדימה של תרגומים/)).toBeInTheDocument();
    // Empty state text
    expect(screen.getByText(/לחץ 'תרגם אוטומטית' כדי לייצר תרגומים/)).toBeInTheDocument();
  });

  it('does not show AI badge before translation', () => {
    renderWithProviders(<AnnouncementComposer />, {
      user: adminUser,
      authContextValue: {
        announcements: [],
        mockAnnouncements: [],
        addAnnouncement: vi.fn(),
      },
    });

    // The AI badge text is just "AI" — should not appear before translation
    // Check that no badge with text "AI" is in the accordion area
    const aiBadges = screen.queryAllByText('AI');
    // The only "AI" text should be in the button label ("תרגם אוטומטית עם AI") and disclaimer, not as badges
    for (const el of aiBadges) {
      // Badge uses class containing "border" (outline variant)
      expect(el.className).not.toContain('border-input');
    }
  });

  it('shows AI badges after successful translation', async () => {
    const mockTranslate = vi.mocked(translateAnnouncement);
    mockTranslate.mockResolvedValueOnce({
      success: true,
      translations: {
        en: { title: 'Hello', body: 'World' },
        ar: { title: 'مرحبا', body: 'عالم' },
        ru: { title: 'Привет', body: 'Мир' },
      },
    });

    renderWithProviders(<AnnouncementComposer />, {
      user: adminUser,
      authContextValue: {
        announcements: [],
        mockAnnouncements: [],
        addAnnouncement: vi.fn(),
      },
    });

    // Fill in title (>= 5 chars) and body (>= 10 chars)
    const titleInput = screen.getByPlaceholderText(/לדוגמה: תזכורת על חופשת חנוכה/);
    const bodyInput = screen.getByPlaceholderText('גוּף');

    fireEvent.change(titleInput, { target: { value: 'כותרת בדיקה' } });
    fireEvent.change(bodyInput, { target: { value: 'גוף הודעה ארוכה מספיק לבדיקה של התרגום' } });

    // Click translate button
    const translateBtn = screen.getByText(/תרגם אוטומטית עם AI/);
    fireEvent.click(translateBtn);

    // Wait for AI badges — each done locale gets an "AI" badge
    await waitFor(() => {
      // The accordion now renders locale sections with AI badges
      // The badge text is "AI" (from aiBadge key)
      // Filter to only Badge elements (they have specific classes)
      const allAITexts = screen.getAllByText('AI');
      // At least 3 should be proper badges (in AccordionTrigger spans)
      const badgeElements = allAITexts.filter(
        (el) => el.closest('[data-state]') !== null || el.tagName === 'DIV' || el.className.includes('rounded')
      );
      expect(badgeElements.length).toBeGreaterThanOrEqual(3);
    });
  });

  it('shows stale warning when source changes after translation', async () => {
    const mockTranslate = vi.mocked(translateAnnouncement);
    mockTranslate.mockResolvedValueOnce({
      success: true,
      translations: {
        en: { title: 'Hello', body: 'World' },
        ar: { title: 'مرحبا', body: 'عالم' },
        ru: { title: 'Привет', body: 'Мир' },
      },
    });

    renderWithProviders(<AnnouncementComposer />, {
      user: adminUser,
      authContextValue: {
        announcements: [],
        mockAnnouncements: [],
        addAnnouncement: vi.fn(),
      },
    });

    const titleInput = screen.getByPlaceholderText(/לדוגמה: תזכורת על חופשת חנוכה/);
    const bodyInput = screen.getByPlaceholderText('גוּף');

    fireEvent.change(titleInput, { target: { value: 'כותרת מקורית' } });
    fireEvent.change(bodyInput, { target: { value: 'גוף הודעה ארוכה מספיק לבדיקה' } });

    // Translate
    fireEvent.click(screen.getByText(/תרגם אוטומטית עם AI/));

    // Wait for translation done
    await waitFor(() => {
      expect(mockTranslate).toHaveBeenCalled();
    });

    // Wait for translation state to settle
    await waitFor(() => {
      // Check that translated content appeared
      expect(screen.getByDisplayValue('Hello')).toBeInTheDocument();
    });

    // Now change the source text — should trigger stale warning
    fireEvent.change(titleInput, { target: { value: 'כותרת חדשה שונה' } });

    await waitFor(() => {
      expect(screen.getByText(/טקסט המקור השתנה מאז יצירת התרגומים/)).toBeInTheDocument();
    });
  });

  it('denies access to non-admin users', () => {
    const regularUser: User = {
      id: 'student-1',
      name: 'Student',
      email: 'student@test.com',
      role: 'student',
      conservatoriumId: 'cons-1',
      conservatoriumName: 'Test Conservatorium',
      createdAt: new Date().toISOString(),
      approved: true,
    };

    renderWithProviders(<AnnouncementComposer />, {
      user: regularUser,
      authContextValue: {
        announcements: [],
        mockAnnouncements: [],
        addAnnouncement: vi.fn(),
      },
    });

    expect(screen.getByText(/אין לך הרשאה/)).toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/לדוגמה/)).not.toBeInTheDocument();
  });
});
