import type { User, FormSubmission, UserRole, InstrumentInfo } from './types';

export const conservatoriums = [
  { id: 'cons-1', name: 'קונסרבטוריון הוד השרון' },
  { id: 'cons-2', name: 'הקונסרבטוריון הישראלי למוסיקה תל אביב' },
  { id: 'cons-3', name: 'קונסרבטוריון גבעתיים' },
  { id: 'cons-4', name: 'מרכז למוסיקה ובימת אמנויות רעננה' },
  { id: 'cons-5', name: 'קונסרבטוריון רון שולמית, ירושלים' },
  { id: 'cons-6', name: 'הקונסרבטוריון העירוני פתח תקוה' },
  { id: 'cons-7', name: 'קונסרבטוריון קרית אונו' },
  { id: 'cons-8', name: 'המרכז למוסיקה ירושלים, משכנות שאננים' },
];

export const instruments = ['פסנתר', 'כינור', 'צ\'לו', 'גיטרה', 'חליל צד', 'קלרינט', 'סקסופון', 'תופים', 'שירה'];

export const schools = [
  { symbol: '44570001', name: 'תיכון הדרים, הוד השרון' },
  { symbol: '12345678', name: 'תיכון חדש, תל אביב' },
  { symbol: '87654321', name: 'תיכון הראשונים, הרצליה' },
  { symbol: '11223344', name: 'בית ספר לאמנויות, ירושלים' },
  { symbol: '22334455', name: 'תיכון אלון, רמת השרון' },
  { symbol: '99887766', name: 'תיכון קלעי, גבעתיים' },
];

// --- Mock Users ---

// 1. Student User
const studentUser: User = {
  id: 'student-user-1',
  name: 'אריאל לוי',
  email: 'student@example.com',
  role: 'student',
  conservatoriumId: 'cons-1',
  conservatoriumName: 'קונסרבטוריון הוד השרון',
  avatarUrl: 'https://i.pravatar.cc/150?u=student',
  idNumber: '111111111',
  schoolName: 'תיכון הדרים, הוד השרון',
  schoolSymbol: '44570001',
  birthDate: '2006-05-10',
  city: 'הוד השרון',
  gender: 'זכר',
  phone: '050-1111111',
  grade: 'יב',
  instruments: [
    { instrument: 'פסנתר', teacherName: 'מרים כהן', yearsOfStudy: 10 },
  ],
};

// Another student for the teacher
const studentUser2: User = {
  id: 'student-user-2',
  name: 'תמר ישראלי',
  email: 'student2@example.com',
  role: 'student',
  conservatoriumId: 'cons-1',
  conservatoriumName: 'קונסרבטוריון הוד השרון',
  avatarUrl: 'https://i.pravatar.cc/150?u=student2',
  idNumber: '222222222',
  schoolName: 'תיכון הדרים, הוד השרון',
  schoolSymbol: '44570001',
  birthDate: '2007-02-15',
  city: 'כפר סבא',
  gender: 'נקבה',
  phone: '052-2222222',
  grade: 'יא',
  instruments: [
    { instrument: 'כינור', teacherName: 'מרים כהן', yearsOfStudy: 8 },
    { instrument: 'חליל צד', teacherName: 'דוד המלך', yearsOfStudy: 2 },
  ],
};

// A student from another conservatorium for site admin testing
const otherStudent: User = {
    id: 'other-student-1',
    name: 'יונתן כץ',
    email: 'other.student@example.com',
    role: 'student',
    conservatoriumId: 'cons-3',
    conservatoriumName: 'קונסרבטוריון גבעתיים',
    avatarUrl: 'https://i.pravatar.cc/150?u=other-student',
    idNumber: '333333333',
    schoolName: 'תיכון קלעי, גבעתיים',
    schoolSymbol: '99887766',
    birthDate: '2006-08-10',
    city: 'גבעתיים',
    gender: 'זכר',
    phone: '054-3333333',
    grade: 'יב',
    instruments: [
        { instrument: 'גיטרה', teacherName: 'גלית שפירא', yearsOfStudy: 6 },
    ],
};


// 2. Teacher User
const teacherUser: User = {
  id: 'teacher-user-1',
  name: 'מרים כהן',
  email: 'teacher@example.com',
  role: 'teacher',
  conservatoriumId: 'cons-1',
  conservatoriumName: 'קונסרבטוריון הוד השרון',
  avatarUrl: 'https://i.pravatar.cc/150?u=teacher',
  students: [studentUser.id, studentUser2.id]
};

const teacherUser2: User = {
  id: 'teacher-user-2',
  name: 'דוד המלך',
  email: 'teacher2@example.com',
  role: 'teacher',
  conservatoriumId: 'cons-1',
  conservatoriumName: 'קונסרבטוריון הוד השרון',
  avatarUrl: 'https://i.pravatar.cc/150?u=teacher2',
  students: [studentUser2.id]
};

