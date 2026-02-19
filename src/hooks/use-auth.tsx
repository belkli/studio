// @ts-nocheck
'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { 
    mockUsers as initialUsers, 
    mockFormSubmissions as initialForms, 
    conservatoriums as initialConservatoriums, 
    mockInvoices as initialInvoices,
    mockLessons as initialLessons,
    mockPracticeLogs as initialPracticeLogs,
    mockAssignedRepertoire as initialRepertoire,
    mockLessonNotes as initialNotes,
    mockMessageThreads as initialMessageThreads,
    mockPackages as initialPackages,
    mockProgressReports as initialProgressReports,
    mockAnnouncements as initialAnnouncements,
    mockPracticeVideos as initialPracticeVideos,
    compositions as initialCompositions,
    mockWaitlist as initialWaitlist,
    mockFormTemplates as initialFormTemplates,
    mockAuditLog as initialAuditLog,
    mockEvents as initialEvents,
    mockInstrumentInventory as initialInstrumentInventory,
    type User, 
    type FormSubmission,
    type Notification,
    type Conservatorium,
    type Package,
    type LessonSlot,
    type Invoice,
    type PracticeLog,
    type Composition,
    type AssignedRepertoire,
    type LessonNote,
    type RepertoireStatus,
    type MessageThread,
    type ProgressReport,
    type Announcement,
    type Room,
    type PayrollSummary,
    type PayrollStatus,
    type PracticeVideo,
    type VideoFeedback,
    type WaitlistEntry,
    type WaitlistStatus,
    type FormTemplate,
    type NotificationPreferences,
    type SlotStatus,
    type AuditLogEntry,
    type Channel,
    type Achievement,
    type AchievementType,
    type EventProduction,
    type EventProductionStatus,
    type PerformanceSlot,
    type InstrumentInventory,
    type InstrumentCondition,
} from '@/lib/data';
import { startOfMonth, endOfMonth, isWithinInterval, differenceInDays, format, addDays, addHours, startOfDay, endOfDay } from 'date-fns';
import { he } from 'date-fns/locale';
import { useToast } from './use-toast';

interface LoginResult {
  user: User | null;
  status: 'approved' | 'pending' | 'not_found';
}

