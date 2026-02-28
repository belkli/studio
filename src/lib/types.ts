
import type { User as AuthUser } from 'firebase/auth';

export type UserRole = 'student' | 'teacher' | 'parent' | 'conservatorium_admin' | 'site_admin' | 'ministry_director' | 'admin' | 'superadmin' | 'school_coordinator'; // SDD-PS

export type InstrumentInfo = {
  instrument: string;
  teacherName: string;
  yearsOfStudy: number;
};

export type Notification = {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  link: string;
  read: boolean;
};

export type Alumnus = {
  id: string;
  name: string;
  avatarUrl?: string;
  graduationYear: number;
  instrument: string;
  currentRole: string;
  achievements?: string;
};

export type Masterclass = {
  id: string;
  title: string;
  instructor: string;
  date: string;
  price: number;
};

// From SDD-07
export type Channel = 'IN_APP' | 'EMAIL' | 'SMS' | 'WHATSAPP';

export type NotificationType =
  | 'lessonReminders'
  | 'lessonCancellation'
  | 'makeupCredits'
  | 'paymentDue'
  | 'formStatusChanges'
  | 'teacherMessages'
  | 'systemAnnouncements';

export type NotificationPreferences = {
  preferences: Record<NotificationType, Channel[]>;
  quietHours: {
    enabled: boolean;
    startTime: string; // "HH:mm"
    endTime: string; // "HH:mm"
  };
  language: 'HE' | 'EN' | 'AR' | 'RU';
}

// From SDD-03
export type TeacherSpecialty = 'EXAM_PREP' | 'EARLY_CHILDHOOD' | 'PERFORMANCE' | 'JAZZ' | 'THEORY' | 'SPECIAL_NEEDS' | 'BEGINNER_ADULTS' | 'COMPETITION' | 'ENSEMBLE';
export type Language = 'HE' | 'EN' | 'AR' | 'RU';
export type DayOfWeek = 'SUN' | 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT';
export type TimeRange = 'MORNING' | 'AFTERNOON' | 'EVENING';

export type WeeklyAvailabilityBlock = {
  dayOfWeek: DayOfWeek;
  startTime: string; // "HH:mm"
  endTime: string; // "HH:mm"
};

// From SDD-14B: Student Achievement & Certificate System
export type AchievementType =
  // Practice milestones
  | 'PRACTICE_STREAK_7'          // 7 consecutive days logged
  | 'PRACTICE_STREAK_30'         // 30 consecutive days
  | 'TOTAL_HOURS_10'             // 10 cumulative practice hours
  | 'TOTAL_HOURS_50'             // 50 cumulative hours
  | 'TOTAL_HOURS_100'            // 100 cumulative hours — "Century Club"
  // Repertoire milestones
  | 'PIECE_COMPLETED'            // Any piece marked COMPLETED
  | 'PIECES_COMPLETED_5'         // 5 pieces in lifetime
  | 'PERFORMANCE_READY'          // First piece marked PERFORMANCE_READY
  // Enrollment milestones
  | 'YEARS_ENROLLED_1'           // 1 year since first lesson
  | 'YEARS_ENROLLED_3'           // 3 years
  | 'FIRST_RECITAL'              // Performed in any recital
  | 'FIRST_LESSON'               // Attended first lesson
  // Engagement
  | 'FORM_SUBMITTED'             // First form submitted
  | 'EXAM_REGISTERED'            // First exam registration
  | 'EXAM_PASSED';               // Ministry exam passed

export type Achievement = {
  id: string;
  type: AchievementType;
  title: string;
  titleHe: string;               // Hebrew title
  description: string;
  icon: string;                  // emoji or icon name
  achievedAt: string;            // ISO Timestamp
  sharedAt?: string;             // if student chose to share
  points: number;                // for leaderboard / level calculation
  certificateUrl?: string;
};

// From SDD-13
export type PerformanceGenre = 'CLASSICAL' | 'JAZZ' | 'KLEZMER' | 'MIDDLE_EASTERN' | 'POPULAR' | 'LITURGICAL' | 'FILM_MUSIC';
export type EnsembleRole = 'LEAD_VIOLIN' | 'ACCOMPANIST' | 'SECTION_PLAYER';

export type RepertoireHighlight = {
  title: string;
  composer: string;
  occasion?: string;
};

export type MediaLink = {
  title: string;
  url: string;
  thumbnailUrl?: string;
  occasion?: string;
};

export type PerformanceProfile = {
  isOptedIn?: boolean;
  adminApproved?: boolean;
  headline?: string;
  performanceBio?: string;
  performanceGenres?: PerformanceGenre[];
  repertoireHighlights?: RepertoireHighlight[];
  videoLinks?: MediaLink[];
  audioLinks?: MediaLink[];
  performanceRatePerHour?: number;
  travelRadiusKm?: number;
  canPerformSolo?: boolean;
  canPerformChamber?: boolean;
  ensembleRoles?: EnsembleRole[];
};

export type PaymentMethod = {
  id: string;
  type: 'CreditCard';
  last4: string;
  expiryMonth: number;
  expiryYear: number;
  isPrimary: boolean;
};

export type User = {
  id: string;
  name: string;
  email: string;
  idNumber?: string;
  role: UserRole;
  conservatoriumId: string;
  conservatoriumName: string;
  branchId?: string;
  conservatoriumStudyYears?: number;
  instruments?: InstrumentInfo[];
  avatarUrl?: string;
  schoolName?: string;
  schoolSymbol?: string;
  birthDate?: string;
  enrollmentDate?: string;
  gender?: 'זכר' | 'נקבה';
  city?: string;
  phone?: string;
  approved: boolean;
  rejectionReason?: string;
  notifications?: Notification[];
  // New fields from SDDs
  dateOfBirth?: string; // ISO Date
  parentId?: string;    // Link to parent user
  childIds?: string[];  // Link to child users
  students?: string[]; // For teachers/admins to list their students by ID
  grade?: 'א' | 'ב' | 'ג' | 'ד' | 'ה' | 'ו' | 'ז' | 'ח' | 'ט' | 'י' | 'יא' | 'יב';
  // Teacher-specific fields from SDD-03 & SDD-13
  bio?: string;
  specialties?: TeacherSpecialty[];
  teachingLanguages?: Language[];
  availability?: WeeklyAvailabilityBlock[];
  maxStudents?: number;
  employmentType?: 'EMPLOYEE' | 'FREELANCE';
  ratePerDuration?: {
    '30': number;
    '45': number;
    '60': number;
  };
  performanceProfile?: PerformanceProfile;
  // Student-specific fields from SDD-09
  weeklyPracticeGoal?: number;
  packageId?: string;
  notificationPreferences?: NotificationPreferences;
  achievements?: Achievement[];
  hasSeenWalkthrough?: boolean;
  isRegistered?: boolean;
  paymentMethods?: PaymentMethod[];
  gamification?: {
    currentStreak: number;
    points: number;
  };
};

