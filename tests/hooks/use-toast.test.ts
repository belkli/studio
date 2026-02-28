import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useToast, toast, reducer } from '@/hooks/use-toast';

describe('useToast', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        const { result } = renderHook(() => useToast());
        act(() => {
            result.current.dismiss();
        });
        vi.runAllTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('should add a toast', () => {
        const { result } = renderHook(() => useToast());

        act(() => {
            toast({
                title: 'Test Toast',
                description: 'Test Description',
            });
        });

        expect(result.current.toasts.length).toBe(1);
        expect(result.current.toasts[0].title).toBe('Test Toast');
    });

    it('should update a toast', () => {
        const { result } = renderHook(() => useToast());
        let toastRef: any;

        act(() => {
            toastRef = toast({
                title: 'Initial Title',
            });
        });

        expect(result.current.toasts[0].title).toBe('Initial Title');

        act(() => {
            toastRef.update({
                id: toastRef.id,
                title: 'Updated Title',
            });
        });

        expect(result.current.toasts[0].title).toBe('Updated Title');
    });

    it('should dismiss a toast', () => {
        const { result } = renderHook(() => useToast());
        let toastRef: any;

        act(() => {
            toastRef = toast({
                title: 'To Dismiss',
            });
        });

        expect(result.current.toasts[0].open).toBe(true);

        act(() => {
            toastRef.dismiss();
        });

        expect(result.current.toasts[0].open).toBe(false);
    });

    it('should remove toast after delay when dismissed', () => {
        const { result } = renderHook(() => useToast());

        act(() => {
            const { dismiss } = toast({ title: 'Temporary' });
            dismiss();
        });

        expect(result.current.toasts[0].open).toBe(false);

        act(() => {
            vi.advanceTimersByTime(1000000); // TOAST_REMOVE_DELAY
        });

        expect(result.current.toasts.length).toBe(0);
    });

    it('should handle multiple simultaneous toasts (up to limit)', () => {
        const { result } = renderHook(() => useToast());

        act(() => {
            toast({ title: 'Toast 1' });
            toast({ title: 'Toast 2' });
        });

        // TOAST_LIMIT is 1 in the source code
        expect(result.current.toasts.length).toBe(1);
        expect(result.current.toasts[0].title).toBe('Toast 2');
    });

    it('should dismiss all toasts when calling dismiss() without id', () => {
        const { result } = renderHook(() => useToast());

        act(() => {
            toast({ title: 'Toast 1' });
        });

        act(() => {
            result.current.dismiss();
        });

        expect(result.current.toasts[0].open).toBe(false);
    });

    it('should handle onOpenChange callback', () => {
        const { result } = renderHook(() => useToast());
        let toastRef: any;

        act(() => {
            toastRef = toast({ title: 'Open Change Test' });
        });

        const addedToast = result.current.toasts[0];
        expect(addedToast.open).toBe(true);

        act(() => {
            if (addedToast.onOpenChange) {
                addedToast.onOpenChange(false);
            }
        });

        expect(result.current.toasts[0].open).toBe(false);
    });

    it('should not add to remove queue if already exists', () => {
        const { result } = renderHook(() => useToast());

        act(() => {
            const { dismiss } = toast({ title: 'Duplicate Queue' });
            dismiss();
            dismiss(); // Second call should hit the 'if (toastTimeouts.has(toastId)) return' branch
        });

        expect(result.current.toasts[0].open).toBe(false);
    });

    it('should cleanup all listeners on multiple unmounts', () => {
        const { unmount: unmount1 } = renderHook(() => useToast());
        const { unmount: unmount2 } = renderHook(() => useToast());
        unmount1();
        unmount2();

        act(() => {
            toast({ title: 'Ghost Toast' });
        });
    });

    it('should handle REMOVE_TOAST without id (via direct reducer call)', () => {
        const initialState = { toasts: [{ id: '1', open: true } as any, { id: '2', open: true } as any] };
        const newState = reducer(initialState, { type: 'REMOVE_TOAST' });
        expect(newState.toasts.length).toBe(0);
    });
});
