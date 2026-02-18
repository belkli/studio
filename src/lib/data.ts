import type { User, FormSubmission, Notification, Conservatorium, Composition } from './types';

export const conservatoriums: Conservatorium[] = [
  { id: 'cons-1', name: 'קונסרבטוריון הוד השרון', tier: 'A', stampUrl: 'https://picsum.photos/seed/stamp1/200/200' },
  { id: 'cons-2', name: 'הקונסרבטוריון הישראלי למוסיקה תל אביב', tier: 'A', stampUrl: 'https://picsum.photos/seed/stamp2/200/200' },
  { id: 'cons-3', name: 'קונסרבטוריון גבעתיים', tier: 'B', stampUrl: 'https://picsum.photos/seed/stamp3/200/200' },
  { id: 'cons-4', name: 'מרכז למוסיקה ובימת אמנויות רעננה', tier: 'A', stampUrl: 'https://picsum.photos/seed/stamp4/200/200' },
  { id: 'cons-5', name: 'קונסרבטוריון רון שולמית, ירושלים', tier: 'C', stampUrl: 'https://picsum.photos/seed/stamp5/200/200' },
  { id: 'cons-6', name: 'הקונסרבטוריון העירוני פתח תקוה', tier: 'B', stampUrl: 'https://picsum.photos/seed/stamp6/200/200' },
  { id: 'cons-7', name: 'קונסרבטוריון קרית אונו', tier: 'B', stampUrl: 'https://picsum.photos/seed/stamp7/200/200' },
  { id: 'cons-8', name: 'המרכז למוסיקה ירושלים, משכנות שאננים', tier: 'A', stampUrl: 'https://picsum.photos/seed/stamp8/200/200' },
  { id: 'cons-9', name: 'קונסרבטוריון עירוני ראשון לציון', tier: 'A', stampUrl: 'https://picsum.photos/seed/stamp9/200/200' },
  { id: 'cons-10', name: 'קונסרבטוריון עירוני נתניה', tier: 'B', stampUrl: 'https://picsum.photos/seed/stamp10/200/200' },
  { id: 'cons-11', name: 'קונסרבטוריון כפר סבא', tier: 'B', stampUrl: 'https://picsum.photos/seed/stamp11/200/200' },
  { id: 'cons-12', name: 'קונסרבטוריון "אקדמא" אשדוד', tier: 'C', stampUrl: 'https://picsum.photos/seed/stamp12/200/200' },
  { id: 'cons-13', name: 'הקונסרבטוריון העירוני באר שבע', tier: 'C', stampUrl: 'https://picsum.photos/seed/stamp13/200/200' },
  { id: 'cons-14', name: 'הקונסרבטוריון העירוני רחובות', tier: 'B', stampUrl: 'https://picsum.photos/seed/stamp14/200/200' },
  { id: 'cons-15', name: 'קונסרבטוריון "הסדנה" ירושלים', tier: 'C', stampUrl: 'https://picsum.photos/seed/stamp15/200/200' }
];

export const priceMatrix: Record<string, Record<string, Record<number, number>>> = {
  A: {
    Small: { 10: 10, 15: 15, 20: 20, 25: 25, 30: 30 },
    Medium: { 10: 15, 15: 20, 20: 25, 25: 30, 30: 35 },
    Large: { 10: 20, 15: 25, 20: 30, 25: 35, 30: 40 },
  },
  B: {
    Small: { 10: 12, 15: 16, 20: 22, 25: 27, 30: 32 },
    Medium: { 10: 16, 15: 22, 20: 27, 25: 32, 30: 37 },
    Large: { 10: 22, 15: 27, 20: 32, 25: 37, 30: 42 },
  },
  C: {
    Small: { 10: 13, 15: 18, 20: 23, 25: 28, 30: 33 },
    Medium: { 10: 18, 15: 23, 20: 28, 25: 33, 30: 38 },
    Large: { 10: 23, 15: 28, 20: 33, 25: 38, 30: 43 },
  },
};

export const instruments = ['פסנתר', 'כינור', 'צ\'לו', 'גיטרה', 'חליל צד', 'קלרינט', 'סקסופון', 'תופים', 'שירה'];
export const genres = ['קלאסי', 'ג\'אז', 'קל', 'ישראלי', 'פופ', 'רוק', 'עממי', 'בארוק', 'רומנטי', 'אימפרסיוניסטי', 'מודרני'];


