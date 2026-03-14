
export type I18nText = { he?: string; en?: string; ar?: string; ru?: string };

export type UserRole = 'student' | 'teacher' | 'parent' | 'conservatorium_admin' | 'delegated_admin' | 'site_admin' | 'ministry_director' | 'admin' | 'superadmin' | 'school_coordinator'; // SDD-PS

export type AccountType = 'FULL' | 'PLAYING_SCHOOL' | 'TRIAL';
export type AdminSection =
  | 'users'
  | 'registrations'
  | 'approvals'
  | 'announcements'
  | 'events'
  | 'scheduling'
  | 'rooms'
  | 'rentals'
  | 'scholarships'
  | 'donations'
  | 'reports'
  | 'payroll'
  | 'open-day'
  | 'performances'
  | 'alumni'
  | 'conservatorium-profile';

export type TeacherAssignment = {
  teacherId: string;
  instrument: string;
  lessonDurationMinutes: 30 | 45 | 60;
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  startTime: string;
};

export type InstrumentInfo = {
  instrument: string;
  teacherName: string;
  yearsOfStudy: number;
};

export type Notification = {
  id: string;
  userId?: string;
  conservatoriumId?: string;
  title: string;
  message: string;
  timestamp: string;
  link: string;
  read: boolean;
  scheduledFor?: string;          // ISO timestamp for quiet-hours deferred delivery
};

export type AlumniProfile = {
  id: string;
  userId: string;
  conservatoriumId: string;
  displayName: string;
  graduationYear: number;
  primaryInstrument: string;
  currentOccupation?: string;
  bio: { he?: string; en?: string; ru?: string; ar?: string };
  profilePhotoUrl?: string;
  isPublic: boolean;
  achievements?: string[];
  socialLinks?: {
    website?: string;
    youtube?: string;
    spotify?: string;
    instagram?: string;
  };
  availableForMasterClasses: boolean;
};

export type Alumnus = AlumniProfile;

export type MasterClassRegistration = {
  studentId: string;
  registeredAt: string;
  attendanceStatus: 'registered' | 'attended' | 'no_show';
  isPartOfPackage: boolean;
};

export type Masterclass = {
  id: string;
  conservatoriumId: string;
  title: { he: string; en: string; ru?: string; ar?: string };
  description: { he: string; en: string; ru?: string; ar?: string };
  instructor: {
    userId: string;
    displayName: string;
    instrument: string;
    bio?: string;
    photoUrl?: string;
  };
  instrument: string;
  maxParticipants: number;
  targetAudience: 'beginners' | 'intermediate' | 'advanced' | 'all';
  date: string;
  startTime: string;
  durationMinutes: number;
  location: string;
  isOnline: boolean;
  streamUrl?: string;
  includedInPackage: boolean;
  priceILS?: number;
  packageMasterClassCount?: number;
  status: 'draft' | 'published' | 'completed' | 'cancelled';
  registrations: MasterClassRegistration[];
};

export type StudentMasterClassAllowance = {
  studentId: string;
  conservatoriumId: string;
  academicYear: string;
  totalAllowed: number;
  used: number;
  remaining: number;
};

// From SDD-07
export type Channel = 'IN_APP' | 'EMAIL' | 'SMS' | 'WHATSAPP';

export type NotificationType =
  | 'lessonReminders'
  | 'lessonCancellation'
  | 'makeupCredits'
  | 'paymentDue'
  | 'paymentConfirmed'
  | 'newStudentEnrolled'
  | 'formStatusChanges'
  | 'teacherMessages'
  | 'systemAnnouncements'
  | 'psLessonReminders'
  | 'psLessonCancellation'
  | 'psPaymentDue'
  | 'psExcellenceUpdates'
  | 'psNewEnrollment'
  | 'psPartnershipUpdate'
  | 'psCoordinatorAnnouncements';

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
  | 'FIRST_PLAYING_SCHOOL_LESSON'
  | 'INSTRUMENT_COLLECTED'
  | 'PRACTICE_STREAK_7'          // 7 consecutive days logged
  | 'PRACTICE_STREAK_30'         // 30 consecutive days
  | 'TOTAL_HOURS_10'             // 10 cumulative practice hours
  | 'TOTAL_HOURS_50'             // 50 cumulative hours
  | 'TOTAL_HOURS_100'            // 100 cumulative hours â€” "Century Club"
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
  studentId?: string;            // link to the student who earned this
  conservatoriumId?: string;
  metadata?: Record<string, unknown>;
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
  type: 'CreditCard' | 'PayPal' | 'BankTransfer';
  last4?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isPrimary: boolean;
};

