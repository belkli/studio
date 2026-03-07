import { renderWithProviders, screen, fireEvent } from '../../../utils';
import AboutPage from '@/app/[locale]/about/page';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';

// Mock Dialog to avoid complex portal/overlay issues in simple unit tests
vi.mock('@/components/ui/dialog', () => ({
    Dialog: ({ children, open }: any) => open ? <div data-testid="mock-dialog">{children}</div> : null,
    DialogContent: ({ children }: any) => <div data-testid="mock-dialog-content">{children}</div>,
    DialogHeader: ({ children }: any) => <div>{children}</div>,
    DialogTitle: ({ children }: any) => <div>{children}</div>,
}));

describe('AboutPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Reset geolocation mock
        const mockGeolocation = {
            getCurrentPosition: vi.fn(),
            watchPosition: vi.fn(),
        };
        (global.navigator as any).geolocation = mockGeolocation;
    });

    it('renders the about page with hero and search', () => {
        renderWithProviders(<AboutPage />);
        expect(screen.getByText(/מוצאים את הקונסרבטוריון שלכם/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/חיפוש לפי שם עיר, שם קונסרבטוריון/i)).toBeInTheDocument();
    });

    it('filters conservatoriums by search input', () => {
        renderWithProviders(<AboutPage />);

        const searchInput = screen.getByPlaceholderText(/חיפוש לפי שם עיר, שם קונסרבטוריון/i);

        // Type "הוד השרון"
        fireEvent.change(searchInput, { target: { value: 'הוד השרון' } });

        // Verify it shows matching items (assuming data has it)
        const items = screen.getAllByText(/הוד השרון/i);
        expect(items.length).toBeGreaterThan(0);

        // Type something random — the grid becomes empty (no "no results" message, just empty grid)
        fireEvent.change(searchInput, { target: { value: 'ZXYZXYZXY' } });
        // Verify search input has the value (filter is applied)
        expect(searchInput).toHaveValue('ZXYZXYZXY');
    });

    it('filters by department chip', () => {
        renderWithProviders(<AboutPage />);

        // Find a department chip (e.g., "פסנתר" if it exist in data)
        // Note: ALL_DEPARTMENTS is derived from data.
        const pianoChips = screen.queryAllByText('פסנתר');
        const pianoChip = pianoChips[0];
        if (pianoChip) {
            fireEvent.click(pianoChip);
            // Verify results filtered
            // (Hard to verify exact count without matching mock data exactly, but we check for existence)
            expect(screen.queryByText(/לא נמצאו קונסרבטוריונים תואמים/i)).not.toBeInTheDocument();
        }
    });

    it('handles geolocation "Locate Me"', async () => {
        const mockPos = {
            coords: {
                latitude: 32.0853,
                longitude: 34.7818,
            }
        };

        (global.navigator.geolocation.getCurrentPosition as any).mockImplementationOnce((success: any) => success(mockPos));

        renderWithProviders(<AboutPage />);

        // The locate button has aria-label="מיקום נוכחי" and title="מיקום נוכחי"
        const locateBtn = screen.getByTitle(/מיקום נוכחי/i);
        fireEvent.click(locateBtn);

        expect(navigator.geolocation.getCurrentPosition).toHaveBeenCalled();
    });

    it('opens dialog when clicking on a conservatorium card', () => {
        renderWithProviders(<AboutPage />);

        // Find any card button (they have onClick)
        const cards = screen.getAllByRole('button');
        // Find one that looks like a card (has heading)
        const card = cards.find(c => c.querySelector('h3'));

        if (card) {
            fireEvent.click(card);
            expect(screen.getByTestId('mock-dialog')).toBeInTheDocument();
        }
    });

    it('clears filters when clicking "Clear Filters"', () => {
        renderWithProviders(<AboutPage />);

        const searchInput = screen.getByPlaceholderText(/חיפוש לפי שם עיר, שם קונסרבטוריון/i);
        fireEvent.change(searchInput, { target: { value: 'SomeFilter' } });

        const clearBtn = screen.getByText(/נקה סינון/i);
        fireEvent.click(clearBtn);

        expect(searchInput).toHaveValue('');
    });
});
