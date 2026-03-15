'use client';
import React, { createContext, useContext, useEffect, useMemo, useRef, useSyncExternalStore } from 'react';
import { AuthDomainProvider, useAuthDomain } from '@/hooks/domains/auth-domain';
import { UsersDomainProvider, useUsersDomain } from '@/hooks/domains/users-domain';
import { LessonsDomainProvider, useLessonsDomain } from '@/hooks/domains/lessons-domain';
import { RepertoireDomainProvider, useRepertoireDomain } from '@/hooks/domains/repertoire-domain';
import { CommsDomainProvider, useCommsDomain } from '@/hooks/domains/comms-domain';
import { InstrumentsDomainProvider, useInstrumentsDomain } from '@/hooks/domains/instruments-domain';
import { EventsDomainProvider, useEventsDomain } from '@/hooks/domains/events-domain';
import { AdminDomainProvider, useAdminDomain } from '@/hooks/domains/admin-domain';
import type { User, FormSubmission, Conservatorium, Package, LessonPackage, ConservatoriumInstrument, LessonSlot, Invoice, PracticeLog, Composition, AssignedRepertoire, LessonNote, RepertoireStatus, MessageThread, ProgressReport, Announcement, Room, PayrollSummary, PracticeVideo, WaitlistEntry, FormTemplate, AuditLogEntry, SlotStatus, NotificationPreferences, AchievementType, EventProduction, EventProductionStatus, InstrumentInventory, PerformanceBooking, PerformanceBookingStatus, PerformanceAssignment, ScholarshipApplication, OpenDayEvent, OpenDayAppointment, Branch, WaitlistStatus, PayrollStatus, Alumnus, Masterclass, MakeupCredit, PlayingSchoolInvoice, DonationCause, DonationRecord, DonationCauseCategory, InstrumentRental, RentalModel, RentalCondition, StudentMasterClassAllowance, TeacherRating } from '@/lib/types';
import { PlaceHolderImages } from '@/lib/placeholder-images';
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
  deferWaitlistOffer: (entryId: string) => void;
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
  assignMusiciansToPerformance: (bookingId: string, assignments: Pick<PerformanceAssignment, 'userId' | 'role'>[]) => void;
  updatePerformanceBookingStatus: (bookingId: string, status: PerformanceBookingStatus) => void;
  respondToPerformanceInvitation: (bookingId: string, userId: string, accept: boolean, declineReason?: string) => void;
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
 * It nests all 8 domain providers and exposes a unified AuthContext
 * for legacy consumers that have not yet been migrated to domain hooks.
 *
 * SSR safety: During server-side rendering, the provider tree is NOT rendered.
 * Instead, children are rendered directly with the SSR_AUTH_FALLBACK context.
 * This prevents useRouter/useLocale/useAuth cascading SSR failures.
 * On the client, the full provider tree mounts after hydration.
 */
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  // useSyncExternalStore with getServerSnapshot = false ensures SSR renders the
  // fallback, while the client renders the full provider tree. No useEffect needed.
  const isMounted = useSyncExternalStore(
    () => () => {},           // subscribe (noop — value never changes)
    () => true,               // getSnapshot (client: always true)
    () => false,              // getServerSnapshot (SSR: always false)
  );

  // During SSR: provide the fallback context directly
  // This avoids the domain provider cascade that fails during SSR
  if (!isMounted) {
    return (
      <AuthContext.Provider value={SSR_AUTH_FALLBACK}>
        {children}
      </AuthContext.Provider>
    );
  }

  // Client-side after mount: render the full provider tree
  return <AuthProviderClient>{children}</AuthProviderClient>;
};