export type PricingConfig = {
  baseRatePerLesson: {
    '30': number;
    '45': number;
    '60': number;
  };
  discounts: {
    pack5: number;
    pack10: number;
    yearly: number;
    sibling: number;
  };
  adHocPremium: number; // as a percentage, e.g. 15 for 15%
  trialPrice: number;
};

export type CancellationPolicy = {
  studentNoticeHoursRequired: number;
  studentCancellationCredit: 'FULL' | 'NONE'; // For on-time cancellations
  studentLateCancelCredit: 'FULL' | 'NONE';   // For late cancellations
  noShowCredit: 'NONE'; // Usually NONE
  makeupCreditExpiryDays: number;
  maxMakeupsPerTerm: number;
};

// --- Public-facing conservatorium profile supporting types ---
export type SocialMediaLinks = {
  facebook?: string;
  instagram?: string;
  youtube?: string;
  tiktok?: string;
  whatsapp?: string;
};

export type ConservatoriumDepartment = {
  name: string;
  nameEn?: string;
  headTeacher?: string;
  link?: string;
  photoUrl?: string;
};

export type ConservatoriumStaffMember = {
  name: string;
  role?: string;
  bio?: string;
  photoUrl?: string;
};

/** A teacher's opt-in public profile shown in the conservatorium directory */
export type TeacherDirectoryProfile = {
  id: string;
  name: string;
  role?: string;
  bio?: string;
  photoUrl?: string;
  instruments?: string[];
};

export type ConservatoriumLocation = {
  city: string;
  cityEn?: string;
  address?: string;
  coordinates?: { lat: number; lng: number };
  branches?: string[]; // Location-level branch descriptions
};

export type ConservatoriumBranchInfo = {
  name: string;
  address?: string;
  tel?: string;
  email?: string;
  manager?: string;
};

export type ConservatoriumTranslations = {
  [locale: string]: {
    about?: string;
    openingHours?: string;
    departments?: { name: string }[];
    programs?: string[];
    manager?: { bio?: string };
  };
};

export type Conservatorium = {
  id: string;
  name: string;
  nameEn?: string;
  tier: 'A' | 'B' | 'C';
  stampUrl?: string;
  newFeaturesEnabled?: boolean;
  aiAgentsConfig?: Record<string, boolean>;
  pricingConfig?: PricingConfig;
  cancellationPolicy?: CancellationPolicy;
  // --- Public profile fields (admin-editable, displayed on About/Contact pages) ---
  about?: string;
  email?: string;
  secondaryEmail?: string;
  tel?: string;
  officialSite?: string;
  openingHours?: string;
  foundedYear?: number;
  location?: ConservatoriumLocation;
  manager?: ConservatoriumStaffMember;
  pedagogicalCoordinator?: ConservatoriumStaffMember;
  departments?: ConservatoriumDepartment[];
  branchesInfo?: ConservatoriumBranchInfo[];
  teachers?: TeacherDirectoryProfile[];
  programs?: string[];
  ensembles?: string[];
  socialMedia?: SocialMediaLinks;
  photoUrls?: string[];
  translations?: ConservatoriumTranslations;
};

export type FormStatus = 'טיוטה' | 'ממתין לאישור מורה' | 'ממתין לאישור מנהל' | 'מאושר' | 'נדחה' | 'נדרש תיקון' | 'מאושר סופית';

export type Composition = {
  id?: string;
  composer: string;
  title: string;
  duration: string; // MM:SS, for the entire piece
  genre: string;
  instrument?: string;
  approved?: boolean;
  source?: 'seed' | 'user_submitted' | 'api';
};

// New detailed types based on the image and SDDs
export type RecitalApplicantDetails = {
  gender?: string;
  city?: string;
  phone?: string;
  birthDate?: string;
};

export type SchoolDetails = {
  schoolName?: string;
  schoolSymbol?: string;
  hasMusicMajor?: boolean;
  isMajorParticipant?: boolean;
  plansTheoryExam?: boolean;
  schoolEmail?: string;
};

export type MainInstrumentDetails = {
  instrument?: string;
  yearsOfStudy?: number;
  recitalField?: string; // e.g. classical, jazz
  previousOrOtherInstrument?: string;
};

export type TeacherDetails = {
  name?: string;
  idNumber?: string;
  email?: string;
  yearsWithTeacher?: number;
};

export type AdditionalMusicDetails = {
  ensembleParticipation?: string;
  theoryStudyYears?: number;
  orchestraParticipation?: string;
};

export type PreviousRepertoire = {
  piece: string;
  composer: string;
  scope: string; // היקף הביצוע
  performedByHeart: boolean; // נוגן בע"פ
};


export type FormSubmission = {
  id: string;
  formType: string;
  academicYear?: string;
  grade?: 'י' | 'יא' | 'יב';
  conservatoriumName?: string;
  conservatoriumManagerName?: string;
  conservatoriumManagerPhone?: string;
  conservatoriumManagerEmail?: string;
  conservatoriumId?: string;

  studentId: string;
  studentName: string;

  applicantDetails?: RecitalApplicantDetails;
  schoolDetails?: SchoolDetails;
  instrumentDetails?: MainInstrumentDetails;
  teacherDetails?: TeacherDetails;
  additionalMusicDetails?: AdditionalMusicDetails;
  previousRepertoire?: PreviousRepertoire[];

  status: FormStatus;
  submissionDate: string;
  submittedBy?: string;          // userId
  totalDuration: string;
  repertoire: Composition[];

  teacherId?: string;
  adminId?: string;
  teacherComment?: string;
  adminComment?: string;
  ministryComment?: string;
  managerNotes?: string;
  calculatedPrice?: number;
  paymentStatus?: 'pending' | 'paid' | 'waived';

  signatureUrl?: string;
  signedBy?: string;
  signedAt?: string;

  formData?: Record<string, any>;
  formTemplateId?: string;

  // Ministry approval fields (SDD-P5)
  requiresMinistryApproval?: boolean;
  ministryReviewedAt?: string;   // ISO Timestamp
  ministryReviewedByDirectorId?: string;
  ministryDirectorComment?: string;
  ministryExportedAt?: string;   // ISO Timestamp
  ministryReferenceNumber?: string;

  // Exam Registration fields
  examLevel?: string;
  examType?: string;
  preferredExamDateRange?: string;
  teacherDeclaration?: boolean;
  instrument?: string;
  eventName?: string;
  eventDate?: string;
  eventLocation?: string;
  conductor?: string;
  accompanist?: string;
  numParticipants?: number;
};

