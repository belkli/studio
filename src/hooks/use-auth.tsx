/**
 * @fileoverview This is the central authentication and state management provider for the Harmonia application.
 * It uses React Context to provide user authentication status, user data, and all mock data
 * for the application's features. It also contains the functions to manipulate this mock data,
 * simulating a backend API. In a production application, these functions would make API calls
 * to a real backend service like Firebase.
 */
'use client';
import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import type { User, FormSubmission, Notification, Conservatorium, Package, LessonSlot, Invoice, PracticeLog, Composition, AssignedRepertoire, LessonNote, RepertoireStatus, MessageThread, ProgressReport, Announcement, Room, PayrollSummary, PracticeVideo, WaitlistEntry, FormTemplate, AuditLogEntry, SlotStatus, Channel, NotificationPreferences, Achievement, AchievementType, EventProduction, EventProductionStatus, PerformanceSlot, InstrumentInventory, InstrumentCondition, PerformanceBooking, PerformanceBookingStatus, ScholarshipApplication, OpenDayEvent, OpenDayAppointment, Branch, PaymentMethod, WaitlistStatus, PayrollStatus, Alumnus, Masterclass } from '@/lib/types';
import * as initialMockData from '@/lib/data';
import { useRouter, usePathname } from 'next/navigation';
import { useToast } from './use-toast';
import { add, differenceInCalendarDays, startOfDay, addDays } from 'date-fns';

/**
 * Defines the shape of the authentication context, including all state and action dispatchers.
 */
