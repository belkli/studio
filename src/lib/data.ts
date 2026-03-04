
import type { User, FormSubmission, Notification, Conservatorium, Package, LessonPackage, ConservatoriumInstrument, LessonSlot, Invoice, PracticeLog, Composition, AssignedRepertoire, LessonNote, RepertoireStatus, MessageThread, ProgressReport, Announcement, Room, PayrollSummary, PracticeVideo, WaitlistEntry, FormTemplate, AuditLogEntry, SlotStatus, Channel, NotificationPreferences, Achievement, AchievementType, EventProduction, EventProductionStatus, PerformanceSlot, InstrumentInventory, InstrumentCondition, PerformanceBooking, PerformanceBookingStatus, ScholarshipApplication, OpenDayEvent, OpenDayAppointment, Branch, PerformanceGenre, Alumnus, Masterclass, DonationCause, DonationRecord, InstrumentRental } from './types';
import constAdminData from '../../docs/constadmin.json';
import rawCompositions from '../../docs/data.json';
import rawConservatoriums from '../../docs/Conservatoriums/conservatoriums.json';

const tierCycle: ('A' | 'B' | 'C')[] = ['A', 'B', 'C'];

// Build a lookup map from scraped data by numeric id
const scrapedById: Record<number, any> = {};
(rawConservatoriums as any[]).forEach((c: any) => { scrapedById[c.id] = c; });