// From SDD-08: Dynamic Form Builder
export type FormFieldType = 'text' | 'textarea' | 'number' | 'date' | 'dropdown' | 'checkbox';

export type FormFieldDefinition = {
  id: string;
  label: string;
  type: FormFieldType;
  required: boolean;
  placeholder?: string;
  options?: string; // Comma-separated values for dropdown
};

export type WorkflowStepDefinition = {
  id: string;
  stepIndex: number;
  roleName: string; // e.g., "Teacher Approval"
  requiredRole: UserRole;
};

export type FormTemplate = {
  id: string;
  conservatoriumId: string;
  title: string;
  description: string;
  fields: FormFieldDefinition[];
  workflow: WorkflowStepDefinition[];
  createdAt: string; // ISO Timestamp
};


// --- New Types from SDDs ---
export type MakeupCreditReason = 'TEACHER_CANCELLATION' | 'CONSERVATORIUM_CANCELLATION' | 'STUDENT_NOTICED_CANCEL';

export type MakeupCredit = {
  id: string;
  conservatoriumId: string;
  studentId: string;
  packageId?: string;            // the package this credit belongs to
  issuedBySlotId: string;        // the cancelled lesson that triggered this credit
  issuedReason: MakeupCreditReason;
  issuedAt: string;              // ISO Timestamp
  expiresAt: string;             // issuedAt + policy.makeupCreditExpiryDays
  status: 'AVAILABLE' | 'REDEEMED' | 'EXPIRED';
  redeemedBySlotId?: string;     // the makeup lesson that consumed this credit
  redeemedAt?: string;           // ISO Timestamp
  amount: number;                // monetary value for accounting (0 if credit-only)
};

export type StudentGoal = 'EXAMS' | 'PERFORMANCE' | 'ENJOYMENT' | 'COMPETITION' | 'OTHER';

export type LessonType = 'RECURRING' | 'MAKEUP' | 'TRIAL' | 'ADHOC' | 'GROUP';
export type SlotStatus = 'SCHEDULED' | 'COMPLETED' | 'CANCELLED_STUDENT_NOTICED' | 'CANCELLED_STUDENT_NO_NOTICE' | 'CANCELLED_TEACHER' | 'CANCELLED_CONSERVATORIUM' | 'NO_SHOW_STUDENT' | 'NO_SHOW_TEACHER';

export type LessonSlot = {
  id: string;
  conservatoriumId: string;
  teacherId: string;
  studentId: string;
  instrument: string;
  startTime: string; // ISO Timestamp
  durationMinutes: 30 | 45 | 60;
  recurrenceId?: string;
  type: LessonType;
  bookingSource: 'STUDENT_SELF' | 'PARENT' | 'TEACHER' | 'ADMIN' | 'AUTO_MAKEUP';
  roomId?: string;
  branchId?: string;
  isVirtual: boolean;
  meetingLink?: string;
  packageId?: string;
  isCreditConsumed: boolean;
  makeupCreditId?: string;       // if booked with a makeup credit
  status: SlotStatus;
  attendanceMarkedAt?: string;   // ISO Timestamp
  teacherNote?: string;
  cancelledAt?: string;          // ISO Timestamp
  cancelledBy?: string;          // userId of who cancelled
  cancellationReason?: string;
  rescheduledFrom?: string;      // original start time before reschedule
  rescheduledAt?: string;        // ISO Timestamp
  googleCalendarEventId?: string; // for two-way calendar sync
  effectiveRate?: number;         // NIS rate applied at this lesson
  createdAt: string; // ISO Timestamp
  updatedAt: string; // ISO Timestamp
};

export type PackageType = 'TRIAL' | 'PACK_5' | 'PACK_10' | 'MONTHLY' | 'YEARLY' | 'ADHOC_SINGLE';
export type PaymentStatus = 'PAID' | 'PENDING' | 'FAILED';

export type Package = {
  id: string;
  studentId?: string;
  type: PackageType;
  title: string;
  description: string;
  totalCredits?: number;
  usedCredits?: number;
  price: number;
  paymentStatus?: PaymentStatus;
  validFrom?: string; // ISO Date
  validUntil?: string; // ISO Date
};

export type InvoiceStatus = 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED';

export type Invoice = {
  id: string;
  invoiceNumber: string;
  conservatoriumId: string;
  payerId: string; // Parent or adult Student
  lineItems: { description: string; total: number; }[];
  total: number;
  status: InvoiceStatus;
  dueDate: string; // ISO Date
  paidAt?: string; // ISO Date
};

export type PracticeLog = {
  id: string;
  conservatoriumId?: string;
  studentId: string;
  teacherId?: string;
  lessonSlotId?: string;         // related lesson
  date: string;                  // ISO Date — indexed for range queries
  durationMinutes: number;
  pieces?: { title: string; composerId?: string; focusArea?: string }[];
  mood?: 'GREAT' | 'OKAY' | 'HARD';
  studentNote?: string;
  notes?: string;                // alias for studentNote
  teacherComment?: string;
  teacherCommentedAt?: string;   // ISO Timestamp
  // Gamification
  pointsAwarded?: number;
  pointsEarned?: number;         // alias for pointsAwarded
  streakContribution?: boolean;  // Did this log maintain a streak?
  createdAt?: string;            // ISO Timestamp
  repertoireId?: string;
  videoAttached?: boolean;
};

export type RepertoireStatus = 'LEARNING' | 'POLISHING' | 'PERFORMANCE_READY' | 'COMPLETED';