interface AuthContextType {
  user: User | null;
  users: User[];
  mockFormSubmissions: FormSubmission[];
  compositions: Composition[];
  mockLessons: LessonSlot[];
  mockPackages: Package[];
  mockInvoices: Invoice[];
  mockPracticeLogs: PracticeLog[];
  mockAssignedRepertoire: AssignedRepertoire[];
  mockLessonNotes: LessonNote[];
  mockMessageThreads: MessageThread[];
  mockProgressReports: ProgressReport[];
  mockAnnouncements: Announcement[];
  mockFormTemplates: FormTemplate[];
  mockAuditLog: AuditLogEntry[];
  mockEvents: EventProduction[];
  mockInstrumentInventory: InstrumentInventory[];
  mockPerformanceBookings: PerformanceBooking[];
  mockScholarshipApplications: ScholarshipApplication[];
  mockOpenDayEvents: OpenDayEvent[];
  mockOpenDayAppointments: OpenDayAppointment[];
  mockPracticeVideos: PracticeVideo[];
  mockAlumni: Alumnus[];
  mockMasterclasses: Masterclass[];
  conservatoriums: Conservatorium[];
  mockBranches: Branch[];
  login: (email: string) => { user: User | null; status: 'approved' | 'pending' | 'not_found' };
  logout: () => void;
  approveUser: (userId: string) => void;
  rejectUser: (userId: string, reason: string) => void;
  updateForm: (updatedForm: FormSubmission) => void;
  updateUser: (updatedUser: User) => void;
  addLesson: (lessonData: Partial<LessonSlot>) => void;
  cancelLesson: (lessonId: string, withNotice: boolean) => void;
  rescheduleLesson: (lessonId: string, newStartTime: string) => void;
  getMakeupCreditBalance: (studentIds: string[]) => number;
  getMakeupCreditsDetail: (studentIds: string[]) => any[];
  addPracticeLog: (logData: Partial<PracticeLog>) => void;
  updateRepertoireStatus: (repertoireId: string, status: RepertoireStatus) => void;
  addLessonNote: (noteData: Partial<LessonNote>) => void;
  updateUserPracticeGoal: (studentId: string, goal: number) => void;
  addProgressReport: (reportData: Partial<ProgressReport>) => void;
  addMessage: (threadId: string, senderId: string, body: string) => void;
  addAnnouncement: (announcementData: Partial<Announcement>) => void;
  assignSubstitute: (lessonId: string, newTeacherId: string) => void;
  reportSickLeave: (teacherId: string, from: Date, to: Date) => LessonSlot[];
  updateLessonStatus: (lessonId: string, status: SlotStatus) => void;
  addToWaitlist: (waitlistEntry: Partial<WaitlistEntry>) => void;
  updateWaitlistStatus: (entryId: string, status: WaitlistStatus) => void;
  addFormTemplate: (templateData: Partial<FormTemplate>) => void;
  updateConservatorium: (updatedConservatorium: Conservatorium) => void;
  addEvent: (eventData: Partial<EventProduction>) => void;
  addPerformanceToEvent: (eventId: string, studentId: string, repertoireId: string) => void;
  removePerformanceFromEvent: (eventId: string, performanceId: string) => void;
  assignInstrumentToStudent: (instrumentId: string, studentId: string, checkoutDetails?: { expectedReturnDate: string; parentSignatureUrl: string; depositAmount?: number }) => void;
  returnInstrument: (instrumentId: string) => void;
  addPracticeVideo: (videoData: Partial<PracticeVideo>) => void;
  addVideoFeedback: (videoId: string, comment: string) => void;
  assignMusiciansToPerformance: (bookingId: string, musicianIds: string[]) => void;
  updatePerformanceBookingStatus: (bookingId: string, status: PerformanceBookingStatus) => void;
  addPerformanceBooking: (bookingData: Partial<PerformanceBooking>) => void;
  addScholarshipApplication: (applicationData: Partial<ScholarshipApplication>) => void;
  addOpenDayAppointment: (appointmentData: Partial<OpenDayAppointment>) => void;
  markWalkthroughAsSeen: (userId: string) => void;
  addUser: (userData: Partial<User>, isAdminFlow?: boolean) => User;
  addBranch: (branchData: Partial<Branch>) => void;
  updateBranch: (branchData: Branch) => void;
  updateNotificationPreferences: (preferences: NotificationPreferences) => void;
  updateUserPaymentMethod: (paymentData: { last4: string, expiryMonth: number, expiryYear: number }) => void;
  newFeaturesEnabled: boolean;
  isLoading: boolean;
  assignRepertoire: (studentId: string, compositionId: string) => void;
  mockWaitlist: WaitlistEntry[];
  mockPayrolls: PayrollSummary[];
  updatePayrollStatus: (payrollId: string, status: PayrollStatus) => void;
  updateEvent: (event: EventProduction) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

/**
 * The main provider component that wraps the application.
 * It initializes and manages all application state, simulating a full backend.
 */
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  // State for the currently logged-in user
  const [user, setUser] = useState<User | null>(null);
  // State for all mock data sets
  const [users, setUsers] = useState<User[]>(initialMockData.mockUsers);
  const [mockFormSubmissions, setMockFormSubmissions] = useState<FormSubmission[]>(initialMockData.mockFormSubmissions);
  const [mockLessons, setMockLessons] = useState<LessonSlot[]>(initialMockData.mockLessons);
  const [mockPackages, setMockPackages] = useState<Package[]>(initialMockData.mockPackages);
  const [mockInvoices, setMockInvoices] = useState<Invoice[]>(initialMockData.mockInvoices);
  const [mockPracticeLogs, setMockPracticeLogs] = useState<PracticeLog[]>(initialMockData.mockPracticeLogs);
  const [mockAssignedRepertoire, setMockAssignedRepertoire] = useState<AssignedRepertoire[]>(initialMockData.mockAssignedRepertoire);
  const [mockLessonNotes, setMockLessonNotes] = useState<LessonNote[]>(initialMockData.mockLessonNotes);
  const [mockMessageThreads, setMockMessageThreads] = useState<MessageThread[]>(initialMockData.mockMessageThreads);
  const [mockProgressReports, setMockProgressReports] = useState<ProgressReport[]>(initialMockData.mockProgressReports);
  const [mockAnnouncements, setMockAnnouncements] = useState<Announcement[]>(initialMockData.mockAnnouncements);
  const [mockFormTemplates, setMockFormTemplates] = useState<FormTemplate[]>(initialMockData.mockFormTemplates);
  const [mockAuditLog, setMockAuditLog] = useState<AuditLogEntry[]>(initialMockData.mockAuditLog);
  const [mockEvents, setMockEvents] = useState<EventProduction[]>(initialMockData.mockEvents);
  const [mockInstrumentInventory, setMockInstrumentInventory] = useState<InstrumentInventory[]>(initialMockData.mockInstrumentInventory);
  const [mockPerformanceBookings, setMockPerformanceBookings] = useState<PerformanceBooking[]>(initialMockData.mockPerformanceBookings);
  const [mockScholarshipApplications, setMockScholarshipApplications] = useState<ScholarshipApplication[]>(initialMockData.mockScholarshipApplications);
  const [mockOpenDayEvents, setMockOpenDayEvents] = useState<OpenDayEvent[]>(initialMockData.mockOpenDayEvents);
  const [mockOpenDayAppointments, setMockOpenDayAppointments] = useState<OpenDayAppointment[]>(initialMockData.mockOpenDayAppointments);
  const [mockBranches, setMockBranches] = useState<Branch[]>(initialMockData.mockBranches);
  const [mockPracticeVideos, setMockPracticeVideos] = useState<PracticeVideo[]>(initialMockData.mockPracticeVideos);
  const [mockAlumni, setMockAlumni] = useState<Alumnus[]>(initialMockData.mockAlumni);
  const [mockMasterclasses, setMockMasterclasses] = useState<Masterclass[]>(initialMockData.mockMasterclasses);
  const [mockWaitlist, setMockWaitlist] = useState<WaitlistEntry[]>(initialMockData.mockWaitlist);
  const [mockPayrolls, setMockPayrolls] = useState<PayrollSummary[]>(initialMockData.mockPayrolls);
  const [conservatoriums, setConservatoriums] = useState<Conservatorium[]>(initialMockData.conservatoriums);
  const [isLoading, setIsLoading] = useState(true);