const AuthProviderClient = ({ children }: { children: React.ReactNode }) => {
  const roomsRef = useRef<Room[]>([]);
  const userRef = useRef<User | null>(null);
  const conservatoriumInstrumentsRef = useRef<ConservatoriumInstrument[]>([]);
  return (
    <UsersDomainProvider>
      <AuthDomainProvider>
        <LessonsDomainProvider
          getRooms={() => roomsRef.current}
          getUser={() => userRef.current}
          getConservatoriumInstruments={() => conservatoriumInstrumentsRef.current}
        >
          <RepertoireDomainProvider>
            <CommsDomainProvider>
              <InstrumentsDomainProvider>
                <EventsDomainProvider>
                  <AdminDomainProvider
                    onRoomsChange={(rooms) => { roomsRef.current = rooms; }}
                    onConservatoriumInstrumentsChange={(instruments) => { conservatoriumInstrumentsRef.current = instruments; }}
                  >
                    <AuthProviderInner userRef={userRef}>
                      {children}
                    </AuthProviderInner>
                  </AdminDomainProvider>
                </EventsDomainProvider>
              </InstrumentsDomainProvider>
            </CommsDomainProvider>
          </RepertoireDomainProvider>
        </LessonsDomainProvider>
      </AuthDomainProvider>
    </UsersDomainProvider>
  );
};

function AuthProviderInner({
  children,
  userRef,
}: {
  children: React.ReactNode;
  userRef: React.RefObject<User | null>;
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

  const {
    mockLessons,
    setMockLessons,
    mockMakeupCredits,
    setMockMakeupCredits,
    addLesson,
    cancelLesson,
    rescheduleLesson,
    getMakeupCreditBalance,
    getMakeupCreditsDetail,
    updateLessonStatus,
    assignSubstitute,
    reportSickLeave,
  } = useLessonsDomain();

  const {
    mockAssignedRepertoire,
    setMockAssignedRepertoire,
    mockRepertoire,
    setMockRepertoire,
    mockPracticeLogs,
    setMockPracticeLogs,
    mockLessonNotes,
    setMockLessonNotes,
    mockProgressReports,
    setMockProgressReports,
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
  } = useRepertoireDomain();

  const {
    mockMessageThreads,
    setMockMessageThreads,
    mockAnnouncements,
    setMockAnnouncements,
    mockFormSubmissions,
    setMockFormSubmissions,
    mockFormTemplates,
    setMockFormTemplates,
    mockAuditLog,
    setMockAuditLog,
    addMessage,
    createMessageThread,
    addAnnouncement,
    updateForm,
    addFormTemplate,
  } = useCommsDomain();

  const {
    mockInstrumentInventory,
    setMockInstrumentInventory,
    mockInstrumentRentals,
    setMockInstrumentRentals,
    mockPracticeVideos,
    setMockPracticeVideos,
    addInstrument,
    updateInstrument,
    deleteInstrument,
    assignInstrumentToStudent,
    initiateInstrumentRental,
    getRentalByToken,
    confirmRentalSignature,
    returnInstrument,
    markInstrumentRentalReturned,
    addPracticeVideo,
    addVideoFeedback,
  } = useInstrumentsDomain();

  const {
    mockEvents,
    setMockEvents,
    mockPerformanceBookings,
    setMockPerformanceBookings,
    mockMasterclasses,
    setMockMasterclasses,
    mockMasterClassAllowances,
    setMockMasterClassAllowances,
    mockOpenDayEvents,
    setMockOpenDayEvents,
    mockOpenDayAppointments,
    setMockOpenDayAppointments,
    mockAlumni,
    setMockAlumni,
    addEvent,
    updateEvent,
    updateEventStatus,
    bookEventTickets,
    addPerformanceToEvent,
    removePerformanceFromEvent,
    assignMusiciansToPerformance,
    updatePerformanceBookingStatus,
    respondToPerformanceInvitation,
    addPerformanceBooking,
    createMasterClass,
    publishMasterClass,
    registerToMasterClass,
    addOpenDayAppointment,
    graduateStudent,
    upsertAlumniProfile,
  } = useEventsDomain();

  const {
    conservatoriums,
    setConservatoriums,
    conservatoriumInstruments,
    setConservatoriumInstruments,
    lessonPackages,
    setLessonPackages,
    mockBranches,
    setMockBranches,
    mockRooms,
    setMockRooms,
    mockWaitlist,
    setMockWaitlist,
    mockPayrolls,
    setMockPayrolls,
    mockPackages,
    setMockPackages,
    mockInvoices,
    setMockInvoices,
    mockPlayingSchoolInvoices,
    setMockPlayingSchoolInvoices,
    mockScholarshipApplications,
    setMockScholarshipApplications,
    mockDonationCauses,
    setMockDonationCauses,
    mockDonations,
    setMockDonations,
    updateConservatorium,
    addBranch,
    updateBranch,
    addConservatoriumInstrument,
    updateConservatoriumInstrument,
    deleteConservatoriumInstrument,
    addLessonPackage,
    updateLessonPackage,
    deleteLessonPackage,
    addRoom,
    updateRoom,
    deleteRoom,
    addToWaitlist,
    updateWaitlistStatus,
    offerSlotToWaitlisted,
    acceptWaitlistOffer,
    declineWaitlistOffer,
    deferWaitlistOffer,
    expireWaitlistOffers,
    revokeWaitlistOffer,
    updatePayrollStatus,
    addScholarshipApplication,
    updateScholarshipStatus,
    markScholarshipAsPaid,
    addDonationCause,
    recordDonation,
  } = useAdminDomain();

  // Keep users-domain in sync with the current session user so that updateUser,
  // markWalkthroughAsSeen etc. can update localStorage / auth cookie correctly.
  useEffect(() => {
    registerAuthSetters(user, setUser);
  }, [user, setUser, registerAuthSetters]);

  // Keep userRef in sync so LessonsDomainProvider getter callbacks always return the latest user
  useEffect(() => { userRef.current = user; }, [user, userRef]);
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (bootstrapResolved) setIsLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bootstrapResolved]);

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
    deferWaitlistOffer,
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
    respondToPerformanceInvitation,
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
}

