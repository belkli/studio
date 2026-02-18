export type UserRole = 'student' | 'teacher' | 'conservatorium_admin' | 'site_admin';

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
  // Detailed properties for form pre-filling
  idNumber?: string;
  schoolName?: string;
  schoolSymbol?: string;
  birthDate?: string;
  gender?: 'זכר' | 'נקבה';
  city?: string;
  phone?: string;
  students?: string[]; // For teachers/admins to list their students by ID
  grade?: 'א' | 'ב' | 'ג' | 'ד' | 'ה' | 'ו' | 'ז' | 'ח' | 'ט' |'י' | 'יא' | 'יב';
  approved: boolean;
  rejectionReason?: string;
  notifications?: Notification[];
};

export type Conservatorium = {
  id: string;
  name: string;
  tier: 'A' | 'B' | 'C';
  stampUrl?: string;
};

export type FormStatus = 'טיוטה' | 'ממתין לאישור מורה' | 'ממתין לאישור מנהל' | 'מאושר' | 'נדחה';

export type Composition = {
  id: string;
  composer: string;
  title: string;
  duration: string; // MM:SS, for the entire piece
  genre: string;
  movements?: { title: string; duration: string }[];
  approved?: boolean;
  source?: 'seed' | 'user_submitted' | 'api';
};

// New detailed types based on the image
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
  // NEW fields from image
  academicYear?: string; // e.g. תשפ"ו
  grade?: 'י' | 'יא' | 'יב';
  conservatoriumName?: string;
  conservatoriumManagerName?: string;
  conservatoriumManagerPhone?: string;
  conservatoriumManagerEmail?: string;

  studentId: string;
  studentName: string;
  
  // NEW nested objects
  applicantDetails?: RecitalApplicantDetails;
  schoolDetails?: SchoolDetails;
  instrumentDetails?: MainInstrumentDetails;
  teacherDetails?: TeacherDetails;
  additionalMusicDetails?: AdditionalMusicDetails;
  previousRepertoire?: PreviousRepertoire[];

  status: FormStatus;
  submissionDate: string;
  totalDuration: string;
  repertoire: Composition[]; // This is the main recital program
  
  // Existing fields
  teacherId?: string;
  adminId?: string;
  teacherComment?: string;
  adminComment?: string;

  // NEW
  managerNotes?: string;
  calculatedPrice?: number;
  paymentStatus?: 'pending' | 'paid' | 'waived';
  
  // For signature feature
  signatureUrl?: string;
  signedBy?: string;
  signedAt?: string;
};