// Generate Conservatoriums from the JSON file, enriched with scraped profile data
export const conservatoriums: Conservatorium[] = constAdminData.map((admin, index) => {
    const isHodHasharon = admin.location === 'הוד השרון';
    const scraped: any = scrapedById[admin.id] || {};

    // Map scraped departments
    const departments = scraped.departments?.map((d: any) => ({
        name: d.name,
        headTeacher: d.head,
        link: d.link,
        photoUrl: d.photo,
    }));

    // Map scraped teachers
    const teachers = scraped.teachers?.map((t: any, i: number) => ({
        id: `teacher-dir-${admin.id}-${i}`,
        name: t.name,
        role: t.role,
        photoUrl: t.photo_url,
    }));

    // Map scraped branches
    const branchesInfo = scraped.branches?.map((b: any) => ({
        name: b.name,
        address: b.address,
        tel: b.tel,
        email: b.email,
        manager: b.manager,
    }));

    // Map location
    const location = scraped.location ? {
        city: scraped.location.city || scraped.city || admin.location,
        cityEn: scraped.city_en,
        address: scraped.location.address,
        coordinates: scraped.location.coordinates,
        branches: scraped.location.branches,
    } : {
        city: admin.location,
    };

    // Map manager from scraped (richer) or admin data
    const manager = scraped.manager ? {
        name: scraped.manager.name || admin.manager_name,
        role: scraped.manager.role,
        bio: scraped.manager.bio,
        photoUrl: scraped.manager.photo_url,
    } : {
        name: admin.manager_name,
    };

    return {
        id: `cons-${admin.id}`,
        name: scraped.name || (admin.organization ? `${admin.location} (${admin.organization})` : admin.location),
        nameEn: scraped.name_en,
        tier: tierCycle[index % 3],
        stampUrl: `https://picsum.photos/seed/stamp${admin.id}/200/200`,
        newFeaturesEnabled: isHodHasharon,
        aiAgentsConfig: isHodHasharon ? {
            "matchmaker-agent": true,
            "composition-suggester": true,
            "reschedule-agent": false,
            "progress-report-agent": false,
            "admin-alerts-agent": false,
            "lead-nurture-agent": false,
        } : undefined,
        // Public profile
        about: scraped.about,
        email: scraped.email?.split(';')[0].trim() || 'no-email@example.com',
        secondaryEmail: scraped.secondary_email,
        tel: scraped.tel || admin.office_phone,
        officialSite: scraped.official_site,
        openingHours: scraped.opening_hours,
        location,
        manager,
        pedagogicalCoordinator: scraped.pedagogical_coordinator ? {
            name: scraped.pedagogical_coordinator.name,
            role: scraped.pedagogical_coordinator.role,
            bio: scraped.pedagogical_coordinator.bio,
            photoUrl: scraped.pedagogical_coordinator.photo_url,
        } : undefined,
        leadingTeam: scraped.leading_team ? scraped.leading_team.map((m: any) => ({
            name: m.name,
            role: m.role,
            bio: m.bio,
            photoUrl: m.photo_url,
        })) : (admin.id === 15 ? [
            {
                name: "מיכאל גורביץ'",
                role: "מנהל אמנותי",
                bio: "בימאי ומחזאי, חתן פרס ישראל",
                photoUrl: "https://alumahod.com/wp-content/uploads/2025/11/%D7%9E%D7%99%D7%9B%D7%90%D7%9C-%D7%92%D7%95%D7%A8%D7%91%D7%99%D7%A5.jpg"
            }
        ] : undefined),
        departments,
        branchesInfo,
        teachers,
        programs: scraped.programs,
        ensembles: scraped.ensembles,
        socialMedia: scraped.social_media ? {
            facebook: scraped.social_media.facebook,
            instagram: scraped.social_media.instagram,
            youtube: scraped.social_media.youtube,
            tiktok: scraped.social_media.tiktok,
            whatsapp: scraped.social_media.whatsapp,
        } : undefined,
        photoUrls: scraped.photos?.length > 0 ? scraped.photos : undefined,
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

const CANONICAL_COMPOSERS: Record<string, { he: string; en: string; ru?: string; ar?: string; aliases: string[] }> = {
    beethoven: { he: '??????', en: 'Beethoven', ru: '????????', ar: '???????', aliases: ['beethoven', '??????'] },
    mozart: { he: '?????', en: 'Mozart', ru: '??????', ar: '??????', aliases: ['mozart', '?????'] },
    bach: { he: '???', en: 'Bach', ru: '???', ar: '???', aliases: ['bach', '???'] },
    chopin: { he: '????', en: 'Chopin', ru: '?????', ar: '?????', aliases: ['chopin', '????'] },
    brahms: { he: '?????', en: 'Brahms', ru: '?????', ar: '?????', aliases: ['brahms', '?????'] },
    handel: { he: '????', en: 'Handel', ru: '???????', ar: '?????', aliases: ['handel', 'haendel', '????'] },
    schumann: { he: '????', en: 'Schumann', ru: '?????', ar: '?????', aliases: ['schumann', '????'] },
};

const normalizeText = (value: string) =>
    value
        .normalize('NFKD')
        .replace(/[֑-ׇ]/g, '')
        .toLowerCase()
        .trim();

const slugifyComposer = (value: string) => {
    const normalized = normalizeText(value)
        .replace(/[^a-z0-9֐-׿s-]/g, '')
        .replace(/s+/g, '-');

    return normalized || 'unknown-composer';
};

const hasHebrewChars = (value: string) => /[\u0590-\u05ff]/.test(value);

const localizeSeedTitle = (titleRaw: string) => ({
    he: titleRaw,
    en: hasHebrewChars(titleRaw) ? `${titleRaw} (EN)` : titleRaw,
    ru: hasHebrewChars(titleRaw) ? `${titleRaw} (RU)` : titleRaw,
    ar: hasHebrewChars(titleRaw) ? `${titleRaw} (AR)` : titleRaw,
});

const resolveComposerData = (composerRaw: string) => {
    const normalized = normalizeText(composerRaw);
    const canonical = Object.entries(CANONICAL_COMPOSERS).find(([, value]) =>
        value.aliases.some((alias) => normalized.includes(normalizeText(alias)))
    );

    if (canonical) {
        return {
            id: canonical[0],
            names: {
                he: canonical[1].he,
                en: canonical[1].en,
                ru: canonical[1].ru,
                ar: canonical[1].ar,
            },
        };
    }

    return {
        id: slugifyComposer(composerRaw),
        names: {
            he: composerRaw,
            en: composerRaw,
            ru: composerRaw,
            ar: composerRaw,
        },
    };
};


export const compositions: Composition[] = (rawCompositions as any[]).map((item: any, index: number) => {
    const composerRaw = item['\u05de\u05dc\u05d7\u05d9\u05df'] || 'Unknown Composer';
    const titleRaw = item['\u05d9\u05e6\u05d9\u05e8\u05d4'] || 'Untitled';
    const composerData = resolveComposerData(composerRaw);

    return {
        id: `comp-db-${index}`,
        composerId: composerData.id,
        composer: composerData.names.he || composerRaw,
        composerNames: composerData.names,
        title: titleRaw,
        titles: localizeSeedTitle(titleRaw),
        duration: '05:00', // Placeholder duration, as it's not in the JSON
        genre: item['\u05ea\u05e7\u05d5\u05e4\u05d4'] || 'Unknown',
        instrument: item['\u05db\u05dc\u05d9'] || undefined,
        approved: item['\u05de\u05d0\u05d5\u05e9\u05e8 \u05db\u05d9\u05e6\u05d9\u05e8\u05d4 \u05de\u05e8\u05db\u05d6\u05d9\u05ea'] === '\u05db\u05df',
        source: 'seed' as const,
    };
}).filter(c => c.composer && c.title);

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
    {
        id: 'room-1',
        conservatoriumId: 'cons-15',
        branchId: 'branch-1',
        name: 'Piano Studio 1',
        capacity: 2,
        instrumentEquipment: [
            { instrumentId: 'piano', quantity: 1, notes: 'Yamaha grand' }
        ],
        blocks: [],
        isActive: true,
        description: 'Dedicated room for piano lessons.',
        photoUrl: 'https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?q=80&w=2070&auto=format&fit=crop'
    },
    {
        id: 'room-2',
        conservatoriumId: 'cons-15',
        branchId: 'branch-1',
        name: 'Strings Room',
        capacity: 2,
        instrumentEquipment: [
            { instrumentId: 'violin', quantity: 2 }
        ],
        blocks: [],
        isActive: true,
        description: 'Best fit for violin and chamber lessons.'
    },
    {
        id: 'room-3',
        conservatoriumId: 'cons-15',
        branchId: 'branch-1',
        name: 'Drums Room',
        capacity: 3,
        instrumentEquipment: [
            { instrumentId: 'drums', quantity: 1 },
            { instrumentId: 'piano', quantity: 1, notes: 'upright' }
        ],
        blocks: [],
        isActive: true,
        description: 'Isolated room for percussion and loud instruments.'
    },
    {
        id: 'room-4',
        conservatoriumId: 'cons-15',
        branchId: 'branch-2',
        name: 'Theory Classroom',
        capacity: 15,
        instrumentEquipment: [
            { instrumentId: 'piano', quantity: 1 }
        ],
        blocks: [],
        isActive: true,
        description: 'Classroom for theory and small ensembles.'
    },
    {
        id: 'room-5',
        conservatoriumId: 'cons-15',
        branchId: 'branch-2',
        name: 'Guitar Studio',
        capacity: 3,
        instrumentEquipment: [
            { instrumentId: 'guitar', quantity: 3 }
        ],
        blocks: [],
        isActive: true,
        description: 'Room for guitar lessons and coaching.'
    },
    {
        id: 'room-6',
        conservatoriumId: 'cons-12',
        branchId: 'branch-3',
        name: 'Winds Room',
        capacity: 5,
        instrumentEquipment: [
            { instrumentId: 'flute', quantity: 2 },
            { instrumentId: 'clarinet', quantity: 2 }
        ],
        blocks: [],
        isActive: true,
        description: 'Room for woodwind instruction.'
    },
    {
        id: 'room-7',
        conservatoriumId: 'cons-12',
        branchId: 'branch-3',
        name: 'Cello Room',
        capacity: 2,
        instrumentEquipment: [
            { instrumentId: 'cello', quantity: 2 }
        ],
        blocks: [],
        isActive: true,
        description: 'Quiet practice room for cello students.'
    },
];

const studentNotifications: Notification[] = [];
const teacherNotifications: Notification[] = [];
const adminNotifications: Notification[] = [];
const siteAdminNotifications: Notification[] = [];

// --- Mock Users ---
const studentUser: User = {
    id: 'student-user-1', name: 'אריאל לוי', email: 'student@example.com', role: 'student', conservatoriumId: 'cons-15', conservatoriumName: 'הוד השרון', avatarUrl: 'https://i.pravatar.cc/150?u=student', idNumber: '111111111', schoolName: 'תיכון הדרים, הוד השרון', schoolSymbol: '44570001', birthDate: '2006-05-10', city: 'הוד השרון', gender: 'זכר', phone: '050-1111111', grade: 'יב', conservatoriumStudyYears: 10, instruments: [{ instrument: 'פסנתר', teacherName: 'מרים כהן', yearsOfStudy: 10 },], approved: true, notifications: studentNotifications, weeklyPracticeGoal: 120, achievements: [], createdAt: '2024-03-03T12:00:00.000Z',
};

const studentUser2: User = {
    id: 'student-user-2', name: 'תמר ישראלי', email: 'student2@example.com', role: 'student', conservatoriumId: 'cons-15', conservatoriumName: 'הוד השרון', avatarUrl: 'https://i.pravatar.cc/150?u=student2', idNumber: '222222222', schoolName: 'תיכון הדרים, הוד השרון', schoolSymbol: '44570001', birthDate: '2007-02-15', city: 'כפר סבא', gender: 'נקבה', phone: '052-2222222', grade: 'יא', conservatoriumStudyYears: 8, instruments: [{ instrument: 'כינור', teacherName: 'מרים כהן', yearsOfStudy: 8 }, { instrument: 'חליל צד', teacherName: 'דוד המלך', yearsOfStudy: 2 },], approved: true, notifications: [], weeklyPracticeGoal: 90, achievements: [], createdAt: '2024-03-03T12:00:00.000Z',
};

const otherStudent: User = {
    id: 'other-student-1', name: 'יונתן כץ', email: 'other.student@example.com', role: 'student', conservatoriumId: 'cons-12', conservatoriumName: 'גבעתיים', avatarUrl: 'https://i.pravatar.cc/150?u=other-student', idNumber: '333333333', schoolName: 'תיכון קלעי, גבעתיים', schoolSymbol: '99887766', birthDate: '2006-08-10', city: 'גבעתיים', gender: 'זכר', phone: '054-3333333', grade: 'יב', conservatoriumStudyYears: 6, instruments: [{ instrument: 'גיטרה', teacherName: 'גלית שפירא', yearsOfStudy: 6 },], approved: true, notifications: [], achievements: [], createdAt: '2024-03-03T12:00:00.000Z',
};

const pendingTeacher: User = {
    id: 'pending-teacher-1', name: 'ישראל ישראלי', email: 'pending.teacher@example.com', role: 'teacher', conservatoriumId: 'cons-1', conservatoriumName: 'קונסרבטוריון הוד השרון', avatarUrl: 'https://i.pravatar.cc/150?u=pending-teacher', approved: false, notifications: [], achievements: [], createdAt: '2024-03-03T12:00:00.000Z',
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
        },
        createdAt: '2024-03-03T12:00:00.000Z',
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
        },
        createdAt: '2024-03-03T12:00:00.000Z',
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
        },
        createdAt: '2024-03-03T12:00:00.000Z',
    },
];