// From SDD-PS
export type PlayingSchoolInfo = {
  schoolName: string;
  schoolSymbol: string;
  instrument: string;
  instrumentReceived: boolean;
  receivedAt?: string; // ISO Date
  programType: 'GROUP' | 'INDIVIDUAL';
  municipalSubsidyPercent: number;
  ministrySubsidyPercent: number;
  parentYearlyContribution: number;
  teacherName?: string;
  lessonDay?: string;
  nextLessonDate?: string; // ISO Timestamp format for next class
  excellenceTrackNominated?: boolean;
  excellenceTrackAccepted?: boolean;
  excellenceTrackOfferDate?: string; // ISO Timestamp
};

export type PlayingSchoolInvoice = {
  id: string;
  studentId: string;
  parentId: string;
  amount: number;
  dueDate: string;
  status: 'PAID' | 'PENDING' | 'OVERDUE';
  description: string;
  academicYear: string;
  paymentMethod?: PSPaymentMethod;
  paidAt?: string;
};

export type PartnershipAnalytics = {
  leads: number;
  tokenScans: number;
  wizardStarts: number;
  completedEnrollments: number;
  conversionRate: number;
};

// User type defined below

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
  premiumSurcharge?: number; // % surcharge added on top of base rate when booking a premium-flagged teacher
  vatRate?: number; // e.g. 0.18 for 18% — overrides global VAT_RATE when set
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
  cityI18n?: I18nText;
  address?: string;
  addressI18n?: I18nText;
  postalCode?: string;
  googlePlaceId?: string;
  coordinates?: { lat: number; lng: number };
  googleMapsUrl?: string;
  branches?: string[]; // Location-level branch descriptions
};

export type OpeningHours = {
  [day: string]: {
    isOpen: boolean;
    openTime: string;
    closeTime: string;
  };
};

export type ConservatoriumBranchInfo = {
  name: string;
  address?: string;
  tel?: string;
  email?: string;
  manager?: string;
};

export type ConservatoriumPolicyContact = {
  name?: string;
  role?: string;
  email?: string;
  phone?: string;
};

export type SocialMediaLinks = {
  facebook?: string;
  instagram?: string;
  youtube?: string;
  tiktok?: string;
  whatsapp?: string;
};

export type ConservatoriumProfileTranslation = {
  name?: string;
  city?: string;
  address?: string;
  about?: string;
  openingHours?: string;
  programs?: string[];
  ensembles?: string[];
  manager?: {
    role?: string;
    bio?: string;
  };
  pedagogicalCoordinator?: {
    role?: string;
    bio?: string;
  };
  leadingTeam?: Array<{
    role?: string;
    bio?: string;
  }>;
  departments?: Array<{
    name: string;
  }>;
  branchesInfo?: Array<{
    name: string;
    address?: string;
  }>;
};

export type ConservatoriumTranslations = {
  he?: ConservatoriumProfileTranslation;
  en?: ConservatoriumProfileTranslation;
  ar?: ConservatoriumProfileTranslation;
  ru?: ConservatoriumProfileTranslation;
};

export type TranslationMeta = {
  lastTranslatedAt?: string;
  sourceHash?: string;
  translatedBy?: 'AI' | 'HUMAN';
  aiModel?: string;
  overrides?: {
    [locale: string]: string[];
  };
};

export type UserProfileTranslation = {
  bio?: string;
  role?: string;
  headline?: string;
  performanceBio?: string;
};

export type UserTranslations = {
  en?: UserProfileTranslation;
  ar?: UserProfileTranslation;
  ru?: UserProfileTranslation;
};