export type AssignedRepertoire = {
  id: string;
  studentId: string;
  compositionId: string;
  status: RepertoireStatus;
  assignedAt: string; // ISO Timestamp
  completedAt?: string; // ISO Timestamp
  compositionDetails?: Composition;
};

export type TechnicalFlag = {
  flag: 'POSTURE' | 'TONE' | 'RHYTHM' | 'THEORY_GAP' | 'MOTIVATION' | 'TECHNIQUE';
  detail: string;
};

export type LessonNote = {
  id: string;
  slotId: string;
  lessonSlotId: string;          // alias for backward compatibility
  teacherId: string;
  studentId: string;
  lessonDate?: string;           // ISO Timestamp

  // Public-facing (visible to student + parent)
  lessonSummary: string;         // What we covered today
  summary: string;               // alias for backward compatibility
  homeworkAssignment?: {
    description: string;
    dueDateLessonNumber?: number;
    dueDate?: string;
    pieces: string[];
    specificFocusAreas: string[];
  };
  homeworkAssignments?: string[]; // legacy format

  // Internal (teacher-only, never exposed to student/parent role)
  studioNote?: string;           // Private pedagogical journal
  technicalFlags?: TechnicalFlag[];
  teacherMood?: 'GREAT_SESSION' | 'PRODUCTIVE' | 'CHALLENGING' | 'CONCERN';

  // Multimedia
  audioFeedbackUrl?: string;     // Firebase Storage URL
  videoFeedbackUrl?: string;
  sheetMusicAnnotationUrl?: string;

  isSharedWithStudent: boolean;
  isSharedWithParent: boolean;
  createdAt: string;             // ISO Timestamp
  updatedAt?: string;            // ISO Timestamp
};

export type Message = {
  senderId: string;
  body: string;
  attachmentUrl?: string;
  sentAt: string; // ISO Timestamp
  readAt?: string; // ISO Timestamp
};

export type MessageThread = {
  id: string;
  participants: string[]; // [teacherId, studentId (or parentId)]
  lessonSlotId?: string;
  messages: Message[];
};

export type ProgressReport = {
  id: string;
  studentId: string;
  teacherId: string;
  period: string; // e.g., "Fall 2024"
  reportText: string;
  createdAt: string; // ISO Timestamp
  sentAt?: string; // ISO Timestamp
};

export type Announcement = {
  id: string;
  conservatoriumId: string;
  title: string;
  body: string;
  targetAudience: 'ALL' | 'STUDENTS' | 'PARENTS' | 'TEACHERS';
  channels: Channel[];
  sentAt: string; // ISO Timestamp
};

export type Room = {
  id: string;
  name: string;
  branchId?: string;
  capacity?: number;
  equipment?: string[];
  description?: string;
  photoUrl?: string;
};

export type PayrollStatus = 'DRAFT' | 'APPROVED' | 'PAID';

export type PayrollSummary = {
  id: string;
  teacherId: string;
  teacherName: string;
  periodStart: string; // ISO Date string
  periodEnd: string; // ISO Date string
  completedLessons: {
    slotId: string;
    studentId: string;
    studentName: string;
    durationMinutes: number;
    rate: number;
    subtotal: number;
    completedAt: string; // ISO Timestamp
  }[];
  totalHours: number;
  grossPay: number;
  status: PayrollStatus;
};

export type WaitlistStatus = 'WAITING' | 'OFFERED' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED';

export type WaitlistEntry = {
  id: string;
  studentId: string;
  teacherId: string;
  conservatoriumId: string;
  instrument: string;
  preferredDays: DayOfWeek[];
  preferredTimes: TimeRange[];
  joinedAt: string; // ISO Timestamp
  notifiedAt?: string; // ISO Timestamp
  status: WaitlistStatus;
};

export type AuditLogEntry = {
  id: string;
  notificationId: string;
  userId: string;
  channel: Channel;
  status: 'SENT' | 'DELIVERED' | 'FAILED' | 'OPTED_OUT';
  sentAt: string; // ISO Timestamp
  title: string;
  body: string;
  errorMessage?: string;
};

export type EventProductionStatus = 'PLANNING' | 'OPEN_REGISTRATION' | 'CLOSED' | 'COMPLETED';

export type PerformanceSlot = {
  id: string;
  studentId: string;
  studentName: string;
  compositionTitle: string;
  composer: string;
  duration: string; // MM:SS
};

export type EventProduction = {
  id: string;
  conservatoriumId: string;
  name: string;
  type: 'RECITAL' | 'CONCERT' | 'EXAM_PERFORMANCE' | 'OPEN_DAY';
  venue: string;
  eventDate: string; // ISO Date string
  startTime: string; // "HH:mm"
  status: EventProductionStatus;
  program: PerformanceSlot[];
  isPublic?: boolean;
  ticketPrice?: number;
  dressRehearsalDate?: string;
  soundCheckSchedule?: {
    performanceId: string;
    startTime: string;
    durationMinutes: number;
  }[];
};

export type InstrumentCondition = 'EXCELLENT' | 'GOOD' | 'FAIR' | 'NEEDS_REPAIR' | 'RETIRED';
export type InstrumentCategory = 'PIANO' | 'BRASS' | 'WOODWIND' | 'STRINGS' | 'PERCUSSION' | 'OTHER';

export type InstrumentInventory = {
  id: string;
  conservatoriumId: string;
  name: string;                  // e.g. "Yamaha CP88 Stage Piano"
  type: string;                  // legacy field
  category: InstrumentCategory;
  brand: string;
  serialNumber: string;
  purchaseDate?: string;         // ISO Date
  purchasePrice?: number;        // in agorot
  insuredValue?: number;
  condition: InstrumentCondition;
  locationRoomId?: string;       // where it normally lives
  status: 'AVAILABLE' | 'CHECKED_OUT' | 'IN_REPAIR' | 'RETIRED';
  rentalRatePerMonth: number;
  currentRenterId?: string;
  rentalStartDate?: string;
  currentCheckout?: {
    studentId: string;
    checkedOutAt: string;        // ISO Timestamp
    expectedReturnDate: string;  // ISO Date
    parentSignatureUrl: string;
    depositAmount?: number;
  };
  maintenanceHistory?: {
    date: string;
    description: string;
    cost?: number;
    technician?: string;
  }[];
  notes?: string;
};