export const schools = [
  { symbol: '44570001', name: 'תיכון הדרים, הוד השרון' },
  { symbol: '12345678', name: 'תיכון חדש, תל אביב' },
  { symbol: '87654321', name: 'תיכון הראשונים, הרצליה' },
  { symbol: '11223344', name: 'בית ספר לאמנויות, ירושלים' },
  { symbol: '22334455', name: 'תיכון אלון, רמת השרון' },
  { symbol: '99887766', name: 'תיכון קלעי, גבעתיים' },
];

export const compositions: Composition[] = [
  // Bach
  { id: 'bach-cello-suite-1', composer: 'יוהאן סבסטיאן באך', title: 'סוויטה לצ\'לו מס\' 1 בסול מז\'ור, רי"ב 1007', genre: 'בארוק', duration: '17:30', approved: true, source: 'seed' },
  { id: 'bach-wtc1-prelude-c', composer: 'יוהאן סבסטיאן באך', title: 'פרלוד ופוגה בדו מז\'ור, רי"ב 846 (מתוך הפסנתר המושווה, ספר א\')', genre: 'בארוק', duration: '04:00', approved: true, source: 'seed' },
  { id: 'bach-toccata-d-minor', composer: 'יוהאן סבסטיאן באך', title: 'טוקטה ופוגה ברה מינור, רי"ב 565', genre: 'בארוק', duration: '09:00', approved: true, source: 'seed' },
  { id: 'bach-air-on-g', composer: 'יוהאן סבסטיאן באך', title: 'אריה על מיתר סול (מתוך סוויטה תזמורתית מס\' 3)', genre: 'בארוק', duration: '05:00', approved: true, source: 'seed' },
  { id: 'bach-jesu-joy', composer: 'יוהאן סבסטיאן באך', title: 'Jesu, Joy of Man\'s Desiring', genre: 'בארוק', duration: '03:30', approved: true, source: 'seed' },
  
  // Beethoven
  { id: 'beethoven-moonlight-sonata', composer: 'לודוויג ואן בטהובן', title: 'סונאטה לפסנתר מס\' 14 בדו דיאז מינור, אופ. 27 מס\' 2 "אור ירח"', genre: 'קלאסי', duration: '15:00', approved: true, source: 'seed' },
  { id: 'beethoven-pathetique-sonata', composer: 'לודוויג ואן בטהובן', title: 'סונאטה לפסנתר מס\' 8 בדו מינור, אופ. 13 "הפאתטית"', genre: 'קלאסי', duration: '18:00', approved: true, source: 'seed' },
  { id: 'beethoven-fur-elise', composer: 'לודוויג ואן בטהובן', title: 'לאליזה (Für Elise)', genre: 'קלאסי', duration: '03:00', approved: true, source: 'seed' },
  { id: 'beethoven-symphony-5-1', composer: 'לודוויג ואן בטהובן', title: 'סימפוניה מס\' 5 בדו מינור, אופ. 67 - פרק 1', genre: 'קלאסי', duration: '07:30', approved: true, source: 'seed' },
  
  // Mozart
  { id: 'mozart-sonata-11', composer: 'וולפגנג אמדאוס מוצרט', title: 'סונאטה לפסנתר מס\' 11 בלה מז\'ור, ק. 331', genre: 'קלאסי', duration: '14:00', approved: true, source: 'seed' },
  { id: 'mozart-sonata-16', composer: 'וולפגנג אמדאוס מוצרט', title: 'סונאטה לפסנתר מס\' 16 בדו מז\'ור, ק. 545 "סונאטה פשוטה"', genre: 'קלאסי', duration: '11:00', approved: true, source: 'seed' },
  { id: 'mozart-eine-kleine', composer: 'וולפגנג אמדאוס מוצרט', title: 'מוזיקת לילה זעירה (Eine kleine Nachtmusik), סרנדה מס\' 13', genre: 'קלאסי', duration: '05:45', approved: true, source: 'seed' },
  
  // Chopin
  { id: 'chopin-nocturne-op9-no2', composer: 'פרדריק שופן', title: 'נוקטורן במי במול מז\'ור, אופ. 9 מס\' 2', genre: 'רומנטי', duration: '04:30', approved: true, source: 'seed' },
  { id: 'chopin-etude-op10-no12', composer: 'פרדריק שופן', title: 'אטיוד "המהפכה", אופ. 10 מס\' 12', genre: 'רומנטי', duration: '02:45', approved: true, source: 'seed' },
  { id: 'chopin-waltz-op64-no1', composer: 'פרדריק שופן', title: 'ולס "הדקה", אופ. 64 מס\' 1', genre: 'רומנטי', duration: '02:00', approved: true, source: 'seed' },
  { id: 'chopin-ballade-no1', composer: 'פרדריק שופן', title: 'בלדה מס\' 1 בסול מינור, אופ. 23', genre: 'רומנטי', duration: '09:30', approved: true, source: 'seed' },
  { id: 'chopin-polonaise-op53', composer: 'פרדריק שופן', title: 'פולונז "הגיבורי", אופ. 53', genre: 'רומנטי', duration: '07:00', approved: true, source: 'seed' },

  // Debussy
  { id: 'debussy-clair-de-lune', composer: 'קלוד דביסי', title: 'אור ירח (Clair de lune) מתוך סוויטה ברגמסק', genre: 'אימפרסיוניסטי', duration: '05:00', approved: true, source: 'seed' },
  { id: 'debussy-arabesque-1', composer: 'קלוד דביסי', title: 'ערבסקה מס\' 1', genre: 'אימפרסיוניסטי', duration: '04:30', approved: true, source: 'seed' },
  { id: 'debussy-girl-flaxen-hair', composer: 'קלוד דביסי', title: 'הנערה עם שער הפשתן (La fille aux cheveux de lin)', genre: 'אימפרסיוניסטי', duration: '02:30', approved: true, source: 'seed' },
  
  // Vivaldi
  { id: 'vivaldi-spring', composer: 'אנטוניו ויוואלדי', title: 'האביב (מתוך ארבע העונות)', genre: 'בארוק', duration: '10:00', approved: true, source: 'seed' },
  { id: 'vivaldi-winter', composer: 'אנטוניו ויוואלדי', title: 'החורף (מתוך ארבע העונות)', genre: 'בארוק', duration: '09:00', approved: true, source: 'seed' },

  // Liszt
  { id: 'liszt-liebestraum-3', composer: 'פרנץ ליסט', title: 'חלום אהבה מס\' 3 (Liebestraum No. 3)', genre: 'רומנטי', duration: '04:45', approved: true, source: 'seed' },
  { id: 'liszt-hungarian-rhapsody-2', composer: 'פרנץ ליסט', title: 'רפסודיה הונגרית מס\' 2', genre: 'רומנטי', duration: '09:30', approved: true, source: 'seed' },

  // Schubert
  { id: 'schubert-impromptu-op90-no3', composer: 'פרנץ שוברט', title: 'אימפרומפטו בסול במול מז\'ור, אופ. 90 מס\' 3', genre: 'רומנטי', duration: '06:00', approved: true, source: 'seed' },
  { id: 'schubert-ave-maria', composer: 'פרנץ שוברט', title: 'אווה מריה', genre: 'רומנטי', duration: '05:00', approved: true, source: 'seed' },
];

