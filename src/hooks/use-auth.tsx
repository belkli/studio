
/**
 * @fileoverview This is the central authentication and state management provider for the Harmonia application.
 * It uses React Context to provide user authentication status, user data, and all mock data
 * for the application's features. It also contains the functions to manipulate this mock data,
 * simulating a backend API. In a production application, these functions would make API calls
 * to a real backend service like Firebase.
 */
'use client';
import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import type { User, FormSubmission, Notification, Conservatorium, Package, LessonPackage, ConservatoriumInstrument, LessonSlot, Invoice, PracticeLog, Composition, AssignedRepertoire, LessonNote, RepertoireStatus, MessageThread, ProgressReport, Announcement, Room, PayrollSummary, PracticeVideo, WaitlistEntry, FormTemplate, AuditLogEntry, SlotStatus, Channel, NotificationPreferences, Achievement, AchievementType, EventProduction, EventProductionStatus, PerformanceSlot, InstrumentInventory, InstrumentCondition, PerformanceBooking, PerformanceBookingStatus, ScholarshipApplication, OpenDayEvent, OpenDayAppointment, Branch, PaymentMethod, WaitlistStatus, PayrollStatus, Alumnus, Masterclass, MakeupCredit, PlayingSchoolInvoice, TicketTier, DonationCause, DonationRecord, DonationCauseCategory, InstrumentRental, RentalModel, RentalCondition, StudentMasterClassAllowance } from '@/lib/types';
import * as initialMockData from '@/lib/data';
import { useRouter } from '@/i18n/routing';
import { useToast } from './use-toast';
import { add, differenceInCalendarDays, startOfDay, addDays } from 'date-fns';
import { allocateRoomWithConflictResolution } from '@/lib/room-allocation';
import { PlaceHolderImages } from '@/lib/placeholder-images';

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
  mockPlayingSchoolInvoices: PlayingSchoolInvoice[];
  mockEvents: EventProduction[];
  mockInstrumentInventory: InstrumentInventory[];
  mockInstrumentRentals: InstrumentRental[];
  mockPerformanceBookings: PerformanceBooking[];
  mockScholarshipApplications: ScholarshipApplication[];
  mockDonationCauses: DonationCause[];
  mockDonations: DonationRecord[];
  mockOpenDayEvents: OpenDayEvent[];
  mockOpenDayAppointments: OpenDayAppointment[];
  mockPracticeVideos: PracticeVideo[];
  mockAlumni: Alumnus[];
  mockMasterclasses: Masterclass[];
  mockMasterClassAllowances: StudentMasterClassAllowance[];
  mockMakeupCredits: MakeupCredit[];
  mockRepertoire: Composition[];
  conservatoriums: Conservatorium[];
  conservatoriumInstruments: ConservatoriumInstrument[];
  lessonPackages: LessonPackage[];
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
  createMessageThread: (participants: string[], initialMessage?: { senderId: string; body: string }) => string;
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
  initiateInstrumentRental: (payload: { instrumentId: string; studentId: string; parentId: string; rentalModel: RentalModel; startDate: string; expectedReturnDate?: string; depositAmountILS?: number; monthlyFeeILS?: number; purchasePriceILS?: number; monthsUntilPurchaseEligible?: number; }) => { rentalId: string; signingToken: string; signingLink: string };
  getRentalByToken: (token: string) => InstrumentRental | undefined;
  confirmRentalSignature: (token: string, signatureUrl: string) => { success: boolean; rentalId?: string };
  returnInstrument: (instrumentId: string) => void;
  markInstrumentRentalReturned: (rentalId: string, condition: RentalCondition, customRefundAmountILS?: number) => { success: boolean; refundAmountILS: number };
  addInstrument: (instrumentData: Partial<InstrumentInventory>) => void;
  updateInstrument: (instrumentId: string, instrumentData: Partial<InstrumentInventory>) => void;
  deleteInstrument: (instrumentId: string) => void;
  addPracticeVideo: (videoData: Partial<PracticeVideo>) => void;
  addVideoFeedback: (videoId: string, comment: string) => void;
  assignMusiciansToPerformance: (bookingId: string, musicianIds: string[]) => void;
  updatePerformanceBookingStatus: (bookingId: string, status: PerformanceBookingStatus) => void;
  addPerformanceBooking: (bookingData: Partial<PerformanceBooking>) => void;
  addScholarshipApplication: (applicationData: Partial<ScholarshipApplication>) => void;
  updateScholarshipStatus: (applicationId: string, status: 'APPROVED' | 'REJECTED') => void;
  markScholarshipAsPaid: (applicationId: string) => void;
  addDonationCause: (cause: { names: { he: string; en: string }; descriptions: { he: string; en: string }; category: DonationCauseCategory; targetAmountILS?: number; }) => DonationCause;
  recordDonation: (donation: { causeId: string; amountILS: number; frequency: 'once' | 'monthly' | 'yearly'; donorName?: string; donorEmail?: string; donorId?: string; status?: DonationRecord['status']; }) => DonationRecord;
  addOpenDayAppointment: (appointmentData: Partial<OpenDayAppointment>) => void;
  graduateStudent: (studentId: string, graduationYear: number) => void;
  upsertAlumniProfile: (payload: Partial<Alumnus> & { userId: string }) => Alumnus;
  createMasterClass: (payload: Partial<Masterclass>) => Masterclass;
  publishMasterClass: (masterClassId: string) => void;
  registerToMasterClass: (masterClassId: string, studentId: string) => { success: boolean; chargedILS?: number; remaining?: number; reason?: string };
  markWalkthroughAsSeen: (userId: string) => void;
  addUser: (userData: Partial<User>, isAdminFlow?: boolean) => User;
  addBranch: (branchData: Partial<Branch>) => void;
  updateBranch: (branchData: Branch) => void;
  addConservatoriumInstrument: (instrumentData: Partial<ConservatoriumInstrument>) => void;
  updateConservatoriumInstrument: (instrumentId: string, instrumentData: Partial<ConservatoriumInstrument>) => void;
  deleteConservatoriumInstrument: (instrumentId: string) => void;
  addLessonPackage: (packageData: Partial<LessonPackage>) => void;
  updateLessonPackage: (packageId: string, packageData: Partial<LessonPackage>) => void;
  deleteLessonPackage: (packageId: string) => void;
  mockRooms: Room[];
  addRoom: (roomData: Partial<Room>) => void;
  updateRoom: (roomId: string, roomData: Partial<Room>) => void;
  deleteRoom: (roomId: string) => void;
  updateNotificationPreferences: (preferences: NotificationPreferences) => void;
  updateUserPaymentMethod: (paymentData: { last4: string, expiryMonth: number, expiryYear: number }) => void;
  newFeaturesEnabled: boolean;
  isLoading: boolean;
  assignRepertoire: (studentIds: string | string[], compositionId: string) => void;
  awardAchievement: (studentId: string, type: AchievementType) => void;
  mockWaitlist: WaitlistEntry[];
  mockPayrolls: PayrollSummary[];
  updatePayrollStatus: (payrollId: string, status: PayrollStatus) => void;
  updateEvent: (event: EventProduction) => void;
  updateEventStatus: (eventId: string, status: EventProductionStatus) => void;
  bookEventTickets: (eventId: string, selections: Record<string, number>, attendee: { name: string; email: string; phone: string }, userId?: string) => { success: boolean; soldOut?: boolean; bookingRef?: string; totalAmount: number };
}

