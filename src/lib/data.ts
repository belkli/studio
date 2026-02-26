

import type { User, FormSubmission, Notification, Conservatorium, Package, LessonSlot, Invoice, PracticeLog, Composition, AssignedRepertoire, LessonNote, RepertoireStatus, MessageThread, ProgressReport, Announcement, Room, PayrollSummary, PracticeVideo, WaitlistEntry, FormTemplate, AuditLogEntry, SlotStatus, Channel, NotificationPreferences, Achievement, AchievementType, EventProduction, EventProductionStatus, PerformanceSlot, InstrumentInventory, InstrumentCondition, PerformanceBooking, PerformanceBookingStatus, ScholarshipApplication, OpenDayEvent, OpenDayAppointment, Branch, PerformanceGenre } from './types';
import constAdminData from '../../docs/constadmin.json';
import rawCompositions from '../../docs/data.json';

const tierCycle: ('A' | 'B' | 'C')[] = ['A', 'B', 'C'];

// Generate Conservatoriums from the JSON file
export const conservatoriums: Conservatorium[] = constAdminData.map((admin, index) => {
    const isHodHasharon = admin.location === 'הוד השרון';
    return {
        id: `cons-${admin.id}`,
        name: admin.organization ? `${admin.location} (${admin.organization})` : admin.location, // Include organization for better identification
        tier: tierCycle[index % 3], // Cycle through tiers A, B, C for variety
        stampUrl: `https://picsum.photos/seed/stamp${admin.id}/200/200`,
        // Enable new features for "הוד השרון" for demonstration purposes
        newFeaturesEnabled: isHodHasharon,
        aiAgentsConfig: isHodHasharon ? {
            "matchmaker-agent": true,
            "composition-suggester": true,
            "reschedule-agent": false,
            "progress-report-agent": false,
            "admin-alerts-agent": false,
            "lead-nurture-agent": false,
        } : undefined,
    };
});

export const priceMatrix: Record<string, Record<string, Record<number, number>>> = {
    A: { Small: { 10: 10, 15: 15, 20: 20, 25: 25, 30: 30 }, Medium: { 10: 15, 15: 20, 20: 25, 25: 30, 30: 35 }, Large: { 10: 20, 15: 25, 20: 30, 25: 35, 30: 40 }, },
    B: { Small: { 10: 12, 15: 16, 20: 22, 25: 27, 30: 32 }, Medium: { 10: 16, 15: 22, 20: 27, 25: 32, 30: 37 }, Large: { 10: 22, 15: 27, 20: 30, 25: 35, 30: 42 }, },
    C: { Small: { 10: 13, 15: 18, 20: 23, 25: 28, 30: 33 }, Medium: { 10: 18, 15: 23, 20: 28, 25: 33, 30: 38 }, Large: { 10: 23, 15: 28, 20: 33, 25: 38, 30: 43 }, },
};

export const instruments = ['פסנתר', 'כינור', 'צ\'לו', 'גיטרה', 'חליל צד', 'קלרינט', 'סקסופון', 'תופים', 'שירה'];
export const genres = ['קלאסי', 'ג\'אז', 'קל', 'ישראלי', 'פופ', 'רוק', 'עממי', 'בארוק', 'רומנטי', 'אימפרסיוניסטי', 'מודרני'];
export const teacherSpecialties = [
    { id: 'EXAM_PREP', label: 'הכנה לבחינות' },
    { id: 'EARLY_CHILDHOOD', label: 'גיל הרך' },
    { id: 'PERFORMANCE', label: 'הכנה להופעות' },
    { id: 'JAZZ', label: 'ג׳אז ואימפרוביזציה' },
    { id: 'THEORY', label: 'תאוריה וקומפוזיציה' },
    { id: 'SPECIAL_NEEDS', label: 'צרכים מיוחדים' },
    { id: 'BEGINNER_ADULTS', label: 'מתחילים מבוגרים' },
    { id: 'ENSEMBLE', label: 'הדרכת הרכבים' },
];
export const performanceGenres: { id: PerformanceGenre, label: string }[] = [
    { id: 'CLASSICAL', label: 'קלאסי' },
    { id: 'JAZZ', label: 'ג\'אז' },
    { id: 'KLEZMER', label: 'כליזמר' },
    { id: 'MIDDLE_EASTERN', label: 'מוזיקת עולם/מזרחית' },
    { id: 'POPULAR', label: 'פופ/רוק' },
    { id: 'LITURGICAL', label: 'ליטורגי' },
];
export const languages = [{ id: 'HE', label: 'עברית' }, { id: 'EN', label: 'אנגלית' }, { id: 'AR', label: 'ערבית' }, { id: 'RU', label: 'רוסית' }];

