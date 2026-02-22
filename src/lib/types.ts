

import type { User as AuthUser } from 'firebase/auth';

export type UserRole = 'student' | 'teacher' | 'parent' | 'conservatorium_admin' | 'site_admin' | 'ministry_director';

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
  | 'PRACTICE_STREAK_7'          // 7-day practice streak
  | 'PRACTICE_STREAK_30'         // 30-day practice streak
  | 'PIECE_COMPLETED'            // teacher marks a piece as performance-ready
  | 'FIRST_RECITAL'              // first public performance
  | 'EXAM_PASSED'                // Ministry exam passed
  | 'YEARS_ENROLLED_1';          // 1 year anniversary

export type Achievement = {
  id: string;
  type: AchievementType;
  title: string;
  description: string;
  achievedAt: string; // ISO Timestamp
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

export type Branch = {
  id: string;
  conservatoriumId: string;
  name: string;
  address: string;
};

export type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  conservatoriumId: string;
  conservatoriumName: string;
  branchId?: string;
  conservatoriumStudyYears?: number;
  instruments?: InstrumentInfo[];
  avatarUrl?: string;
  idNumber?: string;
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

export type Conservatorium = {
  id: string;
  name: string;
  tier: 'A' | 'B' | 'C';
  stampUrl?: string;
  newFeaturesEnabled?: boolean;
  aiAgentsConfig?: Record<string, boolean>;
  pricingConfig?: PricingConfig;
  cancellationPolicy?: CancellationPolicy;
};

export type FormStatus = 'טיוטה' | 'ממתין לאישור מורה' | 'ממתין לאישור מנהל' | 'מאושר' | 'נדחה' | 'נדרש תיקון' | 'מאושר סופית';

export type Composition = {
  id: string;
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

  // New fields for Exam Registration
  examLevel?: string;
  examType?: string;
  preferredExamDateRange?: string;
  teacherDeclaration?: boolean;
  instrument?: string;
};

// --- New Types from SDDs ---
export type MakeupCreditReason = 'TEACHER_CANCELLED' | 'ADMIN_CANCELLED' | 'STUDENT_CANCELLED_NOTICED';

export type MakeupCredit = {
  id: string;
  sourceLessonId: string;
  studentId: string;
  grantedAt: string; // ISO Timestamp
  expiresAt: string; // ISO Timestamp
  status: 'AVAILABLE' | 'USED' | 'EXPIRED';
  reason: MakeupCreditReason;
};

export type StudentGoal = 'EXAMS' | 'PERFORMANCE' | 'ENJOYMENT' | 'COMPETITION' | 'OTHER';

export type LessonType = 'RECURRING' | 'MAKEUP' | 'TRIAL' | 'ADHOC' | 'GROUP';

export type SlotUrgency = 'SAME_DAY' | 'TOMORROW';
export type SlotDemandLevel = 'HIGH_DEMAND' | 'MEDIUM_DEMAND' | 'LOW_DEMAND';

export type EmptySlot = {
    id: string;
    teacher: User;
    instrument: string;
    startTime: Date;
    durationMinutes: number;
    urgency: SlotUrgency;
    demandLevel: SlotDemandLevel;
    basePrice: number;
    promotionalPrice: number;
    discount: number;
};
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
  status: SlotStatus;
  attendanceMarkedAt?: string; // ISO Timestamp
  teacherNote?: string;
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
  studentId: string;
  teacherId?: string;
  date: string; // ISO Date
  durationMinutes: number;
  pieces: { title: string; focusArea?: string }[];
  mood: 'GREAT' | 'OKAY' | 'HARD';
  studentNote?: string;
  teacherComment?: string;
};

export type VideoFeedback = {
  teacherId: string;
  comment: string;
  createdAt: string; // ISO Timestamp
};

export type PracticeVideo = {
  id: string;
  studentId: string;
  teacherId: string;
  repertoireTitle: string;
  videoUrl: string;
  studentNote?: string;
  createdAt: string; // ISO Timestamp
  feedback?: VideoFeedback[];
};


export type LessonNote = {
  id: string;
  lessonSlotId: string;
  teacherId: string;
  studentId: string;
  summary: string;
  homeworkAssignments: string[];
  isSharedWithStudent: boolean;
  isSharedWithParent: boolean;
  createdAt: string; // ISO Timestamp
};

export type RepertoireStatus = 'LEARNING' | 'POLISHING' | 'PERFORMANCE_READY' | 'COMPLETED';

export type AssignedRepertoire = {
  id: string;
  studentId: string;
  compositionId: string;
  status: RepertoireStatus;
  assignedAt: string; // ISO Timestamp
  completedAt?: string; // ISO Timestamp
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
  instruments?: string[];
  capacity?: number;
  branchId?: string;
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

// From SDD-14A: Event Production Manager
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
  isPublic: boolean;
  ticketPrice: number;
  branchId?: string;
};

