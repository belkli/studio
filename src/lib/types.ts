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

export type FormSubmission = {
  id: string;
  formType: string;
  studentId: string;
  studentName: string;
  status: FormStatus;
  submissionDate: string;
  totalDuration: string;
  repertoire: Composition[];
  teacherId?: string;
  adminId?: string;
  teacherComment?: string;
  adminComment?: string;
};