export const schools = [
    { symbol: '44570001', name: 'תיכון הדרים, הוד השרון' }, { symbol: '12345678', name: 'תיכון חדש, תל אביב' }, { symbol: '87654321', name: 'תיכון הראשונים, הרצליה' }, { symbol: '11223344', name: 'בית ספר לאמנויות, ירושלים' }, { symbol: '22334455', name: 'תיכון אלון, רמת השרון' }, { symbol: '99887766', name: 'תיכון קלעי, גבעתיים' },
];

export const examLevels = ['בגרות (יחידה 1)', 'בגרות (5 יחידות)', 'אקדמאי', 'אחר'];
export const examTypes = ['ביצוע (רסיטל)', 'תאוריה', 'משולב'];


export const compositions: Composition[] = (rawCompositions as any[]).map((item: any, index: number) => ({
    id: `comp-db-${index}`,
    composer: item['מלחין'] || 'לא ידוע',
    title: item['יצירה'] || 'ללא כותרת',
    duration: '05:00', // Placeholder duration, as it's not in the JSON
    genre: item['תקופה'] || 'לא ידוע',
    instrument: item['כלי'] || undefined,
    approved: item['מאושר כיצירה מרכזית'] === 'כן',
    source: 'seed' as const,
})).filter(c => c.composer && c.title);

export const mockBranches: Branch[] = [
    {
        id: 'branch-1',
        conservatoriumId: 'cons-15', // הוד השרון
        name: 'שלוחת נווה נאמן',
        address: 'רחוב הגנים 12, הוד השרון'
    },
    {
        id: 'branch-2',
        conservatoriumId: 'cons-15', // הוד השרון
        name: 'שלוחת גני צבי',
        address: 'רחוב הבנים 14, הוד השרון'
    },
    {
        id: 'branch-3',
        conservatoriumId: 'cons-12', // גבעתיים
        name: 'מתנ"ס קהילתיים',
        address: 'רחוב רמב"ם 10, גבעתיים'
    }
];

export const mockRooms: Room[] = [
    { id: 'room-1', name: 'סטודיו פסנתר 1', branchId: 'branch-1' },
    { id: 'room-2', name: 'חדר כינורות', branchId: 'branch-1' },
    { id: 'room-3', name: 'אולם קונצרטים קטן', branchId: 'branch-1' },
    { id: 'room-4', name: 'חדר תיאוריה', branchId: 'branch-2' },
    { id: 'room-5', name: 'סטודיו גיטרה', branchId: 'branch-2' },
    { id: 'room-6', name: 'חדר כלי נשיפה', branchId: 'branch-3' },
    { id: 'room-7', name: 'חדר צ\'לו', branchId: 'branch-3' },
];

const studentNotifications: Notification[] = [];
const teacherNotifications: Notification[] = [];
const adminNotifications: Notification[] = [];
const siteAdminNotifications: Notification[] = [];

// --- Mock Users ---
const studentUser: User = {
    id: 'student-user-1', name: 'אריאל לוי', email: 'student@example.com', role: 'student', conservatoriumId: 'cons-15', conservatoriumName: 'הוד השרון', avatarUrl: 'https://i.pravatar.cc/150?u=student', idNumber: '111111111', schoolName: 'תיכון הדרים, הוד השרון', schoolSymbol: '44570001', birthDate: '2006-05-10', city: 'הוד השרון', gender: 'זכר', phone: '050-1111111', grade: 'יב', conservatoriumStudyYears: 10, instruments: [{ instrument: 'פסנתר', teacherName: 'מרים כהן', yearsOfStudy: 10 },], approved: true, notifications: studentNotifications, weeklyPracticeGoal: 120, achievements: [],
};