  const router = useRouter();
  const { toast } = useToast();

  const newFeaturesEnabled = useMemo(() => {
    if (!user) return false;
    const currentConservatorium = conservatoriums.find(c => c.id === user.conservatoriumId);
    return currentConservatorium?.newFeaturesEnabled || false;
  }, [user, conservatoriums]);

  // On initial load, check for a user in localStorage to persist login state.
  useEffect(() => {
    const storedUser = localStorage.getItem('harmonia-user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  /**
   * Simulates user login.
   * @param email The email to log in with.
   * @returns An object with the user and their approval status.
   */
  const login = (email: string): { user: User | null; status: 'approved' | 'pending' | 'not_found' } => {
    const foundUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (foundUser) {
      if (foundUser.approved) {
        localStorage.setItem('harmonia-user', JSON.stringify(foundUser));
        setUser(foundUser);
        router.push('/dashboard');
        return { user: foundUser, status: 'approved' };
      } else {
        router.push('/pending-approval');
        return { user: foundUser, status: 'pending' };
      }
    }
    return { user: null, status: 'not_found' };
  };

  /**
   * Logs the user out by clearing state and localStorage.
   */
  const logout = () => {
    localStorage.removeItem('harmonia-user');
    setUser(null);
    router.push('/login');
  };

  // --- Data Manipulation Functions ---
  // These functions simulate backend operations by directly manipulating the state.

  const approveUser = (userId: string) => {
    setUsers(prevUsers => prevUsers.map(u => u.id === userId ? { ...u, approved: true } : u));
  };

  const rejectUser = (userId: string, reason: string) => {
    setUsers(prevUsers => prevUsers.map(u => u.id === userId ? { ...u, approved: false, rejectionReason: reason } : u));
  };

  const updateForm = (updatedForm: FormSubmission) => {
    setMockFormSubmissions(prevForms => {
      const formIndex = prevForms.findIndex(f => f.id === updatedForm.id);
      if (formIndex > -1) {
        return prevForms.map((form, index) => index === formIndex ? updatedForm : form);
      } else {
        return [...prevForms, updatedForm];
      }
    });
  };

  const updateUserPaymentMethod = (paymentData: { last4: string, expiryMonth: number, expiryYear: number }) => {
    if (!user) return;
    const newPaymentMethod: PaymentMethod = {
      id: `pm-${Date.now()}`,
      type: 'CreditCard',
      last4: paymentData.last4,
      expiryMonth: paymentData.expiryMonth,
      expiryYear: paymentData.expiryYear,
      isPrimary: true,
    };

    // In a real app, you'd only update the primary or add a new one. Here we replace all.
    const updatedUser: User = {
      ...user,
      paymentMethods: [newPaymentMethod],
    };
    updateUser(updatedUser);
  };


  const updateUser = (updatedUser: User) => {
    const updatedUsers = users.map(u => u.id === updatedUser.id ? updatedUser : u);
    setUsers(updatedUsers);
    if (user?.id === updatedUser.id) {
      setUser(updatedUser);
      localStorage.setItem('harmonia-user', JSON.stringify(updatedUser));
    }
  };

  const updateNotificationPreferences = (preferences: NotificationPreferences) => {
    if (!user) return;
    const updatedUser = { ...user, notificationPreferences: preferences };
    updateUser(updatedUser);
  };

  const addLesson = (lessonData: Partial<LessonSlot>) => {
    const newLesson: LessonSlot = {
      id: `lesson-${Date.now()}`,
      conservatoriumId: user!.conservatoriumId,
      status: 'SCHEDULED',
      isCreditConsumed: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...lessonData
    } as LessonSlot;
    setMockLessons(prev => [...prev, newLesson]);
  };

  const cancelLesson = (lessonId: string, withNotice: boolean) => {
    setMockLessons(prev => prev.map(l => l.id === lessonId ? { ...l, status: withNotice ? 'CANCELLED_STUDENT_NOTICED' : 'CANCELLED_STUDENT_NO_NOTICE' } : l));
  };

  const rescheduleLesson = (lessonId: string, newStartTime: string) => {
    setMockLessons(prev => prev.map(l => l.id === lessonId ? { ...l, startTime: newStartTime } : l));
  };

  const getMakeupCreditBalance = (studentIds: string[]) => {
    if (!studentIds.length) return 0;
    const granted = mockLessons.filter(l =>
      studentIds.includes(l.studentId) &&
      (l.status === 'CANCELLED_TEACHER' || l.status === 'CANCELLED_CONSERVATORIUM' || l.status === 'CANCELLED_STUDENT_NOTICED')
    ).length;
    const used = mockLessons.filter(l => studentIds.includes(l.studentId) && l.type === 'MAKEUP').length;
    return granted - used;
  };
  const getMakeupCreditsDetail = (studentIds: string[]) => {
    if (!studentIds.length) return [];
    return mockLessons.filter(l =>
      studentIds.includes(l.studentId) &&
      (l.status === 'CANCELLED_TEACHER' || l.status === 'CANCELLED_CONSERVATORIUM' || l.status === 'CANCELLED_STUDENT_NOTICED')
    ).map(l => ({
      id: l.id,
      reason: l.status,
      grantedAt: l.createdAt,
      expiresAt: addDays(new Date(l.createdAt), 60).toISOString(),
      status: 'AVAILABLE'
    }))
  };

  const awardAchievement = (studentId: string, type: AchievementType) => {
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
        newAchievement = { id: `ach-${Date.now()}`, type, title: 'יצירה הושלמה!', titleHe: 'יצירה הושלמה!', description: 'כל הכבוד על סיום יצירה חדשה.', icon: '🎵', points: 75, achievedAt: new Date().toISOString() };
        break;
      case 'PRACTICE_STREAK_7':
        newAchievement = { id: `ach-${Date.now()}`, type, title: 'רצף אימונים של 7 ימים!', titleHe: 'רצף אימונים של 7 ימים!', description: 'התמדה היא המפתח להצלחה. כל הכבוד!', icon: '🔥', points: 50, achievedAt: new Date().toISOString() };
        break;
    }

    if (newAchievement) {
      updateUser({ ...student, achievements: [...(student.achievements || []), newAchievement] });
      toast({ title: newAchievement.title, description: newAchievement.description });
    }
  };

  const checkAndAwardPracticeStreak = (studentId: string, allLogs: PracticeLog[]) => {
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
  };


  const addPracticeLog = (logData: Partial<PracticeLog>) => {
    if (!logData.studentId) return;
    const student = users.find(u => u.id === logData.studentId);
    if (!student) return;

    const newLog: PracticeLog = {
      id: `pl-${Date.now()}`,
      studentId: logData.studentId,
      teacherId: student.instruments?.[0]?.teacherName ? users.find(t => t.name === student.instruments![0].teacherName)?.id : undefined,
      ...logData
    } as PracticeLog;
    const updatedLogs = [...mockPracticeLogs, newLog];
    setMockPracticeLogs(updatedLogs);
    checkAndAwardPracticeStreak(logData.studentId, updatedLogs);
  };

  const updateRepertoireStatus = (repertoireId: string, status: RepertoireStatus) => {
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
  };

  const addLessonNote = (noteData: Partial<LessonNote>) => {
    const newNote: LessonNote = {
      id: `note-${Date.now()}`,
      createdAt: new Date().toISOString(),
      isSharedWithParent: true,
      isSharedWithStudent: true,
      ...noteData
    } as LessonNote;
    setMockLessonNotes(prev => [newNote, ...prev]);
  };

  const updateUserPracticeGoal = (studentId: string, practiceGoal: number) => {
    const student = users.find(u => u.id === studentId);
    if (student) {
      updateUser({ ...student, weeklyPracticeGoal: practiceGoal });
    }
  };

  const addProgressReport = (reportData: Partial<ProgressReport>) => {
    const newReport: ProgressReport = {
      id: `report-${Date.now()}`,
      createdAt: new Date().toISOString(),
      sentAt: new Date().toISOString(),
      ...reportData
    } as ProgressReport;
    setMockProgressReports(prev => [newReport, ...prev]);
  };
  const addMessage = (threadId: string, senderId: string, body: string) => {
    setMockMessageThreads(prev => prev.map(thread => {
      if (thread.id === threadId) {
        const newMessage = { senderId, body, sentAt: new Date().toISOString() };
        return { ...thread, messages: [...thread.messages, newMessage] };
      }
      return thread;
    }))
  };
  const addAnnouncement = (announcementData: Partial<Announcement>) => {
    const newAnnouncement: Announcement = {
      id: `ann-${Date.now()}`,
      conservatoriumId: user!.conservatoriumId,
      sentAt: new Date().toISOString(),
      ...announcementData
    } as Announcement;
    setMockAnnouncements(prev => [newAnnouncement, ...prev]);

    const newAuditLogEntry: AuditLogEntry = {
      id: `log-${Date.now()}`,
      notificationId: newAnnouncement.id,
      userId: 'system',
      channel: 'IN_APP',
      status: 'DELIVERED',
      sentAt: new Date().toISOString(),
      title: newAnnouncement.title,
      body: newAnnouncement.body,
    };
    setMockAuditLog(prev => [newAuditLogEntry, ...prev]);
  };
  const assignSubstitute = (lessonId: string, newTeacherId: string) => {
    setMockLessons(prev => prev.map(lesson =>
      lesson.id === lessonId
        ? { ...lesson, teacherId: newTeacherId, status: 'SCHEDULED' as SlotStatus }
        : lesson
    ));
  };

  const reportSickLeave = (teacherId: string, from: Date, to: Date): LessonSlot[] => {
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
  };
  const updateLessonStatus = (lessonId: string, status: SlotStatus) => {
    setMockLessons(prev => prev.map(l => l.id === lessonId ? { ...l, status, attendanceMarkedAt: new Date().toISOString() } : l));
  };
  const addToWaitlist = (waitlistEntry: Partial<WaitlistEntry>) => {
    const newEntry: WaitlistEntry = {
      id: `wait-${Date.now()}`,
      joinedAt: new Date().toISOString(),
      status: 'WAITING',
      ...waitlistEntry
    } as WaitlistEntry;
    setMockWaitlist(prev => [...prev, newEntry]);
  };
  const updateWaitlistStatus = (entryId: string, status: WaitlistStatus) => {
    setMockWaitlist(prev => prev.map(e => e.id === entryId ? { ...e, status } : e));
  };

  const addFormTemplate = (templateData: Partial<FormTemplate>) => {
    const newTemplate: FormTemplate = {
      id: `template-${Date.now()}`,
      conservatoriumId: user!.conservatoriumId,
      createdAt: new Date().toISOString(),
      ...templateData
    } as FormTemplate;
    setMockFormTemplates(prev => [...prev, newTemplate]);
  };
  const updateConservatorium = (updatedConservatorium: Conservatorium) => {
    setConservatoriums(prev => prev.map(c => c.id === updatedConservatorium.id ? updatedConservatorium : c));
  };
  const addEvent = (eventData: Partial<EventProduction>) => {
    const newEvent: EventProduction = {
      id: `event-${Date.now()}`,
      conservatoriumId: user!.conservatoriumId,
      program: [],
      ...eventData,
    } as EventProduction;
    setMockEvents(prev => [newEvent, ...prev]);
  };

  const updateEvent = (updatedEvent: EventProduction) => {
    setMockEvents(prev => prev.map(e => e.id === updatedEvent.id ? updatedEvent : e));
  };

  const addPerformanceToEvent = (eventId: string, studentId: string, repertoireId: string) => {
    const student = users.find(u => u.id === studentId);
    const repertoireItem = initialMockData.mockAssignedRepertoire.find(r => r.id === repertoireId);
    const composition = initialMockData.compositions.find(c => c.id === repertoireItem?.compositionId);

    if (!student || !repertoireItem || !composition) {
      toast({ variant: 'destructive', title: 'שגיאה בהוספת מבצע' });
      return;
    }

    const newPerformance: PerformanceSlot = {
      id: `ps-${Date.now()}`,
      studentId,
      studentName: student.name,
      compositionTitle: composition.title,
      composer: composition.composer,
      duration: composition.duration,
    };

    setMockEvents(prev => prev.map(event =>
      event.id === eventId
        ? { ...event, program: [...event.program, newPerformance] }
        : event
    ));
    toast({ title: `${student.name} נוסף/ה לתוכנית!` });
  };
  const removePerformanceFromEvent = (eventId: string, performanceId: string) => {
    setMockEvents(prev => prev.map(event =>
      event.id === eventId
        ? { ...event, program: event.program.filter(p => p.id !== performanceId) }
        : event
    ));
    toast({ title: 'הביצוע הוסר מהתוכנית' });
  };

  const assignInstrumentToStudent = (instrumentId: string, studentId: string, checkoutDetails?: { expectedReturnDate: string; parentSignatureUrl: string; depositAmount?: number }) => {
    setMockInstrumentInventory(prev => prev.map(inst =>
      inst.id === instrumentId
        ? {
          ...inst,
          currentRenterId: studentId,
          rentalStartDate: new Date().toISOString(),
          currentCheckout: checkoutDetails ? {
            studentId,
            checkedOutAt: new Date().toISOString(),
            expectedReturnDate: checkoutDetails.expectedReturnDate,
            parentSignatureUrl: checkoutDetails.parentSignatureUrl,
            depositAmount: checkoutDetails.depositAmount
          } : undefined
        }
        : inst
    ));
    toast({ title: 'הכלי הושאל בהצלחה' });
  };
  const returnInstrument = (instrumentId: string) => {
    setMockInstrumentInventory(prev => prev.map(inst =>
      inst.id === instrumentId
        ? { ...inst, currentRenterId: undefined, rentalStartDate: undefined, currentCheckout: undefined }
        : inst
    ));
    toast({ title: 'הכלי הוחזר למלאי' });
  };
  const addPracticeVideo = (videoData: Partial<PracticeVideo>) => {
    if (!user) return;
    const studentId = user.role === 'student' ? user.id : user.childIds?.[0];
    const student = users.find(u => u.id === studentId);
    const teacherName = student?.instruments?.[0]?.teacherName;
    const teacherId = teacherName ? users.find(t => t.name === teacherName)?.id : undefined;
    if (!studentId || !teacherId) return;

    const newVideo: PracticeVideo = {
      id: `pv-${Date.now()}`,
      studentId: studentId,
      teacherId: teacherId,
      createdAt: new Date().toISOString(),
      videoUrl: 'https://placehold.co/600x400.mp4',
      ...videoData
    } as PracticeVideo;
    setMockPracticeVideos(prev => [newVideo, ...prev]);
  };
  const addVideoFeedback = (videoId: string, comment: string) => {
    if (!user) return;
    const newFeedback = {
      teacherId: user.id,
      comment: comment,
      createdAt: new Date().toISOString(),
    };
    setMockPracticeVideos(prev => prev.map(v => v.id === videoId ? { ...v, feedback: [...(v.feedback || []), newFeedback] } : v));
  };
  const assignMusiciansToPerformance = (bookingId: string, musicianIds: string[]) => {
    setMockPerformanceBookings(prev =>
      prev.map(booking => {
        if (booking.id === bookingId) {
          const assignedMusicians = musicianIds.map(id => {
            const musicianUser = users.find(u => u.id === id);
            return {
              userId: id,
              name: musicianUser?.name || 'Unknown',
              instrument: musicianUser?.instruments?.[0]?.instrument || 'Unknown',
            };
          });
          return { ...booking, assignedMusicians, status: 'MUSICIANS_CONFIRMED' };
        }
        return booking;
      })
    );
  };

  const updatePerformanceBookingStatus = (bookingId: string, status: PerformanceBookingStatus) => {
    setMockPerformanceBookings(prev =>
      prev.map(booking =>
        booking.id === bookingId ? { ...booking, status } : booking
      )
    );
  };

  const addPerformanceBooking = (bookingData: Partial<PerformanceBooking>) => {
    const newBooking: PerformanceBooking = {
      id: `perf-${Date.now()}`,
      conservatoriumId: user?.conservatoriumId || 'cons-15',
      status: 'INQUIRY_RECEIVED',
      inquiryReceivedAt: new Date().toISOString(),
      ...bookingData
    } as PerformanceBooking;
    setMockPerformanceBookings(prev => [newBooking, ...prev]);
  };

  const addScholarshipApplication = (applicationData: Partial<ScholarshipApplication>) => {
    const student = users.find(u => u.id === user?.id || user?.childIds?.includes(u.id));
    if (!student) return;

    const newApplication: ScholarshipApplication = {
      id: `schol-app-${Date.now()}`,
      studentId: student.id,
      studentName: student.name,
      instrument: student.instruments?.[0].instrument || 'לא צוין',
      conservatoriumId: student.conservatoriumId,
      academicYear: 'תשפ"ה',
      status: 'SUBMITTED',
      submittedAt: new Date().toISOString(),
      priorityScore: Math.floor(Math.random() * 50) + 40,
      ...applicationData
    } as ScholarshipApplication;
    setMockScholarshipApplications(prev => [newApplication, ...prev]);
  };

  const addOpenDayAppointment = (appointmentData: Partial<OpenDayAppointment>) => {
    const newAppointment: OpenDayAppointment = {
      id: `open-day-appt-${Date.now()}`,
      status: 'SCHEDULED',
      registeredAt: new Date().toISOString(),
      ...appointmentData
    } as OpenDayAppointment;
    setMockOpenDayAppointments(prev => [...prev, newAppointment]);
  };

  const markWalkthroughAsSeen = (userId: string) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, hasSeenWalkthrough: true } : u));
    if (user?.id === userId) {
      const updatedUser = { ...user, hasSeenWalkthrough: true };
      setUser(updatedUser);
      localStorage.setItem('harmonia-user', JSON.stringify(updatedUser));
    }
  };

  const addUser = (userData: Partial<User>, isAdminFlow = false): User => {
    const newUser: User = {
      id: `user-${Date.now()}`,
      approved: isAdminFlow, // Admins auto-approve
      avatarUrl: 'https://i.pravatar.cc/150?u=' + Date.now(),
      achievements: [],
      ...userData,
    } as User;
    setUsers(prev => [...prev, newUser]);
    return newUser;
  };

  const addBranch = (branchData: Partial<Branch>) => {
    const newBranch: Branch = {
      id: `branch-${Date.now()}`,
      ...branchData
    } as Branch;
    setMockBranches(prev => [...prev, newBranch]);
  };

  const updateBranch = (updatedBranch: Branch) => {
    setMockBranches(prev => prev.map(b => b.id === updatedBranch.id ? updatedBranch : b));
  };

  const assignRepertoire = (studentId: string, compositionId: string) => {
    const newRepertoire: AssignedRepertoire = {
      id: `rep-${Date.now()}`,
      studentId,
      compositionId,
      status: 'LEARNING',
      assignedAt: new Date().toISOString(),
    };
    setMockAssignedRepertoire(prev => [...prev, newRepertoire]);
  };

  const updatePayrollStatus = (payrollId: string, status: PayrollStatus) => {
    setMockPayrolls(prev => prev.map(p => p.id === payrollId ? { ...p, status } : p));
  };


  return (
    <AuthContext.Provider value={{
      user,
      users,
      mockFormSubmissions,
      compositions: initialMockData.compositions,
      mockLessons,
      mockPackages,
      mockInvoices,
      mockPracticeLogs,
      mockAssignedRepertoire,
      mockLessonNotes,
      mockMessageThreads,
      mockProgressReports,
      mockAnnouncements: initialMockData.mockAnnouncements,
      mockFormTemplates,
      mockAuditLog,
      mockEvents,
      mockInstrumentInventory,
      mockPerformanceBookings,
      mockScholarshipApplications,
      mockOpenDayEvents,
      mockOpenDayAppointments,
      mockPracticeVideos,
      mockAlumni,
      mockMasterclasses,
      conservatoriums,
      mockBranches,
      mockWaitlist,
      mockPayrolls,
      login,
      logout,
      approveUser,
      rejectUser,
      updateForm,
      updateUser,
      newFeaturesEnabled,
      isLoading,
      addLesson,
      cancelLesson,
      rescheduleLesson,
      getMakeupCreditBalance,
      getMakeupCreditsDetail,
      addPracticeLog,
      updateRepertoireStatus,
      addLessonNote,
      updateUserPracticeGoal,
      addProgressReport,
      addMessage,
      addAnnouncement,
      assignSubstitute,
      reportSickLeave,
      updateLessonStatus,
      addToWaitlist,
      updateWaitlistStatus,
      addFormTemplate,
      updateConservatorium,
      addEvent,
      addPerformanceToEvent,
      removePerformanceFromEvent,
      assignInstrumentToStudent,
      returnInstrument,
      addPracticeVideo,
      addVideoFeedback,
      assignMusiciansToPerformance,
      updatePerformanceBookingStatus,
      addPerformanceBooking,
      addScholarshipApplication,
      addOpenDayAppointment,
      markWalkthroughAsSeen,
      addUser,
      addBranch,
      updateBranch,
      updateNotificationPreferences,
      updateUserPaymentMethod,
      assignRepertoire,
      updatePayrollStatus,
      updateEvent
    }}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Custom hook to access the AuthContext.
 * @returns The authentication context.
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
