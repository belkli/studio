import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useIsMobile } from '@/hooks/use-mobile';

describe('useIsMobile', () => {
    beforeEach(() => {
        // Mock matchMedia
        Object.defineProperty(window, 'matchMedia', {
            writable: true,
            value: vi.fn().mockImplementation(query => ({
                matches: false,
                media: query,
                onchange: null,
                addListener: vi.fn(), // deprecated
                removeListener: vi.fn(), // deprecated
                addEventListener: vi.fn(),
                removeEventListener: vi.fn(),
                dispatchEvent: vi.fn(),
            })),
        });
    });

    it('should return true if window.innerWidth < 768', () => {
        window.innerWidth = 500;
        const { result } = renderHook(() => useIsMobile());
        expect(result.current).toBe(true);
    });

    it('should return false if window.innerWidth >= 768', () => {
        window.innerWidth = 1024;
        const { result } = renderHook(() => useIsMobile());
        expect(result.current).toBe(false);
    });

    it('should update value on window resize', () => {
        let changeHandler: (() => void) | null = null;

        Object.defineProperty(window, 'matchMedia', {
            writable: true,
            value: vi.fn().mockImplementation(query => ({
                matches: false,
                media: query,
                addEventListener: vi.fn((event, handler) => {
                    if (event === 'change') changeHandler = handler;
                }),
                removeEventListener: vi.fn(),
            })),
        });

        window.innerWidth = 1024;
        const { result } = renderHook(() => useIsMobile());
        expect(result.current).toBe(false);

        act(() => {
            window.innerWidth = 500;
            if (changeHandler) (changeHandler as () => void)();
        });

        expect(result.current).toBe(true);
    });

    it('should cleanup listener on unmount', () => {
        const removeEventListener = vi.fn();
        Object.defineProperty(window, 'matchMedia', {
            writable: true,
            value: vi.fn().mockImplementation(query => ({
                matches: false,
                media: query,
                addEventListener: vi.fn(),
                removeEventListener,
            })),
        });

        const { unmount } = renderHook(() => useIsMobile());
        unmount();
        expect(removeEventListener).toHaveBeenCalled();
    });
});