const studentUser2: User = {
    id: 'student-user-2', name: 'תמר ישראלי', email: 'student2@example.com', role: 'student', conservatoriumId: 'cons-15', conservatoriumName: 'הוד השרון', avatarUrl: 'https://i.pravatar.cc/150?u=student2', idNumber: '222222222', schoolName: 'תיכון הדרים, הוד השרון', schoolSymbol: '44570001', birthDate: '2007-02-15', city: 'כפר סבא', gender: 'נקבה', phone: '052-2222222', grade: 'יא', conservatoriumStudyYears: 8, instruments: [{ instrument: 'כינור', teacherName: 'מרים כהן', yearsOfStudy: 8 }, { instrument: 'חליל צד', teacherName: 'דוד המלך', yearsOfStudy: 2 },], approved: true, notifications: [], weeklyPracticeGoal: 90, achievements: [],
};

const otherStudent: User = {
    id: 'other-student-1', name: 'יונתן כץ', email: 'other.student@example.com', role: 'student', conservatoriumId: 'cons-12', conservatoriumName: 'גבעתיים', avatarUrl: 'https://i.pravatar.cc/150?u=other-student', idNumber: '333333333', schoolName: 'תיכון קלעי, גבעתיים', schoolSymbol: '99887766', birthDate: '2006-08-10', city: 'גבעתיים', gender: 'זכר', phone: '054-3333333', grade: 'יב', conservatoriumStudyYears: 6, instruments: [{ instrument: 'גיטרה', teacherName: 'גלית שפירא', yearsOfStudy: 6 },], approved: true, notifications: [], achievements: [],
};

const pendingTeacher: User = {
    id: 'pending-teacher-1', name: 'ישראל ישראלי', email: 'pending.teacher@example.com', role: 'teacher', conservatoriumId: 'cons-1', conservatoriumName: 'קונסרבטוריון הוד השרון', avatarUrl: 'https://i.pravatar.cc/150?u=pending-teacher', approved: false, notifications: [], achievements: [],
};

export const mockTeachers: Partial<User>[] = [
    {
        id: 'teacher-user-1', name: 'מרים כהן', email: 'teacher@example.com', avatarUrl: 'musician-miriam',
        bio: 'מורה לפסנתר וכינור עם 15 שנות ניסיון, מתמחה בהכנה לרסיטלים ובחינות בגרות. בוגרת האקדמיה למוסיקה בירושלים. מאמינה בגישה אישית ומעצימה לכל תלמיד.',
        specialties: ['EXAM_PREP', 'PERFORMANCE', 'BEGINNER_ADULTS'],
        teachingLanguages: ['HE', 'EN'],
        maxStudents: 20,
        employmentType: 'EMPLOYEE',
        ratePerDuration: { '30': 80, '45': 100, '60': 120 },
        performanceProfile: {
            isOptedIn: true,
            adminApproved: true,
            headline: 'פסנתרנית קונצרטים ומוזיקאית קאמרית',
            performanceBio: 'זוכת תחרויות ובעלת ניסיון רב בהופעות באירועים פרטיים ורשמיים. רפרטואר רחב, מקלאסי ועד ג\'אז קל.',
            performanceGenres: ['CLASSICAL', 'JAZZ', 'FILM_MUSIC'],
            videoLinks: [{ title: 'Chopin Nocturne', url: 'https://youtube.com' }]
        }
    },
    {
        id: 'teacher-user-2', name: 'דוד המלך', email: 'teacher2@example.com', avatarUrl: 'musician-david',
        bio: 'נשפן וירטואוז, מומחה בחליל צד, סקסופון וקלרינט. מתמחה בג\'אז ואימפרוביזציה, ומעביר סדנאות אמן ברחבי הארץ. מביא אנרגיה ייחודית לשיעורים.',
        specialties: ['JAZZ', 'ENSEMBLE', 'PERFORMANCE'],
        teachingLanguages: ['HE', 'RU'],
        maxStudents: 15,
        employmentType: 'FREELANCE',
        ratePerDuration: { '30': 90, '45': 110, '60': 130 },
        performanceProfile: {
            isOptedIn: false,
        }
    },
    {
        id: 'teacher-user-3', name: 'גלית שפירא', email: 'teacher3@example.com', avatarUrl: 'musician-galit',
        bio: 'גיטריסטית ומורה, מתמחה בעבודה עם ילדים ונוער. בעלת ניסיון רב עם צרכים מיוחדים ופיתוח יצירתיות דרך המוזיקה.',
        specialties: ['EARLY_CHILDHOOD', 'SPECIAL_NEEDS', 'THEORY'],
        teachingLanguages: ['HE'],
        maxStudents: 18,
        employmentType: 'FREELANCE',
        ratePerDuration: { '30': 85, '45': 105, '60': 125 },
        performanceProfile: {
            isOptedIn: true,
            adminApproved: false,
            headline: 'גיטריסטית קלאסית ויוצרת',
        }
    },
];