const teacherUser3: User = {
  id: 'teacher-user-3',
  name: 'גלית שפירא',
  email: 'teacher3@example.com',
  role: 'teacher',
  conservatoriumId: 'cons-3',
  conservatoriumName: 'קונסרבטוריון גבעתיים',
  avatarUrl: 'https://i.pravatar.cc/150?u=teacher3',
  students: [otherStudent.id]
};


// 3. Conservatorium Admin User
const conservatoriumAdminUser: User = {
  id: 'conservatorium-admin-user-1',
  name: 'משה שפירא',
  email: 'conservatorium.admin@example.com',
  role: 'conservatorium_admin',
  conservatoriumId: 'cons-1',
  conservatoriumName: 'קונסרבטוריון הוד השרון',
  avatarUrl: 'https://i.pravatar.cc/150?u=cons-admin',
  students: [studentUser.id, studentUser2.id] // An admin can see all students in their conservatorium
};

const conservatoriumAdminUser2: User = {
  id: 'conservatorium-admin-user-2',
  name: 'רוני מאיר',
  email: 'conservatorium.admin2@example.com',
  role: 'conservatorium_admin',
  conservatoriumId: 'cons-3',
  conservatoriumName: 'קונסרבטוריון גבעתיים',
  avatarUrl: 'https://i.pravatar.cc/150?u=cons-admin2',
  students: [otherStudent.id]
};

// 4. Site Admin User
const siteAdminUser: User = {
  id: 'site-admin-user-1',
  name: 'דנה המנהלת',
  email: 'site.admin@example.com',
  role: 'site_admin',
  conservatoriumId: 'global',
  conservatoriumName: 'מנהל מערכת',
  avatarUrl: 'https://i.pravatar.cc/150?u=site-admin',
};

// The full list of users in the system
export const mockUsers: User[] = [
  studentUser,
  studentUser2,
  teacherUser,
  teacherUser2,
  teacherUser3,
  conservatoriumAdminUser,
  conservatoriumAdminUser2,
  siteAdminUser,
  otherStudent
];

// The currently "logged in" user. Change this to test different roles.
// To test, change this to one of: studentUser, teacherUser, conservatoriumAdminUser, siteAdminUser
export const mockUser: User = siteAdminUser;


export const mockFormSubmissions: FormSubmission[] = [
  {
    id: 'form-101',
    formType: 'רסיטל בגרות',
    academicYear: 'תשפ"ד',
    grade: 'יב',
    studentId: studentUser.id,
    studentName: studentUser.name,
    status: 'ממתין לאישור מורה',
    submissionDate: '2024-05-20',
    totalDuration: '12:30',
    repertoire: [
      { composer: 'באך', title: 'פרלוד בדו מז\'ור', duration: '02:30', genre: 'קלאסי' },
      { composer: 'שופן', title: 'נוקטורן אופ. 9 מס\' 2', duration: '05:00', genre: 'קלאסי' },
      { composer: 'בטהובן', title: 'לאליזה', duration: '05:00', genre: 'קלאסי' },
    ],
    conservatoriumName: studentUser.conservatoriumName,
    applicantDetails: {
      birthDate: studentUser.birthDate,
      city: studentUser.city,
      gender: studentUser.gender,
      phone: studentUser.phone
    },
    schoolDetails: {
      schoolName: studentUser.schoolName,
      hasMusicMajor: true,
      isMajorParticipant: true,
      plansTheoryExam: true
    },
    teacherDetails: {
      name: studentUser.instruments?.[0]?.teacherName,
      yearsWithTeacher: studentUser.instruments?.[0]?.yearsOfStudy,
    }
  },
  {
    id: 'form-102',
    formType: 'קונצרט כיתתי',
    studentId: studentUser2.id,
    studentName: studentUser2.name,
    status: 'מאושר',
    submissionDate: '2024-05-18',
    totalDuration: '08:15',
    repertoire: [
      { composer: 'מוצרט', title: 'סונטה ק. 545', duration: '08:15', genre: 'קלאסי' },
    ],
    conservatoriumName: studentUser2.conservatoriumName,
  },
  {
    id: 'form-103',
    formType: 'מבחן שלב',
    studentId: otherStudent.id,
    studentName: otherStudent.name,
    status: 'טיוטה',
    submissionDate: '2024-05-21',
    totalDuration: '04:00',
    repertoire: [
       { composer: 'קלמנטי', title: 'סונטינה אופ. 36 מס\' 1', duration: '04:00', genre: 'קלאסי' },
    ],
    conservatoriumName: otherStudent.conservatoriumName,
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
