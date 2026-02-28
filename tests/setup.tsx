import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';
import React from 'react';

// Mock next/navigation
vi.mock('next/navigation', () => ({
    usePathname: () => '/',
    useRouter: () => ({
        push: vi.fn(),
        replace: vi.fn(),
        prefetch: vi.fn(),
    }),
    useSearchParams: () => new URLSearchParams(),
    useParams: () => ({ locale: 'he' }),
}));

// Mock @/i18n/routing to avoid loading actual route config in tests
vi.mock('@/i18n/routing', () => ({
    Link: ({ children, ...props }: any) => (
        <a {...props}>{children}</a>
    ),
    usePathname: vi.fn(() => '/'),
    useRouter: vi.fn(() => ({
        push: vi.fn(),
        replace: vi.fn(),
        prefetch: vi.fn(),
    })),
    redirect: vi.fn(),
    routing: {
        locales: ['he', 'en', 'ar', 'ru'],
        defaultLocale: 'he',
    },
}));

// Mock framer-motion
vi.mock('framer-motion', () => ({
    motion: {
        div: React.forwardRef(({ children, ...props }: any, ref: any) => <div {...props} ref={ref}>{children}</div>),
        section: React.forwardRef(({ children, ...props }: any, ref: any) => <section {...props} ref={ref}>{children}</section>),
        header: React.forwardRef(({ children, ...props }: any, ref: any) => <header {...props} ref={ref}>{children}</header>),
        span: React.forwardRef(({ children, ...props }: any, ref: any) => <span {...props} ref={ref}>{children}</span>),
        nav: React.forwardRef(({ children, ...props }: any, ref: any) => <nav {...props} ref={ref}>{children}</nav>),
        button: React.forwardRef(({ children, ...props }: any, ref: any) => <button {...props} ref={ref}>{children}</button>),
    },
    AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock lucide-react icons statically to avoid Proxy issues
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
}));
