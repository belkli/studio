import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';
import React from 'react';

// Polyfill IntersectionObserver (not available in jsdom)
global.IntersectionObserver = class IntersectionObserver {
    root = null;
    rootMargin = '';
    thresholds = [];
    constructor(_callback: IntersectionObserverCallback, _options?: IntersectionObserverInit) {}
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords(): IntersectionObserverEntry[] { return []; }
} as unknown as typeof IntersectionObserver;

// Polyfill ResizeObserver (not available in jsdom)
global.ResizeObserver = class ResizeObserver {
    constructor(_callback: ResizeObserverCallback) {}
    observe() {}
    unobserve() {}
    disconnect() {}
} as unknown as typeof ResizeObserver;

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

// Mock lucide-react — pass through all real icons to avoid "no export" errors
vi.mock('lucide-react', async (importOriginal) => {
    const actual = await importOriginal<typeof import('lucide-react')>();
    return { ...actual };
});