export type PerformanceBookingStatus = 'INQUIRY_RECEIVED' | 'ADMIN_REVIEWING' | 'MUSICIANS_CONFIRMED' | 'QUOTE_SENT' | 'DEPOSIT_PAID' | 'BOOKING_CONFIRMED' | 'EVENT_COMPLETED';

export type PerformanceBooking = {
  id: string;
  conservatoriumId: string;
  status: PerformanceBookingStatus;
  inquiryReceivedAt: string; // ISO Timestamp
  eventName: string;
  eventType: string;
  eventDate: string; // ISO Date string
  eventTime: string; // HH:mm
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  totalQuote: number;
  assignedMusicians?: {
    userId: string;
    name: string;
    instrument: string;
  }[];
};

export type ApplicationStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'DOCUMENTS_PENDING'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'PARTIALLY_APPROVED'
  | 'WAITLISTED'
  | 'REJECTED'
  | 'EXPIRED';

export type ScholarshipApplication = {
  id: string;
  studentId: string;
  studentName: string;
  instrument: string;
  conservatoriumId: string;
  academicYear: string;
  status: ApplicationStatus;
  submittedAt: string; // ISO Timestamp
  priorityScore: number;
};

export type OpenDayEvent = {
  id: string;
  conservatoriumId: string;
  name: string;
  date: string; // ISO Date
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  appointmentDuration: number; // in minutes
  isActive: boolean;
};

export type OpenDayAppointment = {
  id: string;
  eventId: string;
  familyName: string;
  parentEmail: string;
  parentPhone: string;
  childName: string;
  childAge: number;
  instrumentInterest: string;
  appointmentTime: string; // ISO Timestamp
  status: 'SCHEDULED' | 'ATTENDED' | 'NO_SHOW';
  registeredAt: string; // ISO Timestamp
};

export type Branch = {
  id: string;
  conservatoriumId: string;
  name: string;
  address: string;
};


export type PracticeVideo = {
  id: string;
  studentId: string;
  teacherId: string;
  repertoireTitle: string;
  videoUrl: string;
  studentNote?: string;
  createdAt: string; // ISO Timestamp
  feedback?: {
    teacherId: string;
    comment: string;
    createdAt: string; // ISO Timestamp
  }[];
};

export type EmptySlot = {
  id: string;
  teacher: User;
  instrument: string;
  startTime: Date;
  durationMinutes: number;
  urgency: 'SAME_DAY' | 'TOMORROW';
  demandLevel: 'HIGH_DEMAND' | 'MEDIUM_DEMAND' | 'LOW_DEMAND';
  basePrice: number;
  promotionalPrice: number;
  discount: number;
};

// ============================================================
// SDD Enhancement II — New Types
// ============================================================

// SDD-P1: Real-Time Dashboard Aggregations
export type ConservatoriumLiveStats = {
  activeStudents: number;
  lessonsScheduledThisWeek: number;
  lessonsCompletedThisWeek: number;
  lessonsCompletedThisMonth: number;
  lessonHoursThisMonth: number;
  revenueCollectedThisMonth: number;    // in agorot (cents)
  revenueExpectedThisMonth: number;
  pendingApprovals: number;
  openMakeupCredits: number;
  teachersSickToday: number;
  paymentFailuresLast24h: number;
  updatedAt: string;                    // ISO Timestamp
};

// SDD-P1: National Holiday & Academic Year Calendar
export type ClosureDateType = 'NATIONAL_HOLIDAY' | 'CONSERVATORIUM_CLOSURE' | 'EXAM_PERIOD' | 'OTHER';

export type ClosureDate = {
  id?: string;
  date: string;                         // 'YYYY-MM-DD'
  type: ClosureDateType;
  name: string;                         // e.g., "Yom Kippur"
  nameHe: string;                       // Hebrew name
  affectsAllTeachers: boolean;
  affectedTeacherIds?: string[];        // if partial closure
  isRecurring: boolean;
  jewishCalendarRef?: string;           // e.g., "10_TISHRI"
  createdAt?: string;                   // ISO Timestamp
};

// SDD-P1: Room Double-Booking Prevention
export type RoomLock = {
  slotId: string;
  bookedAt: string;                     // ISO Timestamp
  releasedAt: string;                   // ISO Timestamp
};

// SDD-P1/P2: Teacher Compensation & Payroll Export
export type TeacherCompensation = {
  employmentType: 'EMPLOYEE' | 'FREELANCE';
  ratePerLesson: {
    duration30: number;                 // NIS per 30-min lesson
    duration45: number;
    duration60: number;
  };
  eventHourlyRate?: number;             // NIS per hour for events
  sickLeavePaidPolicy: 'FULL' | 'NONE' | 'PARTIAL';
  sickLeavePartialPercent?: number;
  notes?: string;
  rateLastUpdatedAt?: string;           // ISO Timestamp
  rateLastUpdatedBy?: string;           // admin userId
};

export type PayrollExportRow = {
  employeeId: string;
  employeeName: string;
  idNumber?: string;                    // ת"ז
  employmentType: 'EMPLOYEE' | 'FREELANCE';
  periodStart: string;                  // 'YYYY-MM-DD'
  periodEnd: string;
  lessonDate: string;
  lessonStartTime: string;              // 'HH:mm'
  durationMinutes: number;
  studentName: string;
  rateApplied: number;
  lessonSubtotal: number;
  eventDate?: string;
  eventName?: string;
  eventHours?: number;
  eventRate?: number;
  eventSubtotal?: number;
  sickLeaveDate?: string;
  sickLeavePaidAmount?: number;
  grossTotal?: number;
};

// SDD-P2: Attendance Marking
export type AttendanceAction =
  | 'MARK_PRESENT'
  | 'MARK_NO_SHOW_STUDENT'
  | 'MARK_ABSENT_NOTICED'
  | 'MARK_VIRTUAL';

// SDD-P2: Sick Leave
export type SickLeaveRequest = {
  teacherId: string;
  conservatoriumId: string;
  dateRange: {
    from: string;                       // ISO Date
    to: string;                         // ISO Date (defaults to same day)
  };
  note?: string;
};

export type SickLeaveResult = {
  affectedSlotsCount: number;
  makeupCreditsIssued: number;
  exceptionId: string;
};