// --- Mock Notifications ---
const studentNotifications: Notification[] = [
  { id: 'notif-s1', title: 'הטופס שלך אושר!', message: 'הטופס "רסיטל בגרות" אושר על ידי מרים כהן.', timestamp: 'לפני 2 ימים', link: '/dashboard/forms/form-101', read: false },
  { id: 'notif-s2', title: 'הערה חדשה על טופס', message: 'המורה שלך הוסיפה הערה על הטופס.', timestamp: 'לפני 5 ימים', link: '/dashboard/forms/form-101', read: true },
];

const teacherNotifications: Notification[] = [
  { id: 'notif-t1', title: 'טופס חדש לאישור', message: 'אריאל לוי הגיש/ה טופס "רסיטל בגרות".', timestamp: 'לפני 3 שעות', link: '/dashboard/forms/form-101', read: false },
  { id: 'notif-t2', title: 'הטופס של תמר אושר', message: 'הטופס "קונצרט כיתתי" של תמר ישראלי אושר סופית.', timestamp: 'לפני יום', link: '/dashboard/forms/form-102', read: true },
];

const adminNotifications: Notification[] = [
  { id: 'notif-a1', title: 'משתמש חדש ממתין לאישור', message: 'ישראל ישראלי נרשם כמורה וממתין לאישורך.', timestamp: 'לפני 10 דקות', link: '/dashboard/users', read: false },
  { id: 'notif-a2', title: 'טופס חדש לאישור סופי', message: 'טופס של אריאל לוי אושר על ידי המורה וממתין לאישור סופי.', timestamp: 'לפני שעה', link: '/dashboard/forms/form-101', read: false },
  { id: 'notif-a3', title: 'אישרת טופס', message: 'הטופס "קונצרט כיתתי" של תמר ישראלי אושר.', timestamp: 'לפני יום', link: '/dashboard/forms/form-102', read: true },
];

