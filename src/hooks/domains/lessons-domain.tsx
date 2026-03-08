'use client';
import { createContext, useContext, useState, useCallback, useMemo, useRef, useEffect } from 'react';
import type { LessonSlot, MakeupCredit, SlotStatus, Room, ConservatoriumInstrument, User } from '@/lib/types';
import { allocateRoomWithConflictResolution } from '@/lib/room-allocation';
import { upsertLessonAction } from '@/app/actions';
import { addDays } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface LessonsDomainContextType {
  mockLessons: LessonSlot[];
  lessons: LessonSlot[];
  setMockLessons: React.Dispatch<React.SetStateAction<LessonSlot[]>>;
  mockMakeupCredits: MakeupCredit[];
  makeupCredits: MakeupCredit[];
  setMockMakeupCredits: React.Dispatch<React.SetStateAction<MakeupCredit[]>>;
  addLesson: (lessonData: Partial<LessonSlot>) => void;
  cancelLesson: (lessonId: string, withNotice: boolean) => void;
  rescheduleLesson: (lessonId: string, newStartTime: string) => void;
  getMakeupCreditBalance: (studentIds: string[]) => number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getMakeupCreditsDetail: (studentIds: string[]) => any[];
  updateLessonStatus: (lessonId: string, status: SlotStatus) => void;
  assignSubstitute: (lessonId: string, newTeacherId: string) => void;
  reportSickLeave: (teacherId: string, from: Date, to: Date) => LessonSlot[];
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

export const LessonsDomainContext = createContext<LessonsDomainContextType | null>(null);

export const useLessonsDomain = () => {
  const ctx = useContext(LessonsDomainContext);
  if (!ctx) throw new Error('useLessonsDomain must be within LessonsDomainProvider');
  return ctx;
};

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function LessonsDomainProvider({
  children,
  getRooms,
  getUser,
  getConservatoriumInstruments,
}: {
  children: React.ReactNode;
  getRooms: () => Room[];
  getUser: () => User | null;
  getConservatoriumInstruments: () => ConservatoriumInstrument[];
}) {
  const [mockLessons, setMockLessons] = useState<LessonSlot[]>([]);
  const [mockMakeupCredits, setMockMakeupCredits] = useState<MakeupCredit[]>([]);
  const { toast } = useToast();

  // Keep a ref so callbacks can always read the latest lessons without stale closures
  const lessonsRef = useRef<LessonSlot[]>(mockLessons);
  useEffect(() => { lessonsRef.current = mockLessons; }, [mockLessons]);

  // -------------------------------------------------------------------------
  // addLesson
  // -------------------------------------------------------------------------
  const addLesson = useCallback((lessonData: Partial<LessonSlot>) => {
    const user = getUser();
    const newLesson: LessonSlot = {
      id: `lesson-${Date.now()}`,
      conservatoriumId: user?.conservatoriumId || 'cons-15',
      status: 'SCHEDULED',
      isCreditConsumed: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...lessonData
    } as LessonSlot;

    if (!newLesson.startTime) {
      const now = new Date();
      now.setMinutes(0, 0, 0);
      newLesson.startTime = now.toISOString();
    }
    if (!newLesson.durationMinutes || Number.isNaN(newLesson.durationMinutes)) {
      newLesson.durationMinutes = 45;
    }
    if (!newLesson.instrument) {
      newLesson.instrument = 'general_music';
    }

    const mockRooms = getRooms();
    const conservatoriumInstruments = getConservatoriumInstruments();
    const conservatoriumRoomPool = mockRooms.filter((room) => room.conservatoriumId === newLesson.conservatoriumId);

    if (!newLesson.isVirtual && !newLesson.roomId && conservatoriumRoomPool.length > 0) {
      const allocation = allocateRoomWithConflictResolution({
        lesson: {
          instrument: newLesson.instrument,
          startTime: newLesson.startTime,
          durationMinutes: newLesson.durationMinutes,
          conservatoriumId: newLesson.conservatoriumId,
        },
        rooms: conservatoriumRoomPool,
        existingLessons: lessonsRef.current.filter((lesson) => lesson.conservatoriumId === newLesson.conservatoriumId),
        conservatoriumInstruments: conservatoriumInstruments.filter((item) => item.conservatoriumId === newLesson.conservatoriumId),
      });

      if (allocation.action === 'no_room_available') {
        toast({
          title: 'No available room',
          description: 'No available room for ' + newLesson.instrument + ' at ' + new Date(newLesson.startTime).toLocaleString(),
        });
        return;
      }

      newLesson.roomId = allocation.roomId;

      if (allocation.action === 'reallocate_existing') {
        setMockLessons((prev) => {
          const shifted = prev.map((lesson) => lesson.id === allocation.reallocatedLessonId
            ? { ...lesson, roomId: allocation.reallocatedRoomId, updatedAt: new Date().toISOString() }
            : lesson);
          return [...shifted, newLesson];
        });

        void upsertLessonAction(newLesson)
          .catch((error) => {
            console.warn('Failed to persist lesson', error);
          });

        toast({ title: 'Room reallocated automatically for better fit' });
        return;
      }
    }

    setMockLessons(prev => [...prev, newLesson]);

    void upsertLessonAction(newLesson)
      .then((saved) => {
        setMockLessons(prev => prev.map(item => item.id === newLesson.id ? saved : item));
      })
      .catch((error) => {
        console.warn('Failed to persist lesson', error);
      });
  }, [getRooms, getUser, getConservatoriumInstruments, toast]);

  // -------------------------------------------------------------------------
  // cancelLesson
  // -------------------------------------------------------------------------
  const cancelLesson = useCallback((lessonId: string, withNotice: boolean) => {
    const nextStatus = withNotice ? 'CANCELLED_STUDENT_NOTICED' : 'CANCELLED_STUDENT_NO_NOTICE';
    setMockLessons(prev => prev.map(l => l.id === lessonId ? { ...l, status: nextStatus } : l));

    const snapshot = lessonsRef.current.find((item) => item.id === lessonId);
    if (!snapshot) return;

    void upsertLessonAction({ ...snapshot, status: nextStatus } as LessonSlot)
      .then((saved) => {
        setMockLessons(prev => prev.map(item => item.id === lessonId ? saved : item));
      })
      .catch((error) => {
        console.warn('Failed to persist lesson cancel', error);
      });
  }, []);

  // -------------------------------------------------------------------------
  // rescheduleLesson
  // -------------------------------------------------------------------------
  const rescheduleLesson = useCallback((lessonId: string, newStartTime: string) => {
    setMockLessons(prev => prev.map(l => l.id === lessonId ? { ...l, startTime: newStartTime } : l));

    const snapshot = lessonsRef.current.find((item) => item.id === lessonId);
    if (!snapshot) return;

    void upsertLessonAction({ ...snapshot, startTime: newStartTime } as LessonSlot)
      .then((saved) => {
        setMockLessons(prev => prev.map(item => item.id === lessonId ? saved : item));
      })
      .catch((error) => {
        console.warn('Failed to persist lesson reschedule', error);
      });
  }, []);

  // -------------------------------------------------------------------------
  // getMakeupCreditBalance
  // -------------------------------------------------------------------------
  const getMakeupCreditBalance = useCallback((studentIds: string[]) => {
    if (!studentIds.length) return 0;
    const granted = lessonsRef.current.filter(l =>
      studentIds.includes(l.studentId) &&
      (l.status === 'CANCELLED_TEACHER' || l.status === 'CANCELLED_CONSERVATORIUM' || l.status === 'CANCELLED_STUDENT_NOTICED')
    ).length;
    const used = lessonsRef.current.filter(l => studentIds.includes(l.studentId) && l.type === 'MAKEUP').length;
    return granted - used;
  }, []);

  // -------------------------------------------------------------------------
  // getMakeupCreditsDetail
  // -------------------------------------------------------------------------
  const getMakeupCreditsDetail = useCallback((studentIds: string[]) => {
    if (!studentIds.length) return [];
    return lessonsRef.current.filter(l =>
      studentIds.includes(l.studentId) &&
      (l.status === 'CANCELLED_TEACHER' || l.status === 'CANCELLED_CONSERVATORIUM' || l.status === 'CANCELLED_STUDENT_NOTICED')
    ).map(l => ({
      id: l.id,
      reason: l.status,
      grantedAt: l.createdAt,
      expiresAt: addDays(new Date(l.createdAt), 60).toISOString(),
      status: 'AVAILABLE'
    }));
  }, []);

  // -------------------------------------------------------------------------
  // updateLessonStatus
  // -------------------------------------------------------------------------
  const updateLessonStatus = useCallback((lessonId: string, status: SlotStatus) => {
    setMockLessons(prev => prev.map(l => l.id === lessonId ? { ...l, status, attendanceMarkedAt: new Date().toISOString() } : l));

    const snapshot = lessonsRef.current.find((item) => item.id === lessonId);
    if (!snapshot) return;

    void upsertLessonAction({ ...snapshot, status, attendanceMarkedAt: new Date().toISOString() } as LessonSlot)
      .then((saved) => {
        setMockLessons(prev => prev.map(item => item.id === lessonId ? saved : item));
      })
      .catch((error) => {
        console.warn('Failed to persist lesson status', error);
      });
  }, []);

  // -------------------------------------------------------------------------
  // assignSubstitute
  // -------------------------------------------------------------------------
  const assignSubstitute = useCallback((lessonId: string, newTeacherId: string) => {
    setMockLessons(prev => prev.map(lesson =>
      lesson.id === lessonId
        ? { ...lesson, teacherId: newTeacherId, status: 'SCHEDULED' as SlotStatus }
        : lesson
    ));
  }, []);

  // -------------------------------------------------------------------------
  // reportSickLeave
  // -------------------------------------------------------------------------
  const reportSickLeave = useCallback((teacherId: string, from: Date, to: Date): LessonSlot[] => {
    let cancelledLessons: LessonSlot[] = [];
    setMockLessons(prev => prev.map(lesson => {
      const lessonDate = new Date(lesson.startTime);
      if (
        lesson.teacherId === teacherId &&
        lesson.status === 'SCHEDULED' &&
        lessonDate >= from &&
        lessonDate <= to
      ) {
        const updatedLesson = { ...lesson, status: 'CANCELLED_TEACHER' as SlotStatus };
        cancelledLessons.push(updatedLesson);
        return updatedLesson;
      }
      return lesson;
    }));
    return cancelledLessons;
  }, []);

  // -------------------------------------------------------------------------
  // Context value
  // -------------------------------------------------------------------------
  const value = useMemo(
    () => ({
      mockLessons,
      lessons: mockLessons,
      setMockLessons,
      mockMakeupCredits,
      makeupCredits: mockMakeupCredits,
      setMockMakeupCredits,
      addLesson,
      cancelLesson,
      rescheduleLesson,
      getMakeupCreditBalance,
      getMakeupCreditsDetail,
      updateLessonStatus,
      assignSubstitute,
      reportSickLeave,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mockLessons, mockMakeupCredits],
  );

  return <LessonsDomainContext.Provider value={value}>{children}</LessonsDomainContext.Provider>;
}