// SDD-P2: Teacher Exception (sick leave, personal day, etc.)
export type TeacherException = {
  id: string;
  teacherId: string;
  dateFrom: string;                     // ISO Timestamp
  dateTo: string;                       // ISO Timestamp
  type: 'SICK_LEAVE' | 'PERSONAL' | 'EXTERNAL_CALENDAR_BLOCK';
  note?: string;
  createdAt: string;                    // ISO Timestamp
};

// SDD-P2: Israeli Exam Curriculum Tracker
export type ExamLevel = 'MINISTRY_LEVEL_1' | 'MINISTRY_LEVEL_2' | 'BAGRUT' | 'OTHER';
export type ExamRequirementCategory = 'SCALES' | 'PIECES' | 'SIGHT_READING' | 'THEORY' | 'EAR_TRAINING';
export type ExamRequirementStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'READY' | 'EXAM_PASSED';

export type ExamPrepTracker = {
  id: string;
  conservatoriumId: string;
  studentId: string;
  teacherId: string;
  examType: ExamLevel;
  instrument: string;
  targetExamDate?: string;              // ISO Date
  ministryFormId?: string;

  requirements: {
    category: ExamRequirementCategory;
    description: string;
    status: ExamRequirementStatus;
    teacherAssessment?: string;
    lastAssessedAt?: string;            // ISO Timestamp
  }[];

  assignedPieces: {
    compositionId?: string;
    title: string;
    composer?: string;
    category: 'REQUIRED_LIST_A' | 'REQUIRED_LIST_B' | 'FREE_CHOICE';
    readinessPercent: number;           // 0-100
    status: 'LEARNING' | 'POLISHING' | 'PERFORMANCE_READY';
  }[];

  overallReadinessPercent: number;
  teacherRecommendation?: 'READY_TO_SIT' | 'NEEDS_MORE_TIME' | 'NOT_READY';
  createdAt: string;                    // ISO Timestamp
  updatedAt: string;                    // ISO Timestamp
};

// SDD-P2 + SDD-PS: Group/Ensemble Lesson Attendance
export type GroupAttendanceEntry = {
  studentId: string;
  studentName?: string;  // SDD-PS addition
  status: 'PRESENT' | 'ABSENT_NOTICED' | 'ABSENT_NO_NOTICE' | 'NO_SHOW' | 'SCHOOL_EVENT';
  creditConsumed: boolean;
};

export type GroupLessonSlot = LessonSlot & {
  type: 'GROUP';
  studentIds: string[];
  groupName?: string;
  ensembleId?: string;
  maxStudents: number;
  currentStudentCount: number;
  attendance: GroupAttendanceEntry[];
};

export type EnsembleType = 'ORCHESTRA' | 'CHAMBER' | 'BAND' | 'CHOIR' | 'THEORY_CLASS';

export type Ensemble = {
  id: string;
  conservatoriumId: string;
  name: string;
  type: EnsembleType;
  teacherId: string;
  studentIds: string[];
  maxSize: number;
  instrument?: string;
  schedule?: {
    dayOfWeek: number;
    startTime: string;
    durationMinutes: number;
    roomId: string;
  };
  isActive: boolean;
  createdAt: string;                    // ISO Timestamp
};

// SDD-P2: Google Calendar Integration
export type GoogleCalendarIntegration = {
  enabled: boolean;
  accessToken: string;
  refreshToken: string;
  tokenExpiry: string;                  // ISO Timestamp
  calendarId: string;                   // 'primary' or specific calendar
  connectedAt: string;                  // ISO Timestamp
  lastSyncAt?: string;                  // ISO Timestamp
  lastSyncStatus?: 'SUCCESS' | 'FAILED';
  lastSyncError?: string;
};

// SDD-P1: Instrument Checkout (separate from inventory)
export type InstrumentCheckout = {
  id: string;
  instrumentId: string;
  studentId: string;
  checkedOutAt: string;                 // ISO Timestamp
  checkedOutByAdminId: string;
  expectedReturnDate: string;           // ISO Date
  actualReturnDate?: string;            // ISO Timestamp
  returnCondition?: string;
  depositAmount: number;
  depositRefunded: boolean;
  agreementDocUrl: string;
  status: 'ACTIVE' | 'RETURNED' | 'OVERDUE' | 'LOST';
};

// SDD-P3: Full Achievement Definitions
export const ACHIEVEMENT_DEFINITIONS: Record<AchievementType, Omit<Achievement, 'id' | 'achievedAt'>> = {
  PRACTICE_STREAK_7: { type: 'PRACTICE_STREAK_7', title: '7 Days of Practice', titleHe: 'שבוע של תרגול!', description: 'תרגלת 7 ימים ברצף', icon: '🔥', points: 50, },
  PRACTICE_STREAK_30: { type: 'PRACTICE_STREAK_30', title: '30-Day Streak', titleHe: '30 יום ברצף!', description: 'חודש שלם של תרגול יומי', icon: '🌟', points: 200, },
  TOTAL_HOURS_10: { type: 'TOTAL_HOURS_10', title: '10 Hours Practiced', titleHe: '10 שעות תרגול', description: 'הגעת ל-10 שעות תרגול מצטברות', icon: '⏱️', points: 100, },
  TOTAL_HOURS_50: { type: 'TOTAL_HOURS_50', title: '50 Hours Practiced', titleHe: '50 שעות תרגול', description: 'הגעת ל-50 שעות תרגול מצטברות', icon: '🏅', points: 300, },
  TOTAL_HOURS_100: { type: 'TOTAL_HOURS_100', title: 'Century Club', titleHe: '100 שעות תרגול!', description: 'מועדון המאה — 100 שעות תרגול', icon: '🏆', points: 500, },
  PIECE_COMPLETED: { type: 'PIECE_COMPLETED', title: 'Piece Completed!', titleHe: 'יצירה הושלמה!', description: 'כל הכבוד על השלמת יצירה', icon: '🎵', points: 75, },
  PIECES_COMPLETED_5: { type: 'PIECES_COMPLETED_5', title: '5 Pieces Mastered', titleHe: '5 יצירות!', description: 'השלמת 5 יצירות', icon: '🎶', points: 200, },
  PERFORMANCE_READY: { type: 'PERFORMANCE_READY', title: 'Performance Ready', titleHe: 'מוכן להופעה!', description: 'יצירה ראשונה מוכנה להופעה', icon: '🎤', points: 100, },
  YEARS_ENROLLED_1: { type: 'YEARS_ENROLLED_1', title: '1 Year Anniversary', titleHe: 'שנה בקונסרבטוריון!', description: 'שנה של לימודי מוזיקה', icon: '🎂', points: 100, },
  YEARS_ENROLLED_3: { type: 'YEARS_ENROLLED_3', title: '3 Years Strong', titleHe: '3 שנים!', description: 'שלוש שנים של מסירות', icon: '💎', points: 300, },
  FIRST_RECITAL: { type: 'FIRST_RECITAL', title: 'First Recital!', titleHe: 'הופעה ראשונה!', description: 'ניגנת בהופעה הראשונה שלך', icon: '🎭', points: 150, },
  FIRST_LESSON: { type: 'FIRST_LESSON', title: 'First Lesson!', titleHe: 'שיעור ראשון!', description: 'השיעור הראשון שלך', icon: '🎹', points: 25, },
  FORM_SUBMITTED: { type: 'FORM_SUBMITTED', title: 'Form Submitted', titleHe: 'טופס הוגש!', description: 'הגשת טופס ראשון', icon: '📋', points: 10, },
  EXAM_REGISTERED: { type: 'EXAM_REGISTERED', title: 'Exam Registered', titleHe: 'נרשמת לבחינה!', description: 'נרשמת לבחינה ראשונה', icon: '📝', points: 50, },
  EXAM_PASSED: { type: 'EXAM_PASSED', title: 'Exam Passed!', titleHe: 'עברת בחינה!', description: 'עברת בחינת משרד החינוך', icon: '🎓', points: 300, },
};

