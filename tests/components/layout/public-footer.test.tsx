import { renderWithProviders, screen } from '../../utils';
import { PublicFooter } from '@/components/layout/public-footer';
import { describe, it, expect } from 'vitest';
import React from 'react';

describe('PublicFooter', () => {
    it('renders the copyright text', () => {
        renderWithProviders(<PublicFooter />);
        // Footer renders Hebrew by default (utils loads he messages)
        expect(screen.getByText(/כל הזכויות שמורות|All rights reserved/i)).toBeInTheDocument();
    });

    it('contains the privacy policy link', () => {
        renderWithProviders(<PublicFooter />);
        // Hebrew: "מדיניות פרטיות"
        const link = screen.getByRole('link', { name: /מדיניות פרטיות|Privacy Policy/i });
        expect(link).toBeInTheDocument();
        expect(link).toHaveAttribute('href', '/privacy');
    });

    it('contains the contact link from Navigation namespace', () => {
        renderWithProviders(<PublicFooter />);
        // tNav('contact') in Hebrew = 'צור קשר'
        const link = screen.getByRole('link', { name: /צור קשר/i });
        expect(link).toBeInTheDocument();
        expect(link).toHaveAttribute('href', '/contact');
    });
});
