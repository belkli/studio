
/**
 * @fileoverview This is the central authentication and state management provider for the Harmonia application.
 * It uses React Context to provide user authentication status, user data, and all mock data
 * for the application's features. It also contains the functions to manipulate this mock data,
 * simulating a backend API. In a production application, these functions would make API calls
 * to a real backend service like Firebase.
 */
'use client';
import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { AuthDomainProvider, useAuthDomain } from '@/hooks/domains/auth-domain';
import { UsersDomainProvider, useUsersDomain } from '@/hooks/domains/users-domain';
import type { User, FormSubmission, Notification, Conservatorium, Package, LessonPackage, ConservatoriumInstrument, LessonSlot, Invoice, PracticeLog, Composition, AssignedRepertoire, LessonNote, RepertoireStatus, MessageThread, ProgressReport, Announcement, Room, PayrollSummary, PracticeVideo, WaitlistEntry, FormTemplate, AuditLogEntry, SlotStatus, NotificationPreferences, Achievement, AchievementType, EventProduction, EventProductionStatus, PerformanceSlot, InstrumentInventory, PerformanceBooking, PerformanceBookingStatus, ScholarshipApplication, OpenDayEvent, OpenDayAppointment, Branch, WaitlistStatus, PayrollStatus, Alumnus, Masterclass, MakeupCredit, PlayingSchoolInvoice, TicketTier, DonationCause, DonationRecord, DonationCauseCategory, InstrumentRental, RentalModel, RentalCondition, StudentMasterClassAllowance, TeacherRating } from '@/lib/types';
import { useRouter } from '@/i18n/routing';
import { useToast } from './use-toast';
import { differenceInCalendarDays, startOfDay, addDays, addHours } from 'date-fns';
import { allocateRoomWithConflictResolution } from '@/lib/room-allocation';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { createAnnouncement, saveAlumnus, createMasterClassAction, publishMasterClassAction, registerToMasterClassAction, createScholarshipApplicationAction, updateScholarshipStatusAction, markScholarshipPaidAction, createDonationCauseAction, recordDonationAction, createBranchAction, updateBranchAction, createConservatoriumInstrumentAction, updateConservatoriumInstrumentAction, deleteConservatoriumInstrumentAction, createLessonPackageAction, updateLessonPackageAction, deleteLessonPackageAction, createRoomAction, updateRoomAction, deleteRoomAction, upsertFormSubmissionAction, createEventAction, updateEventAction, upsertLessonAction, upsertConservatoriumAction } from '@/app/actions';
import { setAuthCookie, clearAuthCookie } from '@/lib/auth-cookie';

/**
 * Defines the shape of the authentication context, including all state and action dispatchers.
 */
interface AuthContextType {
  user: User | null;
  users: User[];
  mockFormSubmissions: FormSubmission[];
  formSubmissions: FormSubmission[];
  compositions: Composition[];
  mockLessons: LessonSlot[];
  lessons: LessonSlot[];
  mockPackages: Package[];
  packages: Package[];
  mockInvoices: Invoice[];
  invoices: Invoice[];
  mockPracticeLogs: PracticeLog[];
  practiceLogs: PracticeLog[];
  mockAssignedRepertoire: AssignedRepertoire[];
  assignedRepertoire: AssignedRepertoire[];
  mockLessonNotes: LessonNote[];
  lessonNotes: LessonNote[];
  mockMessageThreads: MessageThread[];
  messageThreads: MessageThread[];
  mockProgressReports: ProgressReport[];
  progressReports: ProgressReport[];
  mockAnnouncements: Announcement[];
  announcements: Announcement[];
  mockFormTemplates: FormTemplate[];
  formTemplates: FormTemplate[];
  mockAuditLog: AuditLogEntry[];
  auditLog: AuditLogEntry[];
  mockPlayingSchoolInvoices: PlayingSchoolInvoice[];
  playingSchoolInvoices: PlayingSchoolInvoice[];
  mockEvents: EventProduction[];
  events: EventProduction[];
  mockInstrumentInventory: InstrumentInventory[];
  instrumentInventory: InstrumentInventory[];
  mockInstrumentRentals: InstrumentRental[];
  instrumentRentals: InstrumentRental[];
  mockPerformanceBookings: PerformanceBooking[];
  performanceBookings: PerformanceBooking[];
  mockScholarshipApplications: ScholarshipApplication[];
  scholarshipApplications: ScholarshipApplication[];
  mockDonationCauses: DonationCause[];
  donationCauses: DonationCause[];
  mockDonations: DonationRecord[];
  donations: DonationRecord[];
  mockOpenDayEvents: OpenDayEvent[];
  openDayEvents: OpenDayEvent[];
  mockOpenDayAppointments: OpenDayAppointment[];
  openDayAppointments: OpenDayAppointment[];
  mockPracticeVideos: PracticeVideo[];
  practiceVideos: PracticeVideo[];
  mockAlumni: Alumnus[];
  alumni: Alumnus[];
  mockMasterclasses: Masterclass[];
  masterClasses: Masterclass[];
  mockMasterClassAllowances: StudentMasterClassAllowance[];
  masterClassAllowances: StudentMasterClassAllowance[];
  mockMakeupCredits: MakeupCredit[];
  makeupCredits: MakeupCredit[];
  mockRepertoire: Composition[];
  repertoire: Composition[];
  conservatoriums: Conservatorium[];
  conservatoriumInstruments: ConservatoriumInstrument[];
  lessonPackages: LessonPackage[];
  mockBranches: Branch[];
  branches: Branch[];
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  offerSlotToWaitlisted: (entryId: string, slotId: string, slotTimeLabel: string) => void;
  acceptWaitlistOffer: (entryId: string) => void;
  declineWaitlistOffer: (entryId: string) => void;
  expireWaitlistOffers: () => void;
  revokeWaitlistOffer: (entryId: string) => void;
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
  registerToMasterClass: (masterClassId: string, studentId: string) => Promise<{ success: boolean; chargedILS?: number; remaining?: number; reason?: string }>;
  markWalkthroughAsSeen: (userId: string) => void;
  addUser: (userData: Partial<User>, isAdminFlow?: boolean) => User;
  addBranch: (branchData: Partial<Branch>) => void;
  updateBranch: (branchData: Branch) => void;
  addConservatoriumInstrument: (instrumentData: Partial<ConservatoriumInstrument>) => void;
  updateConservatoriumInstrument: (instrumentId: string, instrumentData: Partial<ConservatoriumInstrument>) => void;
  deleteConservatoriumInstrument: (instrumentId: string) => void;
  addComposition: (data: Partial<Composition>) => void;
  updateComposition: (compositionId: string, data: Partial<Composition>) => void;
  deleteComposition: (compositionId: string) => void;
  addLessonPackage: (packageData: Partial<LessonPackage>) => void;
  updateLessonPackage: (packageId: string, packageData: Partial<LessonPackage>) => void;
  deleteLessonPackage: (packageId: string) => void;
  mockRooms: Room[];
  rooms: Room[];
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
  waitlist: WaitlistEntry[];
  mockPayrolls: PayrollSummary[];
  payrolls: PayrollSummary[];
  updatePayrollStatus: (payrollId: string, status: PayrollStatus) => void;
  updateEvent: (event: EventProduction) => void;
  updateEventStatus: (eventId: string, status: EventProductionStatus) => void;
  bookEventTickets: (eventId: string, selections: Record<string, number>, attendee: { name: string; email: string; phone: string }, userId?: string) => { success: boolean; soldOut?: boolean; bookingRef?: string; totalAmount: number };
  mockTeacherRatings: TeacherRating[];
  submitTeacherRating: (teacherId: string, rating: 1|2|3|4|5, comment?: string) => void;
  getTeacherRating: (teacherId: string) => { avg: number; count: number; userRating?: number };
}

