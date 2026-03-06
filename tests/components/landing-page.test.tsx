import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';

// ── Layout component stubs ────────────────────────────────────────────────────
vi.mock('@/components/layout/public-navbar', () => ({
    PublicNavbar: () => <nav data-testid="public-navbar" />,
}));

vi.mock('@/components/layout/public-footer', () => ({
    PublicFooter: () => <footer data-testid="public-footer" />,
}));

// ── next/image stub ───────────────────────────────────────────────────────────
vi.mock('next/image', () => ({
    // eslint-disable-next-line @next/next/no-img-element
    default: (props: React.ImgHTMLAttributes<HTMLImageElement> & { fill?: boolean; priority?: boolean; sizes?: string }) => {
        const { fill: _fill, priority: _priority, sizes: _sizes, ...rest } = props;
        // eslint-disable-next-line jsx-a11y/alt-text
        return <img {...rest} />;
    },
}));

// ── useAuth mock ──────────────────────────────────────────────────────────────
vi.mock('@/hooks/use-auth', () => ({
    useAuth: () => ({
        conservatoriums: [
            {
                id: 'cons-1',
                name: 'Test Conservatory',
                location: { city: 'Tel Aviv' },
                about: 'A test conservatory',
            },
        ],
        conservatoriumInstruments: [],
        users: [],
        events: [],
    }),
}));

// ── next-intl mock ────────────────────────────────────────────────────────────
vi.mock('next-intl', async () => {
    const actual = await vi.importActual<typeof import('next-intl')>('next-intl');
    return {
        ...actual,
        useLocale: () => 'he',
        useTranslations: () => (key: string) => key,
    };
});

// ── lucide-react — extend the setup.tsx stubs with icons used in landing ────
vi.mock('lucide-react', () => ({
    Search: (props: any) => <span data-testid="icon-search" {...props} />,
    MapPin: (props: any) => <span data-testid="icon-map-pin" {...props} />,
    Phone: (props: any) => <span data-testid="icon-phone" {...props} />,
    Mail: (props: any) => <span data-testid="icon-mail" {...props} />,
    Globe: (props: any) => <span data-testid="icon-globe" {...props} />,
    Clock: (props: any) => <span data-testid="icon-clock" {...props} />,
    Facebook: (props: any) => <span data-testid="icon-facebook" {...props} />,
    Instagram: (props: any) => <span data-testid="icon-instagram" {...props} />,
    Youtube: (props: any) => <span data-testid="icon-youtube" {...props} />,
    Save: (props: any) => <span data-testid="icon-save" {...props} />,
    Plus: (props: any) => <span data-testid="icon-plus" {...props} />,
    Edit: (props: any) => <span data-testid="icon-edit" {...props} />,
    Trash: (props: any) => <span data-testid="icon-trash" {...props} />,
    X: (props: any) => <span data-testid="icon-x" {...props} />,
    ChevronDown: (props: any) => <span data-testid="icon-chevron-down" {...props} />,
    ChevronRight: (props: any) => <span data-testid="icon-chevron-right" {...props} />,
    ChevronLeft: (props: any) => <span data-testid="icon-chevron-left" {...props} />,
    Languages: (props: any) => <span data-testid="icon-languages" {...props} />,
    Globe2: (props: any) => <span data-testid="icon-globe2" {...props} />,
    GraduationCap: (props: any) => <span data-testid="icon-graduation-cap" {...props} />,
    Music: (props: any) => <span data-testid="icon-music" {...props} />,
    Music2: (props: any) => <span data-testid="icon-music2" {...props} />,
    ExternalLink: (props: any) => <span data-testid="icon-external-link" {...props} />,
    LogOut: (props: any) => <span data-testid="icon-logout" {...props} />,
    User: (props: any) => <span data-testid="icon-user" {...props} />,
    Users: (props: any) => <span data-testid="icon-users" {...props} />,
    Settings: (props: any) => <span data-testid="icon-settings" {...props} />,
    MessageCircle: (props: any) => <span data-testid="icon-message-circle" {...props} />,
    LocateFixed: (props: any) => <span data-testid="icon-locate-fixed" {...props} />,
    Building2: (props: any) => <span data-testid="icon-building2" {...props} />,
    Star: (props: any) => <span data-testid="icon-star" {...props} />,
    BookOpen: (props: any) => <span data-testid="icon-book-open" {...props} />,
    Navigation2: (props: any) => <span data-testid="icon-navigation2" {...props} />,
    ClipboardList: (props: any) => <span data-testid="icon-clipboard-list" {...props} />,
    CalendarDays: (props: any) => <span data-testid="icon-calendar-days" {...props} />,
    CalendarClock: (props: any) => <span data-testid="icon-calendar-clock" {...props} />,
    UserRound: (props: any) => <span data-testid="icon-user-round" {...props} />,
    HeartHandshake: (props: any) => <span data-testid="icon-heart-handshake" {...props} />,
}));

