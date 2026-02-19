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

export type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  conservatoriumId: string;
  conservatoriumName: string;
  conservatoriumStudyYears?: number;
  instruments?: InstrumentInfo[];
  avatarUrl?: string;
  idNumber?: string;
  schoolName?: string;
  schoolSymbol?: string;
  birthDate?: string;
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
  grade?: 'א' | 'ב' | 'ג' | 'ד' | 'ה' | 'ו' | 'ז' | 'ח' | 'ט' |'י' | 'יא' | 'יב';
  // Teacher-specific fields from SDD-03
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
  // Student-specific fields from SDD-09
  weeklyPracticeGoal?: number;
  packageId?: string;
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

export type Conservatorium = {
  id: string;
  name: string;
  tier: 'A' | 'B' | 'C';
  stampUrl?: string;
  newFeaturesEnabled?: boolean;
  aiAgentsConfig?: Record<string, boolean>;
  pricingConfig?: PricingConfig;
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

  // New fields for Exam Registration
  examLevel?: string;
  examType?: string;
  preferredExamDateRange?: string;
  teacherDeclaration?: boolean;
};

// --- New Types from SDDs ---
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

export type Channel = 'IN_APP' | 'EMAIL' | 'SMS';

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
