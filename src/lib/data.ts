import type { User, FormSubmission, UserRole } from './types';

export const conservatoriums = [
  { id: 'cons-1', name: 'קונסרבטוריון הוד השרון' },
  { id: 'cons-2', name: 'הקונסרבטוריון הישראלי למוסיקה תל אביב' },
  { id: 'cons-3', name: 'קונסרבטוריון גבעתיים' },
  { id: 'cons-4', name: 'מרכז למוסיקה ובימת אמנויות רעננה' },
];

export const instruments = ['פסנתר', 'כינור', 'צ\'לו', 'גיטרה', 'חליל צד', 'קלרינט', 'סקסופון', 'תופים', 'שירה'];

export const schools = [
  { symbol: '44570001', name: 'תיכון הדרים, הוד השרון' },
  { symbol: '12345678', name: 'תיכון חדש, תל אביב' },
  { symbol: '87654321', name: 'תיכון הראשונים, הרצליה' },
  { symbol: '11223344', name: 'בית ספר לאמנויות, ירושלים' },
  { symbol: '22334455', name: 'תיכון אלון, רמת השרון' },
];

const student1: User = {
  id: 'user-1',
  name: 'משה לוי',
  email: 'moshe@example.com',
  role: 'student',
  conservatoriumId: 'cons-1',
  conservatoriumName: 'קונסרבטוריון הוד השרון',
  instrument: 'פסנתר',
  avatarUrl: 'https://i.pravatar.cc/150?u=moshe',
  idNumber: '123456789',
  schoolName: 'תיכון הדרים, הוד השרון',
  schoolSymbol: '44570001',
  birthDate: '2006-01-15',
  city: 'הוד השרון',
  gender: 'זכר',
  phone: '050-1234567',
  grade: 'יב',
  yearsOfStudy: 10,
  teacherName: 'אבי כהן',
  yearsWithTeacher: 3,
};

const student2: User = {
  id: 'user-5',
  name: 'שרה כהן',
  email: 'sara@example.com',
  role: 'student',
  conservatoriumId: 'cons-1',
  conservatoriumName: 'קונסרבטוריון הוד השרון',
  instrument: 'כינור',
  avatarUrl: 'https://i.pravatar.cc/150?u=sara',
  idNumber: '987654321',
  schoolName: 'תיכון הדרים, הוד השרון',
  schoolSymbol: '44570001',
  birthDate: '2007-03-20',
  city: 'הוד השרון',
  gender: 'נקבה',
  phone: '052-7654321',
  grade: 'יא',
  yearsOfStudy: 8,
  teacherName: 'אבי כהן',
  yearsWithTeacher: 2,
};

const student3: User = {
  id: 'user-6',
  name: 'דוד ביטון',
  email: 'david@example.com',
  role: 'student',
  conservatoriumId: 'cons-3',
  conservatoriumName: 'קונסרבטוריון גבעתיים',
  instrument: 'גיטרה',
  avatarUrl: 'https://i.pravatar.cc/150?u=david',
  idNumber: '112233445',
  schoolName: 'תיכון קלעי, גבעתיים',
  schoolSymbol: '99887766',
  birthDate: '2006-08-10',
  city: 'גבעתיים',
  gender: 'זכר',
  phone: '054-1122334',
  grade: 'יב',
  yearsOfStudy: 6,
  teacherName: 'גלית שפירא',
  yearsWithTeacher: 4,
};


const teacher1: User = {
  id: 'user-2',
  name: 'אבי כהן',
  email: 'avi@example.com',
  role: 'teacher',
  conservatoriumId: 'cons-1',
  conservatoriumName: 'קונסרבטוריון הוד השרון',
  avatarUrl: 'https://i.pravatar.cc/150?u=avi',
  students: [student1.id, student2.id]
};

const conservatoriumAdmin: User = {
  id: 'user-3',
  name: 'יעל ישראלי',
  email: 'yael@example.com',
  role: 'conservatorium_admin',
  conservatoriumId: 'cons-1',
  conservatoriumName: 'קונסרבטוריון הוד השרון',
  avatarUrl: 'https://i.pravatar.cc/150?u=yael',
  students: [student1.id, student2.id] // An admin can also see all students
};

const siteAdmin: User = {
  id: 'user-4',
  name: 'דנה שחר',
  email: 'dana@system.com',
  role: 'site_admin',
  conservatoriumId: 'global',
  conservatoriumName: 'מנהל מערכת',
  avatarUrl: 'https://i.pravatar.cc/150?u=dana',
  instrument: 'ניהול',
};

// The full list of users in the system
export const mockUsers: User[] = [
  student1,
  student2,
  student3,
  teacher1,
  conservatoriumAdmin,
  siteAdmin
];

// The currently "logged in" user. Change this to test different roles.
export const mockUser: User = teacher1;


export const mockFormSubmissions: FormSubmission[] = [
  {
    id: 'form-101',
    formType: 'רסיטל בגרות',
    academicYear: 'תשפ"ד',
    grade: 'יב',
    studentId: student1.id,
    studentName: student1.name,
    status: 'ממתין לאישור מורה',
    submissionDate: '2024-05-20',
    totalDuration: '12:30',
    repertoire: [
      { composer: 'באך', title: 'פרלוד בדו מז\'ור', duration: '02:30', genre: 'קלאסי' },
      { composer: 'שופן', title: 'נוקטורן אופ. 9 מס\' 2', duration: '05:00', genre: 'קלאסי' },
      { composer: 'בטהובן', title: 'לאליזה', duration: '05:00', genre: 'קלאסי' },
    ],
    conservatoriumName: student1.conservatoriumName,
    applicantDetails: {
      birthDate: student1.birthDate,
      city: student1.city,
      gender: student1.gender,
      phone: student1.phone
    },
    schoolDetails: {
      schoolName: student1.schoolName,
      hasMusicMajor: true,
      isMajorParticipant: true,
      plansTheoryExam: true
    },
    teacherDetails: {
      name: student1.teacherName,
      yearsWithTeacher: student1.yearsWithTeacher,
    }
  },
  {
    id: 'form-102',
    formType: 'קונצרט כיתתי',
    studentId: student2.id,
    studentName: student2.name,
    status: 'מאושר',
    submissionDate: '2024-05-18',
    totalDuration: '08:15',
    repertoire: [
      { composer: 'מוצרט', title: 'סונטה ק. 545', duration: '08:15', genre: 'קלאסי' },
    ],
    conservatoriumName: student2.conservatoriumName,
  },
  {
    id: 'form-103',
    formType: 'מבחן שלב',
    studentId: student3.id,
    studentName: student3.name,
    status: 'טיוטה',
    submissionDate: '2024-05-21',
    totalDuration: '04:00',
    repertoire: [
       { composer: 'קלמנטי', title: 'סונטינה אופ. 36 מס\' 1', duration: '04:00', genre: 'קלאסי' },
    ],
    conservatoriumName: student3.conservatoriumName,
  },
  {
    id: 'form-104',
    formType: 'רסיטל בגרות',
    academicYear: 'תשפ"ג',
    grade: 'יא',
    studentId: 'user-7', // A student not in the main list for variety
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
