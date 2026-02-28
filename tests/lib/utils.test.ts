import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { cn, isValidIsraeliID, debounce } from '@/lib/utils';

describe('utils.ts', () => {
    describe('cn', () => {
        it('merges tailwind classes correctly', () => {
            expect(cn('bg-red-500', 'p-4')).toBe('bg-red-500 p-4');
            expect(cn('bg-red-500 bg-blue-500')).toBe('bg-blue-500'); // twMerge handled
        });

        it('handles conditional classes', () => {
            expect(cn('p-4', true && 'bg-red-500', false && 'm-2')).toBe('p-4 bg-red-500');
        });

        it('handles undefined and null', () => {
            expect(cn('p-4', undefined, null)).toBe('p-4');
        });
    });

    describe('isValidIsraeliID', () => {
        it('returns true for valid IDs', () => {
            // Common valid ID examples (these are algorithmically valid)
            expect(isValidIsraeliID('123456782')).toBe(true);
            expect(isValidIsraeliID('012345674')).toBe(true);
        });

        it('returns false for invalid IDs', () => {
            expect(isValidIsraeliID('123456780')).toBe(false);
            expect(isValidIsraeliID('123')).toBe(false); // too short
            expect(isValidIsraeliID('12345678910')).toBe(false); // too long
            expect(isValidIsraeliID('abcdefghi')).toBe(false); // not numbers
            expect(isValidIsraeliID('')).toBe(false); // empty
        });

        it('handles leading zeros', () => {
            expect(isValidIsraeliID('000000000')).toBe(true);
        });
    });

    describe('debounce', () => {
        beforeEach(() => {
            vi.useFakeTimers();
        });

        afterEach(() => {
            vi.useRealTimers();
        });

        it('debounces calls', () => {
            const func = vi.fn();
            const debouncedFunc = debounce(func, 100);

            debouncedFunc('test');
            debouncedFunc('test2');
            debouncedFunc('test3');

            expect(func).not.toHaveBeenCalled();

            vi.advanceTimersByTime(100);
            expect(func).toHaveBeenCalledTimes(1);
            expect(func).toHaveBeenCalledWith('test3');
        });

        it('resets timer if called again', () => {
            const func = vi.fn();
            const debouncedFunc = debounce(func, 100);

            debouncedFunc();
            vi.advanceTimersByTime(50);
            debouncedFunc();
            vi.advanceTimersByTime(50);
            expect(func).not.toHaveBeenCalled();

            vi.advanceTimersByTime(50);
            expect(func).toHaveBeenCalledTimes(1);
        });
    });
});