// Safe SSR fallback — all arrays empty, all functions are noops, isLoading: true.
// This prevents "useAuth must be used within an AuthProvider" errors during SSR
// where the AuthProvider has not yet mounted. Client hydration replaces this immediately.
const noop = () => {};
const noopReturn = <T,>(v: T) => v;
const SSR_AUTH_FALLBACK: AuthContextType = {
  user: null,
  users: [],
  mockFormSubmissions: [],
  formSubmissions: [],
  compositions: [],
  mockLessons: [],
  lessons: [],
  mockPackages: [],
  packages: [],
  mockInvoices: [],
  invoices: [],
  mockPracticeLogs: [],
  practiceLogs: [],
  mockAssignedRepertoire: [],
  assignedRepertoire: [],
  mockLessonNotes: [],
  lessonNotes: [],
  mockMessageThreads: [],
  messageThreads: [],
  mockProgressReports: [],
  progressReports: [],
  mockAnnouncements: [],
  announcements: [],
  mockFormTemplates: [],
  formTemplates: [],
  mockAuditLog: [],
  auditLog: [],
  mockPlayingSchoolInvoices: [],
  playingSchoolInvoices: [],
  mockEvents: [],
  events: [],
  mockInstrumentInventory: [],
  instrumentInventory: [],
  mockInstrumentRentals: [],
  instrumentRentals: [],
  mockPerformanceBookings: [],
  performanceBookings: [],
  mockScholarshipApplications: [],
  scholarshipApplications: [],
  mockDonationCauses: [],
  donationCauses: [],
  mockDonations: [],
  donations: [],
  mockOpenDayEvents: [],
  openDayEvents: [],
  mockOpenDayAppointments: [],
  openDayAppointments: [],
  mockPracticeVideos: [],
  practiceVideos: [],
  mockAlumni: [],
  alumni: [],
  mockMasterclasses: [],
  masterClasses: [],
  mockMasterClassAllowances: [],
  masterClassAllowances: [],
  mockMakeupCredits: [],
  makeupCredits: [],
  mockRepertoire: [],
  repertoire: [],
  conservatoriums: [],
  conservatoriumInstruments: [],
  lessonPackages: [],
  mockBranches: [],
  branches: [],
  mockWaitlist: [],
  waitlist: [],
  mockPayrolls: [],
  payrolls: [],
  mockRooms: [],
  rooms: [],
  mockTeacherRatings: [],
  newFeaturesEnabled: false,
  isLoading: true,
  login: () => ({ user: null, status: 'not_found' }),
  logout: noop,
  approveUser: noop,
  rejectUser: noop,
  updateForm: noop,
  updateUser: noop,
  addLesson: noop,
  cancelLesson: noop,
  rescheduleLesson: noop,
  getMakeupCreditBalance: () => 0,
  getMakeupCreditsDetail: () => [],
  addPracticeLog: noop,
  updateRepertoireStatus: noop,
  addLessonNote: noop,
  updateUserPracticeGoal: noop,
  addProgressReport: noop,
  addMessage: noop,
  createMessageThread: () => '',
  addAnnouncement: noop,
  assignSubstitute: noop,
  reportSickLeave: () => [],
  updateLessonStatus: noop,
  addToWaitlist: noop,
  updateWaitlistStatus: noop,
  offerSlotToWaitlisted: noop,
  acceptWaitlistOffer: noop,
  declineWaitlistOffer: noop,
  deferWaitlistOffer: noop,
  expireWaitlistOffers: noop,
  revokeWaitlistOffer: noop,
  addFormTemplate: noop,
  updateConservatorium: noop,
  addEvent: noop,
  addPerformanceToEvent: noop,
  removePerformanceFromEvent: noop,
  assignInstrumentToStudent: noop,
  initiateInstrumentRental: () => ({ rentalId: '', signingToken: '', signingLink: '' }),
  getRentalByToken: () => undefined,
  confirmRentalSignature: () => ({ success: false }),
  returnInstrument: noop,
  markInstrumentRentalReturned: () => ({ success: false, refundAmountILS: 0 }),
  addInstrument: noop,
  updateInstrument: noop,
  deleteInstrument: noop,
  addPracticeVideo: noop,
  addVideoFeedback: noop,
  assignMusiciansToPerformance: noop,
  updatePerformanceBookingStatus: noop,
  respondToPerformanceInvitation: noop,
  addPerformanceBooking: noop,
  addScholarshipApplication: noop,
  updateScholarshipStatus: noop,
  markScholarshipAsPaid: noop,
  addDonationCause: noopReturn as AuthContextType['addDonationCause'],
  recordDonation: noopReturn as AuthContextType['recordDonation'],
  addOpenDayAppointment: noop,
  graduateStudent: noop,
  upsertAlumniProfile: noopReturn as AuthContextType['upsertAlumniProfile'],
  createMasterClass: noopReturn as AuthContextType['createMasterClass'],
  publishMasterClass: noop,
  registerToMasterClass: async () => ({ success: false }),
  markWalkthroughAsSeen: noop,
  addUser: noopReturn as AuthContextType['addUser'],
  addBranch: noop,
  updateBranch: noop,
  addConservatoriumInstrument: noop,
  updateConservatoriumInstrument: noop,
  deleteConservatoriumInstrument: noop,
  addComposition: noop,
  updateComposition: noop,
  deleteComposition: noop,
  addLessonPackage: noop,
  updateLessonPackage: noop,
  deleteLessonPackage: noop,
  addRoom: noop,
  updateRoom: noop,
  deleteRoom: noop,
  updateNotificationPreferences: noop,
  updateUserPaymentMethod: noop,
  assignRepertoire: noop,
  awardAchievement: noop,
  updatePayrollStatus: noop,
  updateEvent: noop,
  updateEventStatus: noop,
  bookEventTickets: () => ({ success: false, totalAmount: 0 }),
  submitTeacherRating: noop,
  getTeacherRating: () => ({ avg: 0, count: 0 }),
};

/**
 * Custom hook to access the AuthContext.
 * @returns The authentication context.
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    // During SSR, AuthProvider may not be mounted yet.
    // Return a loading state instead of throwing so SSR doesn't crash.
    if (typeof window === 'undefined') {
      return SSR_AUTH_FALLBACK;
    }
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};











