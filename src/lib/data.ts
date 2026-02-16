import type { User, FormSubmission, UserRole } from './types';

// The main user is now a site admin to see all features
export const mockUser: User = {
  id: 'user-4',
  name: 'דנה שחר',
  email: 'dana@system.com',
  role: 'site_admin',
  conservatoriumId: 'global',
  avatarUrl: 'https://i.pravatar.cc/150?u=dana',
  instrument: 'כינור',
};

export const mockUsers: User[] = [
  {
    id: 'user-1',
    name: 'משה לוי',
    email: 'moshe@example.com',
    role: 'student',
    conservatoriumId: 'cons-1',
    instrument: 'פסנתר',
    avatarUrl: 'https://i.pravatar.cc/150?u=moshe',
  },
  {
    id: 'user-2',
    name: 'אבי כהן',
    email: 'avi@example.com',
    role: 'teacher',
    conservatoriumId: 'cons-1',
    avatarUrl: 'https://i.pravatar.cc/150?u=avi',
  },
  {
    id: 'user-3',
    name: 'יעל ישראלי',
    email: 'yael@example.com',
    role: 'conservatorium_admin',
    conservatoriumId: 'cons-1',
    avatarUrl: 'https://i.pravatar.cc/150?u=yael',
  },
  mockUser,
];

export const conservatoriums = [
  { id: 'cons-1', name: 'קונסרבטוריון הוד השרון' },
  { id: 'cons-2', name: 'הקונסרבטוריון הישראלי למוסיקה תל אביב' },
  { id: 'cons-3', name: 'קונסרבטוריון גבעתיים' },
  { id: 'cons-4', name: 'מרכז למוסיקה ובימת אמנויות רעננה' },
];

export const instruments = ['פסנתר', 'כינור', 'צ\'לו', 'גיטרה', 'חליל צד', 'קלרינט', 'סקסופון', 'תופים'];

export const schools = [
  { symbol: '44570001', name: 'תיכון הדרים, הוד השרון' },
  { symbol: '12345678', name: 'תיכון חדש, תל אביב' },
  { symbol: '87654321', name: 'תיכון הראשונים, הרצליה' },
  { symbol: '11223344', name: 'בית ספר לאמנויות, ירושלים' },
];

export const mockFormSubmissions: FormSubmission[] = [
  {
    id: 'form-101',
    formType: 'רסיטל בגרות',
    academicYear: 'תשפ"ד',
    grade: 'יב',
    studentId: 'user-1',
    studentName: 'משה לוי',
    status: 'ממתין לאישור מורה',
    submissionDate: '2024-05-20',
    totalDuration: '12:30',
    repertoire: [
      { composer: 'באך', title: 'פרלוד בדו מז\'ור', duration: '02:30', genre: 'קלאסי' },
      { composer: 'שופן', title: 'נוקטורן אופ. 9 מס\' 2', duration: '05:00', genre: 'קלאסי' },
      { composer: 'בטהובן', title: 'לאליזה', duration: '05:00', genre: 'קלאסי' },
    ],
    conservatoriumName: 'קונסרבטוריון הוד השרון',
    applicantDetails: {
      birthDate: '2006-01-15',
      city: 'הוד השרון',
      gender: 'זכר',
      phone: '050-1234567'
    },
    schoolDetails: {
      schoolName: 'תיכון הדרים, הוד השרון',
      hasMusicMajor: true,
      isMajorParticipant: true,
      plansTheoryExam: true
    },
    teacherDetails: {
      name: 'אבי כהן',
      yearsWithTeacher: 3
    }
  },
  {
    id: 'form-102',
    formType: 'קונצרט כיתתי',
    studentId: 'user-5',
    studentName: 'שרה כהן',
    status: 'מאושר',
    submissionDate: '2024-05-18',
    totalDuration: '08:15',
    repertoire: [
      { composer: 'מוצרט', title: 'סונטה ק. 545', duration: '08:15', genre: 'קלאסי' },
    ],
    conservatoriumName: 'קונסרבטוריון גבעתיים',
  },
  {
    id: 'form-103',
    formType: 'מבחן שלב',
    studentId: 'user-6',
    studentName: 'דוד ביטון',
    status: 'טיוטה',
    submissionDate: '2024-05-21',
    totalDuration: '04:00',
    repertoire: [
       { composer: 'קלמנטי', title: 'סונטינה אופ. 36 מס\' 1', duration: '04:00', genre: 'קלאסי' },
    ],
    conservatoriumName: 'הקונסרבטוריון הישראלי למוסיקה תל אביב',
  },
  {
    id: 'form-104',
    formType: 'רסיטל בגרות',
    academicYear: 'תשפ"ג',
    grade: 'יא',
    studentId: 'user-7',
    studentName: 'רבקה גולן',
    status: 'נדחה',
    teacherComment: 'נא לבחור יצירה נוספת מהתקופה הרומנטית.',
    submissionDate: '2024-05-15',
    totalDuration: '09:00',
    repertoire: [
       { composer: 'היידן', title: 'סונטה ברה מז\'ור', duration: '09:00', genre: 'קלאסי' },
    ],
     conservatoriumName: 'מרכז למוסיקה ובימת אמנויות רעננה',
  },
];