// SDD-P3: Student Level Calculator
export function calculateStudentLevel(achievements: Achievement[]): { level: number; points: number; title: string; titleHe: string } {
  const points = achievements.reduce((sum, a) => sum + (a.points ?? 0), 0);
  const levels = [
    { level: 1, min: 0, title: 'Beginner', titleHe: 'מתחיל' },
    { level: 2, min: 100, title: 'Learner', titleHe: 'לומד' },
    { level: 3, min: 300, title: 'Practitioner', titleHe: 'מתרגל' },
    { level: 4, min: 700, title: 'Musician', titleHe: 'מוזיקאי' },
    { level: 5, min: 1500, title: 'Artist', titleHe: 'אמן' },
  ];
  const current = [...levels].reverse().find(l => points >= l.min) ?? levels[0];
  return { level: current.level, points, title: current.title, titleHe: current.titleHe };
}

// SDD-P4: Installment Payments
export type InstallmentOption = {
  count: number;
  monthlyAmount: number;
  totalAmount: number;
  installmentFee?: number;
};

// SDD-P5: Ministry Director
export type MinistryDirector = {
  id: string;
  userId: string;
  name: string;
  email: string;
  oversightScope: 'ALL' | 'REGIONAL';
  regionIds?: string[];
  managedConservatoriumIds?: string[];
  canCreateFormTemplates: boolean;
  canApproveSubmissions: boolean;
  createdAt: string;                    // ISO Timestamp
};

// SDD-P5: Ministry Form Template
export type MinistryFormTemplate = {
  id: string;
  createdByDirectorId: string;
  title: string;
  titleHe: string;
  description?: string;
  formType: string;
  fields: FormFieldDefinition[];
  requiresStudentSignature: boolean;
  requiresTeacherSignature: boolean;
  requiresParentSignature: boolean;
  requiresAdminSignature: boolean;
  workflow: WorkflowStepDefinition[];
  validFrom?: string;                   // ISO Date
  validUntil?: string;                  // ISO Date
  targetConservatoriumIds: string[] | 'ALL';
  publishedAt?: string;                 // ISO Timestamp
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
};

// SDD-P5: Ministry Inbox Item
export type MinistryInboxItem = {
  formSubmissionId: string;
  conservatoriumName: string;
  conservatoriumId: string;
  formType: string;
  title: string;
  submittedByName: string;
  studentName?: string;
  submittedAt: string;                  // ISO Timestamp
  status: FormStatus;
  daysOpen: number;
};

// SDD-P5: Record Retention & Archival
export type RetentionPolicy = {
  conservatoriumId: string;
  studentRecordRetentionYears: number;  // 7 per Israeli law
  financialRecordRetentionYears: number; // 7 tax law
  formRetentionYears: number;           // 10 Ministry recommendation
  auditLogRetentionYears: number;       // 5
  lastUpdated: string;                  // ISO Timestamp
  approvedBy: string;                   // admin userId
};

// SDD-P5: Enrollment Statistics Report
export type EnrollmentStatisticsReport = {
  conservatoriumId: string;
  reportDate: string;                   // ISO Date
  academicYear: string;
  totalActiveStudents: number;
  byInstrument: Record<string, number>;
  byAgeGroup: {
    under8: number;
    age8to12: number;
    age13to18: number;
    over18: number;
  };
  byGrade: Record<string, number>;
  byFundingSource: {
    municipalFunded: number;
    privatePaying: number;
    scholarship: number;
  };
  totalActiveTeachers: number;
  teachersByInstrument: Record<string, number>;
  averageStudentsPerTeacher: number;
  totalLessonsThisMonth: number;
  totalLessonHoursThisMonth: number;
  roomUtilizationPercent: number;
  enrollmentChangePercent: number;
  retentionRate: number;
};

// SDD-P7: PDPPA Consent Tracking
export type ConsentType = 'DATA_PROCESSING' | 'MARKETING' | 'VIDEO_RECORDING' | 'SCHOLARSHIP_DATA';

export type ConsentRecord = {
  id: string;
  userId: string;
  consentType: ConsentType;
  givenAt: string;                      // ISO Timestamp
  givenByUserId: string;                // may be parent for minors
  ipAddress: string;
  consentVersion: string;               // privacy policy version
  revokedAt?: string;                   // ISO Timestamp
};

// SDD-P4/P5: Digital Signature Audit Trail
export type SignatureAuditRecord = {
  id: string;
  formSubmissionId: string;
  signerId: string;
  signerRole: UserRole;
  signerName: string;
  signedAt: string;                     // ISO Timestamp
  ipAddress: string;
  userAgent: string;
  signatureHash: string;                // SHA-256 of signature dataUrl
  documentHash: string;                 // SHA-256 of form content
};