export const AuthContext = createContext<AuthContextType | null>(null);

/**
 * The main provider component that wraps the application.
 * It initializes and manages all application state, simulating a full backend.
 */
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const setAuthCookie = () => {
    document.cookie = 'harmonia-user=1; path=/; max-age=2592000; samesite=lax';
  };

  const clearAuthCookie = () => {
    document.cookie = 'harmonia-user=; path=/; max-age=0; samesite=lax';
  };

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
  const [mockPlayingSchoolInvoices, setMockPlayingSchoolInvoices] = useState<PlayingSchoolInvoice[]>([]);

  useEffect(() => {
    // Initialize some PS invoices if user is a parent with PS children
    if (user?.role === 'parent' && users.some(u => u.parentId === user.id && u.playingSchoolInfo)) {
      const psChildren = users.filter(u => u.parentId === user.id && u.playingSchoolInfo);
      const initialPsInvoices: PlayingSchoolInvoice[] = psChildren.map(child => ({
        id: `ps-inv-${child.id}`,
        studentId: child.id,
        parentId: user.id,
        amount: 1500, // Year total or similar
        description: `Playing School Program - ${child.playingSchoolInfo?.instrument} at ${child.playingSchoolInfo?.schoolName}`,
        dueDate: '2024-04-01',
        status: 'PENDING',
        academicYear: '2023-2024'
      }));
      setMockPlayingSchoolInvoices(initialPsInvoices);
    }
  }, [user, users]);
  const [mockEvents, setMockEvents] = useState<EventProduction[]>(initialMockData.mockEvents);
  const [mockInstrumentInventory, setMockInstrumentInventory] = useState<InstrumentInventory[]>(initialMockData.mockInstrumentInventory);
  const [mockInstrumentRentals, setMockInstrumentRentals] = useState<InstrumentRental[]>(initialMockData.mockInstrumentRentals || []);

  useEffect(() => {
    const now = new Date();
    const dueRentals = mockInstrumentRentals.filter((rental) => {
      if (rental.rentalModel !== 'rent_to_own') return false;
      if (rental.status !== 'active') return false;
      if (!rental.monthsUntilPurchaseEligible) return false;
      if (rental.purchaseEligibleNotifiedAt) return false;

      const start = startOfDay(new Date(rental.startDate));
      const elapsedDays = differenceInCalendarDays(now, start);
      const minimumDays = rental.monthsUntilPurchaseEligible * 30;
      return elapsedDays >= minimumDays;
    });

    if (dueRentals.length === 0) return;

    const nowIso = now.toISOString();
    const dueIds = new Set(dueRentals.map((item) => item.id));
    const notificationsByParent = new Map<string, Notification[]>();

    for (const rental of dueRentals) {
      const instrument = mockInstrumentInventory.find((inst) => inst.id === rental.instrumentId);
      const notification: Notification = {
        id: 'notif-rent-to-own-' + rental.id + '-' + Date.now(),
        title: 'Purchase option is now available',
        message: 'You can now purchase ' + (instrument?.name || instrument?.type || 'your rented instrument') + '.',
        timestamp: nowIso,
        link: '/dashboard/admin/rentals',
        read: false,
      };

      const existing = notificationsByParent.get(rental.parentId) || [];
      notificationsByParent.set(rental.parentId, [notification, ...existing]);
    }

    setMockInstrumentRentals((prev) =>
      prev.map((rental) => (dueIds.has(rental.id) ? { ...rental, purchaseEligibleNotifiedAt: nowIso } : rental))
    );

    setUsers((prevUsers) =>
      prevUsers.map((entry) => {
        const parentNotifications = notificationsByParent.get(entry.id);
        if (!parentNotifications || parentNotifications.length === 0) return entry;
        return { ...entry, notifications: [...parentNotifications, ...(entry.notifications || [])] };
      })
    );
  }, [mockInstrumentInventory, mockInstrumentRentals]);
  const [mockPerformanceBookings, setMockPerformanceBookings] = useState<PerformanceBooking[]>(initialMockData.mockPerformanceBookings);
  const [mockScholarshipApplications, setMockScholarshipApplications] = useState<ScholarshipApplication[]>(initialMockData.mockScholarshipApplications);
  const [mockDonationCauses, setMockDonationCauses] = useState<DonationCause[]>(initialMockData.mockDonationCauses || []);
  const [mockDonations, setMockDonations] = useState<DonationRecord[]>(initialMockData.mockDonations || []);
  const [mockOpenDayEvents, setMockOpenDayEvents] = useState<OpenDayEvent[]>(initialMockData.mockOpenDayEvents);
  const [mockOpenDayAppointments, setMockOpenDayAppointments] = useState<OpenDayAppointment[]>(initialMockData.mockOpenDayAppointments);
  const [mockBranches, setMockBranches] = useState<Branch[]>(initialMockData.mockBranches);
  const [mockPracticeVideos, setMockPracticeVideos] = useState<PracticeVideo[]>(initialMockData.mockPracticeVideos);
  const [mockAlumni, setMockAlumni] = useState<Alumnus[]>(initialMockData.mockAlumni);
  const [mockMasterclasses, setMockMasterclasses] = useState<Masterclass[]>(initialMockData.mockMasterclasses);
  const [mockMasterClassAllowances, setMockMasterClassAllowances] = useState<StudentMasterClassAllowance[]>([
    { studentId: 'student-user-1', conservatoriumId: 'cons-15', academicYear: '2025-2026', totalAllowed: 2, used: 0, remaining: 2 },
    { studentId: 'student-user-2', conservatoriumId: 'cons-15', academicYear: '2025-2026', totalAllowed: 0, used: 0, remaining: 0 },
  ]);
  const [mockWaitlist, setMockWaitlist] = useState<WaitlistEntry[]>(initialMockData.mockWaitlist);
  const [mockPayrolls, setMockPayrolls] = useState<PayrollSummary[]>(initialMockData.mockPayrolls);
  const [mockMakeupCredits, setMockMakeupCredits] = useState<MakeupCredit[]>(initialMockData.mockMakeupCredits || []);
  const [mockRepertoire, setMockRepertoire] = useState<Composition[]>(initialMockData.mockRepertoire || initialMockData.compositions);
  const [mockRooms, setMockRooms] = useState<Room[]>(initialMockData.mockRooms);
  const [conservatoriums, setConservatoriums] = useState<Conservatorium[]>(initialMockData.conservatoriums);
  const [conservatoriumInstruments, setConservatoriumInstruments] = useState<ConservatoriumInstrument[]>(initialMockData.mockConservatoriumInstruments || []);
  const [lessonPackages, setLessonPackages] = useState<LessonPackage[]>(initialMockData.mockLessonPackages || []);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const loadBootstrapData = async () => {
      try {
        const response = await fetch('/api/bootstrap', { cache: 'no-store' });
        if (!response.ok) return;

        const payload = await response.json();
        if (!active) return;

        const normalizeText = (value: string) => value.trim().toLowerCase();
        const placeholderImageMap = new Map(PlaceHolderImages.map((image) => [image.id, image.imageUrl]));
        const normalizeAvatarUrl = (value?: string) => {
          if (!value) return value;
          return placeholderImageMap.get(value) || value;
        };

        const mergedUsers = Array.isArray(payload.users)
          ? (() => {
              const localUsers = initialMockData.mockUsers;
              const matchedIndexes = new Set<number>();

              const merged = localUsers.map((localUser) => {
                const foundIndex = payload.users.findIndex((remoteUser: User) => {
                  if (remoteUser.id === localUser.id) return true;
                  return normalizeText(remoteUser.email) === normalizeText(localUser.email);
                });

                if (foundIndex < 0) return localUser;
                matchedIndexes.add(foundIndex);
                const remoteUser = payload.users[foundIndex];

                return {
                  ...localUser,
                  ...remoteUser,
                  avatarUrl: remoteUser.avatarUrl || localUser.avatarUrl,
                  bio: remoteUser.bio || localUser.bio,
                  education: (remoteUser.education && remoteUser.education.length > 0) ? remoteUser.education : localUser.education,
                  instruments: (remoteUser.instruments && remoteUser.instruments.length > 0) ? remoteUser.instruments : localUser.instruments,
                } as User;
              });

              payload.users.forEach((remoteUser: User, index: number) => {
                if (!matchedIndexes.has(index)) {
                  merged.push(remoteUser);
                }
              });

              return merged;
            })()
          : null;

        const mergedConservatoriums = Array.isArray(payload.conservatoriums)
          ? (() => {
              const localConservatoriums = initialMockData.conservatoriums;
              const matchedIndexes = new Set<number>();

              const merged = localConservatoriums.map((localCons) => {
                const foundIndex = payload.conservatoriums.findIndex((remoteCons: Conservatorium) => {
                  if (remoteCons.id === localCons.id) return true;
                  return normalizeText(remoteCons.name) === normalizeText(localCons.name);
                });

                if (foundIndex < 0) return localCons;
                matchedIndexes.add(foundIndex);
                const remoteCons = payload.conservatoriums[foundIndex];

                return {
                  ...localCons,
                  ...remoteCons,
                  about: remoteCons.about || localCons.about,
                  departments: (remoteCons.departments && remoteCons.departments.length > 0) ? remoteCons.departments : localCons.departments,
                  teachers: (remoteCons.teachers && remoteCons.teachers.length > 0) ? remoteCons.teachers : localCons.teachers,
                  branchesInfo: (remoteCons.branchesInfo && remoteCons.branchesInfo.length > 0) ? remoteCons.branchesInfo : localCons.branchesInfo,
                  programs: (remoteCons.programs && remoteCons.programs.length > 0) ? remoteCons.programs : localCons.programs,
                  socialMedia: remoteCons.socialMedia || localCons.socialMedia,
                  photoUrls: (remoteCons.photoUrls && remoteCons.photoUrls.length > 0) ? remoteCons.photoUrls : localCons.photoUrls,
                } as Conservatorium;
              });

              payload.conservatoriums.forEach((remoteCons: Conservatorium, index: number) => {
                if (!matchedIndexes.has(index)) {
                  merged.push(remoteCons);
                }
              });

              return merged;
            })()
          : null;

        const finalUsers = mergedUsers
          ? Array.from(
              new Map(
                mergedUsers.map((entry) => [entry.id, { ...entry, avatarUrl: normalizeAvatarUrl(entry.avatarUrl) }])
              ).values()
            )
          : null;

        const finalConservatoriums = mergedConservatoriums
          ? Array.from(new Map(mergedConservatoriums.map((entry) => [entry.id, entry])).values())
          : null;

        if (finalUsers) setUsers(finalUsers);
        if (finalConservatoriums) setConservatoriums(finalConservatoriums);
        if (Array.isArray(payload.lessons)) setMockLessons(payload.lessons);
        if (Array.isArray(payload.forms)) setMockFormSubmissions(payload.forms);
        if (Array.isArray(payload.events)) setMockEvents(payload.events);
        if (Array.isArray(payload.rooms)) setMockRooms(payload.rooms);
        if (Array.isArray(payload.payrolls)) setMockPayrolls(payload.payrolls);

        if (finalUsers) {
          setUser((currentUser) => {
            if (!currentUser) return currentUser;
            const matched = finalUsers.find((candidate: User) => candidate.email.toLowerCase() === currentUser.email.toLowerCase());
            if (!matched) return currentUser;
            localStorage.setItem('harmonia-user', JSON.stringify(matched));
            setAuthCookie();
            return matched;
          });
        }
      } catch (error) {
        console.warn('[auth] bootstrap data fetch failed', error);
      }
    };

    void loadBootstrapData();

    return () => {
      active = false;
    };
  }, []);

  const router = useRouter();
  const { toast } = useToast();

  const newFeaturesEnabled = useMemo(() => {
    if (!user) return false;
    const currentConservatorium = conservatoriums.find(c => c.id === user.conservatoriumId);
    return currentConservatorium?.newFeaturesEnabled || false;
  }, [user, conservatoriums]);

  // On initial load, check for a user in localStorage to persist login state with role validation.
  useEffect(() => {
    const storedUser = localStorage.getItem('harmonia-user');
    if (storedUser) {
      try {
        const parsedData = JSON.parse(storedUser);
        const VALID_ROLES = ['student', 'teacher', 'parent', 'conservatorium_admin', 'delegated_admin', 'site_admin', 'ministry_director', 'school_coordinator'];
        if (VALID_ROLES.includes(parsedData?.role)) {
          setUser(parsedData);
          setAuthCookie();
        } else {
          localStorage.removeItem('harmonia-user');
          clearAuthCookie();
        }
      } catch (e) {
        localStorage.removeItem('harmonia-user');
        clearAuthCookie();
      }
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
        setAuthCookie();
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
    clearAuthCookie();
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
      setAuthCookie();
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
      conservatoriumId: user?.conservatoriumId || 'cons-15',
      status: 'SCHEDULED',
      isCreditConsumed: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...lessonData
    } as LessonSlot;

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
        existingLessons: mockLessons.filter((lesson) => lesson.conservatoriumId === newLesson.conservatoriumId),
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

        toast({ title: 'Room reallocated automatically for better fit' });
        return;
      }
    }

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
        newAchievement = { id: `ach-${Date.now()}`, type, title: '×™×¦×™×¨×” ×”×•×©×œ×ž×”!', titleHe: '×™×¦×™×¨×” ×”×•×©×œ×ž×”!', description: '×›×œ ×”×›×‘×•×“ ×¢×œ ×¡×™×•× ×™×¦×™×¨×” ×—×“×©×”.', icon: 'ðŸŽµ', points: 75, achievedAt: new Date().toISOString() };
        break;
      case 'PRACTICE_STREAK_7':
        newAchievement = { id: `ach-${Date.now()}`, type, title: '×¨×¦×£ ××™×ž×•× ×™× ×©×œ 7 ×™×ž×™×!', titleHe: '×¨×¦×£ ××™×ž×•× ×™× ×©×œ 7 ×™×ž×™×!', description: '×”×ª×ž×“×” ×”×™× ×”×ž×¤×ª×— ×œ×”×¦×œ×—×”. ×›×œ ×”×›×‘×•×“!', icon: 'ðŸ”¥', points: 50, achievedAt: new Date().toISOString() };
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
      studentId: logData.studentId,
      teacherId: student.instruments?.[0]?.teacherName
        ? users.find(t => t.name === student.instruments![0].teacherName)?.id
        : undefined,
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
    }));
  };

  const createMessageThread = (participants: string[], initialMessage?: { senderId: string; body: string }) => {
    const normalizedParticipants = Array.from(new Set(participants));
    const existing = mockMessageThreads.find((thread) =>
      thread.participants.length === normalizedParticipants.length &&
      normalizedParticipants.every((participantId) => thread.participants.includes(participantId))
    );

    if (existing) {
      if (initialMessage?.body?.trim()) {
        addMessage(existing.id, initialMessage.senderId, initialMessage.body);
      }
      return existing.id;
    }

    const newThreadId = 'thread-' + Date.now();
    const now = new Date().toISOString();
    const messages = initialMessage?.body?.trim()
      ? [{ senderId: initialMessage.senderId, body: initialMessage.body, sentAt: now }]
      : [];

    setMockMessageThreads((prev) => [
      ...prev,
      {
        id: newThreadId,
        participants: normalizedParticipants,
        messages,
      },
    ]);

    return newThreadId;
  };
  const addAnnouncement = (announcementData: Partial<Announcement>) => {
    const newAnnouncement: Announcement = {
      id: `ann-${Date.now()}`,
      conservatoriumId: user?.conservatoriumId || 'cons-15',
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
      id: `wl-${Date.now()}`,
      conservatoriumId: user?.conservatoriumId || 'cons-15',
      status: 'PENDING',
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
      conservatoriumId: user?.conservatoriumId || 'cons-15',
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
      conservatoriumId: user?.conservatoriumId || 'cons-15',
      program: [],
      title: eventData.title || { he: eventData.name || "", en: eventData.name || "" },
      description: eventData.description || { he: "", en: "" },
      venueDetails: eventData.venueDetails || {
        name: { he: eventData.venue || "", en: eventData.venue || "" },
        address: "",
        capacity: eventData.totalSeats || 0,
        isOnline: false,
      },
      isFree: eventData.isFree ?? true,
      ticketPrices: eventData.ticketPrices || [],
      bookedSeats: eventData.bookedSeats || [],
      tags: eventData.tags || [],
      ...eventData,
    } as EventProduction;
    setMockEvents(prev => [newEvent, ...prev]);
  };

  const updateEvent = (updatedEvent: EventProduction) => {
    setMockEvents(prev => prev.map(e => e.id === updatedEvent.id ? updatedEvent : e));
  };

  const updateEventStatus = (eventId: string, status: EventProductionStatus) => {
    setMockEvents(prev => prev.map(e => e.id === eventId ? { ...e, status } : e));
  };


  const bookEventTickets = (
    eventId: string,
    selections: Record<string, number>,
    attendee: { name: string; email: string; phone: string },
    userId = 'guest'
  ): { success: boolean; soldOut?: boolean; bookingRef?: string; totalAmount: number } => {
    const bookingRef = `BK-${Date.now()}`;
    let totalAmount = 0;
    let soldOut = false;

    setMockEvents(prev => prev.map(event => {
      if (event.id !== eventId) return event;

      const currentBookedSeats = [...(event.bookedSeats || [])];
      const fallbackFreeTier = {
        id: 'tier-free',
        name: { he: '????? ????', en: 'Free Entry', ru: '?????????? ????', ar: '???? ?????' },
        priceILS: 0,
        availableCount: Math.max(0, (event.totalSeats || 0) - currentBookedSeats.length),
      };

      const tiersInput = (event.ticketPrices && event.ticketPrices.length > 0)
        ? event.ticketPrices
        : [fallbackFreeTier];

      const tiers = tiersInput.map((tier: TicketTier) => {
        const requested = Math.max(0, selections[tier.id] || 0);
        if (requested === 0) return tier;

        if (tier.availableCount < requested) {
          soldOut = true;
          return tier;
        }

        totalAmount += requested * tier.priceILS;
        for (let i = 0; i < requested; i += 1) {
          currentBookedSeats.push({
            userId,
            tierId: tier.id,
            bookingRef,
            paidAt: tier.priceILS > 0 ? new Date().toISOString() : undefined,
          });
        }

        return { ...tier, availableCount: tier.availableCount - requested };
      });

      if (soldOut) return event;

      const remainingTotal = tiers.reduce((acc: number, tier: TicketTier) => acc + tier.availableCount, 0);
      return {
        ...event,
        ticketPrices: event.ticketPrices && event.ticketPrices.length > 0 ? tiers : event.ticketPrices,
        bookedSeats: currentBookedSeats,
        totalSeats: event.totalSeats ?? remainingTotal + currentBookedSeats.length,
        status: remainingTotal <= 0 ? 'CLOSED' : event.status,
      };
    }));

    if (soldOut) {
      return { success: false, soldOut: true, totalAmount: 0 };
    }

    return { success: true, bookingRef, totalAmount };
  };

  const addPerformanceToEvent = (eventId: string, studentId: string, repertoireId: string) => {
    const student = users.find(u => u.id === studentId);
    const repertoireItem = initialMockData.mockAssignedRepertoire.find(r => r.id === repertoireId);
    const composition = initialMockData.compositions.find(c => c.id === repertoireItem?.compositionId);

    if (!student || !repertoireItem || !composition) {
      toast({ variant: 'destructive', title: '×©×’×™××” ×‘×”×•×¡×¤×ª ×ž×‘×¦×¢' });
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
    toast({ title: `${student.name} × ×•×¡×£/×” ×œ×ª×•×›× ×™×ª!` });
  };
  const removePerformanceFromEvent = (eventId: string, performanceId: string) => {
    setMockEvents(prev => prev.map(event =>
      event.id === eventId
        ? { ...event, program: event.program.filter(p => p.id !== performanceId) }
        : event
    ));
    toast({ title: '×”×‘×™×¦×•×¢ ×”×•×¡×¨ ×ž×”×ª×•×›× ×™×ª' });
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
    toast({ title: 'Instrument assigned successfully' });
  };

  const initiateInstrumentRental = (payload: { instrumentId: string; studentId: string; parentId: string; rentalModel: RentalModel; startDate: string; expectedReturnDate?: string; depositAmountILS?: number; monthlyFeeILS?: number; purchasePriceILS?: number; monthsUntilPurchaseEligible?: number; }) => {
    const token = 'rent-sign-' + Date.now();
    const rentalId = 'rental-' + Date.now();
    const now = new Date().toISOString();

    const newRental: InstrumentRental = {
      id: rentalId,
      conservatoriumId: user?.conservatoriumId || 'cons-15',
      instrumentId: payload.instrumentId,
      studentId: payload.studentId,
      parentId: payload.parentId,
      rentalModel: payload.rentalModel,
      depositAmountILS: payload.depositAmountILS,
      monthlyFeeILS: payload.monthlyFeeILS,
      purchasePriceILS: payload.purchasePriceILS,
      monthsUntilPurchaseEligible: payload.monthsUntilPurchaseEligible,
      startDate: payload.startDate,
      expectedReturnDate: payload.expectedReturnDate,
      status: 'pending_signature',
      signingToken: token,
      condition: 'good',
      notes: 'Awaiting parent signature',
    };

    setMockInstrumentRentals(prev => [newRental, ...prev]);

    const parent = users.find(u => u.id === payload.parentId);
    if (parent) {
      const parentNotification: Notification = {
        id: 'notif-rental-' + Date.now(),
        title: 'Instrument rental request awaiting your signature',
        message: 'Please sign the rental agreement: /rental-sign/' + token,
        timestamp: now,
        link: '/rental-sign/' + token,
        read: false,
      };
      setUsers(prevUsers => prevUsers.map(u => u.id === parent.id
        ? { ...u, notifications: [parentNotification, ...(u.notifications || [])] }
        : u));
    }

    toast({ title: 'Signature request sent to parent (app + SMS/WhatsApp link)' });
    return { rentalId, signingToken: token, signingLink: '/rental-sign/' + token };
  };

  const getRentalByToken = (token: string) => {
    return mockInstrumentRentals.find(r => r.signingToken === token);
  };

  const confirmRentalSignature = (token: string, signatureUrl: string) => {
    const rental = mockInstrumentRentals.find(r => r.signingToken === token);
    if (!rental || rental.status !== 'pending_signature') {
      return { success: false };
    }

    const signedAt = new Date().toISOString();
    setMockInstrumentRentals(prev => prev.map(item => item.signingToken === token
      ? { ...item, parentSignedAt: signedAt, parentSignatureUrl: signatureUrl, status: 'active' }
      : item));

    setMockInstrumentInventory(prev => prev.map(inst => {
      if (inst.id !== rental.instrumentId) return inst;
      return {
        ...inst,
        currentRenterId: rental.studentId,
        rentalStartDate: rental.startDate,
        currentCheckout: {
          studentId: rental.studentId,
          checkedOutAt: signedAt,
          expectedReturnDate: rental.expectedReturnDate || rental.startDate,
          parentSignatureUrl: signatureUrl,
          depositAmount: rental.depositAmountILS,
        }
      };
    }));

    const student = users.find(u => u.id === rental.studentId);
    const parent = users.find(u => u.id === rental.parentId);
    const instrument = mockInstrumentInventory.find(inst => inst.id === rental.instrumentId);
    const adminNotification: Notification = {
      id: 'notif-admin-rental-' + Date.now(),
      title: 'Rental agreement signed',
      message: (parent?.name || 'Parent') + ' has signed rental for ' + (instrument?.name || instrument?.type || student?.name || rental.studentId),
      timestamp: signedAt,
      link: '/dashboard/admin/rentals',
      read: false,
    };
    setUsers(prevUsers => prevUsers.map(u => (u.role === 'conservatorium_admin' || u.role === 'site_admin') && u.conservatoriumId === rental.conservatoriumId
      ? { ...u, notifications: [adminNotification, ...(u.notifications || [])] }
      : u));

    return { success: true, rentalId: rental.id };
  };

  const returnInstrument = (instrumentId: string) => {
    setMockInstrumentInventory(prev => prev.map(inst =>
      inst.id === instrumentId
        ? { ...inst, currentRenterId: undefined, rentalStartDate: undefined, currentCheckout: undefined }
        : inst
    ));
    toast({ title: 'Instrument returned to inventory' });
  };

  const markInstrumentRentalReturned = (rentalId: string, condition: RentalCondition, customRefundAmountILS?: number) => {
    const rental = mockInstrumentRentals.find(item => item.id === rentalId);
    if (!rental) return { success: false, refundAmountILS: 0 };

    const deposit = rental.depositAmountILS || 0;
    const refundMap: Record<RentalCondition, number> = {
      excellent: deposit,
      good: deposit,
      fair: Math.round(deposit * 0.7),
      damaged: 0,
    };

    const refundAmountILS = customRefundAmountILS ?? refundMap[condition];
    const now = new Date().toISOString();

    setMockInstrumentRentals(prev => prev.map(item => item.id === rentalId
      ? { ...item, status: 'returned', condition, actualReturnDate: now, refundAmountILS }
      : item));

    setMockInstrumentInventory(prev => prev.map(inst => inst.id === rental.instrumentId
      ? { ...inst, currentRenterId: undefined, rentalStartDate: undefined, currentCheckout: undefined }
      : inst));

    toast({ title: 'Refund calculated: ILS ' + refundAmountILS });
    return { success: true, refundAmountILS };
  };

  const addInstrument = (instrumentData: Partial<InstrumentInventory>) => {
    const newInstrument: InstrumentInventory = {
      id: `inst-${Date.now()}`,
      conservatoriumId: user?.conservatoriumId || 'cons-1',
      condition: 'GOOD',
      ...instrumentData,
    } as InstrumentInventory;
    setMockInstrumentInventory(prev => [...prev, newInstrument]);
    toast({ title: '×”×›×œ×™ ×”×ª×•×•×¡×£ ×œ×ž×œ××™ ×‘×”×¦×œ×—×”' });
  };

  const updateInstrument = (instrumentId: string, instrumentData: Partial<InstrumentInventory>) => {
    setMockInstrumentInventory(prev => prev.map(inst =>
      inst.id === instrumentId ? { ...inst, ...instrumentData } : inst
    ));
    toast({ title: '×¤×¨×˜×™ ×”×›×œ×™ ×¢×•×“×›× ×• ×‘×”×¦×œ×—×”' });
  };

  const deleteInstrument = (instrumentId: string) => {
    setMockInstrumentInventory(prev => prev.filter(inst => inst.id !== instrumentId));
    toast({ title: '×”×›×œ×™ × ×ž×—×§ ×ž×”×ž×œ××™' });
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
    setMockPracticeVideos(prev => [...prev, newVideo]);
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
    setMockPerformanceBookings(prev => [...prev, newBooking]);
  };

  const addScholarshipApplication = (applicationData: Partial<ScholarshipApplication>) => {
    const student = users.find(u => u.id === user?.id || user?.childIds?.includes(u.id));
    if (!student) return;

    const newApplication: ScholarshipApplication = {
      id: `schol-app-${Date.now()}`,
      studentId: student.id,
      studentName: student.name,
      instrument: student.instruments?.[0]?.instrument || 'Unknown',
      conservatoriumId: student.conservatoriumId || 'cons-1',
      academicYear: '2025-2026',
      status: 'SUBMITTED',
      submittedAt: new Date().toISOString(),
      priorityScore: Math.floor(Math.random() * 50) + 40,
      paymentStatus: 'UNPAID',
      ...applicationData
    } as ScholarshipApplication;
    setMockScholarshipApplications(prev => [...prev, newApplication]);
  };

  const updateScholarshipStatus = (applicationId: string, status: 'APPROVED' | 'REJECTED') => {
    const now = new Date().toISOString();
    setMockScholarshipApplications(prev => prev.map(app => {
      if (app.id !== applicationId) return app;
      return {
        ...app,
        status,
        approvedAt: status === 'APPROVED' ? now : app.approvedAt,
        rejectedAt: status === 'REJECTED' ? now : app.rejectedAt,
      };
    }));
  };

  const markScholarshipAsPaid = (applicationId: string) => {
    const now = new Date().toISOString();
    setMockScholarshipApplications(prev => prev.map(app => app.id === applicationId
      ? { ...app, paymentStatus: 'PAID', paidAt: now }
      : app));
  };

  const addDonationCause = (cause: { names: { he: string; en: string }; descriptions: { he: string; en: string }; category: DonationCauseCategory; targetAmountILS?: number; }): DonationCause => {
    const newCause: DonationCause = {
      id: `cause-${Date.now()}`,
      conservatoriumId: user?.conservatoriumId || 'cons-15',
      names: cause.names,
      descriptions: cause.descriptions,
      category: cause.category,
      priority: (mockDonationCauses.reduce((max, item) => Math.max(max, item.priority), 0) || 0) + 1,
      isActive: true,
      targetAmountILS: cause.targetAmountILS,
      raisedAmountILS: 0,
    };
    setMockDonationCauses(prev => [...prev, newCause]);
    return newCause;
  };

  const recordDonation = (donation: { causeId: string; amountILS: number; frequency: 'once' | 'monthly' | 'yearly'; donorName?: string; donorEmail?: string; donorId?: string; status?: DonationRecord['status']; }): DonationRecord => {
    const newDonation: DonationRecord = {
      id: `donation-${Date.now()}`,
      conservatoriumId: user?.conservatoriumId || 'cons-15',
      causeId: donation.causeId,
      amountILS: donation.amountILS,
      frequency: donation.frequency,
      donorName: donation.donorName,
      donorEmail: donation.donorEmail,
      donorId: donation.donorId,
      status: donation.status || 'INITIATED',
      createdAt: new Date().toISOString(),
    };

    setMockDonations(prev => [...prev, newDonation]);
    setMockDonationCauses(prev => prev.map(cause => cause.id === donation.causeId
      ? { ...cause, raisedAmountILS: cause.raisedAmountILS + donation.amountILS }
      : cause));

    return newDonation;
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

  const graduateStudent = (studentId: string, graduationYear: number) => {
    const student = users.find((item) => item.id === studentId);
    if (!student) return;

    setUsers((prev) => prev.map((item) =>
      item.id === studentId
        ? { ...item, status: 'graduated', graduationYear }
        : item
    ));

    setMockAlumni((prev) => {
      const exists = prev.find((item) => item.userId === studentId);
      if (exists) return prev;
      const profile: Alumnus = {
        id: 'alumni-' + studentId,
        userId: studentId,
        conservatoriumId: student.conservatoriumId,
        displayName: student.name,
        graduationYear,
        primaryInstrument: student.instruments?.[0]?.instrument || 'General',
        bio: {},
        profilePhotoUrl: student.avatarUrl,
        isPublic: false,
        availableForMasterClasses: false,
      };
      return [profile, ...prev];
    });
  };

  const upsertAlumniProfile = (payload: Partial<Alumnus> & { userId: string }): Alumnus => {
    const existing = mockAlumni.find((item) => item.userId === payload.userId);
    if (existing) {
      const merged = { ...existing, ...payload } as Alumnus;
      setMockAlumni((prev) => prev.map((item) => (item.userId === payload.userId ? merged : item)));
      return merged;
    }

    const student = users.find((item) => item.id === payload.userId);
    const created: Alumnus = {
      id: payload.id || ('alumni-' + payload.userId),
      userId: payload.userId,
      conservatoriumId: payload.conservatoriumId || student?.conservatoriumId || user?.conservatoriumId || 'cons-15',
      displayName: payload.displayName || student?.name || 'Alumnus',
      graduationYear: payload.graduationYear || new Date().getFullYear(),
      primaryInstrument: payload.primaryInstrument || student?.instruments?.[0]?.instrument || 'General',
      currentOccupation: payload.currentOccupation,
      bio: payload.bio || {},
      profilePhotoUrl: payload.profilePhotoUrl || student?.avatarUrl,
      isPublic: payload.isPublic ?? false,
      achievements: payload.achievements || [],
      socialLinks: payload.socialLinks,
      availableForMasterClasses: payload.availableForMasterClasses ?? false,
    };

    setMockAlumni((prev) => [created, ...prev]);
    return created;
  };

  const createMasterClass = (payload: Partial<Masterclass>): Masterclass => {
    const instructorInstrument = user?.instruments?.[0]?.instrument || payload.instrument || 'General';
    const created: Masterclass = {
      id: payload.id || ('mc-' + Date.now()),
      conservatoriumId: payload.conservatoriumId || user?.conservatoriumId || 'cons-15',
      title: payload.title || { he: payload.instrument || '???? ???', en: payload.instrument || 'Master Class' },
      description: payload.description || { he: '????? ?????? ?????', en: 'Description will be added soon' },
      instructor: payload.instructor || {
        userId: user?.id || 'unknown',
        displayName: user?.name || 'Instructor',
        instrument: instructorInstrument,
        bio: user?.bio,
        photoUrl: user?.avatarUrl,
      },
      instrument: payload.instrument || instructorInstrument,
      maxParticipants: payload.maxParticipants || 12,
      targetAudience: payload.targetAudience || 'all',
      date: payload.date || new Date().toISOString().split('T')[0],
      startTime: payload.startTime || '18:00',
      durationMinutes: payload.durationMinutes || 90,
      location: payload.location || 'Main Hall',
      isOnline: payload.isOnline ?? false,
      streamUrl: payload.streamUrl,
      includedInPackage: payload.includedInPackage ?? false,
      priceILS: payload.priceILS,
      packageMasterClassCount: payload.packageMasterClassCount,
      status: user?.role === 'conservatorium_admin' || user?.role === 'site_admin' ? 'published' : 'draft',
      registrations: payload.registrations || [],
    };

    setMockMasterclasses((prev) => [created, ...prev]);
    return created;
  };

  const publishMasterClass = (masterClassId: string) => {
    setMockMasterclasses((prev) => prev.map((item) =>
      item.id === masterClassId ? { ...item, status: 'published' } : item
    ));
  };

  const registerToMasterClass = (masterClassId: string, studentId: string) => {
    const target = mockMasterclasses.find((item) => item.id === masterClassId);
    const student = users.find((item) => item.id === studentId);
    if (!target || !student) return { success: false, reason: 'not_found' };
    if (target.status !== 'published') return { success: false, reason: 'not_published' };
    if (target.registrations.some((r) => r.studentId === studentId)) return { success: false, reason: 'already_registered' };
    if (target.registrations.length >= target.maxParticipants) return { success: false, reason: 'full' };

    const allowance = mockMasterClassAllowances.find((item) =>
      item.studentId === studentId && item.conservatoriumId === target.conservatoriumId
    );

    const isPartOfPackage = Boolean(target.includedInPackage && allowance && allowance.remaining > 0);

    if (isPartOfPackage && allowance) {
      setMockMasterClassAllowances((prev) => prev.map((item) =>
        item.studentId === allowance.studentId && item.conservatoriumId === allowance.conservatoriumId
          ? { ...item, used: item.used + 1, remaining: Math.max(0, item.remaining - 1) }
          : item
      ));
    }

    const registration = {
      studentId,
      registeredAt: new Date().toISOString(),
      attendanceStatus: 'registered' as const,
      isPartOfPackage,
    };

    setMockMasterclasses((prev) => prev.map((item) =>
      item.id === masterClassId
        ? { ...item, registrations: [...item.registrations, registration] }
        : item
    ));

    if (!isPartOfPackage && (target.priceILS || 0) > 0) {
      return { success: true, chargedILS: target.priceILS || 0, remaining: allowance?.remaining };
    }

    const nextAllowance = isPartOfPackage && allowance ? Math.max(0, allowance.remaining - 1) : allowance?.remaining;
    return { success: true, chargedILS: 0, remaining: nextAllowance };
  };
  const markWalkthroughAsSeen = (userId: string) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, hasSeenWalkthrough: true } : u));
    if (user?.id === userId) {
      const updatedUser = { ...user, hasSeenWalkthrough: true };
      setUser(updatedUser);
      localStorage.setItem('harmonia-user', JSON.stringify(updatedUser));
      setAuthCookie();
    }
  };

  const addUser = (userData: Partial<User>, isAdminFlow = false): User => {
    const isConservatoriumAdmin = userData.role === 'conservatorium_admin' || userData.role === 'delegated_admin';
    const newUser: User = {
      id: `user-${Date.now()}`,
      approved: isAdminFlow, // Admins auto-approve
      avatarUrl: userData.avatarUrl || ('https://i.pravatar.cc/150?u=' + Date.now()),
      achievements: [],
      registrationSource: userData.registrationSource || (isAdminFlow ? 'admin_created' : 'email'),
      ...(isConservatoriumAdmin ? {
        isDelegatedAdmin: userData.isDelegatedAdmin ?? true,
        isPrimaryConservatoriumAdmin: userData.isPrimaryConservatoriumAdmin ?? false,
      } : {}),
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

  const addConservatoriumInstrument = (instrumentData: Partial<ConservatoriumInstrument>) => {
    const newInstrument: ConservatoriumInstrument = {
      id: instrumentData.id || `cons-inst-${Date.now()}`,
      conservatoriumId: instrumentData.conservatoriumId || user?.conservatoriumId || 'cons-15',
      names: instrumentData.names || { he: '', en: '' },
      isActive: instrumentData.isActive ?? true,
      teacherCount: instrumentData.teacherCount ?? 0,
      availableForRegistration: instrumentData.availableForRegistration ?? true,
      availableForRental: instrumentData.availableForRental ?? true,
    };
    setConservatoriumInstruments(prev => [...prev, newInstrument]);
  };

  const updateConservatoriumInstrument = (instrumentId: string, instrumentData: Partial<ConservatoriumInstrument>) => {
    setConservatoriumInstruments(prev => prev.map(item => item.id === instrumentId ? { ...item, ...instrumentData } : item));
  };

  const deleteConservatoriumInstrument = (instrumentId: string) => {
    setConservatoriumInstruments(prev => prev.filter(item => item.id !== instrumentId));
  };

  const addLessonPackage = (packageData: Partial<LessonPackage>) => {
    const newPackage: LessonPackage = {
      id: packageData.id || `lesson-pkg-${Date.now()}`,
      conservatoriumId: packageData.conservatoriumId || user?.conservatoriumId || 'cons-15',
      names: packageData.names || { he: '', en: '' },
      type: packageData.type || 'monthly',
      lessonCount: packageData.lessonCount ?? null,
      durationMinutes: packageData.durationMinutes || 45,
      priceILS: packageData.priceILS || 0,
      isActive: packageData.isActive ?? true,
      instruments: packageData.instruments || [],
      notes: packageData.notes,
    };
    setLessonPackages(prev => [...prev, newPackage]);
  };

  const updateLessonPackage = (packageId: string, packageData: Partial<LessonPackage>) => {
    setLessonPackages(prev => prev.map(item => item.id === packageId ? { ...item, ...packageData } : item));
  };

  const deleteLessonPackage = (packageId: string) => {
    setLessonPackages(prev => prev.filter(item => item.id !== packageId));
  };

  const addRoom = (roomData: Partial<Room>) => {
    const newRoom: Room = {
      id: `room-${Date.now()}`,
      conservatoriumId: roomData.conservatoriumId || user?.conservatoriumId || 'cons-15',
      branchId: roomData.branchId || mockBranches[0]?.id || 'branch-1',
      name: roomData.name || 'Room',
      capacity: roomData.capacity || 1,
      instrumentEquipment: roomData.instrumentEquipment || [],
      blocks: roomData.blocks || [],
      isActive: roomData.isActive ?? true,
      description: roomData.description,
      photoUrl: roomData.photoUrl,
      equipment: roomData.equipment,
    };
    setMockRooms(prev => [...prev, newRoom]);
    toast({ title: 'Room added successfully' });
  };

  const updateRoom = (roomId: string, roomData: Partial<Room>) => {
    setMockRooms(prev => prev.map(r => r.id === roomId ? { ...r, ...roomData } : r));
    toast({ title: '×¤×¨×˜×™ ×”×—×“×¨ ×¢×•×“×›× ×•' });
  };

  const deleteRoom = (roomId: string) => {
    setMockRooms(prev => prev.filter(r => r.id !== roomId));
    toast({ title: '×”×—×“×¨ × ×ž×—×§' });
  };

  const assignRepertoire = (studentIds: string | string[], compositionId: string) => {
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
  };

  const updatePayrollStatus = (payrollId: string, status: PayrollStatus) => {
    setMockPayrolls(prev => prev.map(p => p.id === payrollId ? { ...p, status } : p));
  };

  const contextValue = useMemo(() => ({
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
    mockAnnouncements,
    mockFormTemplates,
    mockAuditLog,
    mockPlayingSchoolInvoices,
    mockEvents,
    mockInstrumentInventory,
    mockInstrumentRentals,
    mockPerformanceBookings,
    mockScholarshipApplications,
    mockDonationCauses,
    mockDonations,
    mockOpenDayEvents,
    mockOpenDayAppointments,
    mockPracticeVideos,
    mockAlumni,
    mockMasterclasses,
    mockMasterClassAllowances,
    mockMakeupCredits,
    mockRepertoire,
    conservatoriums,
    conservatoriumInstruments,
    lessonPackages,
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
    awardAchievement,
    updateRepertoireStatus,
    addLessonNote,
    updateUserPracticeGoal,
    addProgressReport,
    addMessage,
    createMessageThread,
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
    initiateInstrumentRental,
    getRentalByToken,
    confirmRentalSignature,
    returnInstrument,
    markInstrumentRentalReturned,
    addInstrument,
    updateInstrument,
    deleteInstrument,
    addPracticeVideo,
    addVideoFeedback,
    assignMusiciansToPerformance,
    updatePerformanceBookingStatus,
    addPerformanceBooking,
    addScholarshipApplication,
    updateScholarshipStatus,
    markScholarshipAsPaid,
    addDonationCause,
    recordDonation,
    addOpenDayAppointment,
    graduateStudent,
    upsertAlumniProfile,
    createMasterClass,
    publishMasterClass,
    registerToMasterClass,
    markWalkthroughAsSeen,
    addUser,
    addBranch,
    updateBranch,
    addConservatoriumInstrument,
    updateConservatoriumInstrument,
    deleteConservatoriumInstrument,
    addLessonPackage,
    updateLessonPackage,
    deleteLessonPackage,
    mockRooms,
    addRoom,
    updateRoom,
    deleteRoom,
    updateNotificationPreferences,
    updateUserPaymentMethod,
    assignRepertoire,
    updatePayrollStatus,
    updateEvent,
    updateEventStatus,
    bookEventTickets
  }), [
    user, users, mockFormSubmissions, mockLessons, mockPackages, mockInvoices,
    mockPracticeLogs, mockAssignedRepertoire, mockLessonNotes, mockMessageThreads,
    mockProgressReports, mockAnnouncements, mockFormTemplates, mockAuditLog,
    mockPlayingSchoolInvoices, mockEvents, mockInstrumentInventory, mockInstrumentRentals,
    mockPerformanceBookings, mockScholarshipApplications, mockDonationCauses, mockDonations, mockOpenDayEvents,
    mockOpenDayAppointments, mockPracticeVideos, mockAlumni, mockMasterclasses, mockMasterClassAllowances,
    mockMakeupCredits, mockRepertoire, conservatoriums, conservatoriumInstruments, lessonPackages, mockBranches,
    mockWaitlist, mockPayrolls, newFeaturesEnabled, isLoading, mockRooms
  ]);

  return (
    <AuthContext.Provider value={contextValue}>
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



