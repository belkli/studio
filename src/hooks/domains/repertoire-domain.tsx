'use client';
import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type {
  PracticeLog,
  AssignedRepertoire,
  LessonNote,
  ProgressReport,
  TeacherRating,
  Composition,
  RepertoireStatus,
  AchievementType,
  Achievement,
} from '@/lib/types';
import { differenceInCalendarDays, startOfDay, addDays } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useUsersDomain } from './users-domain';
import { useAuthDomain } from './auth-domain';
import { useLessonsDomain } from './lessons-domain';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RepertoireDomainContextType {
  mockAssignedRepertoire: AssignedRepertoire[];
  assignedRepertoire: AssignedRepertoire[];
  setMockAssignedRepertoire: React.Dispatch<React.SetStateAction<AssignedRepertoire[]>>;

  mockRepertoire: Composition[];
  repertoire: Composition[];
  setMockRepertoire: React.Dispatch<React.SetStateAction<Composition[]>>;

  mockPracticeLogs: PracticeLog[];
  practiceLogs: PracticeLog[];
  setMockPracticeLogs: React.Dispatch<React.SetStateAction<PracticeLog[]>>;

  mockLessonNotes: LessonNote[];
  lessonNotes: LessonNote[];
  setMockLessonNotes: React.Dispatch<React.SetStateAction<LessonNote[]>>;

  mockProgressReports: ProgressReport[];
  progressReports: ProgressReport[];
  setMockProgressReports: React.Dispatch<React.SetStateAction<ProgressReport[]>>;

  mockTeacherRatings: TeacherRating[];
  setMockTeacherRatings: React.Dispatch<React.SetStateAction<TeacherRating[]>>;

  assignRepertoire: (studentIds: string | string[], compositionId: string) => void;
  updateRepertoireStatus: (repertoireId: string, status: RepertoireStatus) => void;
  addLessonNote: (noteData: Partial<LessonNote>) => void;
  updateUserPracticeGoal: (studentId: string, goal: number) => void;
  addPracticeLog: (logData: Partial<PracticeLog>) => void;
  addProgressReport: (reportData: Partial<ProgressReport>) => void;
  submitTeacherRating: (teacherId: string, rating: 1 | 2 | 3 | 4 | 5, comment?: string) => void;
  getTeacherRating: (teacherId: string) => { avg: number; count: number; userRating?: number };
  awardAchievement: (studentId: string, type: AchievementType) => void;
  addComposition: (data: Partial<Composition>) => void;
  updateComposition: (compositionId: string, data: Partial<Composition>) => void;
  deleteComposition: (compositionId: string) => void;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

export const RepertoireDomainContext = createContext<RepertoireDomainContextType | null>(null);

export const useRepertoireDomain = () => {
  const ctx = useContext(RepertoireDomainContext);
  if (!ctx) throw new Error('useRepertoireDomain must be within RepertoireDomainProvider');
  return ctx;
};

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function RepertoireDomainProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { users, updateUser, setUsers } = useUsersDomain();
  const { user } = useAuthDomain();
  const { mockLessons } = useLessonsDomain();
  const { toast } = useToast();

  const [mockAssignedRepertoire, setMockAssignedRepertoire] = useState<AssignedRepertoire[]>([]);
  const [mockRepertoire, setMockRepertoire] = useState<Composition[]>([]);
  const [mockPracticeLogs, setMockPracticeLogs] = useState<PracticeLog[]>([]);
  const [mockLessonNotes, setMockLessonNotes] = useState<LessonNote[]>([]);
  const [mockProgressReports, setMockProgressReports] = useState<ProgressReport[]>([]);
  const [mockTeacherRatings, setMockTeacherRatings] = useState<TeacherRating[]>([]);

  // ---------------------------------------------------------------------------
  // awardAchievement
  // ---------------------------------------------------------------------------
  const awardAchievement = useCallback((studentId: string, type: AchievementType) => {
    const student = users.find(u => u.id === studentId);
    if (!student) return;

    const hasExisting = student.achievements?.some(a => a.type === type);
    // Prevent re-awarding certain types of achievements
    if (hasExisting && ['YEARS_ENROLLED_1', 'FIRST_RECITAL'].includes(type)) return;

    // For streaks, we might want to update, not just add. For now, we'll keep it simple.
    if (hasExisting && type === 'PRACTICE_STREAK_7') return;

    let newAchievement: Achievement | null = null;

    switch (type) {
      case 'PIECE_COMPLETED':
        newAchievement = { id: `ach-${Date.now()}`, type, title: 'Amazing progress!', titleHe: 'Amazing progress!', description: 'You completed all your weekly goals.', icon: 'star', points: 75, achievedAt: new Date().toISOString() };
        break;
      case 'PRACTICE_STREAK_7':
        newAchievement = { id: `ach-${Date.now()}`, type, title: 'Practiced for 7 days in a row!', titleHe: 'Practiced for 7 days in a row!', description: 'Excellent consistency this week. Keep going!', icon: 'star', points: 50, achievedAt: new Date().toISOString() };
        break;
    }

    if (newAchievement) {
      updateUser({ ...student, achievements: [...(student.achievements || []), newAchievement] });
      toast({ title: newAchievement.title, description: newAchievement.description });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [users, updateUser, toast]);

  // ---------------------------------------------------------------------------
  // checkAndAwardPracticeStreak (private helper)
  // ---------------------------------------------------------------------------
  const checkAndAwardPracticeStreak = useCallback((studentId: string, allLogs: PracticeLog[]) => {
    const studentLogs = allLogs.filter(log => log.studentId === studentId);
    const logDates = [...new Set(studentLogs.map(log => startOfDay(new Date(log.date)).getTime()))].sort((a, b) => b - a);

    if (logDates.length < 7) return;

    let streak = 0;
    const today = startOfDay(new Date());
    const yesterday = startOfDay(addDays(new Date(), -1));

    if (logDates[0] === today.getTime() || logDates[0] === yesterday.getTime()) {
      streak = 1;
      for (let i = 0; i < logDates.length - 1; i++) {
        const diff = differenceInCalendarDays(logDates[i], logDates[i + 1]);
        if (diff === 1) {
          streak++;
        } else {
          break;
        }
      }
    }

    if (streak >= 7) {
      awardAchievement(studentId, 'PRACTICE_STREAK_7');
    }
  }, [awardAchievement]);

  // ---------------------------------------------------------------------------
  // addPracticeLog
  // ---------------------------------------------------------------------------
  const addPracticeLog = useCallback((logData: Partial<PracticeLog>) => {
    if (!logData.studentId) return;
    const student = users.find(u => u.id === logData.studentId);
    if (!student) return;

    const newLog: PracticeLog = {
      studentId: logData.studentId,
      teacherId: student.instruments?.[0]?.teacherName
        ? users.find(t => t.name === student.instruments![0].teacherName)?.id
        : undefined,
      ...logData
    } as PracticeLog;
    const updatedLogs = [...mockPracticeLogs, newLog];
    setMockPracticeLogs(updatedLogs);
    checkAndAwardPracticeStreak(logData.studentId, updatedLogs);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [users, mockPracticeLogs, checkAndAwardPracticeStreak]);

  // ---------------------------------------------------------------------------
  // updateRepertoireStatus
  // ---------------------------------------------------------------------------
  const updateRepertoireStatus = useCallback((repertoireId: string, status: RepertoireStatus) => {
    setMockAssignedRepertoire(prev =>
      prev.map(rep => {
        if (rep.id === repertoireId) {
          const wasCompleted = rep.status === 'COMPLETED';
          const isNowCompleted = status === 'COMPLETED';
          const updatedRep = { ...rep, status };
          if (isNowCompleted && !wasCompleted) {
            updatedRep.completedAt = new Date().toISOString();
            awardAchievement(rep.studentId, 'PIECE_COMPLETED');
          }
          if (!isNowCompleted && wasCompleted) {
            delete updatedRep.completedAt;
          }
          return updatedRep;
        }
        return rep;
      })
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [awardAchievement]);

  // ---------------------------------------------------------------------------
  // addLessonNote
  // ---------------------------------------------------------------------------
  const addLessonNote = useCallback((noteData: Partial<LessonNote>) => {
    const newNote: LessonNote = {
      id: `note-${Date.now()}`,
      createdAt: new Date().toISOString(),
      isSharedWithParent: true,
      isSharedWithStudent: true,
      ...noteData
    } as LessonNote;
    setMockLessonNotes(prev => [newNote, ...prev]);
  }, []);

  // ---------------------------------------------------------------------------
  // updateUserPracticeGoal
  // ---------------------------------------------------------------------------
  const updateUserPracticeGoal = useCallback((studentId: string, practiceGoal: number) => {
    const student = users.find(u => u.id === studentId);
    if (student) {
      updateUser({ ...student, weeklyPracticeGoal: practiceGoal });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [users, updateUser]);

  // ---------------------------------------------------------------------------
  // addProgressReport
  // ---------------------------------------------------------------------------
  const addProgressReport = useCallback((reportData: Partial<ProgressReport>) => {
    const newReport: ProgressReport = {
      id: `report-${Date.now()}`,
      createdAt: new Date().toISOString(),
      sentAt: new Date().toISOString(),
      ...reportData
    } as ProgressReport;
    setMockProgressReports(prev => [newReport, ...prev]);
  }, []);

  // ---------------------------------------------------------------------------
  // submitTeacherRating
  // ---------------------------------------------------------------------------
  const submitTeacherRating = useCallback((teacherId: string, rating: 1 | 2 | 3 | 4 | 5, comment?: string) => {
    if (!user) return;
    const conservatoriumId = user.conservatoriumId ?? '';

    // Check eligibility: must have a completed lesson with this teacher
    const hasCompletedLesson = mockLessons.some(
      l => l.teacherId === teacherId &&
      l.studentId === user.id &&
      l.status === 'COMPLETED'
    );
    if (!hasCompletedLesson) return;

    // Check uniqueness: one rating per user per teacher
    const alreadyRated = mockTeacherRatings.some(
      r => r.teacherId === teacherId && r.reviewerUserId === user.id
    );
    if (alreadyRated) return;

    const newRating: TeacherRating = {
      id: `rating-${teacherId}-${user.id}`,
      teacherId,
      reviewerUserId: user.id,
      conservatoriumId,
      rating,
      comment,
      createdAt: new Date().toISOString(),
    };

    setMockTeacherRatings(prev => {
      const updated = [...prev, newRating];
      // Recompute avg on the teacher user record
      const teacherRatings = updated.filter(r => r.teacherId === teacherId);
      const avg = teacherRatings.reduce((s, r) => s + r.rating, 0) / teacherRatings.length;
      setUsers(prevUsers => prevUsers.map(u =>
        u.id === teacherId
          ? { ...u, teacherRatingAvg: Math.round(avg * 10) / 10, teacherRatingCount: teacherRatings.length }
          : u
      ));
      return updated;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, mockLessons, mockTeacherRatings, setUsers]);

  // ---------------------------------------------------------------------------
  // getTeacherRating
  // ---------------------------------------------------------------------------
  const getTeacherRating = useCallback((teacherId: string) => {
    return {
      avg: mockTeacherRatings.filter(r => r.teacherId === teacherId).reduce((s, r, _, a) => s + r.rating / a.length, 0) || 0,
      count: mockTeacherRatings.filter(r => r.teacherId === teacherId).length,
      userRating: user ? mockTeacherRatings.find(r => r.teacherId === teacherId && r.reviewerUserId === user.id)?.rating : undefined,
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mockTeacherRatings, user]);

  // ---------------------------------------------------------------------------
  // assignRepertoire
  // ---------------------------------------------------------------------------
  const assignRepertoire = useCallback((studentIds: string | string[], compositionId: string) => {
    const targetIds = Array.isArray(studentIds) ? studentIds : [studentIds];

    setMockAssignedRepertoire(prev => {
      const existingKeys = new Set(prev.map((item) => `${item.studentId}::${item.compositionId}`));
      const additions: AssignedRepertoire[] = [];

      targetIds.forEach((studentId, index) => {
        const key = `${studentId}::${compositionId}`;
        if (existingKeys.has(key)) return;
        additions.push({
          id: `rep-${Date.now()}-${index}`,
          studentId,
          compositionId,
          status: 'LEARNING',
          assignedAt: new Date().toISOString(),
        });
      });

      return additions.length > 0 ? [...prev, ...additions] : prev;
    });
  }, []);

  // ---------------------------------------------------------------------------
  // addComposition / updateComposition / deleteComposition
  // ---------------------------------------------------------------------------
  const addComposition = useCallback((data: Partial<Composition>) => {
    const newComposition: Composition = {
      id: `comp-user-${Date.now()}`,
      composer: data.composerNames?.he || data.composer || '',
      composerNames: data.composerNames,
      title: data.titles?.he || data.title || '',
      titles: data.titles,
      duration: data.duration || '00:00',
      genre: data.genre || '',
      instrument: data.instrument,
      approved: data.approved ?? false,
      source: 'user_submitted',
    };
    setMockRepertoire(prev => [newComposition, ...prev]);
  }, []);

  const updateComposition = useCallback((compositionId: string, data: Partial<Composition>) => {
    setMockRepertoire(prev => prev.map(c => c.id === compositionId ? {
      ...c,
      ...data,
      composer: data.composerNames?.he || data.composer || c.composer,
      title: data.titles?.he || data.title || c.title,
    } : c));
  }, []);

  const deleteComposition = useCallback((compositionId: string) => {
    setMockRepertoire(prev => prev.filter(c => c.id !== compositionId));
  }, []);

  // ---------------------------------------------------------------------------
  // Context value
  // ---------------------------------------------------------------------------
  const value = useMemo(
    () => ({
      mockAssignedRepertoire,
      assignedRepertoire: mockAssignedRepertoire,
      setMockAssignedRepertoire,
      mockRepertoire,
      repertoire: mockRepertoire,
      setMockRepertoire,
      mockPracticeLogs,
      practiceLogs: mockPracticeLogs,
      setMockPracticeLogs,
      mockLessonNotes,
      lessonNotes: mockLessonNotes,
      setMockLessonNotes,
      mockProgressReports,
      progressReports: mockProgressReports,
      setMockProgressReports,
      mockTeacherRatings,
      setMockTeacherRatings,
      assignRepertoire,
      updateRepertoireStatus,
      addLessonNote,
      updateUserPracticeGoal,
      addPracticeLog,
      addProgressReport,
      submitTeacherRating,
      getTeacherRating,
      awardAchievement,
      addComposition,
      updateComposition,
      deleteComposition,
    }),
    [
      mockAssignedRepertoire,
      mockRepertoire,
      mockPracticeLogs,
      mockLessonNotes,
      mockProgressReports,
      mockTeacherRatings,
      assignRepertoire,
      updateRepertoireStatus,
      addLessonNote,
      updateUserPracticeGoal,
      addPracticeLog,
      addProgressReport,
      submitTeacherRating,
      getTeacherRating,
      awardAchievement,
      addComposition,
      updateComposition,
      deleteComposition,
    ],
  );

  return <RepertoireDomainContext.Provider value={value}>{children}</RepertoireDomainContext.Provider>;
}