const teacherUser = { ...mockTeachers[0], id: 'teacher-user-1', role: 'teacher', conservatoriumId: 'cons-15', conservatoriumName: 'הוד השרון', idNumber: '444444444', phone: '054-4444444', students: [studentUser.id, studentUser2.id], approved: true, notifications: teacherNotifications, achievements: [], } as User;
const teacherUser2 = { ...mockTeachers[1], id: 'teacher-user-2', role: 'teacher', conservatoriumId: 'cons-15', conservatoriumName: 'הוד השרון', idNumber: '555555555', phone: '054-5555555', students: [studentUser2.id], approved: true, notifications: [], maxStudents: 15, achievements: [], } as User;
const teacherUser3 = { ...mockTeachers[2], id: 'teacher-user-3', role: 'teacher', conservatoriumId: 'cons-12', conservatoriumName: 'גבעתיים', idNumber: '666666666', phone: '054-6666666', students: [otherStudent.id], approved: true, notifications: [], maxStudents: 18, achievements: [], } as User;

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
            idNumber: `admin-id-${admin.id}`,
            phone: '052-4619363',
            students: [studentUser.id, studentUser2.id],
            approved: true,
            notifications: adminNotifications,
            achievements: [],
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
        achievements: [],
    }
});


export const siteAdminUser: User = {
    id: 'site-admin-user-1', name: 'דנה המנהלת', email: 'site.admin@example.com', role: 'site_admin', conservatoriumId: 'global', conservatoriumName: 'מנהל מערכת', avatarUrl: 'https://i.pravatar.cc/150?u=site-admin', idNumber: '999999999', phone: '054-9999999', approved: true, notifications: siteAdminNotifications, achievements: [],
};

export const ministryDirectorUser: User = {
    id: 'ministry-director-user-1', name: 'יעקב הלוי', email: 'ministry.director@example.com', role: 'ministry_director', conservatoriumId: 'ministry', conservatoriumName: 'משרד החינוך', avatarUrl: 'https://i.pravatar.cc/150?u=ministry-director', idNumber: '123456789', phone: '052-1234567', approved: true, notifications: [], achievements: [],
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
    ...conservatoriumAdminUsers
].filter((v, i, a) => a.findIndex(t => (t.id === v.id)) === i); // Remove duplicates