const teacherUser = { ...mockTeachers[0], id: 'teacher-user-1', role: 'teacher', conservatoriumId: 'cons-15', conservatoriumName: 'הוד השרון', idNumber: '444444444', phone: '054-4444444', students: [studentUser.id, studentUser2.id], approved: true, notifications: teacherNotifications, achievements: [], createdAt: '2024-03-03T12:00:00.000Z' } as User;
const teacherUser2 = { ...mockTeachers[1], id: 'teacher-user-2', role: 'teacher', conservatoriumId: 'cons-15', conservatoriumName: 'הוד השרון', idNumber: '555555555', phone: '054-5555555', students: [studentUser2.id], approved: true, notifications: [], maxStudents: 15, achievements: [], createdAt: '2024-03-03T12:00:00.000Z' } as User;
const teacherUser3 = { ...mockTeachers[2], id: 'teacher-user-3', role: 'teacher', conservatoriumId: 'cons-12', conservatoriumName: 'גבעתיים', idNumber: '666666666', phone: '054-6666666', students: [otherStudent.id], approved: true, notifications: [], maxStudents: 18, achievements: [], createdAt: '2024-03-03T12:00:00.000Z' } as User;

// Generate Conservatorium Admins from the JSON file, adding the logged-in user for "הוד השרון"
const conservatoriumAdminUsers: User[] = constAdminData.map(admin => {
    if (admin.location === 'הוד השרון') {
        return {
            id: 'conservatorium-admin-user-15',
            name: 'יעל פלסטניאר (מנהלת)',
            email: 'admin@example.com',
            role: 'conservatorium_admin',
            isPrimaryConservatoriumAdmin: true,
            isDelegatedAdmin: false,
            conservatoriumId: 'cons-15',
            conservatoriumName: 'הוד השרון',
            avatarUrl: 'https://i.pravatar.cc/150?u=cons-admin15',
            idNumber: `admin-id-${admin.id}`,
            phone: '052-4619363',
            students: [studentUser.id, studentUser2.id],
            approved: true,
            notifications: adminNotifications,
            achievements: [],
            createdAt: '2024-03-03T12:00:00.000Z',
        };
    }
    return {
        id: `conservatorium-admin-user-${admin.id}`,
        name: admin.manager_name,
        email: admin.email?.split(';')[0].trim() || 'no-email@example.com',
        role: 'conservatorium_admin',
        isPrimaryConservatoriumAdmin: true,
        isDelegatedAdmin: false,
        conservatoriumId: `cons-${admin.id}`,
        conservatoriumName: admin.location,
        avatarUrl: `https://i.pravatar.cc/150?u=cons-admin${admin.id}`,
        idNumber: `admin-id-${admin.id}`,
        phone: admin.mobile || admin.office_phone || 'N/A',
        students: [], // Initially no students
        approved: true,
        notifications: [],
        achievements: [],
        createdAt: '2024-03-03T12:00:00.000Z',
    }
});


