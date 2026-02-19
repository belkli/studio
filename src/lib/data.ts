import type { User, FormSubmission, Notification, Conservatorium, Package, LessonSlot, Invoice, PracticeLog } from './types';
import constAdminData from '../../docs/constadmin.json';

const tierCycle: ('A' | 'B' | 'C')[] = ['A', 'B', 'C'];

// Generate Conservatoriums from the JSON file
export const conservatoriums: Conservatorium[] = constAdminData.map((admin, index) => ({
  id: `cons-${admin.id}`,
  name: admin.location, // Using location as the conservatorium name
  tier: tierCycle[index % 3], // Cycle through tiers A, B, C for variety
  stampUrl: `https://picsum.photos/seed/stamp${admin.id}/200/200`,
  // Enable new features for "הוד השרון" for demonstration purposes
  newFeaturesEnabled: admin.location === 'הוד השרון', 
}));

export const priceMatrix: Record<string, Record<string, Record<number, number>>> = {
  A: { Small: { 10: 10, 15: 15, 20: 20, 25: 25, 30: 30 }, Medium: { 10: 15, 15: 20, 20: 25, 25: 30, 30: 35 }, Large: { 10: 20, 15: 25, 20: 30, 25: 35, 30: 40 }, },
  B: { Small: { 10: 12, 15: 16, 20: 22, 25: 27, 30: 32 }, Medium: { 10: 16, 15: 22, 20: 27, 25: 32, 30: 37 }, Large: { 10: 22, 15: 27, 20: 32, 25: 37, 30: 42 }, },
  C: { Small: { 10: 13, 15: 18, 20: 23, 25: 28, 30: 33 }, Medium: { 10: 18, 15: 23, 20: 28, 25: 33, 30: 38 }, Large: { 10: 23, 15: 28, 20: 33, 25: 38, 30: 43 }, },
};

export const instruments = ['פסנתר', 'כינור', 'צ\'לו', 'גיטרה', 'חליל צד', 'קלרינט', 'סקסופון', 'תופים', 'שירה'];
export const genres = ['קלאסי', 'ג\'אז', 'קל', 'ישראלי', 'פופ', 'רוק', 'עממי', 'בארוק', 'רומנטי', 'אימפרסיוניסטי', 'מודרני'];
export const teacherSpecialties = [
    {id: 'EXAM_PREP', label: 'הכנה לבחינות'},
    {id: 'EARLY_CHILDHOOD', label: 'גיל הרך'},
    {id: 'PERFORMANCE', label: 'הכנה להופעות'},
    {id: 'JAZZ', label: 'ג׳אז ואימפרוביזציה'},
    {id: 'THEORY', label: 'תאוריה וקומפוזיציה'},
    {id: 'SPECIAL_NEEDS', label: 'צרכים מיוחדים'},
    {id: 'BEGINNER_ADULTS', label: 'מתחילים מבוגרים'},
    {id: 'ENSEMBLE', label: 'הדרכת הרכבים'},
];
export const languages = [{id: 'HE', label: 'עברית'}, {id: 'EN', label: 'אנגלית'}, {id: 'AR', label: 'ערבית'}, {id: 'RU', label: 'רוסית'}];

export const schools = [
  { symbol: '44570001', name: 'תיכון הדרים, הוד השרון' }, { symbol: '12345678', name: 'תיכון חדש, תל אביב' }, { symbol: '87654321', name: 'תיכון הראשונים, הרצליה' }, { symbol: '11223344', name: 'בית ספר לאמנויות, ירושלים' }, { symbol: '22334455', name: 'תיכון אלון, רמת השרון' }, { symbol: '99887766', name: 'תיכון קלעי, גבעתיים' },
];

// --- Mock Notifications ---
const studentNotifications: Notification[] = [
  { id: 'notif-s1', title: 'הטופס שלך אושר!', message: 'הטופס "רסיטל בגרות" אושר על ידי מרים כהן.', timestamp: 'לפני 2 ימים', link: '/dashboard/forms/form-101', read: false },
  { id: 'notif-s2', title: 'הערה חדשה על טופס', message: 'המורה שלך הוסיפה הערה על הטופס.', timestamp: 'לפני 5 ימים', link: '/dashboard/forms/form-101', read: true },
];