const siteAdminNotifications: Notification[] = [
    { id: 'notif-sa1', title: 'שגיאת מערכת', message: 'זוהתה שגיאה בשרת ה-API.', timestamp: 'לפני 4 שעות', link: '#', read: true },
];


// --- Mock Users ---
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
  conservatoriumStudyYears: 10,
  instruments: [
    { instrument: 'פסנתר', teacherName: 'מרים כהן', yearsOfStudy: 10 },
  ],
  approved: true,
  notifications: studentNotifications,
};

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
  conservatoriumStudyYears: 8,
  instruments: [
    { instrument: 'כינור', teacherName: 'מרים כהן', yearsOfStudy: 8 },
    { instrument: 'חליל צד', teacherName: 'דוד המלך', yearsOfStudy: 2 },
  ],
  approved: true,
  notifications: [],
};

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
    conservatoriumStudyYears: 6,
    instruments: [
        { instrument: 'גיטרה', teacherName: 'גלית שפירא', yearsOfStudy: 6 },
    ],
    approved: true,
    notifications: [],
};

const pendingTeacher: User = {
  id: 'pending-teacher-1',
  name: 'ישראל ישראלי',
  email: 'pending.teacher@example.com',
  role: 'teacher',
  conservatoriumId: 'cons-1',
  conservatoriumName: 'קונסרבטוריון הוד השרון',
  avatarUrl: 'https://i.pravatar.cc/150?u=pending-teacher',
  approved: false,
  notifications: [],
};


const teacherUser: User = {
  id: 'teacher-user-1',
  name: 'מרים כהן',
  email: 'teacher@example.com',
  role: 'teacher',
  conservatoriumId: 'cons-1',
  conservatoriumName: 'קונסרבטוריון הוד השרון',
  avatarUrl: 'https://i.pravatar.cc/150?u=teacher',
  idNumber: '444444444',
  phone: '054-4444444',
  students: [studentUser.id, studentUser2.id],
  approved: true,
  notifications: teacherNotifications,
};

const teacherUser2: User = {
  id: 'teacher-user-2',
  name: 'דוד המלך',
  email: 'teacher2@example.com',
  role: 'teacher',
  conservatoriumId: 'cons-1',
  conservatoriumName: 'קונסרבטוריון הוד השרון',
  avatarUrl: 'https://i.pravatar.cc/150?u=teacher2',
  idNumber: '555555555',
  phone: '054-5555555',
  students: [studentUser2.id],
  approved: true,
  notifications: [],
};

const teacherUser3: User = {
  id: 'teacher-user-3',
  name: 'גלית שפירא',
  email: 'teacher3@example.com',
  role: 'teacher',
  conservatoriumId: 'cons-3',
  conservatoriumName: 'קונסרבטוריון גבעתיים',
  avatarUrl: 'https://i.pravatar.cc/150?u=teacher3',
  idNumber: '666666666',
  phone: '054-6666666',
  students: [otherStudent.id],
  approved: true,
  notifications: [],
};

const conservatoriumAdminUser: User = {
  id: 'conservatorium-admin-user-1',
  name: 'משה שפירא',
  email: 'conservatorium.admin@example.com',
  role: 'conservatorium_admin',
  conservatoriumId: 'cons-1',
  conservatoriumName: 'קונסרבטוריון הוד השרון',
  avatarUrl: 'https://i.pravatar.cc/150?u=cons-admin',
  idNumber: '777777777',
  phone: '054-7777777',
  students: [studentUser.id, studentUser2.id],
  approved: true,
  notifications: adminNotifications,
};