// SDD-P9: Multi-Conservatorium User Role Junction
export type UserConservatoriumRole = {
  userId: string;
  conservatoriumId: string;
  role: UserRole;
  approved: boolean;
  joinedAt: string;                     // ISO Timestamp
};

// SDD-P8: Payroll Period State Machine
export type PayrollPeriodStatus = 'DRAFT' | 'UNDER_REVIEW' | 'APPROVED' | 'PAID' | 'ARCHIVED';

// SDD-P5: Board Director Dashboard Types
export type FinancialHealthCard = {
  currentMonthRevenue: number;
  previousMonthRevenue: number;
  ytdRevenue: number;
  ytdTarget: number;
  collectionRate: number;
  outstandingBalance: number;
  scholarshipFundBalance: number;
};

export type FacultyHealthCard = {
  totalTeachers: number;
  teachersAtCapacity: number;
  teacherTurnoverThisYear: number;
  avgTeacherTenureMonths: number;
  avgStudentsPerTeacher: number;
};

export type ComplianceStatusCard = {
  pendingFormSubmissions: number;
  overdueFormSubmissions: number;
  examRegistrationsSubmitted: number;
  lastMinistryReportDate?: string;      // ISO Date
  nextReportDueDate: string;            // ISO Date
  retentionPolicyLastReviewed: string;  // ISO Date
};

// SDD-P5: Ministry Exam Export
export type MinistryExamRecord = {
  studentIdNumber: string;              // ת"ז
  studentFirstName: string;
  studentLastName: string;
  dateOfBirth: string;                  // DD/MM/YYYY
  grade: string;
  school: string;
  instrument: string;                   // Hebrew Ministry nomenclature
  examLevel: string;
  teacher: string;
  teacherIdNumber: string;
  conservatoriumName: string;
  conservatoriumRegistrationNumber: string;
  examDate?: string;
  examCenter?: string;
};

// Ministry instrument name mapping (Hebrew)
export const MINISTRY_INSTRUMENT_NAMES: Record<string, string> = {
  'PIANO': 'פסנתר', 'VIOLIN': 'כינור', 'CELLO': "צ'לו", 'GUITAR': 'גיטרה',
  'FLUTE': 'חליל צד', 'CLARINET': 'קלרינט', 'TRUMPET': 'חצוצרה',
  'SAXOPHONE': 'סקסופון', 'DRUMS': 'תופים', 'VOICE': 'שירה', 'THEORY': 'תאוריה',
};

// SDD-P8: AI Job Queue
export type AIJobStatus = 'PENDING' | 'PROCESSING' | 'COMPLETE' | 'FAILED';

export type AIJob = {
  id: string;
  type: 'PROGRESS_REPORT' | 'TEACHER_MATCH' | 'SMART_SLOT_FILL';
  studentId?: string;
  teacherId?: string;
  conservatoriumId: string;
  status: AIJobStatus;
  requestedAt: string;                  // ISO Timestamp
  completedAt?: string;                 // ISO Timestamp
  result?: any;
  error?: string;
};

// SDD-P7: Compliance Log
export type ComplianceLog = {
  id: string;
  action: 'PII_DELETED' | 'CONSENT_GIVEN' | 'CONSENT_REVOKED' | 'DATA_EXPORTED' | 'BREACH_REPORTED';
  subjectId: string;
  reason: string;
  performedAt: string;                  // ISO Timestamp
  performedBy: string;                  // userId or 'SYSTEM'
  retentionPolicyApplied?: number;
};

// ── SDD-PS: Playing School Program ───────────────────────────────────────────

export type PartnershipStatus = 'ACTIVE' | 'PENDING' | 'SUSPENDED' | 'ENDED';
export type SubsidyModel = 'FULL_MUNICIPAL' | 'SPLIT' | 'PARENT_ONLY';
export type PSPaymentMethod = 'SCHOOL_FEES' | 'MUNICIPAL_DIRECT' | 'CARDCOM';
export type ExcellenceStatus = 'NOMINATED' | 'AUDITIONED' | 'ENROLLED' | 'DECLINED';
export type GroupLessonStatus = 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'MAKEUP';



export type SchoolProgram = {
  programId: string;
  instrument: string;
  targetGrades: string[];
  teacherId: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  durationMinutes: number;
  roomAtSchool: string;
  maxStudents: number;
  excellenceTrackEnabled: boolean;
};

export type SchoolPartnership = {
  id: string;
  conservatoriumId: string;
  schoolName: string;
  schoolSymbol: string;
  municipalityId: string;
  coordinatorUserId: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  academicYear: string;
  status: PartnershipStatus;
  subsidyModel: SubsidyModel;
  municipalSubsidyPercent: number;
  ministrySubsidyPercent: number;
  parentContributionPerYear: number;
  programs: SchoolProgram[];
  signedAgreementUrl?: string;
  createdAt: string;
  updatedAt: string;
};

export type PlayingSchoolEnrollment = {
  id: string;
  conservatoriumId: string;
  partnershipId: string;
  programId: string;
  studentId?: string;
  parentId?: string;
  studentName: string;
  studentGrade: string;
  studentClass: string;
  schoolSymbol: string;
  instrument: string;
  status: 'PENDING_PAYMENT' | 'ACTIVE' | 'WAITLIST' | 'CANCELLED' | 'COMPLETED';
  paymentStatus: PaymentStatus;
  paymentMethod: PSPaymentMethod;
  instrumentLoanId?: string;
  depositChequeRef?: string;
  excellenceTrackNominated: boolean;
  excellenceTrackStatus?: ExcellenceStatus;
  consentGiven: boolean;
  academicYear: string;
  enrolledAt: string;
  updatedAt: string;
};

export type SchoolGroupLesson = {
  id: string;
  partnershipId: string;
  programId: string;
  teacherId: string;
  schoolSymbol: string;
  startTime: string;
  durationMinutes: number;
  instrument: string;
  recurrenceId?: string;
  status: GroupLessonStatus;
  attendance: GroupAttendanceEntry[];
  teacherNote?: string;
  cancelReason?: string;
  substituteTeacherId?: string;
  createdAt: string;
};