const parentNotifications: Notification[] = [
    { id: 'notif-p1', title: 'תזכורת שיעור', message: 'השיעור של אריאל יתקיים מחר בשעה 16:00.', timestamp: 'לפני יום', link: '/dashboard/schedule', read: false},
    { id: 'notif-p2', title: 'חיוב חדש', message: 'חשבונית חדשה על סך 450 ש"ח הופקה.', timestamp: 'לפני 3 ימים', link: '/dashboard/billing', read: true},
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

const siteAdminNotifications: Notification[] = [ { id: 'notif-sa1', title: 'שגיאת מערכת', message: 'זוהתה שגיאה בשרת ה-API.', timestamp: 'לפני 4 שעות', link: '#', read: true }, ];

// --- Mock Users ---
const studentUser: User = {
  id: 'student-user-1', name: 'אריאל לוי', email: 'student@example.com', role: 'student', conservatoriumId: 'cons-15', conservatoriumName: 'הוד השרון', avatarUrl: 'https://i.pravatar.cc/150?u=student', idNumber: '111111111', schoolName: 'תיכון הדרים, הוד השרון', schoolSymbol: '44570001', birthDate: '2006-05-10', city: 'הוד השרון', gender: 'זכר', phone: '050-1111111', grade: 'יב', conservatoriumStudyYears: 10, instruments: [ { instrument: 'פסנתר', teacherName: 'מרים כהן', yearsOfStudy: 10 }, ], approved: true, notifications: studentNotifications, parentId: 'parent-user-1'
};

const parentUser: User = {
    id: 'parent-user-1', name: 'דני לוי', email: 'parent@example.com', role: 'parent', conservatoriumId: 'cons-15', conservatoriumName: 'הוד השרון', avatarUrl: 'https://i.pravatar.cc/150?u=parent', idNumber: '987654321', phone: '050-9876543', approved: true, childIds: [studentUser.id], notifications: parentNotifications,
}

const studentUser2: User = {
  id: 'student-user-2', name: 'תמר ישראלי', email: 'student2@example.com', role: 'student', conservatoriumId: 'cons-15', conservatoriumName: 'הוד השרון', avatarUrl: 'https://i.pravatar.cc/150?u=student2', idNumber: '222222222', schoolName: 'תיכון הדרים, הוד השרון', schoolSymbol: '44570001', birthDate: '2007-02-15', city: 'כפר סבא', gender: 'נקבה', phone: '052-2222222', grade: 'יא', conservatoriumStudyYears: 8, instruments: [ { instrument: 'כינור', teacherName: 'מרים כהן', yearsOfStudy: 8 }, { instrument: 'חליל צד', teacherName: 'דוד המלך', yearsOfStudy: 2 }, ], approved: true, notifications: [],
};

const otherStudent: User = {
    id: 'other-student-1', name: 'יונתן כץ', email: 'other.student@example.com', role: 'student', conservatoriumId: 'cons-12', conservatoriumName: 'גבעתיים', avatarUrl: 'https://i.pravatar.cc/150?u=other-student', idNumber: '333333333', schoolName: 'תיכון קלעי, גבעתיים', schoolSymbol: '99887766', birthDate: '2006-08-10', city: 'גבעתיים', gender: 'זכר', phone: '054-3333333', grade: 'יב', conservatoriumStudyYears: 6, instruments: [ { instrument: 'גיטרה', teacherName: 'גלית שפירא', yearsOfStudy: 6 }, ], approved: true, notifications: [],
};

const pendingTeacher: User = {
  id: 'pending-teacher-1', name: 'ישראל ישראלי', email: 'pending.teacher@example.com', role: 'teacher', conservatoriumId: 'cons-1', conservatoriumName: 'קונסרבטוריון הוד השרון', avatarUrl: 'https://i.pravatar.cc/150?u=pending-teacher', approved: false, notifications: [],
};

export const mockTeachers: Partial<User>[] = [
    {
        id: 'teacher-user-1', name: 'מרים כהן', email: 'teacher@example.com',
        bio: 'מורה לפסנתר וכינור עם 15 שנות ניסיון, מתמחה בהכנה לרסיטלים ובחינות בגרות. בוגרת האקדמיה למוסיקה בירושלים. מאמינה בגישה אישית ומעצימה לכל תלמיד.',
        specialties: ['EXAM_PREP', 'PERFORMANCE', 'BEGINNER_ADULTS'],
        teachingLanguages: ['HE', 'EN'],
    },
    {
        id: 'teacher-user-2', name: 'דוד המלך', email: 'teacher2@example.com',
        bio: 'נשפן וירטואוז, מומחה בחליל צד, סקסופון וקלרינט. מתמחה בג\'אז ואימפרוביזציה, ומעביר סדנאות אמן ברחבי הארץ. מביא אנרגיה ייחודית לשיעורים.',
        specialties: ['JAZZ', 'ENSEMBLE', 'PERFORMANCE'],
        teachingLanguages: ['HE', 'RU'],
    },
    {
        id: 'teacher-user-3', name: 'גלית שפירא', email: 'teacher3@example.com',
        bio: 'גיטריסטית ומורה, מתמחה בעבודה עם ילדים ונוער. בעלת ניסיון רב עם צרכים מיוחדים ופיתוח יצירתיות דרך המוזיקה.',
        specialties: ['EARLY_CHILDHOOD', 'SPECIAL_NEEDS', 'THEORY'],
        teachingLanguages: ['HE'],
    },
];

const teacherUser = { ...mockTeachers[0], id: 'teacher-user-1', role: 'teacher', conservatoriumId: 'cons-15', conservatoriumName: 'הוד השרון', avatarUrl: 'https://i.pravatar.cc/150?u=teacher', idNumber: '444444444', phone: '054-4444444', students: [studentUser.id, studentUser2.id], approved: true, notifications: teacherNotifications, } as User;
const teacherUser2 = { ...mockTeachers[1], id: 'teacher-user-2', role: 'teacher', conservatoriumId: 'cons-15', conservatoriumName: 'הוד השרון', avatarUrl: 'https://i.pravatar.cc/150?u=teacher2', idNumber: '555555555', phone: '054-5555555', students: [studentUser2.id], approved: true, notifications: [], } as User;
const teacherUser3 = { ...mockTeachers[2], id: 'teacher-user-3', role: 'teacher', conservatoriumId: 'cons-12', conservatoriumName: 'גבעתיים', avatarUrl: 'https://i.pravatar.cc/150?u=teacher3', idNumber: '666666666', phone: '054-6666666', students: [otherStudent.id], approved: true, notifications: [], } as User;

// Generate Conservatorium Admins from the JSON file, adding the logged-in user for "הוד השרון"
const conservatoriumAdminUsers: User[] = constAdminData.map(admin => {
    if (admin.location === 'הוד השרון') {
        return {
            id: 'conservatorium-admin-user-15',
            name: 'יעל פלסטניאר (מנהלת)',
            email: 'admin@example.com',
            role: 'conservatorium_admin',
            conservatoriumId: 'cons-15',
            conservatoriumName: 'הוד השרון',
            avatarUrl: 'https://i.pravatar.cc/150?u=cons-admin15',
            idNumber: `admin-id-15`,
            phone: '052-4619363',
            students: [studentUser.id, studentUser2.id],
            approved: true,
            notifications: adminNotifications,
        };
    }
    return {
        id: `conservatorium-admin-user-${admin.id}`,
        name: admin.manager_name,
        email: admin.email?.split(';')[0].trim() || 'no-email@example.com',
        role: 'conservatorium_admin',
        conservatoriumId: `cons-${admin.id}`,
        conservatoriumName: admin.location,
        avatarUrl: `https://i.pravatar.cc/150?u=cons-admin${admin.id}`,
        idNumber: `admin-id-${admin.id}`,
        phone: admin.mobile || admin.office_phone || 'N/A',
        students: [], // Initially no students
        approved: true,
        notifications: [],
    }
});


export const siteAdminUser: User = {
  id: 'site-admin-user-1', name: 'דנה המנהלת', email: 'site.admin@example.com', role: 'site_admin', conservatoriumId: 'global', conservatoriumName: 'מנהל מערכת', avatarUrl: 'https://i.pravatar.cc/150?u=site-admin', idNumber: '999999999', phone: '054-9999999', approved: true, notifications: siteAdminNotifications,
};

export const ministryDirectorUser: User = {
  id: 'ministry-director-user-1', name: 'יעקב הלוי', email: 'ministry.director@example.com', role: 'ministry_director', conservatoriumId: 'ministry', conservatoriumName: 'משרד החינוך', avatarUrl: 'https://i.pravatar.cc/150?u=ministry-director', idNumber: '123456789', phone: '052-1234567', approved: true, notifications: [],
};

export const mockUsers: User[] = [
  studentUser,
  studentUser2,
  teacherUser,
  teacherUser2,
  teacherUser3,
  otherStudent,
  pendingTeacher,
  siteAdminUser,
  ministryDirectorUser,
  parentUser,
  ...conservatoriumAdminUsers
].filter((v,i,a)=>a.findIndex(t=>(t.id === v.id))===i); // Remove duplicates

export const mockFormSubmissions: FormSubmission[] = [
  { id: 'form-101', formType: 'רסיטל בגרות', academicYear: 'תשפ"ד', grade: 'יב', studentId: studentUser.id, studentName: studentUser.name, status: 'ממתין לאישור מנהל', submissionDate: '2024-05-20', totalDuration: '12:30', repertoire: [ { id: 'bach-wtc1-prelude-c', composer: 'יוהאן סבסטיאן באך', title: 'פרלוד ופוגה בדו מז\'ור, רי"ב 846 (מתוך הפסנתר המושווה, ספר א\')', duration: '04:00', genre: 'בארוק' }, { id: 'chopin-nocturne-op9-no2', composer: 'פרדריק שופן', title: 'נוקטורן במי במול מז\'ור, אופ. 9 מס\' 2', duration: '05:00', genre: 'רומנטי' }, { id: 'beethoven-fur-elise', composer: 'לודוויג ואן בטהובן', title: 'לאליזה (Für Elise)', duration: '03:00', genre: 'קלאסי' }, ], conservatoriumName: studentUser.conservatoriumName, conservatoriumManagerName: 'יעל פלסטניאר (מנהלת)', applicantDetails: { birthDate: studentUser.birthDate, city: studentUser.city, gender: studentUser.gender, phone: studentUser.phone }, schoolDetails: { schoolName: studentUser.schoolName, hasMusicMajor: true, isMajorParticipant: true, plansTheoryExam: true }, teacherDetails: { name: studentUser.instruments?.[0]?.teacherName, yearsWithTeacher: studentUser.instruments?.[0]?.yearsOfStudy, }, instrumentDetails: {instrument: studentUser.instruments?.[0].instrument, yearsOfStudy: studentUser.instruments?.[0].yearsOfStudy} },
  { id: 'form-102', formType: 'כנס / אירוע', studentId: studentUser2.id, studentName: studentUser2.name, status: 'מאושר סופית', submissionDate: '2024-05-18', totalDuration: '08:15', repertoire: [ { id: 'mozart-sonata-16', composer: 'וולפגנג אמדאוס מוצרט', title: 'סונאטה לפסנתר מס\' 16 בדו מז\'ור, ק. 545 "סונאטה פשוטה"', duration: '08:15', genre: 'קלאסי' }, ], conservatoriumName: studentUser2.conservatoriumName, conservatoriumManagerName: 'יעל פלסטניאר (מנהלת)', signatureUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAACWCAYAAABkW7XSAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAARnSURBVHhe7dRBDQAgEMCw9/6/9EIBCa9A1c2AAdgbCxRYgQUGLMCgAgUWGLCAgQoUWGDCAgYqUGCBBQYswKACBRYYsICBCgRXYAEGFigwAYMKFFhgwAICJlBgAQGLAahAgQUWGLCAgQoUWGDCAgYqUGCBBQYswKACBRYYsICBCgRXYAEGFigwAYMKFFhgwAICJlBgAQGLAahAgQUWGLCAgQoUWGDCAgYqUGCBBQYswKACBRYYsICBCgRXYAEGFigwAYMKFFhgwAICJlBgAQGLAahAgQUWGLCAgQoUWGDCAgYqUGCBBQYswKACBRYYsICBCgRXYAEGFigwAYMKFFhgwAICJlBgAQGLAahAgQUWGLCAgQoUWGDCAgYqUGCBBQYswKACBRYYsICBCgRXYAEGFigwAYMKFFhgwAICJlBgAQGLAahAgQUWGLCAgQoUWGDCAgYqUGCBBQYswKACBRYYsICBCgRXYAEGFigwAYMKFFhgwAICJlBgAQGLAahAgQUWGLCAgQoUWGDCAgYq0HwBDK+xMv2+4DEAAAAASUVORK5CYII=', signedAt: '2024-05-19', calculatedPrice: 10, paymentStatus: 'paid', },
  { id: 'form-103', formType: 'מבחן שלב', studentId: otherStudent.id, studentName: otherStudent.name, status: 'טיוטה', submissionDate: '2024-05-21', totalDuration: '04:00', repertoire: [ { id: 'comp-clementi', composer: 'קלמנטי', title: 'סונטינה אופ. 36 מס\' 1', duration: '04:00', genre: 'קלאסי' }, ], conservatoriumName: otherStudent.conservatoriumName, },
  { id: 'form-104', formType: 'רסיטל בגרות', academicYear: 'תשפ"ג', grade: 'יא', studentId: 'user-7', studentName: 'רבקה גולן', status: 'נדחה', teacherComment: 'נא לבחור יצירה נוספת מהתקופה הרומנטית.', submissionDate: '2024-05-15', totalDuration: '09:00', repertoire: [ { id: 'comp-haydn', composer: 'היידן', title: 'סונטה ברה מז\'ור', duration: '09:00', genre: 'קלאסי' }, ], conservatoriumName: 'מרכז למוסיקה ובימת אמנויות רעננה', },
  { id: 'form-105', formType: 'רסיטל בגרות', academicYear: 'תשפ"ד', grade: 'יא', studentId: studentUser2.id, studentName: studentUser2.name, status: 'נדרש תיקון', ministryComment: 'הרפרטואר אינו מאוזן דיו. יש להחליף את אחת היצירות הקלאסיות ביצירה מהמאה ה-20.', submissionDate: '2024-05-23', totalDuration: '21:00', repertoire: [ { id: 'bach-wtc1-prelude-c', composer: 'יוהאן סבסטיאן באך', title: 'פרלוד ופוגה בדו מז\'ור, רי"ב 846 (מתוך הפסנתר המושווה, ספר א\')', duration: '04:00', genre: 'בארוק' }, { id: 'mozart-eine-kleine', composer: 'וולפגנג אמדאוס מוצרט', title: 'מוזיקת לילה זעירה (Eine kleine Nachtmusik), סרנדה מס\' 13', duration: '05:45', genre: 'קלאסי' }, { id: 'chopin-nocturne-op9-no2', composer: 'פרדריק שופן', title: 'נוקטורן במי במול מז\'ור, אופ. 9 מס\' 2', duration: '04:30', genre: 'רומנטי' }, { id: 'beethoven-moonlight-sonata', composer: 'לודוויג ואן בטהובן', title: 'סונאטה לפסנתר מס\' 14 בדו דיאז מינור, אופ. 27 מס\' 2 "אור ירח"', duration: '15:00', genre: 'קלאסי' } ], conservatoriumName: studentUser2.conservatoriumName, applicantDetails: { birthDate: studentUser2.birthDate, city: studentUser2.city, gender: studentUser2.gender, phone: studentUser2.phone }, schoolDetails: { schoolName: studentUser2.schoolName, hasMusicMajor: false, isMajorParticipant: false, plansTheoryExam: true }, teacherDetails: { name: teacherUser.name, }, instrumentDetails: {instrument: studentUser2.instruments?.[0].instrument, yearsOfStudy: studentUser2.instruments?.[0].yearsOfStudy} },
];

export const mockPackages: Package[] = [
    { id: 'pkg-trial', type: 'TRIAL', title: 'שיעור ניסיון', description: 'שיעור אחד, ללא התחייבות', price: 80 },
    { id: 'pkg-5', type: 'PACK_5', title: 'חבילת 5 שיעורים', description: 'גמישות מירבית, תוקף ל-6 חודשים', price: 750 },
    { id: 'pkg-10', type: 'PACK_10', title: 'חבילת 10 שיעורים', description: 'החבילה הפופולרית ביותר', price: 1400 },
    { id: 'pkg-monthly', type: 'MONTHLY', title: 'מנוי חודשי', description: 'שיעור שבועי קבוע, חידוש אוטומטי', price: 560 },
    { id: 'pkg-yearly', type: 'YEARLY', title: 'מנוי שנתי', description: 'המחיר הטוב ביותר, שמירת מקום מובטחת', price: 5800 },
];

export const mockLessons: LessonSlot[] = [
  { id: 'lesson-1', conservatoriumId: 'cons-15', teacherId: 'teacher-user-1', studentId: 'student-user-1', instrument: 'פסנתר', startTime: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString(), durationMinutes: 45, type: 'RECURRING', status: 'SCHEDULED', bookingSource: 'ADMIN', isVirtual: false, isCreditConsumed: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'lesson-2', conservatoriumId: 'cons-15', teacherId: 'teacher-user-1', studentId: 'student-user-2', instrument: 'כינור', startTime: new Date(new Date().setDate(new Date().getDate() + 2)).toISOString(), durationMinutes: 60, type: 'RECURRING', status: 'SCHEDULED', bookingSource: 'ADMIN', isVirtual: false, isCreditConsumed: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'lesson-3', conservatoriumId: 'cons-15', teacherId: 'teacher-user-1', studentId: 'student-user-1', instrument: 'פסנתר', startTime: new Date(new Date().setDate(new Date().getDate() - 6)).toISOString(), durationMinutes: 45, type: 'RECURRING', status: 'COMPLETED', bookingSource: 'ADMIN', isVirtual: false, isCreditConsumed: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'lesson-4', conservatoriumId: 'cons-15', teacherId: 'teacher-user-1', studentId: 'student-user-2', instrument: 'כינור', startTime: new Date(new Date().setDate(new Date().getDate() - 5)).toISOString(), durationMinutes: 60, type: 'RECURRING', status: 'COMPLETED', bookingSource: 'ADMIN', isVirtual: false, isCreditConsumed: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];

export const mockInvoices: Invoice[] = [
  {
    id: 'inv-1',
    invoiceNumber: '2024-05-001',
    conservatoriumId: 'cons-15',
    payerId: 'parent-user-1',
    lineItems: [{ description: 'מנוי חודשי - פסנתר (אריאל) - מאי 2024', total: 560 }],
    total: 560,
    status: 'PAID',
    dueDate: '2024-05-01',
    paidAt: '2024-05-01',
  },
  {
    id: 'inv-2',
    invoiceNumber: '2024-06-001',
    conservatoriumId: 'cons-15',
    payerId: 'parent-user-1',
    lineItems: [{ description: 'מנוי חודשי - פסנתר (אריאל) - יוני 2024', total: 560 }],
    total: 560,
    status: 'PAID',
    dueDate: '2024-06-01',
    paidAt: '2024-06-01',
  },
    {
    id: 'inv-3',
    invoiceNumber: '2024-07-001',
    conservatoriumId: 'cons-15',
    payerId: 'parent-user-1',
    lineItems: [{ description: 'מנוי חודשי - פסנתר (אריאל) - יולי 2024', total: 560 }],
    total: 560,
    status: 'SENT',
    dueDate: '2024-07-01',
  },
];

export const mockPracticeLogs: PracticeLog[] = [
    {
        id: 'pl-1',
        studentId: 'student-user-1',
        date: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString(),
        durationMinutes: 30,
        pieces: [{ title: 'סונטה של מוצרט' }],
        mood: 'OKAY',
    },
    {
        id: 'pl-2',
        studentId: 'student-user-1',
        date: new Date(new Date().setDate(new Date().getDate() - 2)).toISOString(),
        durationMinutes: 45,
        pieces: [{ title: 'סונטה של מוצרט' }, { title: 'אטיוד של שופן' }],
        mood: 'GREAT',
    },
    {
        id: 'pl-3',
        studentId: 'student-user-1',
        date: new Date(new Date().setDate(new Date().getDate() - 4)).toISOString(),
        durationMinutes: 20,
        pieces: [{ title: 'סונטה של מוצרט' }],
        mood: 'HARD',
        studentNote: 'היה לי קשה עם המעבר בתיבה 24.'
    },
     {
        id: 'pl-4',
        studentId: 'student-user-1',
        date: new Date(new Date().setDate(new Date().getDate() - 5)).toISOString(),
        durationMinutes: 35,
        pieces: [{ title: 'אטיוד של שופן' }],
        mood: 'OKAY',
    },
     {
        id: 'pl-5',
        studentId: 'student-user-1',
        date: new Date(new Date().setDate(new Date().getDate() - 6)).toISOString(),
        durationMinutes: 25,
        pieces: [{ title: 'סונטה של מוצרט' }],
        mood: 'GREAT',
    },
];
