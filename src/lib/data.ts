

import type { User, FormSubmission, Notification, Conservatorium, Package, LessonSlot, Invoice, PracticeLog, Composition, AssignedRepertoire, LessonNote, RepertoireStatus, MessageThread, ProgressReport, Announcement, Room, PayrollSummary, PracticeVideo, WaitlistEntry, FormTemplate, AuditLogEntry, SlotStatus, Channel, NotificationPreferences, Achievement, AchievementType, EventProduction, EventProductionStatus, PerformanceSlot, InstrumentInventory, InstrumentCondition, PerformanceGenre, EnsembleRole, PerformanceBooking, PerformanceBookingStatus, ScholarshipApplication, OpenDayEvent, OpenDayAppointment, Branch } from './types';
import constAdminData from '../../docs/constadmin.json';
import rawCompositions from '../../docs/data.json';
import { addDays, setHours, setMinutes } from 'date-fns';

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
            "admin-alerts-agent": true,
            "lead-nurture-agent": false,
        } : undefined,
        pricingConfig: isHodHasharon ? {
            baseRatePerLesson: {
                '30': 80,
                '45': 100,
                '60': 120,
            },
            discounts: {
                pack5: 5, // percentage
                pack10: 10,
                yearly: 15,
                sibling: 10,
            },
            adHocPremium: 15, // percentage
            trialPrice: 50,
        } : undefined,
        cancellationPolicy: isHodHasharon ? {
            studentNoticeHoursRequired: 24,
            studentCancellationCredit: 'FULL',
            studentLateCancelCredit: 'NONE',
            noShowCredit: 'NONE',
            makeupCreditExpiryDays: 60,
            maxMakeupsPerTerm: 4,
        } : undefined,
    };
});

