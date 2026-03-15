import { renderWithProviders, screen } from '../../utils';
import { PublicNavbar } from '@/components/layout/public-navbar';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import * as routing from '@/i18n/routing';

describe('PublicNavbar', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(routing.usePathname).mockReturnValue('/');
    });

    it('renders the logo and title', () => {
        renderWithProviders(<PublicNavbar />);
        const logos = screen.getAllByText((_content, node) => {
            return node?.textContent === 'Lyriosa';
        });
        expect(logos.length).toBeGreaterThan(0);
    });

    it('renders all navigation links', () => {
        renderWithProviders(<PublicNavbar />);

        expect(screen.getByRole('navigation')).toBeInTheDocument();
        expect(screen.getByText(/שיעורים/i)).toBeInTheDocument();
        expect(screen.getByText(/מוזיקאים/i)).toBeInTheDocument();
        expect(screen.getByText(/תרומה/i)).toBeInTheDocument();
        expect(screen.getByText(/יום פתוח/i)).toBeInTheDocument();
        expect(screen.getByText(/אודות/i)).toBeInTheDocument();
        expect(screen.getByText(/צור קשר/i)).toBeInTheDocument();
    });

    it('applies active styling to the current route', () => {
        // Set mock to /about
        vi.mocked(routing.usePathname).mockReturnValue('/about');

        renderWithProviders(<PublicNavbar />);

        const aboutLink = screen.getByText(/אודות/i);
        console.log('About link classes:', aboutLink.className);

        expect(aboutLink).toHaveClass('text-primary');

        const contactLink = screen.getByText(/צור קשר/i);
        expect(contactLink).not.toHaveClass('text-primary');
        expect(contactLink).toHaveClass('text-foreground/80');
    });

    it('renders login and register buttons', () => {
        renderWithProviders(<PublicNavbar />);

        expect(screen.getByText(/כניסה/i)).toBeInTheDocument();
        expect(screen.getByText(/הרשמה/i)).toBeInTheDocument();
    });

    it('renders the language switcher', () => {
        renderWithProviders(<PublicNavbar />);
        const switchers = screen.getAllByTestId('language-switcher');
        expect(switchers.length).toBeGreaterThan(0);
    });
});