export const mockFormSubmissions: FormSubmission[] = [
    { id: 'form-101', formType: 'רסיטל בגרות', academicYear: 'תשפ"ד', grade: 'יב', studentId: studentUser.id, studentName: studentUser.name, status: 'ממתין לאישור מנהל', submissionDate: '2024-05-20', totalDuration: '12:30', repertoire: [{ id: 'bach-wtc1-prelude-c', composer: 'יוהאן סבסטיאן באך', title: 'פרלוד ופוגה בדו מז\'ור, רי"ב 846 (מתוך הפסנתר המושווה, ספר א\')', duration: '04:00', genre: 'בארוק' }, { id: 'chopin-nocturne-op9-no2', composer: 'פרדריק שופן', title: 'נוקטורן במי במול מז\'ור, אופ. 9 מס\' 2', duration: '05:00', genre: 'רומנטי' }, { id: 'beethoven-fur-elise', composer: 'לודוויג ואן בטהובן', title: 'לאליזה (Für Elise)', duration: '03:00', genre: 'קלאסי' },], conservatoriumName: studentUser.conservatoriumName, conservatoriumManagerName: 'יעל פלסטניאר (מנהלת)', applicantDetails: { birthDate: studentUser.birthDate, city: studentUser.city, gender: studentUser.gender, phone: studentUser.phone }, schoolDetails: { schoolName: studentUser.schoolName, hasMusicMajor: true, isMajorParticipant: true, plansTheoryExam: true }, teacherDetails: { name: studentUser.instruments?.[0]?.teacherName, yearsWithTeacher: studentUser.instruments?.[0]?.yearsOfStudy, }, instrumentDetails: { instrument: studentUser.instruments?.[0].instrument, yearsOfStudy: studentUser.instruments?.[0].yearsOfStudy } },
    { id: 'form-102', formType: 'כנס / אירוע', studentId: studentUser2.id, studentName: studentUser2.name, status: 'מאושר סופית', submissionDate: '2024-05-18', totalDuration: '08:15', repertoire: [{ id: 'mozart-sonata-16', composer: 'וולפגנג אמדאוס מוצרט', title: 'סונאטה לפסנתר מס\' 16 בדו מז\'ור, ק. 545 "סונאטה פשוטה"', duration: '08:15', genre: 'קלאסי' },], conservatoriumName: studentUser2.conservatoriumName, conservatoriumManagerName: 'יעל פלסטניאר (מנהלת)', signatureUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAACWCAYAAABkW7XSAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAARnSURBVOgN7dRBDQAgEMCw9/6/9EIBCa9A1c2AAdgbCxRYgQUGLMCgAgUWGLCAgQoUWGDCAgYqUGCBBQYswKACBRYYsICBCgRXYAEGFigwAYMKFFhgwAICJlBgAQGLAahAgQUWGLCAgQoUWGDCAgYq0HwBDK+xMv2+4DEAAAAASUVORK5CYII=', signedAt: '2024-05-19', calculatedPrice: 10, paymentStatus: 'paid', },
    { id: 'form-103', formType: 'מבחן שלב', studentId: otherStudent.id, studentName: otherStudent.name, status: 'טיוטה', submissionDate: '2024-05-21', totalDuration: '04:00', repertoire: [{ id: 'comp-clementi', composer: 'קלמנטי', title: 'סונטינה אופ. 36 מס\' 1', duration: '04:00', genre: 'קלאסי' },], conservatoriumName: otherStudent.conservatoriumName, },
    { id: 'form-104', formType: 'רסיטל בגרות', academicYear: 'תשפ"ג', grade: 'יא', studentId: 'user-7', studentName: 'רבקה גולן', status: 'נדחה', teacherComment: 'נא לבחור יצירה נוספת מהתקופה הרומנטית.', submissionDate: '2024-05-15', totalDuration: '09:00', repertoire: [{ id: 'comp-haydn', composer: 'היידן', title: 'סונטה ברה מז\'ור', duration: '09:00', genre: 'קלאסי' },], conservatoriumName: 'מרכז למוסיקה ובימת אמנויות רעננה', },
    { id: 'form-105', formType: 'רסיטל בגרות', academicYear: 'תשפ"ד', grade: 'יא', studentId: studentUser2.id, studentName: studentUser2.name, status: 'נדרש תיקון', ministryComment: 'הרפרטואר אינו מאוזן דיו. יש להחליף את אחת היצירות הקלאסיות ביצירה מהמאה ה-20.', submissionDate: '2024-05-23', totalDuration: '21:00', repertoire: [{ id: 'bach-wtc1-prelude-c', composer: 'יוהאן סבסטיאן באך', title: 'פרלוד ופוגה בדו מז\'ור, רי"ב 846 (מתוך הפסנתר המושווה, ספר א\')', duration: '04:00', genre: 'בארוק' }, { id: 'mozart-eine-kleine', composer: 'וולפגנג אמדאוס מוצרט', title: 'מוזיקת לילה זעירה (Eine kleine Nachtmusik), סרנדה מס\' 13', duration: '05:45', genre: 'קלאסי' }, { id: 'chopin-nocturne-op9-no2', composer: 'פרדריק שופן', title: 'נוקטורן במי במול מז\'ור, אופ. 9 מס\' 2', duration: '04:30', genre: 'רומנטי' }, { id: 'beethoven-moonlight-sonata', composer: 'לודוויג ואן בטהובן', title: 'סונאטה לפסנתר מס\' 14 בדו דיאז מינור, אופ. 27 מס\' 2 "אור ירח"', duration: '15:00', genre: 'קלאסי' }], conservatoriumName: studentUser2.conservatoriumName, applicantDetails: { birthDate: studentUser2.birthDate, city: studentUser2.city, gender: studentUser2.gender, phone: studentUser2.phone }, schoolDetails: { schoolName: studentUser2.schoolName, hasMusicMajor: false, isMajorParticipant: false, plansTheoryExam: true }, teacherDetails: { name: teacherUser.name, }, instrumentDetails: { instrument: studentUser2.instruments?.[0].instrument, yearsOfStudy: studentUser2.instruments?.[0].yearsOfStudy } },
];
export const mockPackages: Package[] = [];
export const mockLessons: LessonSlot[] = [
    { id: 'lesson-1', conservatoriumId: 'cons-15', teacherId: 'teacher-user-1', studentId: 'student-user-1', instrument: 'פסנתר', startTime: new Date(new Date(new Date().setDate(new Date().getDate() + 1)).setHours(16, 0, 0, 0)).toISOString(), durationMinutes: 45, type: 'RECURRING', bookingSource: 'STUDENT_SELF', roomId: 'room-1', isVirtual: false, status: 'SCHEDULED', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), isCreditConsumed: false },
    { id: 'lesson-2', conservatoriumId: 'cons-15', teacherId: 'teacher-user-1', studentId: 'student-user-2', instrument: 'כינור', startTime: new Date(new Date(new Date().setDate(new Date().getDate() + 2)).setHours(17, 0, 0, 0)).toISOString(), durationMinutes: 60, type: 'RECURRING', bookingSource: 'PARENT', roomId: 'room-2', isVirtual: false, status: 'SCHEDULED', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), isCreditConsumed: false, branchId: 'branch-1' },
    { id: 'lesson-3', conservatoriumId: 'cons-12', teacherId: 'teacher-user-3', studentId: 'other-student-1', instrument: 'גיטרה', startTime: new Date(new Date(new Date().setDate(new Date().getDate() + 3)).setHours(15, 0, 0, 0)).toISOString(), durationMinutes: 45, type: 'RECURRING', bookingSource: 'ADMIN', roomId: 'room-5', isVirtual: true, meetingLink: 'https://zoom.us/j/1234567890', status: 'SCHEDULED', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), isCreditConsumed: false, branchId: 'branch-2' },
];
export const mockInvoices: Invoice[] = [];
export const mockPracticeLogs: PracticeLog[] = [];
export const mockAssignedRepertoire: AssignedRepertoire[] = [];
export const mockLessonNotes: LessonNote[] = [];
export const mockMessageThreads: MessageThread[] = [];
export const mockProgressReports: ProgressReport[] = [];
export const mockAnnouncements: Announcement[] = [];
export const mockFormTemplates: FormTemplate[] = [];
export const mockAuditLog: AuditLogEntry[] = [];
export const mockEvents: EventProduction[] = [];
export const mockInstrumentInventory: InstrumentInventory[] = [];
export const mockPerformanceBookings: PerformanceBooking[] = [];
export const mockScholarshipApplications: any[] = [];
export const mockOpenDayEvents: OpenDayEvent[] = [
    {
        id: 'open-day-1',
        conservatoriumId: 'cons-15',
        name: 'יום פתוח אביב 2024',
        date: new Date(new Date().setDate(new Date().getDate() + 14)).toISOString().split('T')[0],
        startTime: '10:00',
        endTime: '14:00',
        appointmentDuration: 20,
        isActive: true,
    }
];
export const mockOpenDayAppointments: OpenDayAppointment[] = [
    {
        id: 'oda-1',
        eventId: 'open-day-1',
        familyName: 'כהן',
        parentEmail: 'cohen@email.com',
        parentPhone: '050-1234567',
        childName: 'אורי',
        childAge: 8,
        instrumentInterest: 'פסנתר',
        appointmentTime: new Date(new Date(new Date().setDate(new Date().getDate() + 14)).setHours(10, 20, 0, 0)).toISOString(),
        status: 'SCHEDULED',
        registeredAt: new Date().toISOString(),
    }
];

export const mockWaitlist: WaitlistEntry[] = [];
export const mockPracticeVideos: any[] = [];
export const mockPayrolls: PayrollSummary[] = [];