// From SDD-14G: Instrument Rental Management
export type InstrumentCondition = 'NEW' | 'GOOD' | 'FAIR' | 'NEEDS_REPAIR';

export type InstrumentInventory = {
  id: string;
  conservatoriumId: string;
  type: string; // Instrument type, e.g. 'כינור'
  brand: string;
  serialNumber: string;
  condition: InstrumentCondition;
  rentalRatePerMonth: number;
  currentRenterId?: string;
  rentalStartDate?: string; // ISO Date string
  expectedReturnDate?: string; // ISO Date string
};

// From SDD-13
export type PerformanceBookingStatus = 'INQUIRY_RECEIVED' | 'ADMIN_REVIEWING' | 'MUSICIANS_CONFIRMED' | 'QUOTE_SENT' | 'DEPOSIT_PAID' | 'BOOKING_CONFIRMED' | 'EVENT_COMPLETED';

export type PerformanceBooking = {
  id: string;
  conservatoriumId: string;
  status: PerformanceBookingStatus;
  inquiryReceivedAt: string; // ISO Timestamp
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  eventName: string;
  eventType: string;
  eventDate: string; // ISO Date
  eventTime: string; // "HH:mm"
  totalQuote: number;
  assignedMusicians?: { userId: string, name: string, instrument: string }[];
};

// From SDD-17: Scholarship Fund & Donation Management

export type Donation = {
  id: string;
  conservatoriumId: string;
  isAnonymous: boolean;
  donorName?: string;
  donorEmail?: string;
  donorPhone?: string;
  donorIdNumber?: string;
  donorOrganization?: string;
  amount: number;
  currency: 'ILS';
  paymentMethod: 'CARD' | 'BANK_TRANSFER' | 'CHECK' | 'CASH';
  paymentReference?: string;
  taxReceiptEligible: boolean;
  section46AllocationNumber?: string;
  receiptUrl?: string;
  reportedToTaxAuthority: boolean;
  reportedAt?: string; // ISO Timestamp
  isDedicated: boolean;
  dedicationText?: string;
  targetType: 'GENERAL_FUND' | 'SPECIFIC_STUDENT' | 'INSTRUMENT_FUND';
  targetStudentId?: string;
  targetInstrument?: string;
  status: 'PENDING' | 'CONFIRMED' | 'FAILED' | 'REFUNDED';
  confirmedAt?: string; // ISO Timestamp
  isRecurring: boolean;
  recurringIntervalMonths?: 1 | 3 | 12;
  donorMessage?: string;
  thankYouReceived: boolean;
  createdAt: string; // ISO Timestamp
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

export type DocumentType =
  | 'INCOME_CERTIFICATE'
  | 'SINGLE_PARENT_CERTIFICATE'
  | 'NEW_IMMIGRANT_CERTIFICATE'
  | 'DISABILITY_CERTIFICATE'
  | 'SOCIAL_WORKER_LETTER'
  | 'NATIONAL_INSURANCE_BENEFIT'
  | 'TEACHER_RECOMMENDATION'
  | 'EXAM_CERTIFICATE'
  | 'COMPETITION_AWARD';

export type ScholarshipApplication = {
  id: string;
  studentId: string;
  studentName: string; // denormalized for easier display
  instrument: string; // denormalized for easier display
  conservatoriumId: string;
  academicYear: string;
  type: 'FINANCIAL_AID' | 'MERIT_SCHOLARSHIP' | 'COMBINED';
  documents?: {
    type: DocumentType;
    fileUrl: string;
    uploadedAt: string; // ISO Timestamp
  }[];
  teacherEndorsement?: string;
  teacherRating?: number;
  recitalPerformances?: number;
  examGrade?: string;
  competitionResults?: string;
  householdSize?: number;
  monthlyIncome?: number;
  isSingleParent?: boolean;
  isNewImmigrant?: boolean;
  isDisabled?: boolean;
  additionalContext?: string;
  requestedDiscountPercent?: number;
  requestedMonths?: number;
  status: ApplicationStatus;
  priorityScore: number;
  committeeNotes?: string;
  awardedDiscountPercent?: number;
  awardedMonths?: number;
  awardedFrom?: string; // ISO Date
  awardedUntil?: string; // ISO Date
  linkedDonationIds?: string[];
  submittedAt: string; // ISO Timestamp
  reviewedAt?: string; // ISO Timestamp
};

export type ScholarshipFund = {
  id: string;
  conservatoriumId: string;
  name: string;
  description: string;
  totalReceived: number;
  totalAwarded: number;
  currentBalance: number;
  annualTarget: number;
  section46ApprovalNumber?: string;
};

// From SDD-14E
export type OpenDayEvent = {
  id: string;
  conservatoriumId: string;
  name: string;
  description: string;
  date: string; // ISO Date
  startTime: string; // "HH:mm"
  endTime: string; // "HH:mm"
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