export const AuthContext = createContext<AuthContextType | null>(null);

/**
 * The main provider component that wraps the application.
 * It initializes and manages all application state, simulating a full backend.
 */
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <UsersDomainProvider>
      <AuthDomainProvider>
        <AuthProviderInner>
          {children}
        </AuthProviderInner>
      </AuthDomainProvider>
    </UsersDomainProvider>
  );
};

function AuthProviderInner({
  children,
}: {
  children: React.ReactNode;
}) {
  const {
    user,
    isLoading,
    bootstrapResolved,
    login,
    logout,
    approveUser,
    rejectUser,
    setUser,
    setIsLoading,
    setBootstrapResolved,
    setBootstrapUsedMockFallback,
  } = useAuthDomain();

  const {
    users,
    setUsers,
    addUser,
    updateUser,
    markWalkthroughAsSeen,
    updateNotificationPreferences,
    updateUserPaymentMethod,
    registerAuthSetters,
  } = useUsersDomain();

  // Keep users-domain in sync with the current session user so that updateUser,
  // markWalkthroughAsSeen etc. can update localStorage / auth cookie correctly.
  useEffect(() => {
    registerAuthSetters(user, setUser);
  }, [user, setUser, registerAuthSetters]);

  // State for all mock data sets (users moved to outer AuthProvider)
  const [mockFormSubmissions, setMockFormSubmissions] = useState<FormSubmission[]>([]);
  const [mockLessons, setMockLessons] = useState<LessonSlot[]>([]);
  const [mockPackages, setMockPackages] = useState<Package[]>([]);
  const [mockInvoices, setMockInvoices] = useState<Invoice[]>([]);
  const [mockPracticeLogs, setMockPracticeLogs] = useState<PracticeLog[]>([]);
  const [mockAssignedRepertoire, setMockAssignedRepertoire] = useState<AssignedRepertoire[]>([]);
  const [mockLessonNotes, setMockLessonNotes] = useState<LessonNote[]>([]);
  const [mockMessageThreads, setMockMessageThreads] = useState<MessageThread[]>([]);
  const [mockProgressReports, setMockProgressReports] = useState<ProgressReport[]>([]);
  const [mockAnnouncements, setMockAnnouncements] = useState<Announcement[]>([]);
  const [mockFormTemplates, setMockFormTemplates] = useState<FormTemplate[]>([]);
  const [mockAuditLog, setMockAuditLog] = useState<AuditLogEntry[]>([]);
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
  const [mockEvents, setMockEvents] = useState<EventProduction[]>([]);
  const [mockInstrumentInventory, setMockInstrumentInventory] = useState<InstrumentInventory[]>([]);
  const [mockInstrumentRentals, setMockInstrumentRentals] = useState<InstrumentRental[]>([]);

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
  const [mockPerformanceBookings, setMockPerformanceBookings] = useState<PerformanceBooking[]>([]);
  const [mockScholarshipApplications, setMockScholarshipApplications] = useState<ScholarshipApplication[]>([]);
  const [mockDonationCauses, setMockDonationCauses] = useState<DonationCause[]>([]);
  const [mockDonations, setMockDonations] = useState<DonationRecord[]>([]);
  const [mockOpenDayEvents, setMockOpenDayEvents] = useState<OpenDayEvent[]>([]);
  const [mockOpenDayAppointments, setMockOpenDayAppointments] = useState<OpenDayAppointment[]>([]);
  const [mockBranches, setMockBranches] = useState<Branch[]>([]);
  const [mockPracticeVideos, setMockPracticeVideos] = useState<PracticeVideo[]>([]);
  const [mockAlumni, setMockAlumni] = useState<Alumnus[]>([]);
  const [mockMasterclasses, setMockMasterclasses] = useState<Masterclass[]>([]);
  const [mockMasterClassAllowances, setMockMasterClassAllowances] = useState<StudentMasterClassAllowance[]>([]);
  const [mockWaitlist, setMockWaitlist] = useState<WaitlistEntry[]>([]);
  const [mockPayrolls, setMockPayrolls] = useState<PayrollSummary[]>([]);
  const [mockMakeupCredits, setMockMakeupCredits] = useState<MakeupCredit[]>([]);
  const [mockTeacherRatings, setMockTeacherRatings] = useState<TeacherRating[]>([]);
  const [mockRepertoire, setMockRepertoire] = useState<Composition[]>([]);
  const [mockRooms, setMockRooms] = useState<Room[]>([]);
  const [conservatoriums, setConservatoriums] = useState<Conservatorium[]>([]);
  const [conservatoriumInstruments, setConservatoriumInstruments] = useState<ConservatoriumInstrument[]>([]);
  const [lessonPackages, setLessonPackages] = useState<LessonPackage[]>([]);
  const applyMockBootstrapFallback = () => {
    setBootstrapUsedMockFallback(true);
    setUsers([]);
    setConservatoriums([]);
    setConservatoriumInstruments([]);
    setLessonPackages([]);
    setMockLessons([]);
    setMockFormSubmissions([]);
    setMockEvents([]);
    setMockRooms([]);
    setMockPayrolls([]);
    setMockRepertoire([]);

    setMockPackages([]);
    setMockInvoices([]);
    setMockPracticeLogs([]);
    setMockAssignedRepertoire([]);
    setMockLessonNotes([]);
    setMockMessageThreads([]);
    setMockProgressReports([]);
    setMockAnnouncements([]);
    setMockFormTemplates([]);
    setMockAuditLog([]);
    setMockInstrumentInventory([]);
    setMockInstrumentRentals([]);
    setMockPerformanceBookings([]);
    setMockScholarshipApplications([]);
    setMockDonationCauses([]);
    setMockDonations([]);
    setMockOpenDayEvents([]);
    setMockOpenDayAppointments([]);
    setMockBranches([]);
    setMockPracticeVideos([]);
    setMockAlumni([]);
    setMockMasterclasses([]);
    setMockWaitlist([]);
    setMockMakeupCredits([]);
    setMockPlayingSchoolInvoices([]);
    setMockMasterClassAllowances([]);
  };

  useEffect(() => {
    let active = true;

    const allowClientMockBootstrapFallback = process.env.NEXT_PUBLIC_ALLOW_BOOTSTRAP_MOCK_FALLBACK === '1';

    const loadBootstrapData = async () => {
      try {
        const bootstrapUrl = typeof window !== 'undefined'
          ? new URL('/api/bootstrap', window.location.origin).toString()
          : '/api/bootstrap';
        const response = await fetch(bootstrapUrl, { cache: 'no-store' });
        if (!response.ok) {
          if (active && allowClientMockBootstrapFallback) applyMockBootstrapFallback();
          return;
        }

        const payload = await response.json() as {
          meta?: { backend?: string; source?: string; fallbackReason?: string };
          users?: User[];
          conservatoriums?: Conservatorium[];
          conservatoriumInstruments?: ConservatoriumInstrument[];
          lessonPackages?: LessonPackage[];
          lessons?: LessonSlot[];
          forms?: FormSubmission[];
          events?: EventProduction[];
          rooms?: Room[];
          payrolls?: PayrollSummary[];
          repertoire?: Composition[];
          scholarships?: ScholarshipApplication[];
          rentals?: unknown[];
          payments?: Invoice[];
          announcements?: Announcement[];
          alumni?: Alumnus[];
          masterClasses?: Masterclass[];
          packages?: Package[];
          invoices?: Invoice[];
          practiceLogs?: PracticeLog[];
          assignedRepertoire?: AssignedRepertoire[];
          lessonNotes?: LessonNote[];
          messageThreads?: MessageThread[];
          progressReports?: ProgressReport[];
          formTemplates?: FormTemplate[];
          auditLog?: AuditLogEntry[];
          instrumentInventory?: InstrumentInventory[];
          performanceBookings?: PerformanceBooking[];
          donationCauses?: DonationCause[];
          donations?: DonationRecord[];
          openDayEvents?: OpenDayEvent[];
          openDayAppointments?: OpenDayAppointment[];
          branches?: Branch[];
          practiceVideos?: PracticeVideo[];
          waitlist?: WaitlistEntry[];
          makeupCredits?: MakeupCredit[];
          playingSchoolInvoices?: PlayingSchoolInvoice[];
          masterClassAllowances?: StudentMasterClassAllowance[];
        };
        if (!active) return;

        const bootstrapSource = payload?.meta?.source;
        const bootstrapBackend = payload?.meta?.backend;
        const isFallbackBootstrap = bootstrapSource === 'fallback';
        const isAuthoritativeSource = Boolean((bootstrapSource && bootstrapSource !== 'fallback' && bootstrapSource !== 'unknown') || bootstrapBackend === 'postgres' || bootstrapBackend === 'supabase');
        const shouldApplyMockExtras = bootstrapBackend === 'mock' || isFallbackBootstrap;

        if (bootstrapBackend === 'postgres' && isFallbackBootstrap) {
          console.warn('[auth] bootstrap is using fallback seed instead of PostgreSQL', payload?.meta?.fallbackReason);
        }

        if (shouldApplyMockExtras) {
          setBootstrapUsedMockFallback(true);
        }

        const payloadUsers = Array.isArray(payload.users) ? payload.users : [];
        const payloadConservatoriums = Array.isArray(payload.conservatoriums) ? payload.conservatoriums : [];

        const hasPayloadLists = payloadUsers.length > 0 || payloadConservatoriums.length > 0;
        if (!isAuthoritativeSource && !hasPayloadLists) {
          if (allowClientMockBootstrapFallback) applyMockBootstrapFallback();
          return;
        }

        const placeholderImageMap = new Map(PlaceHolderImages.map((image) => [image.id, image.imageUrl]));
        const normalizeAvatarUrl = (value?: string) => {
          if (!value) return value;
          return placeholderImageMap.get(value) || value;
        };

        const finalUsers = payloadUsers.length > 0
          ? Array.from(
              new Map(
                payloadUsers.map((entry: User) => [entry.id, { ...entry, avatarUrl: normalizeAvatarUrl(entry.avatarUrl) }])
              ).values()
            )
          : null;

        const finalConservatoriums = payloadConservatoriums.length > 0
          ? Array.from(new Map(payloadConservatoriums.map((entry: Conservatorium) => [entry.id, entry])).values())
          : null;

        if (finalUsers) setUsers(finalUsers);
        if (finalConservatoriums) setConservatoriums(finalConservatoriums);
        if (Array.isArray(payload.conservatoriumInstruments)) setConservatoriumInstruments(payload.conservatoriumInstruments);
        if (Array.isArray(payload.lessonPackages)) setLessonPackages(payload.lessonPackages);
        if (Array.isArray(payload.lessons)) setMockLessons(payload.lessons);
        if (Array.isArray(payload.forms)) setMockFormSubmissions(payload.forms);
        if (Array.isArray(payload.events)) setMockEvents(payload.events);
        if (Array.isArray(payload.rooms)) setMockRooms(payload.rooms);
        if (Array.isArray(payload.payrolls)) setMockPayrolls(payload.payrolls);
        if (Array.isArray(payload.repertoire)) setMockRepertoire(payload.repertoire);
        if (Array.isArray(payload.scholarships)) setMockScholarshipApplications(payload.scholarships);
        if (Array.isArray(payload.rentals)) setMockInstrumentRentals(payload.rentals as InstrumentRental[]);
        if (Array.isArray(payload.payments)) setMockInvoices(payload.payments);
        if (Array.isArray(payload.announcements)) setMockAnnouncements(payload.announcements);
        if (Array.isArray(payload.alumni)) setMockAlumni(payload.alumni);
        if (Array.isArray(payload.masterClasses)) setMockMasterclasses(payload.masterClasses);
        if (Array.isArray(payload.instrumentInventory)) setMockInstrumentInventory(payload.instrumentInventory);
        if (Array.isArray(payload.performanceBookings)) setMockPerformanceBookings(payload.performanceBookings);
        if (Array.isArray(payload.donationCauses)) setMockDonationCauses(payload.donationCauses);
        if (Array.isArray(payload.donations)) setMockDonations(payload.donations);
        if (Array.isArray(payload.openDayEvents)) setMockOpenDayEvents(payload.openDayEvents);
        if (Array.isArray(payload.openDayAppointments)) setMockOpenDayAppointments(payload.openDayAppointments);
        if (Array.isArray(payload.branches)) setMockBranches(payload.branches);
        if (Array.isArray(payload.practiceVideos)) setMockPracticeVideos(payload.practiceVideos);
        if (Array.isArray(payload.waitlist)) setMockWaitlist(payload.waitlist);
        if (Array.isArray(payload.makeupCredits)) setMockMakeupCredits(payload.makeupCredits);
        if (Array.isArray(payload.playingSchoolInvoices)) setMockPlayingSchoolInvoices(payload.playingSchoolInvoices);
        if (Array.isArray(payload.masterClassAllowances)) setMockMasterClassAllowances(payload.masterClassAllowances);
        if (shouldApplyMockExtras) {
          if (Array.isArray(payload.packages)) setMockPackages(payload.packages);
          if (Array.isArray(payload.invoices)) setMockInvoices(payload.invoices);
          if (Array.isArray(payload.practiceLogs)) setMockPracticeLogs(payload.practiceLogs);
          if (Array.isArray(payload.assignedRepertoire)) setMockAssignedRepertoire(payload.assignedRepertoire);
          if (Array.isArray(payload.lessonNotes)) setMockLessonNotes(payload.lessonNotes);
          if (Array.isArray(payload.messageThreads)) setMockMessageThreads(payload.messageThreads);
          if (Array.isArray(payload.progressReports)) setMockProgressReports(payload.progressReports);
          if (Array.isArray(payload.formTemplates)) setMockFormTemplates(payload.formTemplates);
          if (Array.isArray(payload.auditLog)) setMockAuditLog(payload.auditLog);
        } else {
          // Authoritative DB source: clear any stale mock-only extras from prior fallback boots.
          setMockPackages([]);
          setMockPracticeLogs([]);
          setMockAssignedRepertoire([]);
          setMockLessonNotes([]);
          setMockMessageThreads([]);
          setMockProgressReports([]);
          setMockFormTemplates([]);
          setMockAuditLog([]);
        }

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
        if (!active) return;
        if (allowClientMockBootstrapFallback) applyMockBootstrapFallback();
      } finally {
        if (active) setBootstrapResolved(true);
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

    // Always use modern nav for admin personas.
    if (user.role === 'conservatorium_admin' || user.role === 'delegated_admin' || user.role === 'site_admin') {
      return true;
    }

    const currentConservatorium = conservatoriums.find(c => c.id === user.conservatoriumId);
    return currentConservatorium?.newFeaturesEnabled ?? true;
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
      } catch {
        localStorage.removeItem('harmonia-user');
        clearAuthCookie();
      }
    }
  }, []);

  /**
   * Simulates user login.
   * @param email The email to log in with.
   * @returns An object with the user and their approval status.
   */
  useEffect(() => {
    if (bootstrapResolved) setIsLoading(false);
  }, [bootstrapResolved]);

  // --- Data Manipulation Functions ---
  // These functions simulate backend operations by directly manipulating the state.

  const updateForm = (updatedForm: FormSubmission) => {
    setMockFormSubmissions(prevForms => {
      const formIndex = prevForms.findIndex(f => f.id === updatedForm.id);
      if (formIndex > -1) {
        return prevForms.map((form, index) => index === formIndex ? updatedForm : form);
      } else {
        return [...prevForms, updatedForm];
      }
    });

    void upsertFormSubmissionAction(updatedForm)
      .then((saved) => {
        setMockFormSubmissions(prevForms => {
          const formIndex = prevForms.findIndex(f => f.id === saved.id);
          if (formIndex > -1) {
            return prevForms.map((form, index) => index === formIndex ? saved : form);
          }
          return [...prevForms, saved];
        });
      })
      .catch((error) => {
        console.warn('Failed to persist form submission', error);
      });
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
  };

  const cancelLesson = (lessonId: string, withNotice: boolean) => {
    const nextStatus = withNotice ? 'CANCELLED_STUDENT_NOTICED' : 'CANCELLED_STUDENT_NO_NOTICE';
    setMockLessons(prev => prev.map(l => l.id === lessonId ? { ...l, status: nextStatus } : l));

    const snapshot = mockLessons.find((item) => item.id === lessonId);
    if (!snapshot) return;

    void upsertLessonAction({ ...snapshot, status: nextStatus } as LessonSlot)
      .then((saved) => {
        setMockLessons(prev => prev.map(item => item.id === lessonId ? saved : item));
      })
      .catch((error) => {
        console.warn('Failed to persist lesson cancel', error);
      });
  };

  const rescheduleLesson = (lessonId: string, newStartTime: string) => {
    setMockLessons(prev => prev.map(l => l.id === lessonId ? { ...l, startTime: newStartTime } : l));

    const snapshot = mockLessons.find((item) => item.id === lessonId);
    if (!snapshot) return;

    void upsertLessonAction({ ...snapshot, startTime: newStartTime } as LessonSlot)
      .then((saved) => {
        setMockLessons(prev => prev.map(item => item.id === lessonId ? saved : item));
      })
      .catch((error) => {
        console.warn('Failed to persist lesson reschedule', error);
      });
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

  const submitTeacherRating = (teacherId: string, rating: 1|2|3|4|5, comment?: string) => {
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
  };

  const getTeacherRating = (teacherId: string) => {
    return {
      avg: mockTeacherRatings.filter(r => r.teacherId === teacherId).reduce((s, r, _, a) => s + r.rating / a.length, 0) || 0,
      count: mockTeacherRatings.filter(r => r.teacherId === teacherId).length,
      userRating: user ? mockTeacherRatings.find(r => r.teacherId === teacherId && r.reviewerUserId === user.id)?.rating : undefined,
    };
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
      id: `ann-${Date.now()}` ,
      conservatoriumId: user?.conservatoriumId || 'cons-15',
      sentAt: new Date().toISOString(),
      ...announcementData
    } as Announcement;
    setMockAnnouncements(prev => [newAnnouncement, ...prev]);

    const newAuditLogEntry: AuditLogEntry = {
      id: `log-${Date.now()}` ,
      notificationId: newAnnouncement.id,
      userId: 'system',
      channel: 'IN_APP',
      status: 'DELIVERED',
      sentAt: new Date().toISOString(),
      title: newAnnouncement.title,
      body: newAnnouncement.body,
    };
    setMockAuditLog(prev => [newAuditLogEntry, ...prev]);

    if (newAnnouncement.title && newAnnouncement.body) {
      void createAnnouncement(newAnnouncement)
        .then((serverAnnouncement) => {
          setMockAnnouncements((prev) => prev.map((item) => (item.id === newAnnouncement.id ? serverAnnouncement : item)));
        })
        .catch((error) => {
          console.warn('Failed to persist announcement', error);
        });
    }
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

    const snapshot = mockLessons.find((item) => item.id === lessonId);
    if (!snapshot) return;

    void upsertLessonAction({ ...snapshot, status, attendanceMarkedAt: new Date().toISOString() } as LessonSlot)
      .then((saved) => {
        setMockLessons(prev => prev.map(item => item.id === lessonId ? saved : item));
      })
      .catch((error) => {
        console.warn('Failed to persist lesson status', error);
      });
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

  const offerSlotToWaitlisted = (entryId: string, slotId: string, slotTimeLabel: string) => {
    const expiresAt = addHours(new Date(), 48).toISOString();
    setMockWaitlist(prev => prev.map(e =>
      e.id === entryId
        ? { ...e, status: 'OFFERED' as WaitlistStatus, offeredSlotId: slotId, offeredSlotTime: slotTimeLabel, offerExpiresAt: expiresAt, notifiedAt: new Date().toISOString() }
        : e
    ));
  };

  const acceptWaitlistOffer = (entryId: string) => {
    const entry = mockWaitlist.find(e => e.id === entryId);
    if (!entry || entry.status !== 'OFFERED') return;
    if (entry.offerExpiresAt && new Date(entry.offerExpiresAt) < new Date()) return;
    setMockWaitlist(prev => prev.map(e =>
      e.id === entryId
        ? { ...e, status: 'ACCEPTED' as WaitlistStatus, offerAcceptedAt: new Date().toISOString() }
        : e
    ));
  };

  const declineWaitlistOffer = (entryId: string) => {
    setMockWaitlist(prev => prev.map(e =>
      e.id === entryId
        ? { ...e, status: 'DECLINED' as WaitlistStatus, offerDeclinedAt: new Date().toISOString() }
        : e
    ));
  };

  const expireWaitlistOffers = useCallback(() => {
    const now = new Date();
    setMockWaitlist(prev => prev.map(e =>
      e.status === 'OFFERED' && e.offerExpiresAt && new Date(e.offerExpiresAt) < now
        ? { ...e, status: 'EXPIRED' as WaitlistStatus }
        : e
    ));
  }, []);

  const revokeWaitlistOffer = (entryId: string) => {
    setMockWaitlist(prev => prev.map(e =>
      e.id === entryId && e.status === 'OFFERED'
        ? { ...e, status: 'WAITING' as WaitlistStatus, offeredSlotId: undefined, offeredSlotTime: undefined, offerExpiresAt: undefined }
        : e
    ));
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

    void upsertConservatoriumAction(updatedConservatorium)
      .then((saved) => {
        setConservatoriums(prev => prev.map(item => item.id === saved.id ? saved : item));
      })
      .catch((error) => {
        console.warn('Failed to persist conservatorium', error);
      });
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

    void createEventAction(newEvent)
      .then((saved) => {
        setMockEvents(prev => prev.map(item => (item.id === newEvent.id ? saved : item)));
      })
      .catch((error) => {
        console.warn('Failed to persist event', error);
      });
  };

  const updateEvent = (updatedEvent: EventProduction) => {
    setMockEvents(prev => prev.map(e => e.id === updatedEvent.id ? updatedEvent : e));

    void updateEventAction(updatedEvent)
      .then((saved) => {
        setMockEvents(prev => prev.map(item => (item.id === saved.id ? saved : item)));
      })
      .catch((error) => {
        console.warn('Failed to persist event update', error);
      });
  };

  const updateEventStatus = (eventId: string, status: EventProductionStatus) => {
    setMockEvents(prev => prev.map(e => e.id === eventId ? { ...e, status } : e));

    const snapshot = mockEvents.find((event) => event.id === eventId);
    if (!snapshot) return;

    void updateEventAction({ ...snapshot, status })
      .then((saved) => {
        setMockEvents(prev => prev.map(item => (item.id === eventId ? saved : item)));
      })
      .catch((error) => {
        console.warn('Failed to persist event status update', error);
      });
  };


  const bookEventTickets = (
    eventId: string,
    selections: Record<string, number>,
    attendee: { name: string; email: string; phone: string },
    userId = 'guest'
  ): { success: boolean; soldOut?: boolean; bookingRef?: string; totalAmount: number } => {
    const bookingRef = 'BK-' + Date.now();
    let totalAmount = 0;
    let soldOut = false;
    let updatedEventSnapshot: EventProduction | null = null;

    setMockEvents(prev => prev.map(event => {
      if (event.id !== eventId) return event;

      const currentBookedSeats = [...(event.bookedSeats || [])];
      const fallbackFreeTier = {
        id: 'tier-free',
        name: { he: 'Free Entry', en: 'Free Entry', ru: 'Free Entry', ar: 'Free Entry' },
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
      const updatedEvent = {
        ...event,
        ticketPrices: event.ticketPrices && event.ticketPrices.length > 0 ? tiers : event.ticketPrices,
        bookedSeats: currentBookedSeats,
        totalSeats: event.totalSeats ?? remainingTotal + currentBookedSeats.length,
        status: remainingTotal <= 0 ? 'CLOSED' : event.status,
      };
      updatedEventSnapshot = updatedEvent;
      return updatedEvent;
    }));

    if (soldOut) {
      return { success: false, soldOut: true, totalAmount: 0 };
    }

    if (updatedEventSnapshot) {
      void updateEventAction(updatedEventSnapshot)
        .then((saved) => {
          setMockEvents(prev => prev.map(item => item.id === saved.id ? saved : item));
        })
        .catch((error) => {
          console.warn('Failed to persist ticket booking event state', error);
        });
    }

    return { success: true, bookingRef, totalAmount };
  };

  const addPerformanceToEvent = (eventId: string, studentId: string, repertoireId: string) => {
    const student = users.find(u => u.id === studentId);
    const repertoireItem = mockAssignedRepertoire.find(r => r.id === repertoireId);
    const composition = mockRepertoire.find(c => c.id === repertoireItem?.compositionId);

    if (!student || !repertoireItem || !composition) {
      toast({ variant: 'destructive', title: 'Description will be added soon' });
      return;
    }

    const newPerformance: PerformanceSlot = {
      id: 'ps-' + Date.now(),
      studentId,
      studentName: student.name,
      compositionTitle: composition.title,
      composer: composition.composer,
      duration: composition.duration,
    };

    let updatedEventSnapshot: EventProduction | null = null;
    setMockEvents(prev => prev.map(event => {
      if (event.id !== eventId) return event;
      const updatedEvent = { ...event, program: [...event.program, newPerformance] };
      updatedEventSnapshot = updatedEvent;
      return updatedEvent;
    }));

    if (updatedEventSnapshot) {
      void updateEventAction(updatedEventSnapshot)
        .then((saved) => {
          setMockEvents(prev => prev.map(item => item.id === saved.id ? saved : item));
        })
        .catch((error) => {
          console.warn('Failed to persist added performance', error);
        });
    }
    toast({ title: student.name + ' added to program!' });
  };

  const removePerformanceFromEvent = (eventId: string, performanceId: string) => {
    let updatedEventSnapshot: EventProduction | null = null;
    setMockEvents(prev => prev.map(event => {
      if (event.id !== eventId) return event;
      const updatedEvent = { ...event, program: event.program.filter(p => p.id !== performanceId) };
      updatedEventSnapshot = updatedEvent;
      return updatedEvent;
    }));

    if (updatedEventSnapshot) {
      void updateEventAction(updatedEventSnapshot)
        .then((saved) => {
          setMockEvents(prev => prev.map(item => item.id === saved.id ? saved : item));
        })
        .catch((error) => {
          console.warn('Failed to persist removed performance', error);
        });
    }
    toast({ title: 'Performance removed from program' });
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
    toast({ title: 'Instrument added to inventory' });
  };

  const updateInstrument = (instrumentId: string, instrumentData: Partial<InstrumentInventory>) => {
    setMockInstrumentInventory(prev => prev.map(inst =>
      inst.id === instrumentId ? { ...inst, ...instrumentData } : inst
    ));
    toast({ title: 'Instrument details updated' });
  };

  const deleteInstrument = (instrumentId: string) => {
    setMockInstrumentInventory(prev => prev.filter(inst => inst.id !== instrumentId));
    toast({ title: 'Room details updated' });
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

    void (async () => {
      try {
        const normalizedStatus =
          newApplication.status === 'DRAFT' || newApplication.status === 'DOCUMENTS_PENDING'
            ? 'SUBMITTED'
            : newApplication.status;
        const saved = await createScholarshipApplicationAction({
          id: newApplication.id,
          studentId: newApplication.studentId,
          studentName: newApplication.studentName,
          instrument: newApplication.instrument,
          conservatoriumId: newApplication.conservatoriumId,
          academicYear: newApplication.academicYear,
          status: normalizedStatus,
          submittedAt: newApplication.submittedAt,
          priorityScore: newApplication.priorityScore,
          approvedAt: newApplication.approvedAt,
          rejectedAt: newApplication.rejectedAt,
          paymentStatus: newApplication.paymentStatus,
          paidAt: newApplication.paidAt,
        });
        setMockScholarshipApplications(prev =>
          prev.map(app => (app.id === newApplication.id ? { ...app, ...saved } : app))
        );
      } catch {
        // Keep optimistic entry in memory even if persistence fails.
      }
    })();
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

    void (async () => {
      try {
        const result = await updateScholarshipStatusAction({ applicationId, status });
        if (result?.success && result.scholarship) {
          setMockScholarshipApplications(prev =>
            prev.map(app => (app.id === applicationId ? { ...app, ...result.scholarship } : app))
          );
        }
      } catch {
        // Keep optimistic state in memory if persistence fails.
      }
    })();
  };

  const markScholarshipAsPaid = (applicationId: string) => {
    const now = new Date().toISOString();
    setMockScholarshipApplications(prev => prev.map(app => app.id === applicationId
      ? { ...app, paymentStatus: 'PAID', paidAt: now }
      : app));

    void (async () => {
      try {
        const result = await markScholarshipPaidAction(applicationId);
        if (result?.success && result.scholarship) {
          setMockScholarshipApplications(prev =>
            prev.map(app => (app.id === applicationId ? { ...app, ...result.scholarship } : app))
          );
        }
      } catch {
        // Keep optimistic state in memory if persistence fails.
      }
    })();
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

    void (async () => {
      try {
        const saved = await createDonationCauseAction({
          id: newCause.id,
          conservatoriumId: newCause.conservatoriumId,
          names: { ...newCause.names, ru: newCause.names.en, ar: newCause.names.en },
          descriptions: newCause.descriptions,
          category: newCause.category,
          priority: newCause.priority,
          isActive: newCause.isActive,
          targetAmountILS: newCause.targetAmountILS,
          raisedAmountILS: newCause.raisedAmountILS,
          imageUrl: newCause.imageUrl,
        });
        setMockDonationCauses(prev =>
          prev.map(item => (item.id === newCause.id ? { ...item, ...saved } : item))
        );
      } catch {
        // Keep optimistic entry in memory even if persistence fails.
      }
    })();

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

    void (async () => {
      try {
        const saved = await recordDonationAction({
          id: newDonation.id,
          conservatoriumId: newDonation.conservatoriumId,
          causeId: newDonation.causeId,
          amountILS: newDonation.amountILS,
          frequency: newDonation.frequency,
          donorName: newDonation.donorName,
          donorEmail: newDonation.donorEmail,
          donorId: newDonation.donorId,
          status: newDonation.status,
          createdAt: newDonation.createdAt,
        });
        setMockDonations(prev =>
          prev.map(item => (item.id === newDonation.id ? { ...item, ...saved } : item))
        );
      } catch {
        // Keep optimistic state in memory if persistence fails.
      }
    })();

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
      void saveAlumnus(merged)
        .then((serverAlumnus) => {
          setMockAlumni((prev) => prev.map((item) => (item.userId === payload.userId ? serverAlumnus : item)));
        })
        .catch((error) => {
          console.warn('Failed to persist alumni profile', error);
        });
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
    void saveAlumnus(created)
      .then((serverAlumnus) => {
        setMockAlumni((prev) => prev.map((item) => (item.userId === payload.userId ? serverAlumnus : item)));
      })
      .catch((error) => {
        console.warn('Failed to persist alumni profile', error);
      });
    return created;
  };

  const createMasterClass = (payload: Partial<Masterclass>): Masterclass => {
    const instructorInstrument = user?.instruments?.[0]?.instrument || payload.instrument || 'General';
    const created: Masterclass = {
      id: payload.id || ('mc-' + Date.now()),
      conservatoriumId: payload.conservatoriumId || user?.conservatoriumId || 'cons-15',
      title: payload.title || { he: payload.instrument || 'Master class', en: payload.instrument || 'Master Class' },
      description: payload.description || { he: 'Description will be added soon', en: 'Description will be added soon' },
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
    void createMasterClassAction(created)
      .then((serverMasterClass) => {
        setMockMasterclasses((prev) => prev.map((item) => (item.id === created.id ? serverMasterClass : item)));
      })
      .catch((error) => {
        console.warn('Failed to persist master class', error);
      });
    return created;
  };

  const publishMasterClass = (masterClassId: string) => {
    setMockMasterclasses((prev) => prev.map((item) =>
      item.id === masterClassId ? { ...item, status: 'published' } : item
    ));
    void publishMasterClassAction(masterClassId)
      .then((serverMasterClass) => {
        setMockMasterclasses((prev) => prev.map((item) => (item.id === masterClassId ? serverMasterClass : item)));
      })
      .catch((error) => {
        console.warn('Failed to publish master class', error);
      });
  };

  const registerToMasterClass = async (masterClassId: string, studentId: string) => {
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
    const optimisticResult = { success: true, chargedILS: 0, remaining: nextAllowance };
    try {
      const serverResult = await registerToMasterClassAction({
        masterClassId,
        studentId,
        allowances: mockMasterClassAllowances,
      });
      if (!serverResult.success) {
        console.warn('Master class registration rejected by server', serverResult.reason);
        return serverResult;
      }
      setMockMasterclasses((prev) => prev.map((item) =>
        item.id === masterClassId ? serverResult.masterClass : item
      ));
      setMockMasterClassAllowances(serverResult.allowances);
      return { success: true, chargedILS: serverResult.chargedILS, remaining: serverResult.remaining };
    } catch (error) {
      console.warn('Failed to persist master class registration', error);
      return optimisticResult;
    }
  };
  const addBranch = (branchData: Partial<Branch>) => {
    const newBranch: Branch = {
      id: branchData.id || `branch-${Date.now()}`,
      conservatoriumId: branchData.conservatoriumId || user?.conservatoriumId || 'cons-15',
      name: branchData.name || 'Branch',
      address: branchData.address || '',
    };
    setMockBranches(prev => [...prev, newBranch]);

    void createBranchAction(newBranch)
      .then((saved) => {
        setMockBranches(prev => prev.map(item => (item.id === newBranch.id ? saved : item)));
      })
      .catch((error) => {
        console.warn('Failed to persist branch', error);
      });
  };

  const updateBranch = (updatedBranch: Branch) => {
    setMockBranches(prev => prev.map(b => b.id === updatedBranch.id ? updatedBranch : b));

    void updateBranchAction(updatedBranch)
      .then((saved) => {
        setMockBranches(prev => prev.map(item => (item.id === saved.id ? saved : item)));
      })
      .catch((error) => {
        console.warn('Failed to persist branch update, retrying as create', error);
        void createBranchAction({ ...updatedBranch, id: updatedBranch.id })
          .then((saved) => {
            setMockBranches(prev => prev.map(item => (item.id === updatedBranch.id ? saved : item)));
          })
          .catch((createError) => {
            console.warn('Failed to create branch during update fallback', createError);
          });
      });
  };

  const addConservatoriumInstrument = (instrumentData: Partial<ConservatoriumInstrument>) => {
    const newInstrument: ConservatoriumInstrument = {
      id: instrumentData.id || `cons-inst-${Date.now()}`,
      conservatoriumId: instrumentData.conservatoriumId || user?.conservatoriumId || 'cons-15',
      instrumentCatalogId: instrumentData.instrumentCatalogId,
      names: instrumentData.names || { he: '', en: '' },
      isActive: instrumentData.isActive ?? true,
      teacherCount: instrumentData.teacherCount ?? 0,
      availableForRegistration: instrumentData.availableForRegistration ?? true,
      availableForRental: instrumentData.availableForRental ?? true,
    };
    setConservatoriumInstruments(prev => [...prev, newInstrument]);

    void createConservatoriumInstrumentAction(newInstrument)
      .then((saved) => {
        setConservatoriumInstruments(prev => prev.map(item => (item.id === newInstrument.id ? saved : item)));
      })
      .catch((error) => {
        console.warn('Failed to persist conservatorium instrument', error);
      });
  };

  const updateConservatoriumInstrument = (instrumentId: string, instrumentData: Partial<ConservatoriumInstrument>) => {
    setConservatoriumInstruments(prev => prev.map(item => item.id === instrumentId ? { ...item, ...instrumentData } : item));

    const snapshot = conservatoriumInstruments.find((item) => item.id === instrumentId);
    if (!snapshot) return;

    void updateConservatoriumInstrumentAction({ ...snapshot, ...instrumentData, id: instrumentId })
      .then((saved) => {
        setConservatoriumInstruments(prev => prev.map(item => (item.id === instrumentId ? saved : item)));
      })
      .catch((error) => {
        console.warn('Failed to persist conservatorium instrument update, retrying as create', error);
        void createConservatoriumInstrumentAction({ ...snapshot, ...instrumentData, id: instrumentId })
          .then((saved) => {
            setConservatoriumInstruments(prev => prev.map(item => (item.id === instrumentId ? saved : item)));
          })
          .catch((createError) => {
            console.warn('Failed to create conservatorium instrument during update fallback', createError);
          });
      });
  };

  const deleteConservatoriumInstrument = (instrumentId: string) => {
    setConservatoriumInstruments(prev => prev.filter(item => item.id !== instrumentId));

    void deleteConservatoriumInstrumentAction(instrumentId)
      .catch((error) => {
        console.warn('Failed to delete conservatorium instrument', error);
      });
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
      conservatoriumInstrumentIds: packageData.conservatoriumInstrumentIds,
      instrumentCatalogIds: packageData.instrumentCatalogIds,
      notes: packageData.notes,
    };
    setLessonPackages(prev => [...prev, newPackage]);

    void createLessonPackageAction(newPackage)
      .then((saved) => {
        setLessonPackages(prev => prev.map(item => (item.id === newPackage.id ? saved : item)));
      })
      .catch((error) => {
        console.warn('Failed to persist lesson package', error);
      });
  };

  const updateLessonPackage = (packageId: string, packageData: Partial<LessonPackage>) => {
    setLessonPackages(prev => prev.map(item => item.id === packageId ? { ...item, ...packageData } : item));

    const snapshot = lessonPackages.find((item) => item.id === packageId);
    if (!snapshot) return;

    void updateLessonPackageAction({ ...snapshot, ...packageData, id: packageId })
      .then((saved) => {
        setLessonPackages(prev => prev.map(item => (item.id === packageId ? saved : item)));
      })
      .catch((error) => {
        console.warn('Failed to persist lesson package update, retrying as create', error);
        void createLessonPackageAction({ ...snapshot, ...packageData, id: packageId })
          .then((saved) => {
            setLessonPackages(prev => prev.map(item => (item.id === packageId ? saved : item)));
          })
          .catch((createError) => {
            console.warn('Failed to create lesson package during update fallback', createError);
          });
      });
  };

  const deleteLessonPackage = (packageId: string) => {
    setLessonPackages(prev => prev.filter(item => item.id !== packageId));

    void deleteLessonPackageAction(packageId)
      .catch((error) => {
        console.warn('Failed to delete lesson package', error);
      });
  };

  const addRoom = (roomData: Partial<Room>) => {
    const newRoom: Room = {
      id: roomData.id || `room-${Date.now()}`,
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

    void createRoomAction(newRoom)
      .then((saved) => {
        setMockRooms(prev => prev.map(item => (item.id === newRoom.id ? saved : item)));
      })
      .catch((error) => {
        console.warn('Failed to persist room', error);
      });
  };

  const updateRoom = (roomId: string, roomData: Partial<Room>) => {
    setMockRooms(prev => prev.map(r => r.id === roomId ? { ...r, ...roomData } : r));
    toast({ title: 'Room details updated' });

    const snapshot = mockRooms.find((room) => room.id === roomId);
    if (!snapshot) return;

    void updateRoomAction({ ...snapshot, ...roomData, id: roomId })
      .then((saved) => {
        setMockRooms(prev => prev.map(item => (item.id === roomId ? saved : item)));
      })
      .catch((error) => {
        console.warn('Failed to persist room update, retrying as create', error);
        void createRoomAction({ ...snapshot, ...roomData, id: roomId })
          .then((saved) => {
            setMockRooms(prev => prev.map(item => (item.id === roomId ? saved : item)));
          })
          .catch((createError) => {
            console.warn('Failed to create room during update fallback', createError);
          });
      });
  };

  const deleteRoom = (roomId: string) => {
    setMockRooms(prev => prev.filter(r => r.id !== roomId));
    toast({ title: 'Room deleted' });

    void deleteRoomAction(roomId)
      .catch((error) => {
        console.warn('Failed to delete room', error);
      });
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

  const addComposition = (data: Partial<Composition>) => {
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
  };

  const updateComposition = (compositionId: string, data: Partial<Composition>) => {
    setMockRepertoire(prev => prev.map(c => c.id === compositionId ? {
      ...c,
      ...data,
      composer: data.composerNames?.he || data.composer || c.composer,
      title: data.titles?.he || data.title || c.title,
    } : c));
  };

  const deleteComposition = (compositionId: string) => {
    setMockRepertoire(prev => prev.filter(c => c.id !== compositionId));
  };

  const contextValue = useMemo(() => ({
    user,
    users,
    mockFormSubmissions,
    formSubmissions: mockFormSubmissions,
    compositions: mockRepertoire,
    mockLessons,
    lessons: mockLessons,
    mockPackages,
    packages: mockPackages,
    mockInvoices,
    invoices: mockInvoices,
    mockPracticeLogs,
    practiceLogs: mockPracticeLogs,
    mockAssignedRepertoire,
    assignedRepertoire: mockAssignedRepertoire,
    mockLessonNotes,
    lessonNotes: mockLessonNotes,
    mockMessageThreads,
    messageThreads: mockMessageThreads,
    mockProgressReports,
    progressReports: mockProgressReports,
    mockAnnouncements,
    announcements: mockAnnouncements,
    mockFormTemplates,
    formTemplates: mockFormTemplates,
    mockAuditLog,
    auditLog: mockAuditLog,
    mockPlayingSchoolInvoices,
    playingSchoolInvoices: mockPlayingSchoolInvoices,
    mockEvents,
    events: mockEvents,
    mockInstrumentInventory,
    instrumentInventory: mockInstrumentInventory,
    mockInstrumentRentals,
    instrumentRentals: mockInstrumentRentals,
    mockPerformanceBookings,
    performanceBookings: mockPerformanceBookings,
    mockScholarshipApplications,
    scholarshipApplications: mockScholarshipApplications,
    mockDonationCauses,
    donationCauses: mockDonationCauses,
    mockDonations,
    donations: mockDonations,
    mockOpenDayEvents,
    openDayEvents: mockOpenDayEvents,
    mockOpenDayAppointments,
    openDayAppointments: mockOpenDayAppointments,
    mockPracticeVideos,
    practiceVideos: mockPracticeVideos,
    mockAlumni,
    alumni: mockAlumni,
    mockMasterclasses,
    masterClasses: mockMasterclasses,
    mockMasterClassAllowances,
    masterClassAllowances: mockMasterClassAllowances,
    mockMakeupCredits,
    makeupCredits: mockMakeupCredits,
    mockRepertoire,
    repertoire: mockRepertoire,
    conservatoriums,
    conservatoriumInstruments,
    lessonPackages,
    mockBranches,
    branches: mockBranches,
    mockWaitlist,
    waitlist: mockWaitlist,
    mockPayrolls,
    payrolls: mockPayrolls,
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
    offerSlotToWaitlisted,
    acceptWaitlistOffer,
    declineWaitlistOffer,
    expireWaitlistOffers,
    revokeWaitlistOffer,
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
    rooms: mockRooms,
    addRoom,
    updateRoom,
    deleteRoom,
    updateNotificationPreferences,
    updateUserPaymentMethod,
    assignRepertoire,
    updatePayrollStatus,
    addComposition,
    updateComposition,
    deleteComposition,
    updateEvent,
    updateEventStatus,
    bookEventTickets,
    mockTeacherRatings,
    submitTeacherRating,
    getTeacherRating,
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [
    user, users, mockFormSubmissions, mockLessons, mockPackages, mockInvoices,
    mockPracticeLogs, mockAssignedRepertoire, mockLessonNotes, mockMessageThreads,
    mockProgressReports, mockAnnouncements, mockFormTemplates, mockAuditLog,
    mockPlayingSchoolInvoices, mockEvents, mockInstrumentInventory, mockInstrumentRentals,
    mockPerformanceBookings, mockScholarshipApplications, mockDonationCauses, mockDonations, mockOpenDayEvents,
    mockOpenDayAppointments, mockPracticeVideos, mockAlumni, mockMasterclasses, mockMasterClassAllowances,
    mockMakeupCredits, mockRepertoire, conservatoriums, conservatoriumInstruments, lessonPackages, mockBranches,
    mockWaitlist, mockPayrolls, newFeaturesEnabled, isLoading, mockRooms, mockTeacherRatings
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