export type UserOAuthProvider = {
  userId: string;
  provider: 'google' | 'microsoft';
  providerUserId: string;
  providerEmail: string;
  linkedAt: string;
  lastUsedAt: string;
};

export type User = {
  createdAt: string | number | Date;
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
  gender?: string;
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
  grade?: string;
  // Teacher-specific fields from SDD-03 & SDD-13
  bio?: string;
  videoUrl?: string;
  education?: string[];
  performanceCredits?: string[];
  teachingPhilosophy?: {
    he?: string;
    en?: string;
    ru?: string;
    ar?: string;
  };
  availableForNewStudents?: boolean;
  lessonDurationsOffered?: (30 | 45 | 60)[];
  specialties?: TeacherSpecialty[];
  teachingLanguages?: Language[];
  spokenLanguages?: Language[];
  availability?: WeeklyAvailabilityBlock[];
  maxStudents?: number;
  teacherRatingAvg?: number;
  teacherRatingCount?: number;
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
  translations?: UserTranslations;
  translationMeta?: TranslationMeta;
  accountType?: AccountType;
  playingSchoolInfo?: PlayingSchoolInfo;
  isDelegatedAdmin?: boolean;
  delegatedAdminPermissions?: AdminSection[];
  teacherAssignments?: TeacherAssignment[];
  isPrimaryConservatoriumAdmin?: boolean;
  isPremiumTeacher?: boolean;
  oauthProviders?: UserOAuthProvider[];
  registrationSource?: 'email' | 'google' | 'microsoft' | 'admin_created';
  preferredLanguage?: 'he' | 'en' | 'ar' | 'ru';
  status?: 'active' | 'graduated' | 'inactive';
  graduationYear?: number;
};

export type Conservatorium = {
  id: string;
  name: string;
  nameEn?: string;
  nameI18n?: I18nText;
  tier: 'A' | 'B' | 'C';
  stampUrl?: string;
  newFeaturesEnabled?: boolean;
  aiAgentsConfig?: Record<string, boolean>;
  pricingConfig?: PricingConfig;
  cancellationPolicy?: CancellationPolicy;
  // --- i18n fields from enriched CSV data ---
  managerNameI18n?: I18nText;
  organizationI18n?: I18nText;
  website?: string;
  logoUrl?: string;
  imageUrl?: string;
  mapsUrl?: string;
  mobile?: string;
  // --- Public profile fields (admin-editable, displayed on About/Contact pages) ---
  about?: string;
  email?: string;
  secondaryEmail?: string;
  tel?: string;
  officialSite?: string;
  openingHours?: string;
  openingHoursByDay?: OpeningHours;
  foundedYear?: number;
  location?: ConservatoriumLocation;
  manager?: ConservatoriumStaffMember;
  pedagogicalCoordinator?: ConservatoriumStaffMember;
  leadingTeam?: ConservatoriumStaffMember[];
  departments?: ConservatoriumDepartment[];
  branchesInfo?: ConservatoriumBranchInfo[];
  teachers?: TeacherDirectoryProfile[];
  programs?: string[];
  ensembles?: string[];
  socialMedia?: SocialMediaLinks;
  privacyContact?: ConservatoriumPolicyContact;
  accessibilityContact?: ConservatoriumPolicyContact;
  photoUrls?: string[];
  translations?: ConservatoriumTranslations;
  translationMeta?: TranslationMeta;
  customRegistrationTerms?: {
    he?: string;
    en?: string;
    ar?: string;
    ru?: string;
  };
};

export type FormStatus = 'DRAFT' | 'PENDING_TEACHER' | 'PENDING_ADMIN' | 'APPROVED' | 'REJECTED' | 'REVISION_REQUIRED' | 'FINAL_APPROVED';

export type Composition = {
  id?: string;
  composer: string;
  composerId?: string;
  composerNames?: {
    he: string;
    en: string;
    ru?: string;
    ar?: string;
  };
  title: string;
  titles?: {
    he: string;
    en: string;
    ru?: string;
    ar?: string;
  };
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
  scope: string; // ��"קף ���"צ�"ע
  performedByHeart: boolean; // נ�"��x �ע"פ
};