export const siteAdminUser: User = {
    id: 'site-admin-user-1', name: 'דנה המנהלת', email: 'site.admin@example.com', role: 'site_admin', conservatoriumId: 'global', conservatoriumName: 'מנהל מערכת', avatarUrl: 'https://i.pravatar.cc/150?u=site-admin', idNumber: '999999999', phone: '054-9999999', approved: true, notifications: siteAdminNotifications, achievements: [], createdAt: '2024-03-03T12:00:00.000Z',
};

export const ministryDirectorUser: User = {
    id: 'ministry-director-user-1', name: 'יעקב הלוי', email: 'ministry.director@example.com', role: 'ministry_director', conservatoriumId: 'ministry', conservatoriumName: 'משרד החינוך', avatarUrl: 'https://i.pravatar.cc/150?u=ministry-director', idNumber: '123456789', phone: '052-1234567', approved: true, notifications: [], achievements: [], createdAt: '2024-03-03T12:00:00.000Z',
};

const parentUser: User = {
    id: 'parent-user-1',
    name: 'רוני לוי',
    email: 'parent@example.com',
    role: 'parent',
    conservatoriumId: 'cons-15',
    conservatoriumName: 'הוד השרון',
    avatarUrl: 'https://i.pravatar.cc/150?u=parent',
    idNumber: '777777777',
    phone: '050-7777777',
    approved: true,
    notifications: [],
    achievements: [],
    students: [studentUser.id],
    createdAt: '2024-03-03T12:00:00.000Z',
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
].filter((v, i, a) => a.findIndex(t => (t.id === v.id)) === i); // Remove duplicates

