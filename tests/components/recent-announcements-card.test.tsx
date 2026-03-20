import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { renderWithProviders, screen } from '../utils';
import { RecentAnnouncementsCard } from '@/components/dashboard/harmonia/recent-announcements-card';
import type { Announcement, User } from '@/lib/types';
import * as fs from 'fs';
import * as path from 'path';

// Mock date-fns formatDistanceToNow to avoid locale issues
vi.mock('date-fns', () => ({
  formatDistanceToNow: () => '2 hours ago',
}));

// Load English messages
function loadMessages(locale: string): Record<string, unknown> {
  const dir = path.resolve(__dirname, `../../src/messages/${locale}`);
  const merged: Record<string, unknown> = {};
  if (fs.existsSync(dir)) {
    for (const file of fs.readdirSync(dir)) {
      if (file.endsWith('.json')) {
        try {
          const contents = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf-8'));
          Object.assign(merged, contents);
        } catch {
          // skip
        }
      }
    }
  }
  return merged;
}

const enMessages = loadMessages('en');

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

function makeAnnouncement(overrides: Partial<Announcement> = {}): Announcement {
  return {
    id: 'ann-1',
    conservatoriumId: 'cons-1',
    title: 'הודעה חשובה',
    body: 'גוף ההודעה בעברית',
    targetAudience: 'ALL',
    channels: ['EMAIL'] as Announcement['channels'],
    sentAt: new Date().toISOString(),
    translatedByAI: false,
    ...overrides,
  };
}

describe('RecentAnnouncementsCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows AI disclaimer when translatedByAI=true and locale is not he', () => {
    const ann = makeAnnouncement({
      translatedByAI: true,
      translations: {
        en: {
          title: 'Important Announcement',
          body: 'Body in English',
          translatedByAI: true,
          editedByHuman: false,
        },
      },
    });

    renderWithProviders(<RecentAnnouncementsCard />, {
      locale: 'en',
      messages: enMessages,
      user: adminUser,
      authContextValue: {
        announcements: [ann],
        mockAnnouncements: [ann],
      },
    });

    // The (AI) badge should be visible
    expect(screen.getByText('(AI)')).toBeInTheDocument();
    // The full disclaimer text from English messages
    expect(screen.getByText(/automatically generated/i)).toBeInTheDocument();
  });

  it('does NOT show AI disclaimer when locale is he', () => {
    const ann = makeAnnouncement({
      translatedByAI: true,
      translations: {
        en: {
          title: 'Important Announcement',
          body: 'Body in English',
          translatedByAI: true,
          editedByHuman: false,
        },
      },
    });

    renderWithProviders(<RecentAnnouncementsCard />, {
      locale: 'he',
      user: adminUser,
      authContextValue: {
        announcements: [ann],
        mockAnnouncements: [ann],
      },
    });

    // Neither AI badge nor disclaimer should show in Hebrew locale
    expect(screen.queryByText('(AI)')).not.toBeInTheDocument();
    expect(screen.queryByText(/נוצר אוטומטית/)).not.toBeInTheDocument();
  });

  it('does NOT show AI disclaimer when translatedByAI=false', () => {
    const ann = makeAnnouncement({
      translatedByAI: false,
    });

    renderWithProviders(<RecentAnnouncementsCard />, {
      locale: 'en',
      messages: enMessages,
      user: adminUser,
      authContextValue: {
        announcements: [ann],
        mockAnnouncements: [ann],
      },
    });

    expect(screen.queryByText('(AI)')).not.toBeInTheDocument();
    expect(screen.queryByText(/automatically generated/i)).not.toBeInTheDocument();
  });

  it('shows empty state when no announcements exist', () => {
    renderWithProviders(<RecentAnnouncementsCard />, {
      user: adminUser,
      authContextValue: {
        announcements: [],
        mockAnnouncements: [],
      },
    });

    // Hebrew: "אין הכרזות אחרונות."
    expect(screen.getByText(/אין הכרזות אחרונות/)).toBeInTheDocument();
  });

  it('displays localized title for non-Hebrew locale', () => {
    const ann = makeAnnouncement({
      translatedByAI: true,
      translations: {
        en: {
          title: 'English Title Here',
          body: 'English body text',
          translatedByAI: true,
          editedByHuman: false,
        },
      },
    });

    renderWithProviders(<RecentAnnouncementsCard />, {
      locale: 'en',
      messages: enMessages,
      user: adminUser,
      authContextValue: {
        announcements: [ann],
        mockAnnouncements: [ann],
      },
    });

    // Should show English title, not Hebrew
    expect(screen.getByText('English Title Here')).toBeInTheDocument();
  });
});