interface AuthContextType {
  user: User | null;
  users: User[];
  login: (email: string) => LoginResult;
  logout: () => void;
  isLoading: boolean;
  approveUser: (userId: string) => void;
  rejectUser: (userId: string, reason: string) => void;
  updateUser: (updatedUser: User) => void;
  addUser: (newUser: Partial<User>, isApproved?: boolean) => User;
  mockFormSubmissions: FormSubmission[];
  updateForm: (updatedForm: FormSubmission) => void;
  mockLessons: LessonSlot[];
  addLesson: (newLesson: Partial<LessonSlot>) => void;
  cancelLesson: (lessonId: string) => void;
  updateLessonStatus: (lessonId: string, status: SlotStatus) => void;
  rescheduleLesson: (lessonId: string, newStartTime: string) => void;
  reportSickLeave: (teacherId: string, startDate: Date, endDate: Date) => LessonSlot[];
  assignSubstitute: (lessonId: string, newTeacherId: string) => void;
  mockInvoices: Invoice[];
  mockPracticeLogs: PracticeLog[];
  addPracticeLog: (log: Partial<PracticeLog>) => void;
  mockAssignedRepertoire: AssignedRepertoire[];
  compositions: Composition[];
  mockLessonNotes: LessonNote[];
  updateRepertoireStatus: (repertoireId: string, status: RepertoireStatus) => void;
  addLessonNote: (note: Partial<LessonNote>) => void;
  assignRepertoire: (studentId: string, compositionId: string) => void;
  mockMessageThreads: MessageThread[];
  addMessage: (threadId: string, senderId: string, body: string) => void;
  newFeaturesEnabled: boolean;
  conservatoriums: Conservatorium[];
  updateConservatorium: (updatedConservatorium: Conservatorium) => void;
  mockPackages: Package[];
  updateUserPracticeGoal: (studentId: string, goal: number) => void;
  mockProgressReports: ProgressReport[];
  addProgressReport: (report: Partial<ProgressReport>) => void;
  mockAnnouncements: Announcement[];
  addAnnouncement: (announcement: Partial<Announcement>) => void;
  getMakeupCreditBalance: (studentIds: string[]) => number;
  mockPayrolls: PayrollSummary[];
  updatePayrollStatus: (payrollId: string, status: PayrollStatus) => void;
  mockPracticeVideos: PracticeVideo[];
  addPracticeVideo: (videoData: Partial<PracticeVideo>) => PracticeVideo | undefined;
  addVideoFeedback: (videoId: string, comment: string) => void;
  mockWaitlist: WaitlistEntry[];
  addToWaitlist: (entry: Partial<WaitlistEntry>) => WaitlistEntry;
  updateWaitlistStatus: (entryId: string, status: WaitlistStatus) => void;
  mockFormTemplates: FormTemplate[];
  addFormTemplate: (template: Partial<FormTemplate>) => void;
  updateNotificationPreferences: (preferences: NotificationPreferences) => void;
  mockAuditLog: AuditLogEntry[];
  mockEvents: EventProduction[];
  addEvent: (event: Partial<EventProduction>) => void;
  addPerformanceToEvent: (eventId: string, studentId: string, repertoireId: string) => void;
  removePerformanceFromEvent: (eventId: string, performanceSlotId: string) => void;
  mockInstrumentInventory: InstrumentInventory[];
  assignInstrumentToStudent: (instrumentId: string, studentId: string) => void;
  returnInstrument: (instrumentId: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [forms, setForms] = useState<FormSubmission[]>(initialForms);
  const [conservatoriums, setConservatoriums] = useState<Conservatorium[]>(initialConservatoriums);
  const [lessons, setLessons] = useState<LessonSlot[]>(initialLessons);
  const [practiceLogs, setPracticeLogs] = useState<PracticeLog[]>(initialPracticeLogs);
  const [assignedRepertoire, setAssignedRepertoire] = useState<AssignedRepertoire[]>(initialRepertoire);
  const [lessonNotes, setLessonNotes] = useState<LessonNote[]>(initialNotes);
  const [messageThreads, setMessageThreads] = useState<MessageThread[]>(initialMessageThreads);
  const [progressReports, setProgressReports] = useState<ProgressReport[]>(initialProgressReports);
  const [announcements, setAnnouncements] = useState<Announcement[]>(initialAnnouncements);
  const [practiceVideos, setPracticeVideos] = useState<PracticeVideo[]>(initialPracticeVideos);
  const [payrolls, setPayrolls] = useState<PayrollSummary[]>([]);
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>(initialWaitlist);
  const [formTemplates, setFormTemplates] = useState<FormTemplate[]>(initialFormTemplates);
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>(initialAuditLog);
  const [events, setEvents] = useState<EventProduction[]>(initialEvents);
  const [instrumentInventory, setInstrumentInventory] = useState<InstrumentInventory[]>(initialInstrumentInventory);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const notificationsSentOnLoad = useRef(new Set<string>());


  const addNotificationAndLog = useCallback((userId: string, title: string, message: string, link: string) => {
    const notificationId = `notif-${Date.now()}-${Math.random()}`;
    const newNotification: Notification = {
      id: notificationId,
      title,
      message,
      link,
      read: false,
      timestamp: new Date().toISOString(),
    };
    
    setUsers(prevUsers => prevUsers.map(u => 
        u.id === userId
            ? { ...u, notifications: [newNotification, ...(u.notifications || [])]}
            : u
    ));
    
    setUser(prevUser => (prevUser && prevUser.id === userId) 
        ? { ...prevUser, notifications: [newNotification, ...(prevUser.notifications || [])]} 
        : prevUser
    );

    const newLogEntry: AuditLogEntry = {
      id: `log-IN_APP-${Date.now()}`,
      notificationId,
      userId,
      channel: 'IN_APP',
      status: 'DELIVERED', // Mock status
      sentAt: new Date().toISOString(),
      title,
      body: message,
    };
    setAuditLog(prev => [newLogEntry, ...prev]);
  }, []);

  useEffect(() => {
    const checkAndNotify = (userId: string, notificationKey: string, createNotification: () => void) => {
        const key = `${userId}-${notificationKey}`;
        if (!notificationsSentOnLoad.current.has(key)) {
            createNotification();
            notificationsSentOnLoad.current.add(key);
        }
    };

    const now = new Date();

    // Check for expiring packages
    initialUsers.forEach(u => {
        const studentPackage = initialPackages.find(p => p.id === u.packageId);
        if (studentPackage && studentPackage.validUntil) {
            const expiryDate = new Date(studentPackage.validUntil);
            const daysUntilExpiry = differenceInDays(expiryDate, now);

            if (daysUntilExpiry > 0 && daysUntilExpiry <= 14) {
                const userToNotifyId = u.parentId || u.id;
                checkAndNotify(userToNotifyId, `expiring-package-${u.id}`, () => {
                    addNotificationAndLog(
                        userToNotifyId,
                        'חבילתך עומדת לפוג!',
                        `נותרו רק ${daysUntilExpiry} ימים עד תום החבילה "${studentPackage.title}".`,
                        '/dashboard/billing'
                    );
                });
            }
        }
    });

    // Check for overdue/new invoices
    initialInvoices.forEach(inv => {
        if (inv.status === 'SENT') {
            checkAndNotify(inv.payerId, `new-invoice-${inv.id}`, () => {
                addNotificationAndLog(
                    inv.payerId,
                    'חשבונית חדשה הופקה',
                    `חשבונית מספר ${inv.invoiceNumber} על סך ${inv.total}₪ זמינה לצפייה ותשלום.`,
                    '/dashboard/billing'
                );
            });
        }

        if (inv.status === 'OVERDUE') {
            checkAndNotify(inv.payerId, `overdue-invoice-${inv.id}`, () => {
                addNotificationAndLog(
                    inv.payerId,
                    'תשלום נדרש: חשבונית בפיגור',
                    `חשבונית מספר ${inv.invoiceNumber} על סך ${inv.total}₪ לא שולמה.`,
                    '/dashboard/billing'
                );
            });
        }
    });
    
    // Check for expiring makeup credits
    const studentUsers = initialUsers.filter(u => u.role === 'student' && u.approved);
    studentUsers.forEach(student => {
        const studentLessons = initialLessons.filter(l => l.studentId === student.id);
        
        const grantedCredits = studentLessons.filter(l => 
            ['CANCELLED_TEACHER', 'CANCELLED_CONSERVATORIUM', 'CANCELLED_STUDENT_NOTICED'].includes(l.status)
        ).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

        const usedCredits = studentLessons.filter(l => l.type === 'MAKEUP').length;
        const balance = grantedCredits.length - usedCredits;

        if (balance > 0) {
            const earliestCreditLesson = grantedCredits[usedCredits];
            const MAKEUP_EXPIRY_DAYS = 60;
            const EXPIRING_SOON_DAYS = 7;
            const expiryDate = addDays(new Date(earliestCreditLesson.createdAt), MAKEUP_EXPIRY_DAYS);
            const daysUntilExpiry = differenceInDays(expiryDate, now);

            if (daysUntilExpiry > 0 && daysUntilExpiry <= EXPIRING_SOON_DAYS) {
                const userToNotifyId = student.parentId || student.id;
                checkAndNotify(userToNotifyId, `expiring-makeup-${student.id}`, () => {
                    addNotificationAndLog(
                        userToNotifyId,
                        'זיכוי לשיעור השלמה עומד לפוג',
                        `יתרת שיעורי ההשלמה שלך (${balance}) תפוג בעוד ${daysUntilExpiry} ימים. מהר/י לקבוע שיעור!`,
                        '/dashboard/makeups'
                    );
                });
            }
        }
    });
    
    // Check for 24-hour lesson reminders
    const tomorrow = addDays(now, 1);
    const startOfTomorrow = startOfDay(tomorrow);
    const endOfTomorrow = endOfDay(tomorrow);
    
    initialLessons.forEach(lesson => {
        const lessonTime = new Date(lesson.startTime);
        if (lesson.status === 'SCHEDULED' && isWithinInterval(lessonTime, { start: startOfTomorrow, end: endOfTomorrow })) {
            const student = initialUsers.find(u => u.id === lesson.studentId);
            const teacher = initialUsers.find(u => u.id === lesson.teacherId);
            if (student && teacher) {
                // Notify student/parent
                const userToNotifyId = student.parentId || student.id;
                checkAndNotify(userToNotifyId, `reminder-student-${lesson.id}`, () => {
                    addNotificationAndLog(
                        userToNotifyId,
                        'תזכורת: שיעור מחר',
                        `שיעור ${lesson.instrument} עם ${teacher.name} מתוכנן למחר בשעה ${format(lessonTime, 'HH:mm')}.`,
                        '/dashboard/schedule'
                    );
                });

                // Notify teacher
                checkAndNotify(teacher.id, `reminder-teacher-${lesson.id}`, () => {
                     addNotificationAndLog(
                        teacher.id,
                        'תזכורת: שיעור מחר',
                        `שיעור ${lesson.instrument} עם ${student.name} מתוכנן למחר בשעה ${format(lessonTime, 'HH:mm')}.`,
                        '/dashboard/schedule'
                    );
                });
            }
        }
    });

  }, [addNotificationAndLog]);

  useEffect(() => {
    const teachers = users.filter(u => u.role === 'teacher' && u.approved && u.ratePerDuration);
    const now = new Date();
    const periodStart = startOfMonth(now);
    const periodEnd = endOfMonth(now);

    const generatedPayrolls = teachers.map(teacher => {
        const completedLessons = lessons.filter(l => 
            l.teacherId === teacher.id && 
            l.status === 'COMPLETED' &&
            l.attendanceMarkedAt &&
            isWithinInterval(new Date(l.attendanceMarkedAt), { start: periodStart, end: periodEnd })
        );

        let grossPay = 0;
        let totalMinutes = 0;

        const lessonDetails = completedLessons.map(lesson => {
            const rate = teacher.ratePerDuration?.[lesson.durationMinutes] || 0;
            const student = users.find(u => u.id === lesson.studentId);
            grossPay += rate;
            totalMinutes += lesson.durationMinutes;
            return {
                slotId: lesson.id,
                studentId: lesson.studentId,
                studentName: student?.name || 'Unknown',
                durationMinutes: lesson.durationMinutes,
                rate: rate, // this is hourly rate, we need to adjust
                subtotal: rate,
                completedAt: lesson.attendanceMarkedAt!,
            }
        });
        
        return {
            id: `payroll-${teacher.id}-${now.toISOString().slice(0, 7)}`,
            teacherId: teacher.id,
            teacherName: teacher.name,
            periodStart: periodStart.toISOString(),
            periodEnd: periodEnd.toISOString(),
            completedLessons: lessonDetails,
            totalHours: totalMinutes / 60,
            grossPay,
            status: 'DRAFT' as PayrollStatus,
        }
    });

    setPayrolls(generatedPayrolls);
  }, [users, lessons]);

  const updatePayrollStatus = (payrollId: string, status: PayrollStatus) => {
    setPayrolls(prev => prev.map(p => p.id === payrollId ? { ...p, status } : p));
  };


  const loadUserFromStorage = useCallback(() => {
    try {
      const savedUserId = localStorage.getItem('userId');
      if (savedUserId) {
        const foundUser = users.find(u => u.id === savedUserId);
        if (foundUser && foundUser.approved) {
          setUser(foundUser);
        } else {
          localStorage.removeItem('userId');
          setUser(null);
        }
      }
    } catch (error) {
      console.error("Could not access localStorage.", error);
    }
    setIsLoading(false);
  }, [users]);

  useEffect(() => {
    loadUserFromStorage();
  }, [loadUserFromStorage]);

  // Redirect to login if no user and not on a public page
  useEffect(() => {
    if (!isLoading && !user && !['/login', '/register', '/'].includes(pathname)) {
        router.push('/login');
    }
  }, [user, isLoading, pathname, router]);
  
  const login = (email: string): LoginResult => {
    const foundUser = users.find(u => u.email?.toLowerCase() === email.toLowerCase());
    
    if (!foundUser) {
      return { user: null, status: 'not_found' };
    }

    if (!foundUser.approved) {
      return { user: foundUser, status: 'pending' };
    }

    localStorage.setItem('userId', foundUser.id);
    setUser(foundUser);
    router.push('/dashboard');
    return { user: foundUser, status: 'approved' };
  };

  const logout = () => {
    localStorage.removeItem('userId');
    setUser(null);
    router.push('/login');
  };
  
  const approveUser = (userId: string) => {
    setUsers(prevUsers => prevUsers.map(u => u.id === userId ? { ...u, approved: true, rejectionReason: undefined } : u));
  };

  const rejectUser = (userId: string, reason: string) => {
    setUsers(prevUsers => prevUsers.map(u => u.id === userId ? { ...u, approved: false, rejectionReason: reason } : u));
  };

  const updateUser = (updatedUser: User) => {
    setUsers(prevUsers => prevUsers.map(u => u.id === updatedUser.id ? updatedUser : u));
    if (user && user.id === updatedUser.id) {
      setUser(updatedUser);
    }
  };

  const addUser = (newUser: Partial<User>, isApproved = false): User => {
    const fullNewUser: User = {
        id: `user-${Date.now()}`,
        approved: isApproved,
        role: 'student', // Default role
        conservatoriumName: '', // Default
        notifications: [],
        ...newUser,
    } as User;
    setUsers(prevUsers => [...prevUsers, fullNewUser]);
    return fullNewUser;
};
  
  const updateForm = (updatedForm: FormSubmission) => {
    const formIndex = forms.findIndex(f => f.id === updatedForm.id);
    const isNew = formIndex === -1;
    
    if (isNew) {
      setForms(prevForms => [updatedForm, ...prevForms]);
    } else {
      setForms(prevForms => prevForms.map(f => (f.id === updatedForm.id ? { ...f, ...updatedForm } : f)));
    }
    
    if (isNew) {
      if (updatedForm.status === 'ממתין לאישור מורה') {
        const student = users.find(u => u.id === updatedForm.studentId);
        const teacher = users.find(u => u.name === student?.instruments?.[0]?.teacherName);
        if (teacher) {
          addNotificationAndLog(teacher.id, 'טופס חדש ממתין לאישורך', `התלמיד/ה ${updatedForm.studentName} הגיש/ה טופס.`, `/dashboard/approvals`);
        }
      }
    } else {
      const student = users.find(u => u.id === updatedForm.studentId);
      if (!student) return;
      const userToNotifyId = student.parentId || student.id;
      addNotificationAndLog(userToNotifyId, `סטטוס טופס עודכן: ${updatedForm.formType}`, `הסטטוס של הטופס שונה ל: ${updatedForm.status}.`, `/dashboard/forms/${updatedForm.id}`);
    }
  };
  
  const newFeaturesEnabled = React.useMemo(() => {
    if (!user) return false;
    const userConservatorium = conservatoriums.find(c => c.id === user.conservatoriumId);
    return userConservatorium?.newFeaturesEnabled ?? false;
  }, [user, conservatoriums]);

  const updateConservatorium = (updatedConservatorium: Conservatorium) => {
    setConservatoriums(prev => prev.map(c => c.id === updatedConservatorium.id ? updatedConservatorium : c));
  }

  const updateRepertoireStatus = (repertoireId: string, status: RepertoireStatus) => {
    setAssignedRepertoire(prev => prev.map(rep => {
        if (rep.id === repertoireId) {
            const updatedRep: AssignedRepertoire = { ...rep, status };
            if (status === 'COMPLETED' && !rep.completedAt) {
                updatedRep.completedAt = new Date().toISOString();
            }
            return updatedRep;
        }
        return rep;
    }));
  };

  const addLessonNote = (note: Partial<LessonNote>) => {
    const newNote: LessonNote = {
      id: `note-${Date.now()}`,
      lessonSlotId: 'lesson-placeholder-id',
      isSharedWithParent: true,
      isSharedWithStudent: true,
      homeworkAssignments: [],
      createdAt: new Date().toISOString(),
      ...note,
    } as LessonNote;
    setLessonNotes(prev => [newNote, ...prev]);
  };
  
  const addMessage = (threadId: string, senderId: string, body: string) => {
      setMessageThreads(prev => prev.map(thread => {
          if (thread.id === threadId) {
              return {
                  ...thread,
                  messages: [...thread.messages, {
                      senderId,
                      body,
                      sentAt: new Date().toISOString(),
                  }]
              }
          }
          return thread;
      }))
  }

  const updateUserPracticeGoal = (studentId: string, goal: number) => {
    setUsers(prevUsers => prevUsers.map(u => u.id === studentId ? { ...u, weeklyPracticeGoal: goal } : u));
    if (user && user.id === studentId) {
      setUser(prev => prev ? ({ ...prev, weeklyPracticeGoal: goal }) : null);
    }
  };
  
  const addProgressReport = (report: Partial<ProgressReport>) => {
      const newReport = {
          id: `report-${Date.now()}`,
          createdAt: new Date().toISOString(),
          ...report,
      } as ProgressReport;
      setProgressReports(prev => [newReport, ...prev]);
  };
  
  const addLesson = (newLesson: Partial<LessonSlot>) => {
    const fullLesson: LessonSlot = {
        id: `lesson-${Date.now()}`,
        conservatoriumId: user!.conservatoriumId,
        type: 'ADHOC',
        status: 'SCHEDULED',
        isVirtual: false,
        isCreditConsumed: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...newLesson,
    } as LessonSlot;
    setLessons(prev => [...prev, fullLesson]);

    const bookingSource = newLesson.bookingSource || (user!.role === 'parent' ? 'PARENT' : 'STUDENT_SELF');
    if (bookingSource === 'ADMIN' || bookingSource === 'TEACHER') {
        const student = users.find(u => u.id === fullLesson.studentId);
        const teacher = users.find(u => u.id === fullLesson.teacherId);
        if (student && teacher) {
            const userToNotifyId = student.parentId || student.id;
            addNotificationAndLog(
                userToNotifyId,
                'שיעור חדש נקבע עבורך',
                `המורה ${teacher.name} קבע/ה עבורך שיעור ${fullLesson.instrument} ביום ${format(new Date(fullLesson.startTime), 'EEEE, dd/MM/yy', { locale: he })} בשעה ${format(new Date(fullLesson.startTime), 'HH:mm')}.`,
                '/dashboard/schedule'
            );
        }
    }
  };

  const cancelLesson = (lessonId: string) => {
    setLessons(prevLessons => prevLessons.map(lesson => {
      if (lesson.id === lessonId) {
        const lessonStartTime = new Date(lesson.startTime);
        const now = new Date();
        const hoursUntilLesson = (lessonStartTime.getTime() - now.getTime()) / (1000 * 60 * 60);

        const newStatus: SlotStatus = hoursUntilLesson > 24 
            ? 'CANCELLED_STUDENT_NOTICED' 
            : 'CANCELLED_STUDENT_NO_NOTICE';
        
        const updatedLesson = { ...lesson, status: newStatus, updatedAt: new Date().toISOString() };

        const student = users.find(u => u.id === lesson.studentId);
        const teacher = users.find(u => u.id === lesson.teacherId);
        if (student && teacher) {
            const lessonTimeStr = `${format(lessonStartTime, 'EEEE, dd/MM/yy', { locale: he })} בשעה ${format(lessonStartTime, 'HH:mm')}`;
            if (newStatus === 'CANCELLED_STUDENT_NOTICED') {
                 addNotificationAndLog(
                    teacher.id,
                    'ביטול שיעור',
                    `${student.name} ביטל/ה את השיעור בתאריך ${lessonTimeStr}. המשבצת פנויה כעת.`,
                    '/dashboard/schedule'
                );
            } else {
                 addNotificationAndLog(
                    teacher.id,
                    'ביטול שיעור מאוחר',
                    `${student.name} ביטל/ה באיחור את השיעור בתאריך ${lessonTimeStr}.`,
                    '/dashboard/schedule'
                );
            }
        }
        
        return updatedLesson;
      }
      return lesson;
    }));
  };

  const updateLessonStatus = (lessonId: string, status: SlotStatus) => {
    setLessons(prevLessons => prevLessons.map(lesson =>
      lesson.id === lessonId
        ? { ...lesson, status, attendanceMarkedAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
        : lesson
    ));
  };
  
  const rescheduleLesson = (lessonId: string, newStartTime: string) => {
    setLessons(prevLessons => prevLessons.map(lesson => {
        if (lesson.id === lessonId) {
            const updatedLesson = { ...lesson, startTime: newStartTime, status: 'SCHEDULED' as const, updatedAt: new Date().toISOString() };
            
            const student = users.find(u => u.id === lesson.studentId);
            const teacher = users.find(u => u.id === lesson.teacherId);
            if (student && teacher) {
                const userToNotifyId = student.parentId || student.id;
                const newTimeStr = `${format(new Date(newStartTime), 'EEEE, dd/MM/yy', { locale: he })} בשעה ${format(new Date(newStartTime), 'HH:mm')}`;
                
                addNotificationAndLog(
                    userToNotifyId,
                    'שיעור נקבע מחדש',
                    `השיעור שלך עם ${teacher.name} נקבע מחדש למועד: ${newTimeStr}.`,
                    '/dashboard/schedule'
                );

                addNotificationAndLog(
                    teacher.id,
                    'שיעור נקבע מחדש',
                    `השיעור של ${student.name} נקבע מחדש למועד: ${newTimeStr}.`,
                    '/dashboard/schedule'
                );
            }

            return updatedLesson;
        }
        return lesson;
    }));
  };

  const reportSickLeave = useCallback((teacherId: string, startDate: Date, endDate: Date): LessonSlot[] => {
    let affectedLessons: LessonSlot[] = [];
    setLessons(prevLessons => {
        const updatedLessons = prevLessons.map(lesson => {
            const lessonDate = new Date(lesson.startTime);
            if (lesson.teacherId === teacherId && 
                lessonDate >= startDate && 
                lessonDate <= endDate &&
                lesson.status === 'SCHEDULED') {
                
                const updatedLesson = { 
                    ...lesson, 
                    status: 'CANCELLED_TEACHER' as SlotStatus,
                    updatedAt: new Date().toISOString()
                };
                affectedLessons.push(updatedLesson);
                
                const student = users.find(u => u.id === lesson.studentId);
                if (student) {
                    const notifyUser = users.find(u => u.id === student.parentId) || student;
                    const teacher = users.find(u => u.id === teacherId);
                    addNotificationAndLog(
                        notifyUser.id,
                        'שיעור בוטל עקב מחלת מורה',
                        `השיעור של ${student.name} עם ${teacher?.name} בוטל. יתרת שיעורי ההשלמה עודכנה.`,
                        '/dashboard/makeups'
                    );
                }
                
                return updatedLesson;
            }
            return lesson;
        });
        return updatedLessons;
    });
    return affectedLessons;
  }, [addNotificationAndLog, users]);

  const assignSubstitute = (lessonId: string, newTeacherId: string) => {
    setLessons(prevLessons => prevLessons.map(lesson => {
        if (lesson.id === lessonId) {
            const updatedLesson = { ...lesson, teacherId: newTeacherId, status: 'SCHEDULED' as const, updatedAt: new Date().toISOString() };
            
            const student = users.find(u => u.id === lesson.studentId);
            const newTeacher = users.find(u => u.id === newTeacherId);
            if (student && newTeacher) {
                const userToNotifyId = student.parentId || student.id;
                const lessonTimeStr = `${format(new Date(updatedLesson.startTime), 'EEEE, dd/MM/yy', { locale: he })} בשעה ${format(new Date(updatedLesson.startTime), 'HH:mm')}`;
                
                addNotificationAndLog(
                    userToNotifyId,
                    'נמצא מורה מחליף לשיעור',
                    `שיעור ה${lesson.instrument} שלך יתקיים כרגיל עם המורה המחליף/ה ${newTeacher.name} במועד: ${lessonTimeStr}.`,
                    '/dashboard/schedule'
                );

                addNotificationAndLog(
                    newTeacher.id,
                    'שיבוץ לשיעור כמחליף/ה',
                    `שובצת להעביר שיעור ${lesson.instrument} לתלמיד/ה ${student.name} במועד: ${lessonTimeStr}.`,
                    '/dashboard/schedule'
                );
            }

            return updatedLesson;
        }
        return lesson;
    }));
  };

  const addPracticeLog = (log: Partial<PracticeLog>) => {
    if (!user) return;
    
    const studentId = user.role === 'student' ? user.id : (user.role === 'parent' ? user.childIds?.[0] : undefined);
    if (!studentId) return;

    const student = users.find(u => u.id === studentId);
    const teacherId = student?.instruments?.[0]?.teacherName ? users.find(u => u.name === student.instruments![0].teacherName)?.id : undefined;

    const newLog: PracticeLog = {
        id: `plog-${Date.now()}`,
        studentId: studentId,
        teacherId: teacherId,
        ...log,
    } as PracticeLog;

    setPracticeLogs(prev => [newLog, ...prev]);
  };
  
   const addPracticeVideo = (videoData: Partial<PracticeVideo>) => {
        if (!user) return;
        const studentId = user.role === 'student' ? user.id : (user.role === 'parent' ? user.childIds?.[0] : undefined);
        if (!studentId) return;

        const student = users.find(u => u.id === studentId);
        const teacherId = student?.instruments?.[0]?.teacherName ? users.find(u => u.name === student.instruments![0].teacherName)?.id : undefined;
        if (!teacherId) return;

        const newVideo: PracticeVideo = {
            id: `vid-${Date.now()}`,
            studentId,
            teacherId: teacherId,
            videoUrl: 'https://placehold.co/600x400.mp4',
            createdAt: new Date().toISOString(),
            feedback: [],
            ...videoData
        } as PracticeVideo;
        setPracticeVideos(prev => [newVideo, ...prev]);
        return newVideo;
    };

    const addVideoFeedback = (videoId: string, comment: string) => {
        if (!user || user.role !== 'teacher') return;
        setPracticeVideos(prev => prev.map(video => {
            if (video.id === videoId) {
                const newFeedback: VideoFeedback = {
                    teacherId: user.id,
                    comment,
                    createdAt: new Date().toISOString(),
                };
                return { ...video, feedback: [...(video.feedback || []), newFeedback] };
            }
            return video;
        }));
    };

  const addAnnouncement = (announcement: Partial<Announcement>) => {
    if (!user) return;
    const newAnnouncement: Announcement = {
      id: `anno-${Date.now()}`,
      conservatoriumId: user.conservatoriumId,
      sentAt: new Date().toISOString(),
      ...announcement,
    } as Announcement;
    setAnnouncements(prev => [newAnnouncement, ...prev]);
  };
  
  const assignRepertoire = useCallback((studentId: string, compositionId: string) => {
    const composition = initialCompositions.find(c => c.id === compositionId);
    if (!composition) return;

    const newRepertoireItem: AssignedRepertoire = {
      id: `rep-${Date.now()}`,
      studentId,
      compositionId,
      status: 'LEARNING',
      assignedAt: new Date().toISOString(),
    };
    setAssignedRepertoire(prev => [...prev, newRepertoireItem]);
  }, []);

  const getMakeupCreditBalance = useCallback((studentIds: string[]): number => {
    if (!studentIds.length) return 0;
    
    const grantedCredits = lessons.filter(l => 
        studentIds.includes(l.studentId) && 
        (l.status === 'CANCELLED_TEACHER' || l.status === 'CANCELLED_CONSERVATORIUM' || l.status === 'CANCELLED_STUDENT_NOTICED')
    ).length;

    const usedCredits = lessons.filter(l => 
        studentIds.includes(l.studentId) && 
        l.type === 'MAKEUP'
    ).length;
    
    return grantedCredits - usedCredits;
  }, [lessons]);

  const addToWaitlist = (entry: Partial<WaitlistEntry>) => {
        const newEntry: WaitlistEntry = {
            id: `waitlist-${Date.now()}`,
            status: 'WAITING',
            joinedAt: new Date().toISOString(),
            ...entry,
        } as WaitlistEntry;
        setWaitlist(prev => [newEntry, ...prev]);
        return newEntry;
    };
    
    const updateWaitlistStatus = useCallback((entryId: string, status: WaitlistStatus) => {
        setWaitlist(prev => prev.map(entry => {
            if (entry.id === entryId) {
                const updatedEntry = { ...entry, status, notifiedAt: status === 'OFFERED' ? new Date().toISOString() : entry.notifiedAt };
    
                if (status === 'OFFERED') {
                    const student = users.find(u => u.id === entry.studentId);
                    const teacher = users.find(u => u.id === entry.teacherId);
                    if (student) {
                        const userToNotifyId = student.parentId || student.id;
                        addNotificationAndLog(
                            userToNotifyId,
                            'מקום התפנה!',
                            `התפנה מקום אצל ${teacher?.name || 'המורה המבוקש/ת'}. יש לך 48 שעות להבטיח את המקום.`,
                            '/dashboard/schedule/book'
                        );
                    }
                }
                return updatedEntry;
            }
            return entry;
        }));
    }, [users, addNotificationAndLog]);

    const addFormTemplate = (template: Partial<FormTemplate>) => {
        if (!user) return;
        const newTemplate: FormTemplate = {
            id: `template-${Date.now()}`,
            conservatoriumId: user.conservatoriumId,
            createdAt: new Date().toISOString(),
            ...template,
        } as FormTemplate;
        setFormTemplates(prev => [newTemplate, ...prev]);
    };
    
    const updateNotificationPreferences = (preferences: NotificationPreferences) => {
        if (user) {
            updateUser({ ...user, notificationPreferences: preferences });
        }
    };
    
  const addEvent = (event: Partial<EventProduction>) => {
    if (!user) return;
    const newEvent: EventProduction = {
        id: `event-${Date.now()}`,
        conservatoriumId: user.conservatoriumId,
        status: 'PLANNING',
        program: [],
        ...event,
    } as EventProduction;
    setEvents(prev => [newEvent, ...prev]);
  };

  const addPerformanceToEvent = (eventId: string, studentId: string, repertoireId: string) => {
    const student = users.find(u => u.id === studentId);
    const repertoireItem = assignedRepertoire.find(r => r.id === repertoireId);
    const composition = initialCompositions.find(c => c.id === repertoireItem?.compositionId);

    if (!student || !repertoireItem || !composition) {
      toast({ variant: 'destructive', title: 'שגיאה', description: 'לא ניתן להוסיף את המשתתף. פרטים חסרים.' });
      return;
    }

    const newPerformanceSlot: PerformanceSlot = {
      id: `perf-${Date.now()}`,
      studentId: student.id,
      studentName: student.name,
      compositionTitle: composition.title,
      composer: composition.composer,
      duration: composition.duration,
    };

    setEvents(prev => prev.map(event => {
      if (event.id === eventId) {
        return { ...event, program: [...event.program, newPerformanceSlot] };
      }
      return event;
    }));

    toast({ title: 'משתתף נוסף!', description: `${student.name} נוסף לתוכנית האירוע.` });
  };
  
  const removePerformanceFromEvent = (eventId: string, performanceSlotId: string) => {
    setEvents(prev => prev.map(event => {
        if (event.id === eventId) {
            return { ...event, program: event.program.filter(p => p.id !== performanceSlotId) };
        }
        return event;
    }));
    toast({ title: 'משתתף הוסר מהתוכנית.' });
  };

  const assignInstrumentToStudent = (instrumentId: string, studentId: string) => {
    setInstrumentInventory(prev => prev.map(inst => {
        if (inst.id === instrumentId) {
            toast({ title: 'השאלת כלי בוצעה', description: `${inst.type} ${inst.brand} הושאל לסטודנט.`});
            return {
                ...inst,
                currentRenterId: studentId,
                rentalStartDate: new Date().toISOString(),
            }
        }
        return inst;
    }));
  };

  const returnInstrument = (instrumentId: string) => {
      setInstrumentInventory(prev => prev.map(inst => {
        if (inst.id === instrumentId) {
            toast({ title: 'החזרת כלי בוצעה', description: `${inst.type} ${inst.brand} הוחזר למלאי.`});
            return {
                ...inst,
                currentRenterId: undefined,
                rentalStartDate: undefined,
            }
        }
        return inst;
    }));
  };


  const value = { 
      user, 
      users, 
      login, 
      logout, 
      isLoading, 
      approveUser, 
      rejectUser, 
      updateUser, 
      addUser, 
      mockFormSubmissions: forms, 
      updateForm, 
      mockLessons: lessons, 
      addLesson,
      cancelLesson,
      updateLessonStatus,
      rescheduleLesson,
      reportSickLeave,
      assignSubstitute,
      newFeaturesEnabled, 
      mockInvoices: initialInvoices, 
      mockPracticeLogs: practiceLogs, 
      addPracticeLog,
      conservatoriums, 
      updateConservatorium,
      mockAssignedRepertoire: assignedRepertoire,
      compositions: initialCompositions,
      mockLessonNotes: lessonNotes,
      updateRepertoireStatus,
      addLessonNote,
      assignRepertoire,
      mockMessageThreads: messageThreads,
      addMessage,
      mockPackages: initialPackages,
      updateUserPracticeGoal,
      mockProgressReports: progressReports,
      addProgressReport,
      mockAnnouncements: announcements,
      addAnnouncement,
      getMakeupCreditBalance,
      mockPayrolls: payrolls,
      updatePayrollStatus,
      mockPracticeVideos: practiceVideos,
      addPracticeVideo,
      addVideoFeedback,
      mockWaitlist: waitlist,
      addToWaitlist,
      updateWaitlistStatus,
      mockFormTemplates: formTemplates,
      addFormTemplate,
      updateNotificationPreferences,
      mockAuditLog: auditLog,
      mockEvents: events,
      addEvent,
      addPerformanceToEvent,
      removePerformanceFromEvent,
      mockInstrumentInventory: instrumentInventory,
      assignInstrumentToStudent,
      returnInstrument,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