const conservatoriumAdminUser2: User = {
  id: 'conservatorium-admin-user-2',
  name: 'רוני מאיר',
  email: 'conservatorium.admin2@example.com',
  role: 'conservatorium_admin',
  conservatoriumId: 'cons-3',
  conservatoriumName: 'קונסרבטוריון גבעתיים',
  avatarUrl: 'https://i.pravatar.cc/150?u=cons-admin2',
  idNumber: '888888888',
  phone: '054-8888888',
  students: [otherStudent.id],
  approved: true,
  notifications: [],
};

export const siteAdminUser: User = {
  id: 'site-admin-user-1',
  name: 'דנה המנהלת',
  email: 'site.admin@example.com',
  role: 'site_admin',
  conservatoriumId: 'global',
  conservatoriumName: 'מנהל מערכת',
  avatarUrl: 'https://i.pravatar.cc/150?u=site-admin',
  idNumber: '999999999',
  phone: '054-9999999',
  approved: true,
  notifications: siteAdminNotifications,
};

export const mockUsers: User[] = [
  studentUser,
  studentUser2,
  teacherUser,
  teacherUser2,
  teacherUser3,
  conservatoriumAdminUser,
  conservatoriumAdminUser2,
  siteAdminUser,
  otherStudent,
  pendingTeacher,
];

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
      { id: 'bach-wtc1-prelude-c', composer: 'יוהאן סבסטיאן באך', title: 'פרלוד ופוגה בדו מז\'ור, רי"ב 846 (מתוך הפסנתר המושווה, ספר א\')', duration: '04:00', genre: 'בארוק' },
      { id: 'chopin-nocturne-op9-no2', composer: 'פרדריק שופן', title: 'נוקטורן במי במול מז\'ור, אופ. 9 מס\' 2', duration: '05:00', genre: 'רומנטי' },
      { id: 'beethoven-fur-elise', composer: 'לודוויג ואן בטהובן', title: 'לאליזה (Für Elise)', duration: '03:00', genre: 'קלאסי' },
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
      { id: 'mozart-sonata-16', composer: 'וולפגנג אמדאוס מוצרט', title: 'סונאטה לפסנתר מס\' 16 בדו מז\'ור, ק. 545 "סונאטה פשוטה"', duration: '08:15', genre: 'קלאסי' },
    ],
    conservatoriumName: studentUser2.conservatoriumName,
    conservatoriumManagerName: conservatoriumAdminUser.name,
    signatureUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAACWCAYAAABkW7XSAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAARnSURBVHhe7dRBDQAgEMCw9/6/9EIBCa9A1c2AAdgbCxRYgQUGLMCgAgUWGLCAgQoUWGDCAgYqUGCBBQYswKACBRYYsICBCgRXYAEGFigwAYMKFFhgwAICJlBgAQGLAahAgQUWGLCAgQoUWGDCAgYqUGCBBQYswKACBRYYsICBCgRXYAEGFigwAYMKFFhgwAICJlBgAQGLAahAgQUWGLCAgQoUWGDCAgYqUGCBBQYswKACBRYYsICBCgRXYAEGFigwAYMKFFhgwAICJlBgAQGLAahAgQUWGLCAgQoUWGDCAgYqUGCBBQYswKACBRYYsICBCgRXYAEGFigwAYMKFFhgwAICJlBgAQGLAahAgQUWGLCAgQoUWGDCAgYqUGCBBQYswKACBRYYsICBCgRXYAEGFigwAYMKFFhgwAICJlBgAQGLAahAgQUWGLCAgQoUWGDCAgYqUGCBBQYswKACBRYYsICBCgRXYAEGFigwAYMKFFhgwAICJlBgAQGLAahAgQUWGLCAgQoUWGDCAgYqUGCBBQYswKACBRYYsICBCgRXYAEGFigwAYMKFFhgwAICJlBgAQGLAahAgQUWGLCAgQoUWGDCAgYqUGCBBQYswKACBRYYsICBCgRXYAEGFigwAYMKFFhgwAICJlBgAQGLAahAgQUWGLCAgQoUWGDCAgYqUGCBBQYswKACBRYYsICBCgRXYAEGFigwAYMKFFhgwAICJlBgAQGLAahAgQUWGLCAgQoUWGDCAgYqUGCBBQYswKACBRYYsICBCgRXYAEGFigwAYMKFFhgwAICJlBgAQGLAahAgQUWGLCAgQoUWGDCAgYqUGCBBQYswKACBRYYsICBCgRXYAEGFigwAYMKFFhgwAICJlBgAQGLAahAgQUWGLCAgQoUWGDCAgYqUGCBBQYswKACBRYYsICBCgRXYAEGFigwAYMKFFhgwAICJlBgAQGLAahAgQUWGLCAgQoUWGDCAgYqUGCBBQYswKACBRYYsICBCgRXYAEGFigwAYMKFFhgwAICJlBgAQGLAahAgQUWGLCAgQoUWGDCAgYqUGCBBQYswKACBRYYsICBCgRXYAEGFigwAYMKFFhgwAICJlBgAQGLAahAgQUWGLCAgQoUWGDCAgYqUGCBBQYswKACBRYYsICBCgRXYAEGFigwAYMKFFhgwAICJlBgAQGLAahAgQUWGLCAgQoUWGDCAgYqUGCBBQYswKACBRYYsICBCgRXYAEGFigwAYMKFFhgwAICJlBgAQGLAahAgQUWGLCAgQoUWGDCAgYqUGCBBQYswKACBRYYsICBCgRXYAEGFigwAYMKFFhgwAICJlBgAQGLAahAgQUWGLCAgQoUWGDCAgYqUGCBBQYswKACBRYYsICBCgRXYAEGFigwAYMKFFhgwAICJlBgAQGLAahAgQUWGLCAgQoUWGDCAgYqUGCBBQYswKACBRYYsICBCgRXYAEGFigwAYMKFFhgwAICJlBgAQGLAahAgQUWGLCAgQoUWGDCAgYqUGCBBQYswKACBRYYsICBCgRXYAEGFigwAYMKFFhgwAICJlBgAQGLAahAgQUWGLCAgQoUWGDCAgYq0HwBDK+xMv2+4DEAAAAASUVORK5CYII=', // Placeholder signature
    signedAt: '2024-05-19',
    calculatedPrice: 10,
    paymentStatus: 'paid',
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
       { id: 'comp-clementi', composer: 'קלמנטי', title: 'סונטינה אופ. 36 מס\' 1', duration: '04:00', genre: 'קלאסי' },
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
       { id: 'comp-haydn', composer: 'היידן', title: 'סונטה ברה מז\'ור', duration: '09:00', genre: 'קלאסי' },
    ],
     conservatoriumName: 'מרכז למוסיקה ובימת אמנויות רעננה',
  },
  {
    id: 'form-105',
    formType: 'רסיטל בגרות',
    academicYear: 'תשפ"ד',
    grade: 'יא',
    studentId: studentUser2.id,
    studentName: studentUser2.name,
    status: 'ממתין לאישור מנהל',
    submissionDate: '2024-05-23',
    totalDuration: '21:00',
    repertoire: [
      { id: 'bach-wtc1-prelude-c', composer: 'יוהאן סבסטיאן באך', title: 'פרלוד ופוגה בדו מז\'ור, רי"ב 846 (מתוך הפסנתר המושווה, ספר א\')', duration: '04:00', genre: 'בארוק' },
      { id: 'mozart-eine-kleine', composer: 'וולפגנג אמדאוס מוצרט', title: 'מוזיקת לילה זעירה (Eine kleine Nachtmusik), סרנדה מס\' 13', duration: '05:45', genre: 'קלאסי' },
      { id: 'chopin-nocturne-op9-no2', composer: 'פרדריק שופן', title: 'נוקטורן במי במול מז\'ור, אופ. 9 מס\' 2', duration: '04:30', genre: 'רומנטי' },
      { id: 'beethoven-moonlight-sonata', composer: 'לודוויג ואן בטהובן', title: 'סונאטה לפסנתר מס\' 14 בדו דיאז מינור, אופ. 27 מס\' 2 "אור ירח"', duration: '15:00', genre: 'קלאסי' }
    ],
    conservatoriumName: studentUser2.conservatoriumName,
    teacherDetails: {
      name: teacherUser.name,
    }
  },
];