// ── Import the component under test ──────────────────────────────────────────
import { PublicLandingPage } from '@/components/harmonia/public-landing-page';

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('PublicLandingPage', () => {
    it('renders without crashing', () => {
        render(<PublicLandingPage />);
    });

    it('mounts the public navbar', () => {
        render(<PublicLandingPage />);
        expect(document.querySelector('[data-testid="public-navbar"]')).toBeTruthy();
    });

    it('shows hero section (id="hero-heading")', () => {
        render(<PublicLandingPage />);
        expect(document.getElementById('hero-heading')).toBeTruthy();
    });

    it('hero heading renders the heroTitle translation key', () => {
        render(<PublicLandingPage />);
        // The useTranslations mock returns the key itself, so the heading text = 'heroTitle'
        const heading = document.getElementById('hero-heading');
        expect(heading?.textContent).toBe('heroTitle');
    });

    it('shows the find conservatory section (id="find-heading")', () => {
        render(<PublicLandingPage />);
        expect(document.getElementById('find-heading')).toBeTruthy();
    });

    it('find heading renders the findTitle translation key', () => {
        render(<PublicLandingPage />);
        const heading = document.getElementById('find-heading');
        expect(heading?.textContent).toBe('findTitle');
    });

    it('shows the personas section (id="personas-heading")', () => {
        render(<PublicLandingPage />);
        expect(document.getElementById('personas-heading')).toBeTruthy();
    });

    it('personas heading renders the personasTitle translation key', () => {
        render(<PublicLandingPage />);
        const heading = document.getElementById('personas-heading');
        expect(heading?.textContent).toBe('personasTitle');
    });

    it('renders in RTL direction for Hebrew locale', () => {
        render(<PublicLandingPage />);
        // useLocale returns 'he' → should set dir="rtl" on the root div
        const root = document.querySelector('[dir="rtl"]');
        expect(root).toBeTruthy();
    });

    it('renders a search button for finding conservatoriums', () => {
        render(<PublicLandingPage />);
        // useTranslations mock returns the key; the search button text = 'search'
        const buttons = screen.getAllByRole('button');
        const searchButtons = buttons.filter((btn) => btn.textContent?.includes('search'));
        expect(searchButtons.length).toBeGreaterThan(0);
    });

    it('shows the heroBadge translation key in the hero section', () => {
        render(<PublicLandingPage />);
        expect(screen.getByText('heroBadge')).toBeTruthy();
    });

    it('shows the registerCta translation key as a link', () => {
        render(<PublicLandingPage />);
        expect(screen.getByText('registerCta')).toBeTruthy();
    });

    it('shows the findConservatory translation key', () => {
        render(<PublicLandingPage />);
        expect(screen.getByText('findConservatory')).toBeTruthy();
    });

    it('shows the howItWorksTitle section', () => {
        render(<PublicLandingPage />);
        expect(screen.getByText('howItWorksTitle')).toBeTruthy();
    });

    it('shows the featuredTeachersTitle section', () => {
        render(<PublicLandingPage />);
        expect(screen.getByText('featuredTeachersTitle')).toBeTruthy();
    });

    it('shows the testimonialsTitle section', () => {
        render(<PublicLandingPage />);
        expect(screen.getByText('testimonialsTitle')).toBeTruthy();
    });

    it('shows the donateTitle section', () => {
        render(<PublicLandingPage />);
        expect(screen.getByText('donateTitle')).toBeTruthy();
    });

    it('shows the upcomingEventsTitle section', () => {
        render(<PublicLandingPage />);
        expect(screen.getByText('upcomingEventsTitle')).toBeTruthy();
    });

    it('renders step 1, 2, and 3 titles in the how-it-works section', () => {
        render(<PublicLandingPage />);
        expect(screen.getByText('step1Title')).toBeTruthy();
        expect(screen.getByText('step2Title')).toBeTruthy();
        expect(screen.getByText('step3Title')).toBeTruthy();
    });

    it('renders persona cards for all four roles', () => {
        render(<PublicLandingPage />);
        expect(screen.getByText('personaAdminTitle')).toBeTruthy();
        expect(screen.getByText('personaTeacherTitle')).toBeTruthy();
        expect(screen.getByText('personaParentTitle')).toBeTruthy();
        expect(screen.getByText('personaStudentTitle')).toBeTruthy();
    });

    it('renders the donate CTA button', () => {
        render(<PublicLandingPage />);
        expect(screen.getByText('donateCta')).toBeTruthy();
    });

    it('shows openDaysFallback text (no open-day events seeded)', () => {
        render(<PublicLandingPage />);
        expect(screen.getByText('openDaysFallback')).toBeTruthy();
    });
});

// ── Additional rendering with empty data ──────────────────────────────────────

describe('PublicLandingPage with empty data', () => {
    beforeEach(() => {
        vi.doMock('@/hooks/use-auth', () => ({
            useAuth: () => ({
                conservatoriums: [],
                conservatoriumInstruments: [],
                users: [],
                events: [],
            }),
        }));
    });

    it('renders without crashing when all data arrays are empty', async () => {
        vi.resetModules();
        // Re-apply mocks that would be cleared by resetModules
        vi.mock('@/components/layout/public-navbar', () => ({
            PublicNavbar: () => <nav data-testid="public-navbar" />,
        }));
        vi.mock('@/components/layout/public-footer', () => ({
            PublicFooter: () => <footer data-testid="public-footer" />,
        }));
        vi.mock('@/hooks/use-auth', () => ({
            useAuth: () => ({
                conservatoriums: [],
                conservatoriumInstruments: [],
                users: [],
                events: [],
            }),
        }));

        const { PublicLandingPage: LP } = await import(
            '@/components/harmonia/public-landing-page'
        );
        render(<LP />);
        expect(document.getElementById('hero-heading')).toBeTruthy();
    });
});
