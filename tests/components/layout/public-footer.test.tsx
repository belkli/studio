import { renderWithProviders, screen } from '../../utils';
import { PublicFooter } from '@/components/layout/public-footer';
import { describe, it, expect } from 'vitest';
import React from 'react';

describe('PublicFooter', () => {
    it('renders the copyright text', () => {
        renderWithProviders(<PublicFooter />);
        // Since our mock tHome('copyright') returns the key or a default string
        // In our utils.tsx we set it to 'All rights reserved.'
        expect(screen.getByText(/All rights reserved/i)).toBeInTheDocument();
    });

    it('contains the privacy policy link', () => {
        renderWithProviders(<PublicFooter />);
        const link = screen.getByRole('link', { name: /Privacy Policy/i });
        expect(link).toBeInTheDocument();
        expect(link).toHaveAttribute('href', '/privacy');
    });

    it('contains the contact link from Navigation namespace', () => {
        renderWithProviders(<PublicFooter />);
        // tNav('contact') in utils is 'צור קשר'
        const link = screen.getByRole('link', { name: /צור קשר/i });
        expect(link).toBeInTheDocument();
        expect(link).toHaveAttribute('href', '/contact');
    });
});