export type FormSubmission = {
  id: string;
  formType: string;
  academicYear?: string;
  grade?: string;
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

  formData?: Record<string, unknown>;
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
export type FormFieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'date'
  | 'select'
  | 'multiselect'
  | 'checkbox'
  | 'checkbox_group'
  | 'radio'
  | 'file_upload'
  | 'signature'
  | 'composer_select'
  | 'teacher_select'
  | 'instrument_select'
  | 'separator'
  | 'heading'
  | 'info_text'
  | 'conditional_group'
  | 'dropdown';

export type LocalizedLabel = {
  he: string;
  en: string;
  ru?: string;
  ar?: string;
};

export type FormFieldOption = {
  value: string;
  label: LocalizedLabel | string;
};

export type FormFieldCondition = {
  fieldId: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'not_empty';
  value?: string | boolean;
};

export type FormFieldValidation = {
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  min?: number;
  max?: number;
};

export type FormFieldDefinition = {
  id: string;
  label: LocalizedLabel | string;
  type: FormFieldType;
  required: boolean;
  order?: number;
  placeholder?: string;
  options?: FormFieldOption[] | string;
  showIf?: FormFieldCondition;
  validation?: FormFieldValidation;
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
  studentRating?: number;         // 1-5 star rating by student (future: persisted after lesson)
  createdAt: string; // ISO Timestamp
  updatedAt: string; // ISO Timestamp
};

export type PackageType = 'TRIAL' | 'PACK_5' | 'PACK_10' | 'MONTHLY' | 'YEARLY' | 'ADHOC_SINGLE' | 'PACK_5_PREMIUM' | 'PACK_10_PREMIUM' | 'PACK_DUET';
export type PaymentStatus = 'PAID' | 'PENDING' | 'FAILED';

export type Package = {
  id: string;
  conservatoriumId: string;
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
  installments?: InstallmentOption;
  createdAt?: string;
  updatedAt?: string;
};

export type InvoiceStatus = 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED';

export type Invoice = {
  id: string;
  invoiceNumber: string;
  conservatoriumId: string;
  payerId: string; // Parent or adult Student
  lineItems: {
    description: string;
    quantity?: number;
    unitPrice?: number;
    total: number;
  }[];
  subtotal?: number;
  discounts?: {
    type: string;
    amount: number;
    description?: string;
  }[];
  vatRate?: number; // 0.17 for Israeli 17% VAT
  vatAmount?: number;
  total: number;
  paidAmount?: number;
  status: InvoiceStatus;
  dueDate: string; // ISO Date
  paidAt?: string; // ISO Date
  paymentMethod?: 'CREDIT_CARD' | 'BANK_TRANSFER' | 'CASH' | 'CHEQUE' | 'CARDCOM';
  installments?: {
    count: number;
    monthlyAmount: number;
    paidInstallments: number;
    nextPaymentDate?: string;
  };
  pdfUrl?: string;
  cardcomTransactionId?: string;
  issuedAt?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type PracticeLog = {
  id: string;
  conservatoriumId?: string;
  studentId: string;
  teacherId?: string;
  lessonSlotId?: string;         // related lesson
  date: string;                  // ISO Date â€” indexed for range queries
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

export type AnnouncementContent = {
  title: string;
  body: string;
};

export type Announcement = {
  id: string;
  conservatoriumId: string;
  /** Source language content (always Hebrew — the admin writes in Hebrew) */
  title: string;
  body: string;
  /** Per-locale translations — auto-generated via AI */
  translations?: {
    en?: AnnouncementContent;
    ar?: AnnouncementContent;
    ru?: AnnouncementContent;
  };
  /** If translations were auto-generated by AI, note this for legal disclaimer */
  translatedByAI?: boolean;
  targetAudience: 'ALL' | 'STUDENTS' | 'PARENTS' | 'TEACHERS';
  channels: Channel[];
  sentAt: string; // ISO Timestamp
};

export type RoomInstrumentEquipment = {
  instrumentId: string;
  quantity: number;
  notes?: string;
};

export type RoomBlock = {
  id: string;
  startDateTime: string;
  endDateTime: string;
  reason: string;
  blockedByUserId: string;
};

export type Room = {
  id: string;
  conservatoriumId: string;
  branchId: string;
  name: string;
  capacity: number;
  instrumentEquipment: RoomInstrumentEquipment[];
  blocks: RoomBlock[];
  isActive: boolean;
  description?: string;
  photoUrl?: string;
  equipment?: string[];
};

export type PayrollStatus = 'DRAFT' | 'APPROVED' | 'PAID';

export type PayrollSummary = {
  conservatoriumId: string;
  paymentDate?: string;
  totalAmount: number;
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
  offeredSlotId?: string;
  offeredSlotTime?: string;
  offerExpiresAt?: string;
  offerAcceptedAt?: string;
  offerDeclinedAt?: string;
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
export type EventVisibilityStatus = 'draft' | 'published' | 'cancelled' | 'completed';

export type EventTranslation = {
  he: string;
  en: string;
  ru?: string;
  ar?: string;
};

export type EventVenue = {
  name: { he: string; en: string };
  address: string;
  googleMapsUrl?: string;
  capacity: number;
  isOnline: boolean;
  streamUrl?: string;
};

export type TicketTier = {
  id: string;
  name: { he: string; en: string };
  priceILS: number;
  availableCount: number;
  description?: string;
};

export type BookedSeat = {
  userId: string;
  tierId: string;
  seatNumber?: string;
  bookingRef: string;
  paidAt?: string;
};

export type EventPerformer = {
  userId?: string;
  displayName: string;
  instrument: string;
  role: 'soloist' | 'ensemble' | 'accompanist' | 'conductor';
};

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
  title?: EventTranslation;
  description?: EventTranslation;
  type: 'RECITAL' | 'CONCERT' | 'EXAM_PERFORMANCE' | 'OPEN_DAY';
  venue: string;
  venueDetails?: EventVenue;
  eventDate: string; // ISO Date string
  startTime: string; // "HH:mm"
  status: EventProductionStatus;
  visibilityStatus?: EventVisibilityStatus;
  program: PerformanceSlot[];
  performers?: EventPerformer[];
  isPublic?: boolean;
  isFree?: boolean;
  ticketPrices?: TicketTier[];
  ticketPrice?: number;
  totalSeats?: number;
  seatMapUrl?: string;
  bookedSeats?: BookedSeat[];
  tags?: string[];
  posterUrl?: string;
  publishedAt?: string;
  dressRehearsalDate?: string;
  soundCheckSchedule?: {
    performanceId: string;
    startTime: string;
    durationMinutes: number;
  }[];
};

export type InstrumentCondition = 'EXCELLENT' | 'GOOD' | 'FAIR' | 'NEEDS_REPAIR' | 'RETIRED';
export type InstrumentCategory = 'PIANO' | 'BRASS' | 'WOODWIND' | 'STRINGS' | 'PERCUSSION' | 'OTHER';
export type RentalModel = 'deposit' | 'monthly' | 'rent_to_own';
export type RentalStatus = 'pending_signature' | 'active' | 'returned' | 'overdue' | 'purchased';
export type RentalCondition = 'excellent' | 'good' | 'fair' | 'damaged';

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
  rentalModelsOffered?: RentalModel[];
  depositAmountILS?: number;
  monthlyFeeILS?: number;
  purchasePriceILS?: number;
  monthsUntilPurchaseEligible?: number;
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

export type InstrumentRental = {
  id: string;
  conservatoriumId: string;
  instrumentId: string;
  studentId: string;
  parentId: string;

  rentalModel: RentalModel;
  depositAmountILS?: number;
  monthlyFeeILS?: number;
  purchasePriceILS?: number;
  monthsUntilPurchaseEligible?: number;

  startDate: string;
  expectedReturnDate?: string;
  actualReturnDate?: string;

  status: RentalStatus;

  signingToken: string;
  parentSignedAt?: string;
  parentSignatureUrl?: string;

  condition: RentalCondition;
  notes?: string;
  refundAmountILS?: number;
  purchaseEligibleNotifiedAt?: string;
};

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

export type ScholarshipPaymentStatus = 'UNPAID' | 'PAID';

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
  approvedAt?: string;
  rejectedAt?: string;
  paymentStatus?: ScholarshipPaymentStatus;
  paidAt?: string;
};

export type DonationCauseCategory = 'financial_aid' | 'excellence' | 'equipment' | 'events' | 'general';

export type DonationCause = {
  id: string;
  conservatoriumId: string;
  names: { he: string; en: string; ru?: string; ar?: string };
  descriptions: { he: string; en: string; ru?: string; ar?: string };
  category: DonationCauseCategory;
  priority: number;
  isActive: boolean;
  targetAmountILS?: number;
  raisedAmountILS: number;
  imageUrl?: string;
};

export type DonationRecord = {
  id: string;
  conservatoriumId: string;
  causeId: string;
  amountILS: number;
  frequency: 'once' | 'monthly' | 'yearly';
  donorName?: string;
  donorEmail?: string;
  donorId?: string;
  status: 'INITIATED' | 'PAID' | 'FAILED';
  createdAt: string;
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

export type TeacherRating = {
  id: string;
  teacherId: string;
  reviewerUserId: string;
  conservatoriumId: string;
  rating: 1 | 2 | 3 | 4 | 5;
  comment?: string;
  createdAt: string;
};

// ============================================================
// SDD Enhancement II â€” New Types
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
  id: string;
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
  idNumber?: string;                    // ת"�
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
  PRACTICE_STREAK_7: { type: 'PRACTICE_STREAK_7', title: '7 Days of Practice', titleHe: '×©×‘×•×¢ ×©×œ ×ª×¨×’×•×œ!', description: '×ª×¨×’×œ×ª 7 ×™×ž×™× ×‘×¨×¦×£', icon: 'ðŸ”¥', points: 50, },
  PRACTICE_STREAK_30: { type: 'PRACTICE_STREAK_30', title: '30-Day Streak', titleHe: '30 ×™×•× ×‘×¨×¦×£!', description: '×—×•×“×© ×©×œ× ×©×œ ×ª×¨×’×•×œ ×™×•×ž×™', icon: 'ðŸŒŸ', points: 200, },
  TOTAL_HOURS_10: { type: 'TOTAL_HOURS_10', title: '10 Hours Practiced', titleHe: '10 ×©×¢×•×ª ×ª×¨×’×•×œ', description: '×”×’×¢×ª ×œ-10 ×©×¢×•×ª ×ª×¨×’×•×œ ×ž×¦×˜×‘×¨×•×ª', icon: 'â±ï¸', points: 100, },
  TOTAL_HOURS_50: { type: 'TOTAL_HOURS_50', title: '50 Hours Practiced', titleHe: '50 ×©×¢×•×ª ×ª×¨×’×•×œ', description: '×”×’×¢×ª ×œ-50 ×©×¢×•×ª ×ª×¨×’×•×œ ×ž×¦×˜×‘×¨×•×ª', icon: 'ðŸ…', points: 300, },
  TOTAL_HOURS_100: { type: 'TOTAL_HOURS_100', title: 'Century Club', titleHe: '100 ×©×¢×•×ª ×ª×¨×’×•×œ!', description: '×ž×•×¢×“×•×Ÿ ×”×ž××” â€” 100 ×©×¢×•×ª ×ª×¨×’×•×œ', icon: 'ðŸ†', points: 500, },
  PIECE_COMPLETED: { type: 'PIECE_COMPLETED', title: 'Piece Completed!', titleHe: '×™×¦×™×¨×” ×”×•×©×œ×ž×”!', description: '×›×œ ×”×›×‘×•×“ ×¢×œ ×”×©×œ×ž×ª ×™×¦×™×¨×”', icon: 'ðŸŽµ', points: 75, },
  PIECES_COMPLETED_5: { type: 'PIECES_COMPLETED_5', title: '5 Pieces Mastered', titleHe: '5 ×™×¦×™×¨×•×ª!', description: '×”×©×œ×ž×ª 5 ×™×¦×™×¨×•×ª', icon: 'ðŸŽ¶', points: 200, },
  PERFORMANCE_READY: { type: 'PERFORMANCE_READY', title: 'Performance Ready', titleHe: '×ž×•×›×Ÿ ×œ×”×•×¤×¢×”!', description: '×™×¦×™×¨×” ×¨××©×•× ×” ×ž×•×›× ×” ×œ×”×•×¤×¢×”', icon: 'ðŸŽ¤', points: 100, },
  YEARS_ENROLLED_1: { type: 'YEARS_ENROLLED_1', title: '1 Year Anniversary', titleHe: '×©× ×” ×‘×§×•× ×¡×¨×‘×˜×•×¨×™×•×Ÿ!', description: '×©× ×” ×©×œ ×œ×™×ž×•×“×™ ×ž×•×–×™×§×”', icon: 'ðŸŽ‚', points: 100, },
  YEARS_ENROLLED_3: { type: 'YEARS_ENROLLED_3', title: '3 Years Strong', titleHe: '3 ×©× ×™×!', description: '×©×œ×•×© ×©× ×™× ×©×œ ×ž×¡×™×¨×•×ª', icon: 'ðŸ’Ž', points: 300, },
  FIRST_RECITAL: { type: 'FIRST_RECITAL', title: 'First Recital!', titleHe: '×”×•×¤×¢×” ×¨××©×•× ×”!', description: '× ×™×’× ×ª ×‘×”×•×¤×¢×” ×”×¨××©×•× ×” ×©×œ×š', icon: 'ðŸŽ­', points: 150, },
  FIRST_LESSON: { type: 'FIRST_LESSON', title: 'First Lesson!', titleHe: '×©×™×¢×•×¨ ×¨××©×•×Ÿ!', description: '×”×©×™×¢×•×¨ ×”×¨××©×•×Ÿ ×©×œ×š', icon: 'ðŸŽ¹', points: 25, },
  FORM_SUBMITTED: { type: 'FORM_SUBMITTED', title: 'Form Submitted', titleHe: '×˜×•×¤×¡ ×”×•×’×©!', description: '×”×’×©×ª ×˜×•×¤×¡ ×¨××©×•×Ÿ', icon: 'ðŸ“‹', points: 10, },
  EXAM_REGISTERED: { type: 'EXAM_REGISTERED', title: 'Exam Registered', titleHe: '× ×¨×©×ž×ª ×œ×‘×—×™× ×”!', description: '× ×¨×©×ž×ª ×œ×‘×—×™× ×” ×¨××©×•× ×”', icon: 'ðŸ“', points: 50, },
  EXAM_PASSED: { type: 'EXAM_PASSED', title: 'Exam Passed!', titleHe: '×¢×‘×¨×ª ×‘×—×™× ×”!', description: '×¢×‘×¨×ª ×‘×—×™× ×ª ×ž×©×¨×“ ×”×—×™× ×•×š', icon: 'ðŸŽ“', points: 300, },
  FIRST_PLAYING_SCHOOL_LESSON: { type: 'FIRST_PLAYING_SCHOOL_LESSON', title: 'School Music Debut', titleHe: '×©×™×¢×•×¨ × ×’×™× ×” ×¨××©×•×Ÿ ×‘×‘×™×”"ס!', description: '�ת��Sת �S�S�~�"� �~�"��"ק� ���"ת �ספר', icon: '�x��', points: 30, },
  INSTRUMENT_COLLECTED: { type: 'INSTRUMENT_COLLECTED', title: 'Got My Instrument!', titleHe: 'ק�"��Sת�" �:�S�" נ��"נ�!', description: 'אספת את �:�S�" �נ��"נ� ש�S�a �~�ק�"נסר����"ר�"�"�x', icon: '�x}�', points: 20, },
};

// SDD-P3: Student Level Calculator
export function calculateStudentLevel(achievements: Achievement[]): { level: number; points: number; title: string; titleHe: string } {
  const points = achievements.reduce((sum, a) => sum + (a.points ?? 0), 0);
  const levels = [
    { level: 1, min: 0, title: 'Beginner', titleHe: '�~ת��"�S' },
    { level: 2, min: 100, title: 'Learner', titleHe: '�S�"�~�' },
    { level: 3, min: 300, title: 'Practitioner', titleHe: '�~תר��S' },
    { level: 4, min: 700, title: 'Musician', titleHe: '�~�"��"קא�"' },
    { level: 5, min: 1500, title: 'Artist', titleHe: 'א�~�x' },
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
export type ConsentType = 'DATA_PROCESSING' | 'TERMS' | 'MARKETING' | 'VIDEO_RECORDING' | 'SCHOLARSHIP_DATA' | 'PHOTOS';

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
  studentIdNumber: string;              // ת"×–
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
  PIANO: '\u05e4\u05e1\u05e0\u05ea\u05e8',
  VIOLIN: '\u05db\u05d9\u05e0\u05d5\u05e8',
  CELLO: "\u05e6'\u05dc\u05d5",
  GUITAR: '\u05d2\u05d9\u05d8\u05e8\u05d4',
  FLUTE: '\u05d7\u05dc\u05d9\u05dc \u05e6\u05d3',
  CLARINET: '\u05e7\u05dc\u05e8\u05d9\u05e0\u05d8',
  TRUMPET: '\u05d7\u05e6\u05d5\u05e6\u05e8\u05d4',
  SAXOPHONE: '\u05e1\u05e7\u05e1\u05d5\u05e4\u05d5\u05df',
  DRUMS: '\u05ea\u05d5\u05e4\u05d9\u05dd',
  VOICE: '\u05e9\u05d9\u05e8\u05d4',
  THEORY: '\u05ea\u05d0\u05d5\u05e8\u05d9\u05d4',
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
  result?: unknown;
  error?: string;
};

// SDD-P7: Compliance Log
export type ComplianceLog = {
  id: string;
  action: 'PII_DELETED' | 'CONSENT_GIVEN' | 'CONSENT_REVOKED' | 'DATA_EXPORTED' | 'BREACH_REPORTED' | 'SIGNATURE_CREATED';
  subjectId: string;
  reason: string;
  performedAt: string;                  // ISO Timestamp
  performedBy: string;                  // userId or 'SYSTEM'
  retentionPolicyApplied?: number;
};

// â”€â”€ SDD-PS: Playing School Program â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

export type LeadStatus = 'NEW' | 'CONTACTED' | 'CONVERTED' | 'ARCHIVED';

export type PlayingSchoolInterestLead = {
  id: string;
  parentName: string;
  parentEmail: string;
  parentPhone: string;
  schoolName?: string;
  schoolSymbol?: string;
  city?: string;
  status: LeadStatus;
  notes?: string;
  createdAt: string;
};



export type ConservatoriumInstrument = {
  id: string;
  conservatoriumId: string;
  instrumentCatalogId?: string;
  names: {
    he: string;
    en: string;
    ru?: string;
    ar?: string;
  };
  isActive: boolean;
  teacherCount: number;
  availableForRegistration: boolean;
  availableForRental: boolean;
};

export type LessonPackageType = 'monthly' | 'semester' | 'annual' | 'single';

export type LessonPackage = {
  id: string;
  conservatoriumId: string;
  names: { he: string; en: string; ru?: string; ar?: string };
  type: LessonPackageType;
  lessonCount: number | null;
  durationMinutes: 30 | 45 | 60;
  priceILS: number;
  isActive: boolean;
  isPremium?: boolean;          // if true, only bookable with premium-flagged teachers
  // Legacy free-text instrument labels (kept for backward compatibility)
  instruments?: string[];
  // Normalized IDs from lesson_package_instruments
  conservatoriumInstrumentIds?: string[];
  instrumentCatalogIds?: string[];
  notes?: string;
};

export type TeacherMatchResult = {
  teacherId: string;
  teacherName: string;
  conservatoriumId: string;
  conservatoriumName: string;
  score: number;
  matchReason: string;
  instruments: string[];
  specialties: TeacherSpecialty[];
  avatarUrl?: string;
  isPremiumTeacher?: boolean;
  nextAvailableSlot?: {
    day: DayOfWeek;
    time: string;
  };
  tags: string[];
};
