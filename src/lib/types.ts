export type UserRole = 'student' | 'teacher' | 'conservatorium_admin' | 'site_admin';

export type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  conservatoriumId: string;
  instrument?: string;
  avatarUrl?: string;
};

export type FormStatus = 'טיוטה' | 'ממתין לאישור מורה' | 'ממתין לאישור מנהל' | 'מאושר' | 'נדחה';

export type Composition = {
  composer: string;
  title: string;
  duration: string; // MM:SS
  genre: string;
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
};
