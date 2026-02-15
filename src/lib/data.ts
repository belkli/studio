import type { User, FormSubmission, UserRole } from './types';

export const mockUser: User = {
  id: 'user-2',
  name: 'אבי כהן',
  email: 'avi@example.com',
  role: 'teacher',
  conservatoriumId: 'cons-1',
  avatarUrl: 'https://i.pravatar.cc/150?u=avi',
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
  mockUser,
  {
    id: 'user-3',
    name: 'יעל ישראלי',
    email: 'yael@example.com',
    role: 'conservatorium_admin',
    conservatoriumId: 'cons-1',
    avatarUrl: 'https://i.pravatar.cc/150?u=yael',
  },
  {
    id: 'user-4',
    name: 'דנה שחר',
    email: 'dana@system.com',
    role: 'site_admin',
    conservatoriumId: 'global',
    avatarUrl: 'https://i.pravatar.cc/150?u=dana',
  },
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
  },
    {
    id: 'form-104',
    formType: 'רסיטל בגרות',
    studentId: 'user-7',
    studentName: 'רבקה גולן',
    status: 'נדחה',
    teacherComment: 'נא לבחור יצירה נוספת מהתקופה הרומנטית.',
    submissionDate: '2024-05-15',
    totalDuration: '09:00',
    repertoire: [
       { composer: 'היידן', title: 'סונטה ברה מז\'ור', duration: '09:00', genre: 'קלאסי' },
    ],
  },
];