export const priceMatrix: Record<string, Record<string, Record<number, number>>> = {
    A: { Small: { 10: 10, 15: 15, 20: 20, 25: 25, 30: 30 }, Medium: { 10: 15, 15: 20, 20: 25, 25: 30, 30: 35 }, Large: { 10: 20, 15: 25, 20: 30, 25: 35, 30: 40 }, },
    B: { Small: { 10: 12, 15: 16, 20: 22, 25: 27, 30: 32 }, Medium: { 10: 16, 15: 22, 20: 27, 25: 32, 30: 37 }, Large: { 10: 22, 15: 27, 20: 32, 25: 37, 30: 42 }, },
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


// --- Mock Branches (SDD-14F) ---
export const mockBranches: Branch[] = [
  { id: 'branch-1', conservatoriumId: 'cons-15', name: 'קמפוס מרכזי', address: 'רחוב הראשונים 1, הוד השרון' },
  { id: 'branch-2', conservatoriumId: 'cons-15', name: 'שלוחת נווה הדר', address: 'רחוב הבנים 14, הוד השרון' },
  { id: 'branch-3', conservatoriumId: 'cons-12', name: 'סניף ראשי גבעתיים', address: 'רחוב ויצמן 2, גבעתיים' },
];

// --- Mock Achievements (SDD-14B) ---
export const mockAchievements: Achievement[] = [
    {
        id: 'ach-1',
        type: 'YEARS_ENROLLED_1',
        title: 'שנה בהרמוניה!',
        description: 'כל הכבוד על שנה שלמה של התמדה ולימודים.',
        achievedAt: new Date(new Date().setFullYear(new Date().getFullYear() - 1)).toISOString(),
    },
    {
        id: 'ach-2',
        type: 'PIECE_COMPLETED',
        title: 'יצירה ראשונה הושלמה!',
        description: 'סיימת ללמוד את "סונאטה של מוצרט".',
        achievedAt: new Date(new Date().setDate(new Date().getDate() - 10)).toISOString(),
    },
];

// --- Mock Notifications ---
const studentNotifications: Notification[] = [];
const parentNotifications: Notification[] = [];
const teacherNotifications: Notification[] = [];
const adminNotifications: Notification[] = [];
const siteAdminNotifications: Notification[] = [];

// --- Mock Users ---
const thirteenYearsAgo = new Date();
thirteenYearsAgo.setFullYear(thirteenYearsAgo.getFullYear() - 13);
const thirteenYearsAgoDateString = thirteenYearsAgo.toISOString().split('T')[0];


const studentUser: User = {
    id: 'student-user-1', name: 'אריאל לוי', email: 'student@example.com', role: 'student', conservatoriumId: 'cons-15', conservatoriumName: 'הוד השרון', branchId: 'branch-1', avatarUrl: 'https://i.pravatar.cc/150?u=student', idNumber: '111111111', schoolName: 'תיכון הדרים, הוד השרון', schoolSymbol: '44570001', birthDate: '2006-05-10', enrollmentDate: new Date(new Date().setFullYear(new Date().getFullYear() - 2)).toISOString(), city: 'הוד השרון', gender: 'זכר', phone: '050-1111111', grade: 'יב', conservatoriumStudyYears: 10, instruments: [{ instrument: 'פסנתר', teacherName: 'מרים כהן', yearsOfStudy: 10 },], approved: true, notifications: studentNotifications, parentId: 'parent-user-1', weeklyPracticeGoal: 120, packageId: 'pkg-monthly', achievements: mockAchievements,
};

const parentUser: User = {
    id: 'parent-user-1', name: 'דני לוי', email: 'parent@example.com', role: 'parent', conservatoriumId: 'cons-15', conservatoriumName: 'הוד השרון', avatarUrl: 'https://i.pravatar.cc/150?u=parent', idNumber: '987654321', phone: '050-9876543', approved: true, childIds: ['student-user-1', 'student-user-noa'], notifications: parentNotifications,
}

const noaLevi: User = {
    id: 'student-user-noa', name: 'נועה לוי', email: parentUser.email, role: 'student', conservatoriumId: 'cons-15', conservatoriumName: 'הוד השרון', branchId: 'branch-2', avatarUrl: 'https://i.pravatar.cc/150?u=student-noa', idNumber: '333444555', birthDate: thirteenYearsAgoDateString, enrollmentDate: new Date().toISOString(), city: 'הוד השרון', gender: 'נקבה', grade: 'ז', approved: true, notifications: [], parentId: 'parent-user-1', packageId: 'pkg-5', instruments: [{ instrument: 'חליל צד', teacherName: 'דוד המלך', yearsOfStudy: 1 }], achievements: [],
};


const studentUser2: User = {
    id: 'student-user-2', name: 'תמר ישראלי', email: 'student2@example.com', role: 'student', conservatoriumId: 'cons-15', conservatoriumName: 'הוד השרון', branchId: 'branch-2', avatarUrl: 'https://i.pravatar.cc/150?u=student2', idNumber: '222222222', schoolName: 'תיכון הדרים, הוד השרון', schoolSymbol: '44570001', birthDate: '2007-02-15', enrollmentDate: new Date().toISOString(), city: 'כפר סבא', gender: 'נקבה', phone: '052-2222222', grade: 'יא', conservatoriumStudyYears: 8, instruments: [{ instrument: 'כינור', teacherName: 'מרים כהן', yearsOfStudy: 8 }, { instrument: 'חליל צד', teacherName: 'דוד המלך', yearsOfStudy: 2 },], approved: true, notifications: [], weeklyPracticeGoal: 150, packageId: 'pkg-10', achievements: [],
};

const disengagedStudent: User = {
    id: 'student-user-3', name: 'מאיה כהן', email: 'disengaged@example.com', role: 'student', conservatoriumId: 'cons-15', conservatoriumName: 'הוד השרון', avatarUrl: 'https://i.pravatar.cc/150?u=student3', idNumber: '333333333', enrollmentDate: new Date(new Date().setMonth(new Date().getMonth() - 6)).toISOString(), approved: true, notifications: [], parentId: 'parent-user-2', instruments: [{ instrument: 'צ\'לו', teacherName: 'מרים כהן', yearsOfStudy: 1 }], weeklyPracticeGoal: 90, maxStudents: 20, achievements: [],
};


const otherStudent: User = {
    id: 'other-student-1', name: 'יונתן כץ', email: 'other.student@example.com', role: 'student', conservatoriumId: 'cons-12', conservatoriumName: 'גבעתיים', branchId: 'branch-3', avatarUrl: 'https://i.pravatar.cc/150?u=other-student', idNumber: '333333333', schoolName: 'תיכון קלעי, גבעתיים', schoolSymbol: '99887766', birthDate: '2006-08-10', enrollmentDate: new Date().toISOString(), city: 'גבעתיים', gender: 'זכר', phone: '054-3333333', grade: 'יב', conservatoriumStudyYears: 6, instruments: [{ instrument: 'גיטרה', teacherName: 'גלית שפירא', yearsOfStudy: 6 },], approved: true, notifications: [], achievements: [],
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
        id: 'teacher-user-2', name: 'דוד המלך', email: 'teacher2@example.com',
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
        id: 'teacher-user-3', name: 'גלית שפירא', email: 'teacher3@example.com',
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

const teacherUser = { ...mockTeachers[0], id: 'teacher-user-1', role: 'teacher', conservatoriumId: 'cons-15', branchId: 'branch-1', conservatoriumName: 'הוד השרון', avatarUrl: 'https://i.pravatar.cc/150?u=teacher', idNumber: '444444444', phone: '054-4444444', students: [studentUser.id, studentUser2.id, disengagedStudent.id], approved: true, notifications: teacherNotifications, } as User;
const teacherUser2 = { ...mockTeachers[1], id: 'teacher-user-2', role: 'teacher', conservatoriumId: 'cons-15', branchId: 'branch-2', conservatoriumName: 'הוד השרון', avatarUrl: 'https://i.pravatar.cc/150?u=teacher2', idNumber: '555555555', phone: '054-5555555', students: [studentUser2.id, noaLevi.id], approved: true, notifications: [], maxStudents: 15 } as User;
const teacherUser3 = { ...mockTeachers[2], id: 'teacher-user-3', role: 'teacher', conservatoriumId: 'cons-12', branchId: 'branch-3', conservatoriumName: 'גבעתיים', avatarUrl: 'https://i.pravatar.cc/150?u=teacher3', idNumber: '666666666', phone: '054-6666666', students: [otherStudent.id], approved: true, notifications: [], maxStudents: 18 } as User;

// Generate Conservatorium Admins from the JSON file, adding the logged-in user for "הוד השרון"
const conservatoriumAdminUsers: User[] = constAdminData.map(admin => {
    if (admin.location === 'הוד השרון') {
        return {
            id: 'conservatorium-admin-user-15',
            name: 'יעל פלסטניאר (מנהלת)',
            email: 'admin@example.com',
            role: 'conservatorium_admin',
            conservatoriumId: 'cons-15',
            branchId: 'branch-1',
            conservatoriumName: 'הוד השרון',
            avatarUrl: 'https://i.pravatar.cc/150?u=cons-admin15',
            idNumber: `admin-id-15`,
            phone: '052-4619363',
            students: [studentUser.id, studentUser2.id, disengagedStudent.id, noaLevi.id],
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
    disengagedStudent,
    teacherUser,
    teacherUser2,
    teacherUser3,
    otherStudent,
    noaLevi,
    pendingTeacher,
    siteAdminUser,
    ministryDirectorUser,
    parentUser,
    ...conservatoriumAdminUsers
].filter((v, i, a) => a.findIndex(t => (t.id === v.id)) === i); // Remove duplicates

export const mockFormSubmissions: FormSubmission[] = [
    { id: 'form-101', formType: 'רסיטל בגרות', academicYear: 'תשפ"ד', grade: 'יב', studentId: studentUser.id, studentName: studentUser.name, status: 'ממתין לאישור מנהל', submissionDate: '2024-05-20', totalDuration: '12:30', repertoire: [{ id: 'bach-wtc1-prelude-c', composer: 'יוהאן סבסטיאן באך', title: 'פרלוד ופוגה בדו מז\'ור, רי"ב 846 (מתוך הפסנתר המושווה, ספר א\')', duration: '04:00', genre: 'בארוק' }, { id: 'chopin-nocturne-op9-no2', composer: 'פרדריק שופן', title: 'נוקטורן במי במול מז\'ור, אופ. 9 מס\' 2', duration: '05:00', genre: 'רומנטי' }, { id: 'beethoven-fur-elise', composer: 'לודוויג ואן בטהובן', title: 'לאליזה (Für Elise)', duration: '03:00', genre: 'קלאסי' },], conservatoriumName: studentUser.conservatoriumName, conservatoriumManagerName: 'יעל פלסטניאר (מנהלת)', applicantDetails: { birthDate: studentUser.birthDate, city: studentUser.city, gender: studentUser.gender, phone: studentUser.phone }, schoolDetails: { schoolName: studentUser.schoolName, hasMusicMajor: true, isMajorParticipant: true, plansTheoryExam: true }, teacherDetails: { name: studentUser.instruments?.[0]?.teacherName, yearsWithTeacher: studentUser.instruments?.[0]?.yearsOfStudy, }, instrumentDetails: { instrument: studentUser.instruments?.[0].instrument, yearsOfStudy: studentUser.instruments?.[0].yearsOfStudy } },
    { id: 'form-102', formType: 'כנס / אירוע', studentId: studentUser2.id, studentName: studentUser2.name, status: 'מאושר סופית', submissionDate: '2024-05-18', totalDuration: '08:15', repertoire: [{ id: 'mozart-sonata-16', composer: 'וולפגנג אמדאוס מוצרט', title: 'סונאטה לפסנתר מס\' 16 בדו מז\'ור, ק. 545 "סונאטה פשוטה"', duration: '08:15', genre: 'קלאסי' },], conservatoriumName: studentUser2.conservatoriumName, conservatoriumManagerName: 'יעל פלסטניאר (מנהלת)', signatureUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAACWCAYAAABkW7XSAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAARnSURBVOgN7dRBDQAgEMCw9/6/9EIBCa9A1c2AAdgbCxRYgQUGLMCgAgUWGLCAgQoUWGDCAgYqUGCBBQYswKACBRYYsICBCgRXYAEGFigwAYMKFFhgwAICJlBgAQGLAahAgQUWGLCAgQoUWGDCAgYq0HwBDK+xMv2+4DEAAAAASUVORK5CYII=', signedAt: '2024-05-19', calculatedPrice: 10, paymentStatus: 'paid', },
    { id: 'form-103', formType: 'מבחן שלב', studentId: otherStudent.id, studentName: otherStudent.name, status: 'טיוטה', submissionDate: '2024-05-21', totalDuration: '04:00', repertoire: [{ id: 'comp-clementi', composer: 'קלמנטי', title: 'סונטינה אופ. 36 מס\' 1', duration: '04:00', genre: 'קלאסי' },], conservatoriumName: otherStudent.conservatoriumName, },
    { id: 'form-104', formType: 'רסיטל בגרות', academicYear: 'תשפ"ג', grade: 'יא', studentId: 'user-7', studentName: 'רבקה גולן', status: 'נדחה', teacherComment: 'נא לבחור יצירה נוספת מהתקופה הרומנטית.', submissionDate: '2024-05-15', totalDuration: '09:00', repertoire: [{ id: 'comp-haydn', composer: 'היידן', title: 'סונטה ברה מז\'ור', duration: '09:00', genre: 'קלאסי' },], conservatoriumName: 'מרכז למוסיקה ובימת אמנויות רעננה', },
    { id: 'form-105', formType: 'רסיטל בגרות', academicYear: 'תשפ"ד', grade: 'יא', studentId: studentUser2.id, studentName: studentUser2.name, status: 'נדרש תיקון', ministryComment: 'הרפרטואר אינו מאוזן דיו. יש להחליף את אחת היצירות הקלאסיות ביצירה מהמאה ה-20.', submissionDate: '2024-05-23', totalDuration: '21:00', repertoire: [{ id: 'bach-wtc1-prelude-c', composer: 'יוהאן סבסטיאן באך', title: 'פרלוד ופוגה בדו מז\'ור, רי"ב 846 (מתוך הפסנתר המושווה, ספר א\')', duration: '04:00', genre: 'בארוק' }, { id: 'mozart-eine-kleine', composer: 'וולפגנג אמדאוס מוצרט', title: 'מוזיקת לילה זעירה (Eine kleine Nachtmusik), סרנדה מס\' 13', duration: '05:45', genre: 'קלאסי' }, { id: 'chopin-nocturne-op9-no2', composer: 'פרדריק שופן', title: 'נוקטורן במי במול מז\'ור, אופ. 9 מס\' 2', duration: '04:30', genre: 'רומנטי' }, { id: 'beethoven-moonlight-sonata', composer: 'לודוויג ואן בטהובן', title: 'סונאטה לפסנתר מס\' 14 בדו דיאז מינור, אופ. 27 מס\' 2 "אור ירח"', duration: '15:00', genre: 'קלאסי' }], conservatoriumName: studentUser2.conservatoriumName, applicantDetails: { birthDate: studentUser2.birthDate, city: studentUser2.city, gender: studentUser2.gender, phone: studentUser2.phone }, schoolDetails: { schoolName: studentUser2.schoolName, hasMusicMajor: false, isMajorParticipant: false, plansTheoryExam: true }, teacherDetails: { name: teacherUser.name, }, instrumentDetails: { instrument: studentUser2.instruments?.[0].instrument, yearsOfStudy: studentUser2.instruments?.[0].yearsOfStudy } },
    { id: 'form-106', formType: 'בקשה להשאלת כלי נגינה', formTemplateId: 'template-1', studentId: studentUser.id, studentName: studentUser.name, conservatoriumName: studentUser.conservatoriumName, conservatoriumId: studentUser.conservatoriumId, status: 'ממתין לאישור מנהל', submissionDate: '2024-07-20', totalDuration: '00:00', repertoire: [], formData: { 'field-1': 'הכינור שלי נשלח לתיקון ויחזור רק בעוד כשבועיים. אני זקוק/ה לכלי חלופי כדי להמשיך להתאמן לקראת הרסיטל.', 'field-2': '2024-07-22', 'field-3': 'כינור', 'field-4': true, } },
];

const tenDaysFromNow = addDays(new Date(), 10).toISOString().split('T')[0];
const thirtyDaysFromNow = addDays(new Date(), 30).toISOString().split('T')[0];

export const mockPackages: Package[] = [
    { id: 'pkg-trial', type: 'TRIAL', title: 'שיעור ניסיון', description: 'שיעור אחד, ללא התחייבות', price: 80 },
    { id: 'pkg-5', type: 'PACK_5', title: 'חבילת 5 שיעורים', description: 'גמישות מירבית', price: 750, totalCredits: 5, validUntil: tenDaysFromNow },
    { id: 'pkg-10', type: 'PACK_10', title: 'חבילת 10 שיעורים', description: 'החבילה הפופולרית ביותר', price: 1400, totalCredits: 10, validUntil: thirtyDaysFromNow },
    { id: 'pkg-monthly', type: 'MONTHLY', title: 'מנוי חודשי', description: 'שיעור שבועי קבוע, חידוש אוטומטי', price: 560 },
    { id: 'pkg-yearly', type: 'YEARLY', title: 'מנוי שנתי', description: 'המחיר הטוב ביותר, שמירת מקום מובטחת', price: 5800 },
];

export const mockRooms: Room[] = [
    { id: 'room-101', name: 'Room 101', branchId: 'branch-1' },
    { id: 'room-102', name: 'Room 102 - Piano Studio', branchId: 'branch-1' },
    { id: 'room-103', name: 'Room 103', branchId: 'branch-2' },
    { id: 'room-201', name: 'Room 201 - Ensemble Hall', branchId: 'branch-2' },
    { id: 'room-202', name: 'Room 202', branchId: 'branch-1' },
];

export const mockLessons: LessonSlot[] = [
    { id: 'lesson-1', conservatoriumId: 'cons-15', branchId: 'branch-1', teacherId: 'teacher-user-1', studentId: 'student-user-1', instrument: 'פסנתר', startTime: addDays(new Date(), 2).toISOString(), durationMinutes: 45, type: 'RECURRING', status: 'SCHEDULED', bookingSource: 'ADMIN', isVirtual: false, roomId: 'room-102', isCreditConsumed: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'lesson-2', conservatoriumId: 'cons-15', branchId: 'branch-2', teacherId: 'teacher-user-1', studentId: 'student-user-2', instrument: 'כינור', startTime: addDays(new Date(), 3).toISOString(), durationMinutes: 60, type: 'RECURRING', status: 'SCHEDULED', bookingSource: 'ADMIN', roomId: 'room-101', isVirtual: false, isCreditConsumed: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'lesson-3', conservatoriumId: 'cons-15', branchId: 'branch-1', teacherId: 'teacher-user-1', studentId: 'student-user-1', instrument: 'פסנתר', startTime: new Date(new Date().setDate(new Date().getDate() - 6)).toISOString(), durationMinutes: 45, type: 'RECURRING', status: 'COMPLETED', attendanceMarkedAt: new Date(new Date().setDate(new Date().getDate() - 6)).toISOString(), bookingSource: 'ADMIN', roomId: 'room-102', isVirtual: false, isCreditConsumed: true, createdAt: new Date(new Date().setDate(new Date().getDate() - 6)).toISOString(), updatedAt: new Date().toISOString() },
    { id: 'lesson-4', conservatoriumId: 'cons-15', branchId: 'branch-2', teacherId: 'teacher-user-1', studentId: 'student-user-2', instrument: 'כינור', startTime: new Date(new Date().setDate(new Date().getDate() - 5)).toISOString(), durationMinutes: 60, type: 'RECURRING', status: 'COMPLETED', attendanceMarkedAt: new Date(new Date().setDate(new Date().getDate() - 5)).toISOString(), bookingSource: 'ADMIN', roomId: 'room-101', isVirtual: false, isCreditConsumed: true, createdAt: new Date(new Date().setDate(new Date().getDate() - 5)).toISOString(), updatedAt: new Date().toISOString() },
    { id: 'lesson-d1', conservatoriumId: 'cons-15', branchId: 'branch-1', teacherId: 'teacher-user-1', studentId: 'student-user-3', instrument: 'צ\'לו', startTime: new Date(new Date().setDate(new Date().getDate() - 10)).toISOString(), durationMinutes: 45, type: 'RECURRING', status: 'NO_SHOW_STUDENT', attendanceMarkedAt: new Date(new Date().setDate(new Date().getDate() - 10)).toISOString(), bookingSource: 'ADMIN', roomId: 'room-202', isVirtual: false, isCreditConsumed: true, createdAt: new Date(new Date().setDate(new Date().getDate() - 10)).toISOString(), updatedAt: new Date().toISOString() },
    { id: 'lesson-d2', conservatoriumId: 'cons-15', branchId: 'branch-1', teacherId: 'teacher-user-1', studentId: 'student-user-3', instrument: 'צ\'לו', startTime: new Date(new Date().setDate(new Date().getDate() - 3)).toISOString(), durationMinutes: 45, type: 'RECURRING', status: 'NO_SHOW_STUDENT', attendanceMarkedAt: new Date(new Date().setDate(new Date().getDate() - 3)).toISOString(), bookingSource: 'ADMIN', roomId: 'room-202', isVirtual: false, isCreditConsumed: true, createdAt: new Date(new Date().setDate(new Date().getDate() - 3)).toISOString(), updatedAt: new Date().toISOString() },
    // Credits for Ariel
    { id: 'lesson-cancel-1', conservatoriumId: 'cons-15', branchId: 'branch-1', teacherId: 'teacher-user-1', studentId: 'student-user-1', instrument: 'פסנתר', startTime: new Date(new Date().setDate(new Date().getDate() - 70)).toISOString(), durationMinutes: 45, type: 'RECURRING', status: 'CANCELLED_TEACHER', bookingSource: 'ADMIN', isVirtual: false, isCreditConsumed: true, createdAt: new Date(new Date().setDate(new Date().getDate() - 71)).toISOString(), updatedAt: new Date().toISOString() },
    { id: 'lesson-cancel-2', conservatoriumId: 'cons-15', branchId: 'branch-1', teacherId: 'teacher-user-1', studentId: 'student-user-1', instrument: 'פסנתר', startTime: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString(), durationMinutes: 45, type: 'RECURRING', status: 'CANCELLED_CONSERVATORIUM', bookingSource: 'ADMIN', isVirtual: false, isCreditConsumed: true, createdAt: new Date(new Date().setDate(new Date().getDate() - 31)).toISOString(), updatedAt: new Date().toISOString() },
    { id: 'lesson-cancel-3', conservatoriumId: 'cons-15', branchId: 'branch-1', teacherId: 'teacher-user-1', studentId: 'student-user-1', instrument: 'פסנתר', startTime: new Date(new Date().setDate(new Date().getDate() - 10)).toISOString(), durationMinutes: 45, type: 'RECURRING', status: 'CANCELLED_STUDENT_NOTICED', bookingSource: 'ADMIN', isVirtual: false, isCreditConsumed: true, createdAt: new Date(new Date().setDate(new Date().getDate() - 11)).toISOString(), updatedAt: new Date().toISOString() },
    // Used credit
    { id: 'lesson-makeup-1', conservatoriumId: 'cons-15', branchId: 'branch-1', teacherId: 'teacher-user-1', studentId: 'student-user-1', instrument: 'פסנתר', startTime: new Date(new Date().setDate(new Date().getDate() - 5)).toISOString(), durationMinutes: 45, type: 'MAKEUP', status: 'COMPLETED', bookingSource: 'STUDENT_SELF', isVirtual: false, isCreditConsumed: false, createdAt: new Date(new Date().setDate(new Date().getDate() - 6)).toISOString(), updatedAt: new Date().toISOString() },
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
        status: 'OVERDUE',
        dueDate: '2024-07-01',
    },
];

export const mockPracticeLogs: PracticeLog[] = [
    {
        id: 'pl-1',
        studentId: 'student-user-1',
        teacherId: 'teacher-user-1',
        date: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString(),
        durationMinutes: 30,
        pieces: [{ title: 'סונטה של מוצרט' }],
        mood: 'OKAY',
    },
    {
        id: 'pl-2',
        studentId: 'student-user-1',
        teacherId: 'teacher-user-1',
        date: new Date(new Date().setDate(new Date().getDate() - 2)).toISOString(),
        durationMinutes: 45,
        pieces: [{ title: 'סונטה של מוצרט' }, { title: 'אטיוד של שופן' }],
        mood: 'GREAT',
    },
    {
        id: 'pl-3',
        studentId: 'student-user-1',
        teacherId: 'teacher-user-1',
        date: new Date(new Date().setDate(new Date().getDate() - 4)).toISOString(),
        durationMinutes: 20,
        pieces: [{ title: 'סונטה של מוצרט' }],
        mood: 'HARD',
        studentNote: 'היה לי קשה עם המעבר בתיבה 24.'
    },
    {
        id: 'pl-4',
        studentId: 'student-user-1',
        teacherId: 'teacher-user-1',
        date: new Date(new Date().setDate(new Date().getDate() - 5)).toISOString(),
        durationMinutes: 35,
        pieces: [{ title: 'אטיוד של שופן' }],
        mood: 'OKAY',
    },
    {
        id: 'pl-5',
        studentId: 'student-user-1',
        teacherId: 'teacher-user-1',
        date: new Date(new Date().setDate(new Date().getDate() - 6)).toISOString(),
        durationMinutes: 25,
        pieces: [{ title: 'סונטה של מוצרט' }],
        mood: 'GREAT',
    },
     {
        id: 'pl-8',
        studentId: 'student-user-1',
        teacherId: 'teacher-user-1',
        date: new Date(new Date().setDate(new Date().getDate() - 3)).toISOString(),
        durationMinutes: 30,
        pieces: [{ title: 'אטיוד של שופן' }],
        mood: 'GREAT',
    },
     {
        id: 'pl-9',
        studentId: 'student-user-1',
        teacherId: 'teacher-user-1',
        date: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString(),
        durationMinutes: 40,
        pieces: [{ title: 'פרלוד של באך' }],
        mood: 'OKAY',
    },
    {
        id: 'pl-6',
        studentId: 'student-user-2',
        teacherId: 'teacher-user-1',
        date: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString(),
        durationMinutes: 60,
        pieces: [{ title: 'קונצ\'רטו של ברוך' }],
        mood: 'GREAT',
    },
    {
        id: 'pl-7',
        studentId: 'student-user-2',
        teacherId: 'teacher-user-1',
        date: new Date(new Date().setDate(new Date().getDate() - 3)).toISOString(),
        durationMinutes: 50,
        pieces: [{ title: 'קונצ\'רטו של ברוך' }, { title: 'פרטיטה של באך' }],
        mood: 'OKAY',
        studentNote: 'האינטונציה קצת בעייתית בפרק השני.'
    },
];

export const mockAssignedRepertoire: AssignedRepertoire[] = [
    { id: 'rep-1', studentId: 'student-user-1', compositionId: 'bach-wtc1-prelude-c', status: 'PERFORMANCE_READY', assignedAt: new Date().toISOString() },
    { id: 'rep-2', studentId: 'student-user-1', compositionId: 'chopin-nocturne-op9-no2', status: 'LEARNING', assignedAt: new Date().toISOString() },
    { id: 'rep-3', studentId: 'student-user-2', compositionId: 'mozart-sonata-16', status: 'COMPLETED', assignedAt: new Date(new Date().setMonth(new Date().getMonth() - 2)).toISOString(), completedAt: new Date().toISOString() },
];

export const mockLessonNotes: LessonNote[] = [
    {
        id: 'note-1',
        lessonSlotId: 'lesson-3',
        teacherId: 'teacher-user-1',
        studentId: 'student-user-1',
        summary: 'עבדנו על דינמיקה בפרלוד של באך. יש לשים לב למעברים בין פורטה לפיאנו.',
        homeworkAssignments: ['לתרגל את תיבות 1-16 בידיים נפרדות', 'להקשיב להקלטה של גלן גולד'],
        isSharedWithStudent: true,
        isSharedWithParent: true,
        createdAt: new Date(new Date().setDate(new Date().getDate() - 6)).toISOString()
    },
    {
        id: 'note-2',
        lessonSlotId: 'lesson-1-past',
        teacherId: 'teacher-user-1',
        studentId: 'student-user-1',
        summary: 'התקדמות יפה בנוקטורן של שופן. יש לעבוד על אצבוע מדויק יותר בתיבות 20-25.',
        homeworkAssignments: ['לנגן את הנוקטורן 5 פעמים ברצף ללא טעויות', 'להאזין לביצוע של ארתור רובינשטיין'],
        isSharedWithStudent: true,
        isSharedWithParent: true,
        createdAt: new Date(new Date().setDate(new Date().getDate() - 2)).toISOString()
    }
];

export const mockMessageThreads: MessageThread[] = [
    {
        id: 'thread-1',
        participants: ['teacher-user-1', 'student-user-1'],
        messages: [
            { senderId: 'teacher-user-1', body: 'היי אריאל, אל תשכח לתרגל את המעבר בתיבה 24 לקראת השיעור הבא.', sentAt: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString() },
            { senderId: 'student-user-1', body: 'בסדר גמור, מרים. אני עובד על זה!', sentAt: new Date().toISOString() },
        ]
    },
    {
        id: 'thread-2',
        participants: ['teacher-user-1', 'student-user-2'],
        messages: [
            { senderId: 'teacher-user-1', body: 'תמר, תוכלי להביא את התווים של הפרטיטה של באך לשיעור ביום שלישי?', sentAt: new Date(new Date().setDate(new Date().getDate() - 2)).toISOString() },
        ]
    },
    {
        id: 'thread-3',
        participants: ['teacher-user-1', 'parent-user-1'],
        messages: [
            { senderId: 'parent-user-1', body: 'היי מרים, רציתי לשאול לגבי אפשרות להעביר את השיעור של אריאל בשבוע הבא מיום שלישי לחמישי.', sentAt: new Date(new Date().setDate(new Date().getDate() - 3)).toISOString() },
            { senderId: 'teacher-user-1', body: 'היי דני, בטח. בוא נבדוק זמינות. אשלח לך אופציות בהמשך היום.', sentAt: new Date(new Date().setDate(new Date().getDate() - 3)).toISOString() },
        ]
    }
];


export const mockProgressReports: ProgressReport[] = [];
export const mockAnnouncements: Announcement[] = [];

export const mockFormTemplates: FormTemplate[] = [
    {
        id: 'template-1',
        conservatoriumId: 'cons-15', // 'הוד השרון'
        title: 'בקשה להשאלת כלי נגינה',
        description: 'טופס להגשת בקשה להשאלה של כלי נגינה מהמלאי של הקונסרבטוריון.',
        fields: [
            { id: 'field-1', label: 'סיבת הבקשה', type: 'textarea', required: true, placeholder: 'לדוגמה: הכלי שלי בתיקון, צורך בכלי שני...' },
            { id: 'field-2', label: 'תאריך התחלה רצוי', type: 'date', required: true },
            { id: 'field-3', label: 'סוג הכלי המבוקש', type: 'dropdown', required: true, options: 'כינור,צ\'לו,גיטרה,חליל,קלרינט' },
            { id: 'field-4', label: 'קראתי ואני מאשר/ת את תנאי ההשאלה', type: 'checkbox', required: true },
        ],
        workflow: [
            { id: 'wf-1', stepIndex: 0, roleName: 'אישור מורה', requiredRole: 'teacher' },
            { id: 'wf-2', stepIndex: 1, roleName: 'אישור מנהל מלאי', requiredRole: 'conservatorium_admin' },
        ],
        createdAt: new Date().toISOString(),
    }
];

export const mockAuditLog: AuditLogEntry[] = [];

export const mockEvents: EventProduction[] = [
    {
        id: 'event-spring-2024',
        conservatoriumId: 'cons-15',
        branchId: 'branch-1',
        name: 'רסיטל אביב 2024',
        type: 'RECITAL',
        venue: 'אולם הקונצרטים, הוד השרון',
        eventDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString(),
        startTime: '19:00',
        status: 'OPEN_REGISTRATION',
        isPublic: true,
        ticketPrice: 25,
        program: [
            { id: 'ps-1', studentId: 'student-user-1', studentName: 'אריאל לוי', compositionTitle: 'נוקטורן במי במול מז\'ור, אופ. 9 מס\' 2', composer: 'שופן', duration: '05:00' },
            { id: 'ps-2', studentId: 'student-user-2', studentName: 'תמר ישראלי', compositionTitle: 'קונצ\'רטו לכינור מס\' 1', composer: 'ברוך', duration: '08:30' },
        ],
        dressRehearsalDate: new Date(new Date().setMonth(new Date().getMonth() + 1, new Date(new Date().setMonth(new Date().getMonth() + 1)).getDate() - 1)).toISOString(),
        soundCheckSchedule: [
            { performanceId: 'ps-1', startTime: '17:00', durationMinutes: 15 },
            { performanceId: 'ps-2', startTime: '17:15', durationMinutes: 20 },
        ]
    },
    {
        id: 'event-exam-2024',
        conservatoriumId: 'cons-15',
        branchId: 'branch-2',
        name: 'בחינות בגרות - מועד קיץ',
        type: 'EXAM_PERFORMANCE',
        venue: 'חדר 201 - אולם אנסמבלים',
        eventDate: new Date(new Date().setMonth(new Date().getMonth() + 2)).toISOString(),
        startTime: '09:00',
        status: 'PLANNING',
        isPublic: false,
        ticketPrice: 0,
        program: []
    }
];

export const mockInstrumentInventory: InstrumentInventory[] = [
    {
        id: 'inst-inv-1',
        conservatoriumId: 'cons-15',
        type: 'כינור',
        brand: 'Stentor',
        serialNumber: 'SN12345',
        condition: 'GOOD',
        rentalRatePerMonth: 50,
        currentRenterId: 'student-user-1',
        rentalStartDate: new Date('2024-06-01').toISOString(),
        expectedReturnDate: new Date('2025-06-01').toISOString(),
    },
    {
        id: 'inst-inv-2',
        conservatoriumId: 'cons-15',
        type: 'צ\'לו',
        brand: 'Yamaha',
        serialNumber: 'SN67890',
        condition: 'NEW',
        rentalRatePerMonth: 80,
    },
    {
        id: 'inst-inv-3',
        conservatoriumId: 'cons-15',
        type: 'חליל צד',
        brand: 'Jupiter',
        serialNumber: 'SN54321',
        condition: 'FAIR',
        rentalRatePerMonth: 40,
    }
];

export const mockPerformanceBookings: PerformanceBooking[] = [
    {
        id: 'perf-1',
        conservatoriumId: 'cons-15',
        eventName: 'חתונה - משפחת כהן',
        eventType: 'חתונה',
        eventDate: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString(),
        eventTime: '19:30',
        eventLocation: 'אולמי "הדריה", הרצליה',
        clientName: 'יוסי כהן',
        clientEmail: 'yossi@cohen.com',
        clientPhone: '052-1234567',
        ensembleSize: 'דואט (2 נגנים)',
        genre: 'קלאסי',
        totalQuote: 2800,
        status: 'INQUIRY_RECEIVED',
        inquiryReceivedAt: new Date().toISOString(),
        assignedMusicians: [],
    },
];

export const mockScholarshipApplications: ScholarshipApplication[] = [
  {
    id: `schol-app-1`,
    studentId: 'student-user-2',
    studentName: 'תמר ישראלי',
    instrument: 'כינור',
    conservatoriumId: 'cons-15',
    academicYear: 'תשפ"ה',
    status: 'SUBMITTED',
    submittedAt: new Date(new Date().setDate(new Date().getDate() - 5)).toISOString(),
    priorityScore: 75,
  }
];

export const mockOpenDayEvents: OpenDayEvent[] = [
  {
    id: 'open-day-event-1',
    conservatoriumId: 'cons-15',
    name: 'יום פתוח אביב 2024',
    date: addDays(new Date(), 14).toISOString(),
    startTime: '10:00',
    endTime: '14:00',
    appointmentDuration: 20,
    isActive: true,
  }
];

export const mockOpenDayAppointments: OpenDayAppointment[] = [
  {
    id: 'open-day-appt-1',
    eventId: 'open-day-event-1',
    familyName: 'לוי',
    parentEmail: 'levi.fam@email.com',
    parentPhone: '050-1234567',
    childName: 'איתי',
    childAge: 8,
    instrumentInterest: 'פסנתר',
    appointmentTime: setMinutes(setHours(addDays(new Date(), 14), 10), 0).toISOString(),
    status: 'SCHEDULED',
    registeredAt: new Date().toISOString(),
  }
];

export const mockPracticeVideos: PracticeVideo[] = [
    {
        id: 'pv-1',
        studentId: 'student-user-1',
        teacherId: 'teacher-user-1',
        repertoireTitle: 'נוקטורן במי במול מז\'ור, אופ. 9 מס\' 2',
        videoUrl: 'https://placehold.co/600x400.mp4',
        studentNote: 'אני לא בטוח לגבי הדינמיקה בתיבות 12-16, אשמח למשוב.',
        createdAt: new Date(new Date().setDate(new Date().getDate() - 2)).toISOString(),
        feedback: [
            {
                teacherId: 'teacher-user-1',
                comment: 'הדינמיקה נשמעת טוב! נסה להדגיש קצת יותר את הקרשנדו לקראת סוף הקטע.',
                createdAt: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString(),
            }
        ]
    }
];

export const mockWaitlist: WaitlistEntry[] = [
    {
        id: 'wait-1',
        studentId: 'student-user-noa',
        teacherId: 'teacher-user-1',
        conservatoriumId: 'cons-15',
        instrument: 'פסנתר',
        preferredDays: ['MON', 'WED'],
        preferredTimes: ['AFTERNOON'],
        joinedAt: new Date(new Date().setDate(new Date().getDate() - 10)).toISOString(),
        status: 'WAITING',
    },
    {
        id: 'wait-2',
        studentId: 'other-student-1',
        teacherId: 'teacher-user-3',
        conservatoriumId: 'cons-12',
        instrument: 'גיטרה',
        preferredDays: ['TUE', 'THU'],
        preferredTimes: ['EVENING'],
        joinedAt: new Date(new Date().setDate(new Date().getDate() - 5)).toISOString(),
        status: 'OFFERED',
        notifiedAt: new Date().toISOString(),
    }
];

export const mockPayrolls: PayrollSummary[] = [
    {
        id: 'payroll-1',
        teacherId: 'teacher-user-1',
        teacherName: 'מרים כהן',
        periodStart: '2024-07-01T00:00:00.000Z',
        periodEnd: '2024-07-31T23:59:59.999Z',
        completedLessons: [
            {
                slotId: 'lesson-3',
                studentId: 'student-user-1',
                studentName: 'אריאל לוי',
                durationMinutes: 45,
                rate: 120,
                subtotal: 90,
                completedAt: '2024-07-15T10:00:00.000Z'
            },
            {
                slotId: 'lesson-4',
                studentId: 'student-user-2',
                studentName: 'תמר ישראלי',
                durationMinutes: 60,
                rate: 120,
                subtotal: 120,
                completedAt: '2024-07-16T11:00:00.000Z'
            }
        ],
        totalHours: 1.75,
        grossPay: 210,
        status: 'DRAFT'
    },
    {
        id: 'payroll-2',
        teacherId: 'teacher-user-2',
        teacherName: 'דוד המלך',
        periodStart: '2024-07-01T00:00:00.000Z',
        periodEnd: '2024-07-31T23:59:59.999Z',
        completedLessons: [],
        totalHours: 0,
        grossPay: 0,
        status: 'DRAFT'
    },
     {
        id: 'payroll-3',
        teacherId: 'teacher-user-1',
        teacherName: 'מרים כהן',
        periodStart: '2024-06-01T00:00:00.000Z',
        periodEnd: '2024-06-30T23:59:59.999Z',
        completedLessons: [
             {
                slotId: 'lesson-makeup-1',
                studentId: 'student-user-1',
                studentName: 'אריאל לוי',
                durationMinutes: 45,
                rate: 120,
                subtotal: 90,
                completedAt: '2024-06-20T10:00:00.000Z'
            }
        ],
        totalHours: 0.75,
        grossPay: 90,
        status: 'PAID'
    }
];
