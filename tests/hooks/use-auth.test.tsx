import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { AuthProvider, useAuth } from '@/hooks/use-auth';
import type { FormTemplate, NotificationPreferences } from '@/lib/types';

vi.mock('@/hooks/use-toast', () => ({
    useToast: () => ({
        toast: vi.fn(),
    }),
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
    <AuthProvider>{children}</AuthProvider>
);

describe('AuthProvider smoke coverage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
    });

    it('executes core auth and mutation flows with current signatures', async () => {
        const { result } = renderHook(() => useAuth(), { wrapper });

        await act(async () => {
            result.current.login('admin@example.com');
        });
        expect(result.current.user?.role).toBe('conservatorium_admin');

        await act(async () => {
            result.current.approveUser('pending-teacher-1');
            result.current.rejectUser('student-user-2', 'Inappropriate');
            result.current.addUser({ name: 'Admin Added', role: 'teacher' }, true);

            const currentConservatorium = result.current.conservatoriums[0];
            if (currentConservatorium) {
                result.current.updateConservatorium({
                    ...currentConservatorium,
                    name: 'Harmony Center',
                });
            }

            result.current.addBranch({
                conservatoriumId: result.current.user?.conservatoriumId || 'cons-1',
                name: 'Downtown',
                address: 'Main St',
            });

            result.current.addRoom({ name: 'Hall A' });

            const template: Partial<FormTemplate> = {
                title: 'Annual Review',
                description: 'Template for review',
                fields: [],
                workflow: [],
            };
            result.current.addFormTemplate(template);

            result.current.addAnnouncement({ title: 'System Update' });
            result.current.addEvent({ name: 'Spring Fest' });
            result.current.addPerformanceBooking({ clientName: 'Rotary Club' });
        });

        const firstBranch = result.current.mockBranches[0];
        const roomId = result.current.mockRooms.find((room) => room.name === 'Hall A')?.id;
        const eventId = result.current.mockEvents[0]?.id;
        const bookingId = result.current.mockPerformanceBookings[0]?.id;

        await act(async () => {
            if (firstBranch) {
                result.current.updateBranch({ ...firstBranch, name: 'Downtown Main' });
            }
            if (roomId) {
                result.current.updateRoom(roomId, { capacity: 50 });
                result.current.deleteRoom(roomId);
            }
            if (eventId) {
                result.current.updateEvent({
                    ...result.current.mockEvents[0],
                    type: 'CONCERT',
                });
                result.current.updateEventStatus(eventId, 'COMPLETED');
            }
            if (bookingId) {
                result.current.assignMusiciansToPerformance(bookingId, ['teacher-user-1']);
                result.current.updatePerformanceBookingStatus(bookingId, 'BOOKING_CONFIRMED');
            }
        });

        await act(async () => {
            result.current.login('teacher@example.com');
        });

        await act(async () => {
            result.current.addLesson({ studentId: 'student-user-1', instrument: 'Piano' });
            result.current.updateLessonStatus('lesson-1', 'COMPLETED');
            result.current.cancelLesson('lesson-1', false);
            result.current.rescheduleLesson('lesson-2', new Date().toISOString());
            result.current.assignSubstitute('lesson-1', 'teacher-user-2');
            result.current.addLessonNote({ studentId: 'student-user-1', summary: 'Great focus' });
            result.current.addProgressReport({ studentId: 'student-user-1', reportText: 'A+' });
            result.current.assignRepertoire('student-user-1', 'comp-db-1');
        });

        await waitFor(() => expect(result.current.mockAssignedRepertoire.length).toBeGreaterThan(0));
        const repId = result.current.mockAssignedRepertoire[0].id;

        await act(async () => {
            result.current.updateRepertoireStatus(repId, 'COMPLETED');
            result.current.awardAchievement('student-user-1', 'PIECE_COMPLETED');
            result.current.reportSickLeave('teacher-user-1', new Date(), new Date());
        });

        await act(async () => {
            result.current.login('student1@example.com');
        });

        await act(async () => {
            result.current.addPracticeLog({ studentId: 'student-user-1', durationMinutes: 45 });
            result.current.updateUserPracticeGoal('student-user-1', 150);
            result.current.addPracticeVideo({ repertoireTitle: 'Daily Scale', videoUrl: 'vid-1' });
        });

        const videoId = result.current.mockPracticeVideos[0]?.id;

        await act(async () => {
            result.current.login('teacher@example.com');
        });

        if (videoId) {
            await act(async () => {
                result.current.addVideoFeedback(videoId, 'Fix your fingering');
            });
        }

        await act(async () => {
            result.current.login('parent@example.com');
        });

        await act(async () => {
            result.current.addScholarshipApplication({});
            result.current.addOpenDayAppointment({ childName: 'Dana' });
            result.current.updateUserPaymentMethod({
                last4: '4242',
                expiryMonth: 12,
                expiryYear: 2030,
            });

            const notificationPreferences: NotificationPreferences = {
                preferences: {
                    lessonReminders: ['IN_APP'],
                    lessonCancellation: ['IN_APP'],
                    makeupCredits: ['IN_APP'],
                    paymentDue: ['IN_APP'],
                    formStatusChanges: ['IN_APP'],
                    teacherMessages: ['IN_APP'],
                    systemAnnouncements: ['IN_APP'],
                    psLessonReminders: ['IN_APP'],
                    psLessonCancellation: ['IN_APP'],
                    psPaymentDue: ['IN_APP'],
                    psExcellenceUpdates: ['IN_APP'],
                    psNewEnrollment: ['IN_APP'],
                    psPartnershipUpdate: ['IN_APP'],
                    psCoordinatorAnnouncements: ['IN_APP'],
                },
                quietHours: {
                    enabled: false,
                    startTime: '22:00',
                    endTime: '07:00',
                },
                language: 'EN',
            };
            result.current.updateNotificationPreferences(notificationPreferences);
        });

        await act(async () => {
            result.current.login('admin@example.com');
            result.current.addInstrument({ name: 'Oboe' });
        });

        const instId = result.current.mockInstrumentInventory[0]?.id;

        await act(async () => {
            if (instId) {
                result.current.assignInstrumentToStudent(instId, 'student-user-1', {
                    expectedReturnDate: new Date().toISOString().split('T')[0],
                    parentSignatureUrl: 'sig://test',
                    depositAmount: 10,
                });
                result.current.updateInstrument(instId, { condition: 'GOOD' });
                result.current.returnInstrument(instId);
                result.current.deleteInstrument(instId);
            }

            result.current.addMessage('thread-1', 'admin-user-1', 'Ping');
            result.current.markWalkthroughAsSeen('student-user-1');
            result.current.logout();
        });

        expect(result.current.user).toBeNull();
    });
});
