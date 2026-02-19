'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
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
    type RepertoireStatus,
    type LessonNote,
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
} from '@/lib/data';
import { startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';

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
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const addNotificationAndLog = useCallback((userId: string, title: string, message: string, link: string) => {
    // This is a mock function. In a real app, this would be a complex backend service.
    const userToNotify = users.find(u => u.id === userId);
    if (!userToNotify) return;

    // Simulate checking user preferences - for now, always send IN_APP
    const channelsToSend: Channel[] = ['IN_APP']; // Mock: always send in-app

    const notificationId = `notif-${Date.now()}`;
    
    // 1. Add notification to user's list if IN_APP is a preferred channel
    if (channelsToSend.includes('IN_APP')) {
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
        if (user?.id === userId) {
            setUser(prev => prev ? { ...prev, notifications: [newNotification, ...(prev.notifications || [])]} : null);
        }
    }
    
    // 2. Add entries to the audit log for each channel
    channelsToSend.forEach(channel => {
        const newLogEntry: AuditLogEntry = {
            id: `log-${channel}-${Date.now()}`,
            notificationId,
            userId,
            channel,
            status: 'DELIVERED', // Mock status
            sentAt: new Date().toISOString(),
            title,
            body: message,
        };
        setAuditLog(prev => [newLogEntry, ...prev]);
    });

  }, [users, user?.id]);

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
    
    // NOTIFICATION LOGIC
    if (isNew) {
      // Find approver and notify them
      if (updatedForm.status === 'ממתין לאישור מורה') {
        const student = users.find(u => u.id === updatedForm.studentId);
        const teacher = users.find(u => u.name === student?.instruments?.[0]?.teacherName);
        if (teacher) {
          addNotificationAndLog(teacher.id, 'טופס חדש ממתין לאישורך', `התלמיד/ה ${updatedForm.studentName} הגיש/ה טופס.`, `/dashboard/approvals`);
        }
      }
    } else {
      // Notify submitter of status change
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
        bookingSource: user!.role === 'parent' ? 'PARENT' : 'STUDENT_SELF',
        isVirtual: false,
        isCreditConsumed: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...newLesson
    } as LessonSlot;
    setLessons(prev => [...prev, fullLesson]);
  };

  const cancelLesson = (lessonId: string) => {
    setLessons(prevLessons => prevLessons.map(lesson => {
      if (lesson.id === lessonId) {
        const lessonStartTime = new Date(lesson.startTime);
        const now = new Date();
        const hoursUntilLesson = (lessonStartTime.getTime() - now.getTime()) / (1000 * 60 * 60);

        // Mock policy: 24 hours notice
        const newStatus: SlotStatus = hoursUntilLesson > 24 
            ? 'CANCELLED_STUDENT_NOTICED' 
            : 'CANCELLED_STUDENT_NO_NOTICE';

        return { ...lesson, status: newStatus, updatedAt: new Date().toISOString() };
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
    setLessons(prevLessons => prevLessons.map(lesson => 
        lesson.id === lessonId
            ? { ...lesson, startTime: newStartTime, status: 'SCHEDULED', updatedAt: new Date().toISOString() }
            : lesson
    ));
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
                
                // NOTIFICATION LOGIC
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
    setLessons(prevLessons => prevLessons.map(lesson => 
        lesson.id === lessonId
            ? { ...lesson, teacherId: newTeacherId, status: 'SCHEDULED' as const, updatedAt: new Date().toISOString() }
            : lesson
    ));
    // In a real app, also trigger notifications here
  };

  const addPracticeLog = (log: Partial<PracticeLog>) => {
    if (!user) return;
    
    // Determine studentId for parent or student
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
    
    const updateWaitlistStatus = (entryId: string, status: WaitlistStatus) => {
        setWaitlist(prev => prev.map(entry =>
            entry.id === entryId ? { ...entry, status, notifiedAt: status === 'OFFERED' ? new Date().toISOString() : entry.notifiedAt } : entry
        ));
    };

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