export const mockFormSubmissions: FormSubmission[] = [
    { id: 'form-101', formType: 'רסיטל בגרות', academicYear: 'תשפ"ד', grade: 'יב', studentId: studentUser.id, studentName: studentUser.name, status: 'PENDING_ADMIN', submissionDate: '2024-05-20', totalDuration: '12:30', repertoire: [{ id: 'bach-wtc1-prelude-c', composer: 'יוהאן סבסטיאן באך', title: 'פרלוד ופוגה בדו מז\'ור, רי"ב 846 (מתוך הפסנתר המושווה, ספר א\')', duration: '04:00', genre: 'בארוק' }, { id: 'chopin-nocturne-op9-no2', composer: 'פרדריק שופן', title: 'נוקטורן במי במול מז\'ור, אופ. 9 מס\' 2', duration: '05:00', genre: 'רומנטי' }, { id: 'beethoven-fur-elise', composer: 'לודוויג ואן בטהובן', title: 'לאליזה (Für Elise)', duration: '03:00', genre: 'קלאסי' },], conservatoriumName: studentUser.conservatoriumName, conservatoriumManagerName: 'יעל פלסטניאר (מנהלת)', applicantDetails: { birthDate: studentUser.birthDate, city: studentUser.city, gender: studentUser.gender, phone: studentUser.phone }, schoolDetails: { schoolName: studentUser.schoolName, hasMusicMajor: true, isMajorParticipant: true, plansTheoryExam: true }, teacherDetails: { name: studentUser.instruments?.[0]?.teacherName, yearsWithTeacher: studentUser.instruments?.[0]?.yearsOfStudy, }, instrumentDetails: { instrument: studentUser.instruments?.[0].instrument, yearsOfStudy: studentUser.instruments?.[0].yearsOfStudy } },
    { id: 'form-102', formType: 'כנס / אירוע', studentId: studentUser2.id, studentName: studentUser2.name, status: 'FINAL_APPROVED', submissionDate: '2024-05-18', totalDuration: '08:15', repertoire: [{ id: 'mozart-sonata-16', composer: 'וולפגנג אמדאוס מוצרט', title: 'סונאטה לפסנתר מס\' 16 בדו מז\'ור, ק. 545 "סונאטה פשוטה"', duration: '08:15', genre: 'קלאסי' },], conservatoriumName: studentUser2.conservatoriumName, conservatoriumManagerName: 'יעל פלסטניאר (מנהלת)', signatureUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAACWCAYAAABkW7XSAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAARnSURBVOgN7dRBDQAgEMCw9/6/9EIBCa9A1c2AAdgbCxRYgQUGLMCgAgUWGLCAgQoUWGDCAgYqUGCBBQYswKACBRYYsICBCgRXYAEGFigwAYMKFFhgwAICJlBgAQGLAahAgQUWGLCAgQoUWGDCAgYq0HwBDK+xMv2+4DEAAAAASUVORK5CYII=', signedAt: '2024-05-19', calculatedPrice: 10, paymentStatus: 'paid', },
    { id: 'form-103', formType: 'מבחן שלב', studentId: otherStudent.id, studentName: otherStudent.name, status: 'DRAFT', submissionDate: '2024-05-21', totalDuration: '04:00', repertoire: [{ id: 'comp-clementi', composer: 'קלמנטי', title: 'סונטינה אופ. 36 מס\' 1', duration: '04:00', genre: 'קלאסי' },], conservatoriumName: otherStudent.conservatoriumName, },
    { id: 'form-104', formType: 'רסיטל בגרות', academicYear: 'תשפ"ג', grade: 'יא', studentId: 'user-7', studentName: 'רבקה גולן', status: 'REJECTED', teacherComment: 'נא לבחור יצירה נוספת מהתקופה הרומנטית.', submissionDate: '2024-05-15', totalDuration: '09:00', repertoire: [{ id: 'comp-haydn', composer: 'היידן', title: 'סונטה ברה מז\'ור', duration: '09:00', genre: 'קלאסי' },], conservatoriumName: 'מרכז למוסיקה ובימת אמנויות רעננה', },
    { id: 'form-105', formType: 'רסיטל בגרות', academicYear: 'תשפ"ד', grade: 'יא', studentId: studentUser2.id, studentName: studentUser2.name, status: 'REVISION_REQUIRED', ministryComment: 'הרפרטואר אינו מאוזן דיו. יש להחליף את אחת היצירות הקלאסיות ביצירה מהמאה ה-20.', submissionDate: '2024-05-23', totalDuration: '21:00', repertoire: [{ id: 'bach-wtc1-prelude-c', composer: 'יוהאן סבסטיאן באך', title: 'פרלוד ופוגה בדו מז\'ור, רי"ב 846 (מתוך הפסנתר המושווה, ספר א\')', duration: '04:00', genre: 'בארוק' }, { id: 'mozart-eine-kleine', composer: 'וולפגנג אמדאוס מוצרט', title: 'מוזיקת לילה זעירה (Eine kleine Nachtmusik), סרנדה מס\' 13', duration: '05:45', genre: 'קלאסי' }, { id: 'chopin-nocturne-op9-no2', composer: 'פרדריק שופן', title: 'נוקטורן במי במול מז\'ור, אופ. 9 מס\' 2', duration: '04:30', genre: 'רומנטי' }, { id: 'beethoven-moonlight-sonata', composer: 'לודוויג ואן בטהובן', title: 'סונאטה לפסנתר מס\' 14 בדו דיאז מינור, אופ. 27 מס\' 2 "אור ירח"', duration: '15:00', genre: 'קלאסי' }], conservatoriumName: studentUser2.conservatoriumName, applicantDetails: { birthDate: studentUser2.birthDate, city: studentUser2.city, gender: studentUser2.gender, phone: studentUser2.phone }, schoolDetails: { schoolName: studentUser2.schoolName, hasMusicMajor: false, isMajorParticipant: false, plansTheoryExam: true }, teacherDetails: { name: teacherUser.name, }, instrumentDetails: { instrument: studentUser2.instruments?.[0].instrument, yearsOfStudy: studentUser2.instruments?.[0].yearsOfStudy } },
];
export const mockConservatoriumInstruments: ConservatoriumInstrument[] = [
  { id: 'piano', conservatoriumId: 'cons-15', names: { he: '?????', en: 'Piano', ru: '??????????', ar: '?????' }, isActive: true, teacherCount: 1, availableForRegistration: true, availableForRental: true },
  { id: 'violin', conservatoriumId: 'cons-15', names: { he: '?????', en: 'Violin', ru: '???????', ar: '????' }, isActive: true, teacherCount: 1, availableForRegistration: true, availableForRental: true },
  { id: 'flute', conservatoriumId: 'cons-15', names: { he: '????', en: 'Flute', ru: '??????', ar: '????' }, isActive: true, teacherCount: 1, availableForRegistration: true, availableForRental: true },
  { id: 'guitar', conservatoriumId: 'cons-15', names: { he: '?????', en: 'Guitar', ru: '??????', ar: '?????' }, isActive: true, teacherCount: 1, availableForRegistration: true, availableForRental: true },
  { id: 'cello', conservatoriumId: 'cons-15', names: { he: "?'??", en: 'Cello', ru: '??????????', ar: '?????' }, isActive: true, teacherCount: 0, availableForRegistration: true, availableForRental: true },
  { id: 'drums', conservatoriumId: 'cons-15', names: { he: '?????', en: 'Drums', ru: '???????', ar: '????' }, isActive: true, teacherCount: 0, availableForRegistration: true, availableForRental: true },
  { id: 'saxophone', conservatoriumId: 'cons-15', names: { he: '???????', en: 'Saxophone', ru: '????????', ar: '???????' }, isActive: true, teacherCount: 1, availableForRegistration: true, availableForRental: true },
  { id: 'clarinet', conservatoriumId: 'cons-15', names: { he: '??????', en: 'Clarinet', ru: '???????', ar: '????????' }, isActive: true, teacherCount: 1, availableForRegistration: true, availableForRental: true },
];

export const mockLessonPackages: LessonPackage[] = [
  {
    id: 'pkg-monthly-45',
    conservatoriumId: 'cons-15',
    names: { he: '???? ?????', en: 'Monthly Plan', ru: '??????????? ????', ar: '??? ?????' },
    type: 'monthly',
    lessonCount: 4,
    durationMinutes: 45,
    priceILS: 500,
    isActive: true,
  },
  {
    id: 'pkg-semester-45',
    conservatoriumId: 'cons-15',
    names: { he: '????? ?????', en: 'Semester Pack', ru: '??????????? ?????', ar: '???? ?????' },
    type: 'semester',
    lessonCount: 16,
    durationMinutes: 45,
    priceILS: 1800,
    isActive: true,
  },
  {
    id: 'pkg-single-45',
    conservatoriumId: 'cons-15',
    names: { he: '????? ????', en: 'Single Lesson', ru: '??????? ????', ar: '??? ????' },
    type: 'single',
    lessonCount: 1,
    durationMinutes: 45,
    priceILS: 150,
    isActive: true,
  },
];

export const mockPackages: Package[] = [];
export const mockLessons: LessonSlot[] = [
    { id: 'lesson-1', conservatoriumId: 'cons-15', teacherId: 'teacher-user-1', studentId: 'student-user-1', instrument: 'פסנתר', startTime: '2024-03-04T16:00:00.000Z', durationMinutes: 45, type: 'RECURRING', bookingSource: 'STUDENT_SELF', roomId: 'room-1', isVirtual: false, status: 'SCHEDULED', createdAt: '2024-03-03T12:00:00.000Z', updatedAt: '2024-03-03T12:00:00.000Z', isCreditConsumed: false },
    { id: 'lesson-2', conservatoriumId: 'cons-15', teacherId: 'teacher-user-1', studentId: 'student-user-2', instrument: 'כינור', startTime: '2024-03-05T17:00:00.000Z', durationMinutes: 60, type: 'RECURRING', bookingSource: 'PARENT', roomId: 'room-2', isVirtual: false, status: 'SCHEDULED', createdAt: '2024-03-03T12:00:00.000Z', updatedAt: '2024-03-03T12:00:00.000Z', isCreditConsumed: false, branchId: 'branch-1' },
    { id: 'lesson-3', conservatoriumId: 'cons-12', teacherId: 'teacher-user-3', studentId: 'other-student-1', instrument: 'גיטרה', startTime: '2024-03-06T15:00:00.000Z', durationMinutes: 45, type: 'RECURRING', bookingSource: 'ADMIN', roomId: 'room-5', isVirtual: true, meetingLink: 'https://zoom.us/j/1234567890', status: 'SCHEDULED', createdAt: '2024-03-03T12:00:00.000Z', updatedAt: '2024-03-03T12:00:00.000Z', isCreditConsumed: false, branchId: 'branch-2' },
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
export const mockEvents: EventProduction[] = [
    {
        id: 'event-1',
        conservatoriumId: 'cons-15',
        name: 'קונצרט אביב 2024',
        type: 'RECITAL',
        venue: 'אולם קונצרטים קטן',
        eventDate: '2024-03-18T12:00:00.000Z'.split('T')[0],
        startTime: '18:30',
        status: 'OPEN_REGISTRATION',
        program: [
            { id: 'ps-1', studentId: 'student-user-1', studentName: 'אריאל לוי', compositionTitle: 'נוקטורן בקו מז\'ור', composer: 'שופן', duration: '04:30' },
            { id: 'ps-2', studentId: 'student-user-2', studentName: 'תמר ישראלי', compositionTitle: 'סונטה מס\' 16', composer: 'מוצרט', duration: '08:15' }
        ]
    }
];
export const mockInstrumentInventory: InstrumentInventory[] = [
    {
        id: 'inst-1',
        conservatoriumId: 'cons-15',
        name: 'Yamaha YEV104',
        type: 'Violin',
        category: 'STRINGS',
        brand: 'Yamaha',
        serialNumber: 'YEV104-2024-001',
        condition: 'GOOD',
        status: 'AVAILABLE',
        rentalRatePerMonth: 180,
        rentalModelsOffered: ['deposit', 'monthly', 'rent_to_own'],
        depositAmountILS: 1200,
        monthlyFeeILS: 180,
        purchasePriceILS: 4800,
        monthsUntilPurchaseEligible: 12,
    },
    {
        id: 'inst-2',
        conservatoriumId: 'cons-15',
        name: 'Buffet Crampon E11',
        type: 'Clarinet',
        category: 'WOODWIND',
        brand: 'Buffet Crampon',
        serialNumber: 'E11-2023-017',
        condition: 'EXCELLENT',
        status: 'AVAILABLE',
        rentalRatePerMonth: 220,
        rentalModelsOffered: ['deposit', 'monthly'],
        depositAmountILS: 1500,
        monthlyFeeILS: 220,
    }
];
export const mockPerformanceBookings: PerformanceBooking[] = [];
export const mockScholarshipApplications: ScholarshipApplication[] = [
    {
        id: 'schol-app-1',
        studentId: 'student-user-1',
        studentName: 'Ariel Levi',
        instrument: 'Piano',
        conservatoriumId: 'cons-15',
        academicYear: '2025-2026',
        status: 'SUBMITTED',
        submittedAt: new Date().toISOString(),
        priorityScore: 88,
        paymentStatus: 'UNPAID',
    },
    {
        id: 'schol-app-2',
        studentId: 'student-user-2',
        studentName: 'Tamar Israeli',
        instrument: 'Violin',
        conservatoriumId: 'cons-15',
        academicYear: '2025-2026',
        status: 'APPROVED',
        submittedAt: new Date().toISOString(),
        approvedAt: new Date().toISOString(),
        priorityScore: 81,
        paymentStatus: 'UNPAID',
    }
];

export const mockDonationCauses: DonationCause[] = [
    {
        id: 'cause-financial-aid',
        conservatoriumId: 'cons-15',
        category: 'financial_aid',
        priority: 1,
        names: { he: '???? ????? ???????', en: 'Financial Aid for Disadvantaged Families' },
        descriptions: { he: '????? ??????? ??????? ??? ???, ??? ???? ?????? ??????.', en: 'Equal music education for every child regardless of financial background.' },
        isActive: true,
        targetAmountILS: 250000,
        raisedAmountILS: 125000,
    },
    {
        id: 'cause-excellence',
        conservatoriumId: 'cons-15',
        category: 'excellence',
        priority: 2,
        names: { he: '????? ???????', en: 'Excellence Scholarships' },
        descriptions: { he: '????? ???????? ???????? ?????? ??????? ????.', en: 'Support gifted students in developing their talent.' },
        isActive: true,
        targetAmountILS: 120000,
        raisedAmountILS: 56000,
    },
    {
        id: 'cause-equipment',
        conservatoriumId: 'cons-15',
        category: 'equipment',
        priority: 3,
        names: { he: '???? ??????? ????????', en: 'Musical Equipment for Students' },
        descriptions: { he: '????? ??? ????? ?????? ????????.', en: 'Purchase instruments for student loans.' },
        isActive: true,
        targetAmountILS: 90000,
        raisedAmountILS: 22500,
    },
    {
        id: 'cause-events',
        conservatoriumId: 'cons-15',
        category: 'events',
        priority: 4,
        names: { he: '??????? ?????????', en: 'Competitions & Festivals' },
        descriptions: { he: '????? ??????? ??????? ???????? ????????? ???? ??????.', en: 'Fund student participation in national and international competitions.' },
        isActive: true,
        targetAmountILS: 110000,
        raisedAmountILS: 47000,
    },
];

export const mockDonations: DonationRecord[] = [];
export const mockInstrumentRentals: InstrumentRental[] = [];
export const mockOpenDayEvents: OpenDayEvent[] = [
    {
        id: 'open-day-1',
        conservatoriumId: 'cons-15',
        name: 'יום פתוח אביב 2024',
        date: '2024-03-17T12:00:00.000Z'.split('T')[0],
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
        appointmentTime: '2024-03-17T10:00:00.000Z',
        status: 'SCHEDULED',
        registeredAt: '2024-03-03T12:00:00.000Z',
    }
];

export const mockWaitlist: WaitlistEntry[] = [];
export const mockPracticeVideos: any[] = [];
export const mockPayrolls: PayrollSummary[] = [];
export const mockMakeupCredits: any[] = [];
export const mockRepertoire: Composition[] = compositions;

export const mockAlumni: Alumnus[] = [
  {
    id: 'alumni-1',
    userId: 'student-user-1',
    conservatoriumId: 'cons-15',
    displayName: 'Daniel Cohen',
    graduationYear: 2018,
    primaryInstrument: 'Piano',
    currentOccupation: 'Concert pianist',
    bio: {
      he: '???? ?????? ?????? ?????? ??????? ???????.',
      en: 'Classical track graduate performing across Israel and Europe.',
    },
    profilePhotoUrl: 'https://i.pravatar.cc/150?u=alumni1',
    isPublic: true,
    achievements: ['Pinchas Zukerman Competition Winner 2021'],
    socialLinks: {
      website: 'https://example.com/daniel',
    },
    availableForMasterClasses: true,
  },
  {
    id: 'alumni-2',
    userId: 'alumni-user-2',
    conservatoriumId: 'cons-15',
    displayName: 'Maya Levi',
    graduationYear: 2020,
    primaryInstrument: 'Violin',
    currentOccupation: 'Orchestra violinist',
    bio: {
      he: '????? ??????? ????? ?????? ???.',
      en: 'Orchestra violinist and guest master class instructor.',
    },
    profilePhotoUrl: 'https://i.pravatar.cc/150?u=alumni2',
    isPublic: true,
    achievements: ['Juilliard MA graduate'],
    availableForMasterClasses: true,
  },
  {
    id: 'alumni-3',
    userId: 'alumni-user-3',
    conservatoriumId: 'cons-15',
    displayName: 'Yonatan Agmon',
    graduationYear: 2019,
    primaryInstrument: 'Voice',
    currentOccupation: 'Opera soloist',
    bio: {
      he: '??? ????? ???? ?????? ??????.',
      en: 'Active opera soloist in Israel and abroad.',
    },
    profilePhotoUrl: 'https://i.pravatar.cc/150?u=alumni3',
    isPublic: false,
    achievements: ['Master class with Placido Domingo'],
    availableForMasterClasses: false,
  },
];

export const mockMasterclasses: Masterclass[] = [
  {
    id: 'mc-1',
    conservatoriumId: 'cons-15',
    title: { he: '??????? ??????? ??????', en: 'Advanced Piano Techniques' },
    description: { he: '???? ??? ????????? ???????', en: 'Master class for advanced pianists' },
    instructor: {
      userId: 'teacher-user-1',
      displayName: 'Miriam Cohen',
      instrument: 'Piano',
    },
    instrument: 'Piano',
    maxParticipants: 12,
    targetAudience: 'advanced',
    date: '2026-04-15',
    startTime: '17:00',
    durationMinutes: 90,
    location: 'Main Hall',
    isOnline: false,
    includedInPackage: true,
    packageMasterClassCount: 1,
    status: 'published',
    registrations: [],
  },
  {
    id: 'mc-2',
    conservatoriumId: 'cons-15',
    title: { he: '???? ????????? ???????', en: 'Orchestra Audition Prep' },
    description: { he: '???? ??????? ?????????', en: 'Practical tools for audition success' },
    instructor: {
      userId: 'alumni-user-2',
      displayName: 'Maya Levi',
      instrument: 'Violin',
    },
    instrument: 'Violin',
    maxParticipants: 15,
    targetAudience: 'intermediate',
    date: '2026-05-05',
    startTime: '18:30',
    durationMinutes: 120,
    location: 'Room B',
    isOnline: true,
    streamUrl: 'https://example.com/masterclass/violin',
    includedInPackage: false,
    priceILS: 180,
    status: 'draft',
    registrations: [],
  },
];

export const initialMockData = {
    mockUsers,
    mockFormSubmissions,
    mockLessons,
    mockPackages,
    mockInvoices,
    mockPracticeLogs,
    mockAssignedRepertoire,
    mockLessonNotes,
    mockMessageThreads,
    mockProgressReports,
    mockAnnouncements,
    mockFormTemplates,
    mockAuditLog,
    mockEvents,
    mockInstrumentInventory,
    mockPerformanceBookings,
    mockScholarshipApplications,
    mockDonationCauses,
    mockDonations,
    mockOpenDayEvents,
    mockOpenDayAppointments,
    mockBranches,
    mockPracticeVideos,
    mockAlumni,
    mockMasterclasses,
    mockWaitlist,
    mockPayrolls,
    mockMakeupCredits,
    mockRepertoire,
    mockRooms,
    compositions,
    conservatoriums,
};
