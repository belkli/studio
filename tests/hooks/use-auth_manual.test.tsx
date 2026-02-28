import { render, act, waitFor, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { AuthProvider, useAuth } from '@/hooks/use-auth';

vi.mock('@/hooks/use-toast', () => ({
    useToast: () => ({ toast: vi.fn() }),
}));

describe('useAuth / AuthProvider Manual', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
    });

    it('should add a lesson (manual)', async () => {
        let context: any;
        const TestComponent = () => {
            context = useAuth();
            return <div data-testid="count">{context.mockLessons.length}</div>;
        };

        render(
            <AuthProvider>
                <TestComponent />
            </AuthProvider>
        );

        expect(context).not.toBeNull();
        const initialCount = context.mockLessons.length;

        await act(async () => {
            context.addLesson({
                studentId: 'student-user-1',
                instrument: 'Piano',
                startTime: new Date().toISOString(),
            });
        });

        expect(context.mockLessons.length).toBe(initialCount + 1);
        expect(screen.getByTestId('count')).toHaveTextContent(String(initialCount + 1));
    });
});
