
import type { User, FormSubmission, Notification, Conservatorium, Package, LessonPackage, ConservatoriumInstrument, LessonSlot, Invoice, PracticeLog, Composition, AssignedRepertoire, LessonNote, RepertoireStatus, MessageThread, ProgressReport, Announcement, Room, PayrollSummary, PracticeVideo, WaitlistEntry, FormTemplate, AuditLogEntry, SlotStatus, Channel, NotificationPreferences, Achievement, AchievementType, EventProduction, EventProductionStatus, PerformanceSlot, InstrumentInventory, InstrumentCondition, PerformanceBooking, PerformanceBookingStatus, ScholarshipApplication, OpenDayEvent, OpenDayAppointment, Branch, PerformanceGenre, Alumnus, Masterclass, DonationCause, DonationRecord, InstrumentRental } from './types';
import constAdminData from '../../docs/data/constadmin.json';
import rawCompositions from './data.json';
import rawConservatoriums from '../../docs/data/conservatoriums.json';

const tierCycle: ('A' | 'B' | 'C')[] = ['A', 'B', 'C'];

const UNSPLASH_CONSERVATORIUM_PHOTOS = [
    'https://images.unsplash.com/photo-1519892300165-cb5542fb47c7?q=80&w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1507838153414-b4b713384a76?q=80&w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1564186763535-ebb21ef5277f?q=80&w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1513883049090-d0b7439799bf?q=80&w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1548438294-1ad5d5f4f063?q=80&w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?q=80&w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?q=80&w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1511379938547-c1f69419868d?q=80&w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?q=80&w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1525201548942-d8732f6617a0?q=80&w=600&auto=format&fit=crop',
];

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
        photoUrls: scraped.photos?.length > 0 ? scraped.photos : [UNSPLASH_CONSERVATORIUM_PHOTOS[admin.id % 10]],
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
    beethoven: { he: 'בטהובן', en: 'Beethoven', ru: 'Бетховен', ar: 'بيتهوفن', aliases: ['beethoven', 'בטהובן'] },
    mozart: { he: 'מוצרט', en: 'Mozart', ru: 'Моцарт', ar: 'موتسارت', aliases: ['mozart', 'מוצרט'] },
    bach: { he: 'באך', en: 'Bach', ru: 'Бах', ar: 'باخ', aliases: ['bach', 'באך'] },
    chopin: { he: 'שופן', en: 'Chopin', ru: 'Шопен', ar: 'شوبان', aliases: ['chopin', 'שופן'] },
    brahms: { he: 'ברהמס', en: 'Brahms', ru: 'Брамс', ar: 'براهمز', aliases: ['brahms', 'ברהמס'] },
    handel: { he: 'הנדל', en: 'Handel', ru: 'Гендель', ar: 'هاندل', aliases: ['handel', 'haendel', 'הנדל'] },
    schumann: { he: 'שומן', en: 'Schumann', ru: 'Шуман', ar: 'شومان', aliases: ['schumann', 'שומן'] },
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
        isPremiumTeacher: true,
        teacherRatingAvg: 4.8,
        teacherRatingCount: 23,
        bio: 'מורה לפסנתר וכינור עם 15 שנות ניסיון, מתמחה בהכנה לרסיטלים ובחינות בגרות. בוגרת האקדמיה למוסיקה בירושלים. מאמינה בגישה אישית ומעצימה לכל תלמיד.',
        specialties: ['EXAM_PREP', 'PERFORMANCE', 'BEGINNER_ADULTS'],
        teachingLanguages: ['HE', 'EN'],
        spokenLanguages: ['HE', 'EN'],
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
        isPremiumTeacher: true,
        teacherRatingAvg: 4.6,
        teacherRatingCount: 15,
        bio: 'נשפן וירטואוז, מומחה בחליל צד, סקסופון וקלרינט. מתמחה בג\'אז ואימפרוביזציה, ומעביר סדנאות אמן ברחבי הארץ. מביא אנרגיה ייחודית לשיעורים.',
        specialties: ['JAZZ', 'ENSEMBLE', 'PERFORMANCE'],
        teachingLanguages: ['HE', 'RU'],
        spokenLanguages: ['HE', 'EN'],
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

const teacherUser = { ...mockTeachers[0], id: 'teacher-user-1', role: 'teacher', conservatoriumId: 'cons-15', conservatoriumName: 'הוד השרון', idNumber: '444444444', phone: '054-4444444', students: [studentUser.id, studentUser2.id], approved: true, availableForNewStudents: true, availability: [{ dayOfWeek: 'SUN' as const, startTime: '14:00', endTime: '20:00' }, { dayOfWeek: 'TUE' as const, startTime: '14:00', endTime: '20:00' }, { dayOfWeek: 'THU' as const, startTime: '14:00', endTime: '20:00' }], instruments: [{ instrument: 'פסנתר', teacherName: 'מרים כהן', yearsOfStudy: 15 }, { instrument: 'כינור', teacherName: 'מרים כהן', yearsOfStudy: 10 }], notifications: teacherNotifications, achievements: [], createdAt: '2024-03-03T12:00:00.000Z' } as User;
const teacherUser2 = { ...mockTeachers[1], id: 'teacher-user-2', role: 'teacher', conservatoriumId: 'cons-15', conservatoriumName: 'הוד השרון', idNumber: '555555555', phone: '054-5555555', students: [studentUser2.id], approved: true, availableForNewStudents: true, availability: [{ dayOfWeek: 'MON' as const, startTime: '15:00', endTime: '21:00' }, { dayOfWeek: 'WED' as const, startTime: '15:00', endTime: '21:00' }], instruments: [{ instrument: 'חליל צד', teacherName: 'דוד המלך', yearsOfStudy: 18 }, { instrument: 'קלרינט', teacherName: 'דוד המלך', yearsOfStudy: 16 }, { instrument: 'סקסופון', teacherName: 'דוד המלך', yearsOfStudy: 14 }], notifications: [], maxStudents: 15, achievements: [], createdAt: '2024-03-03T12:00:00.000Z' } as User;
const teacherUser3 = { ...mockTeachers[2], id: 'teacher-user-3', role: 'teacher', conservatoriumId: 'cons-12', conservatoriumName: 'גבעתיים', idNumber: '666666666', phone: '054-6666666', students: [otherStudent.id], approved: true, availableForNewStudents: true, availability: [{ dayOfWeek: 'SUN' as const, startTime: '09:00', endTime: '15:00' }, { dayOfWeek: 'TUE' as const, startTime: '09:00', endTime: '15:00' }, { dayOfWeek: 'THU' as const, startTime: '09:00', endTime: '15:00' }], instruments: [{ instrument: 'גיטרה', teacherName: 'גלית שפירא', yearsOfStudy: 12 }], notifications: [], maxStudents: 18, achievements: [], createdAt: '2024-03-03T12:00:00.000Z' } as User;

// ── Teachers from conservatoriums.json directory ──────────────────
// These mirror scraped teachers from docs/data/conservatoriums.json.
// Naming matches so the about page can resolve teacherUserId and show
// the "Book with teacher" CTA for cons-15, cons-66, and cons-84 (ICM).
const directoryTeacherUsers: User[] = [
    { id: 'dir-teacher-001', name: 'יעל פלוטניארז', email: 'teacher-dir-001@harmonia.local', role: 'teacher' as const, conservatoriumId: 'cons-15', conservatoriumName: 'הוד השרון', avatarUrl: 'https://alumahod.com/wp-content/uploads/2025/09/%D7%99%D7%A2%D7%9C-%D7%A4%D7%9C%D7%95%D7%98%D7%A0%D7%99%D7%90%D7%A8%D7%96-300x300.jpg', bio: 'מנהלת, מנצחת תזמורות', approved: true, availableForNewStudents: true, specialties: ['ENSEMBLE'], teachingLanguages: ['HE'], maxStudents: 20, employmentType: 'EMPLOYEE' as const, ratePerDuration: { '30': 80, '45': 100, '60': 120 }, availability: [{ dayOfWeek: 'MON' as const, startTime: '15:00', endTime: '21:00' }, { dayOfWeek: 'WED' as const, startTime: '15:00', endTime: '21:00' }], instruments: [{ instrument: 'פסנתר', teacherName: 'יעל פלוטניארז', yearsOfStudy: 15 }], notifications: [], achievements: [], createdAt: '2024-03-03T12:00:00.000Z' },
    { id: 'dir-teacher-002', name: 'יעל קדר', email: 'teacher-dir-002@harmonia.local', role: 'teacher' as const, conservatoriumId: 'cons-15', conservatoriumName: 'הוד השרון', avatarUrl: 'https://alumahod.com/wp-content/uploads/2025/12/%D7%A7%D7%93%D7%A8-%D7%99%D7%A2%D7%9C-150x150.png', bio: 'רכזת פדגוגית, מנצחת מקהלות, פסנתרנית', approved: true, availableForNewStudents: true, specialties: ['ENSEMBLE'], teachingLanguages: ['HE'], maxStudents: 20, employmentType: 'EMPLOYEE' as const, ratePerDuration: { '30': 80, '45': 100, '60': 120 }, availability: [{ dayOfWeek: 'SUN' as const, startTime: '09:00', endTime: '15:00' }, { dayOfWeek: 'TUE' as const, startTime: '09:00', endTime: '15:00' }, { dayOfWeek: 'THU' as const, startTime: '09:00', endTime: '15:00' }], instruments: [{ instrument: 'פסנתר', teacherName: 'יעל קדר', yearsOfStudy: 20 }], notifications: [], achievements: [], createdAt: '2024-03-03T12:00:00.000Z' },
    { id: 'dir-teacher-003', name: 'שירה סברוב', email: 'teacher-dir-003@harmonia.local', role: 'teacher' as const, conservatoriumId: 'cons-15', conservatoriumName: 'הוד השרון', avatarUrl: 'https://alumahod.com/wp-content/uploads/2025/12/%D7%A1%D7%91%D7%A8%D7%95%D7%91-%D7%A9%D7%99%D7%A8%D7%94-150x150.png', bio: 'מנצחת מקהלות ילדים ונוער', approved: true, availableForNewStudents: true, specialties: ['ENSEMBLE', 'EARLY_CHILDHOOD'], teachingLanguages: ['HE'], maxStudents: 20, employmentType: 'EMPLOYEE' as const, ratePerDuration: { '30': 80, '45': 100, '60': 120 }, availability: [{ dayOfWeek: 'MON' as const, startTime: '10:00', endTime: '17:00' }, { dayOfWeek: 'WED' as const, startTime: '10:00', endTime: '17:00' }, { dayOfWeek: 'FRI' as const, startTime: '09:00', endTime: '13:00' }], instruments: [{ instrument: 'שירה', teacherName: 'שירה סברוב', yearsOfStudy: 15 }], notifications: [], achievements: [], createdAt: '2024-03-03T12:00:00.000Z' },
    { id: 'dir-teacher-004', name: 'אייל הרכבי', email: 'teacher-dir-004@harmonia.local', role: 'teacher' as const, conservatoriumId: 'cons-15', conservatoriumName: 'הוד השרון', avatarUrl: 'https://alumahod.com/wp-content/uploads/2025/12/%D7%94%D7%A8%D7%9B%D7%91%D7%99-%D7%90%D7%99%D7%99%D7%9C-2-150x150.png', bio: 'מנצח תזמורות נוער, מעבד ומלחין', approved: true, availableForNewStudents: true, specialties: ['ENSEMBLE', 'EARLY_CHILDHOOD'], teachingLanguages: ['HE'], maxStudents: 20, employmentType: 'EMPLOYEE' as const, ratePerDuration: { '30': 80, '45': 100, '60': 120 }, availability: [{ dayOfWeek: 'SUN' as const, startTime: '16:00', endTime: '21:00' }, { dayOfWeek: 'WED' as const, startTime: '16:00', endTime: '21:00' }], instruments: [{ instrument: 'פסנתר', teacherName: 'אייל הרכבי', yearsOfStudy: 15 }], notifications: [], achievements: [], createdAt: '2024-03-03T12:00:00.000Z' },
    { id: 'dir-teacher-005', name: 'עדיה לביא', email: 'teacher-dir-005@harmonia.local', role: 'teacher' as const, conservatoriumId: 'cons-15', conservatoriumName: 'הוד השרון', avatarUrl: 'https://alumahod.com/wp-content/uploads/2025/12/%D7%9C%D7%91%D7%99%D7%90-%D7%A2%D7%93%D7%99%D7%94-2-150x150.png', bio: 'מנצחת מקהלת בוגרים, זמרת ג\'אז', approved: true, availableForNewStudents: true, specialties: ['ENSEMBLE', 'JAZZ'], teachingLanguages: ['HE'], maxStudents: 20, employmentType: 'EMPLOYEE' as const, ratePerDuration: { '30': 80, '45': 100, '60': 120 }, availability: [{ dayOfWeek: 'SUN' as const, startTime: '14:00', endTime: '20:00' }, { dayOfWeek: 'TUE' as const, startTime: '14:00', endTime: '20:00' }, { dayOfWeek: 'THU' as const, startTime: '14:00', endTime: '20:00' }], instruments: [{ instrument: 'שירה', teacherName: 'עדיה לביא', yearsOfStudy: 15 }], notifications: [], achievements: [], createdAt: '2024-03-03T12:00:00.000Z' },
    { id: 'dir-teacher-006', name: 'טליה גבעון', email: 'teacher-dir-006@harmonia.local', role: 'teacher' as const, conservatoriumId: 'cons-15', conservatoriumName: 'הוד השרון', avatarUrl: 'https://alumahod.com/wp-content/uploads/2025/09/%D7%92%D7%91%D7%A2%D7%95%D7%9F-%D7%98%D7%9C%D7%99%D7%94-%E2%80%93-%D7%A8%D7%9B%D7%96%D7%AA-%D7%9E%D7%97%D7%9C%D7%A7%D7%AA-%D7%94%D7%A4%D7%A1%D7%A0%D7%AA%D7%A8.png', bio: 'ראש מחלקת פסנתר', approved: true, availableForNewStudents: true, specialties: ['PERFORMANCE'], teachingLanguages: ['HE'], maxStudents: 20, employmentType: 'EMPLOYEE' as const, ratePerDuration: { '30': 80, '45': 100, '60': 120 }, availability: [{ dayOfWeek: 'MON' as const, startTime: '15:00', endTime: '21:00' }, { dayOfWeek: 'WED' as const, startTime: '15:00', endTime: '21:00' }], instruments: [{ instrument: 'פסנתר', teacherName: 'טליה גבעון', yearsOfStudy: 20 }], notifications: [], achievements: [], createdAt: '2024-03-03T12:00:00.000Z' },
    { id: 'dir-teacher-007', name: 'גילי אברבנאל', email: 'teacher-dir-007@harmonia.local', role: 'teacher' as const, conservatoriumId: 'cons-15', conservatoriumName: 'הוד השרון', avatarUrl: 'https://alumahod.com/wp-content/uploads/2025/09/%D7%90%D7%91%D7%A8%D7%91%D7%A0%D7%90%D7%9C-%D7%92%D7%99%D7%9C%D7%99-300x200.png', bio: 'פסנתר, תאוריה וקומפוזיציה', approved: true, availableForNewStudents: true, specialties: ['THEORY', 'PERFORMANCE'], teachingLanguages: ['HE'], maxStudents: 20, employmentType: 'EMPLOYEE' as const, ratePerDuration: { '30': 80, '45': 100, '60': 120 }, availability: [{ dayOfWeek: 'SUN' as const, startTime: '09:00', endTime: '15:00' }, { dayOfWeek: 'TUE' as const, startTime: '09:00', endTime: '15:00' }, { dayOfWeek: 'THU' as const, startTime: '09:00', endTime: '15:00' }], instruments: [{ instrument: 'פסנתר', teacherName: 'גילי אברבנאל', yearsOfStudy: 18 }], notifications: [], achievements: [], createdAt: '2024-03-03T12:00:00.000Z' },
    { id: 'dir-teacher-008', name: 'אלכס גולדברג', email: 'teacher-dir-008@harmonia.local', role: 'teacher' as const, conservatoriumId: 'cons-15', conservatoriumName: 'הוד השרון', avatarUrl: 'https://alumahod.com/wp-content/uploads/2025/09/%D7%92%D7%95%D7%9C%D7%93%D7%91%D7%A8%D7%92-%D7%90%D7%9C%D7%9B%D7%A1.png', bio: 'פסנתר והרכבים קאמריים', approved: true, availableForNewStudents: true, specialties: ['ENSEMBLE', 'PERFORMANCE'], teachingLanguages: ['HE'], maxStudents: 20, employmentType: 'EMPLOYEE' as const, ratePerDuration: { '30': 80, '45': 100, '60': 120 }, availability: [{ dayOfWeek: 'MON' as const, startTime: '10:00', endTime: '17:00' }, { dayOfWeek: 'WED' as const, startTime: '10:00', endTime: '17:00' }, { dayOfWeek: 'FRI' as const, startTime: '09:00', endTime: '13:00' }], instruments: [{ instrument: 'פסנתר', teacherName: 'אלכס גולדברג', yearsOfStudy: 17 }], notifications: [], achievements: [], createdAt: '2024-03-03T12:00:00.000Z' },
    { id: 'dir-teacher-009', name: 'פאינה גלוזמן', email: 'teacher-dir-009@harmonia.local', role: 'teacher' as const, conservatoriumId: 'cons-15', conservatoriumName: 'הוד השרון', avatarUrl: 'https://alumahod.com/wp-content/uploads/2025/09/%D7%92%D7%9C%D7%95%D7%96%D7%9E%D7%9F-%D7%A4%D7%90%D7%99%D7%A0%D7%94-225x300.jpg', bio: 'פסנתר ואורגנית', approved: true, availableForNewStudents: true, specialties: ['PERFORMANCE'], teachingLanguages: ['HE'], maxStudents: 20, employmentType: 'EMPLOYEE' as const, ratePerDuration: { '30': 80, '45': 100, '60': 120 }, availability: [{ dayOfWeek: 'SUN' as const, startTime: '16:00', endTime: '21:00' }, { dayOfWeek: 'WED' as const, startTime: '16:00', endTime: '21:00' }], instruments: [{ instrument: 'פסנתר', teacherName: 'פאינה גלוזמן', yearsOfStudy: 20 }], notifications: [], achievements: [], createdAt: '2024-03-03T12:00:00.000Z' },
    { id: 'dir-teacher-010', name: 'אלה דובין', email: 'teacher-dir-010@harmonia.local', role: 'teacher' as const, conservatoriumId: 'cons-15', conservatoriumName: 'הוד השרון', avatarUrl: 'https://alumahod.com/wp-content/uploads/2025/09/%D7%93%D7%95%D7%91%D7%99%D7%9F-%D7%90%D7%9C%D7%94-149x150.png', bio: 'פסנתר', approved: true, availableForNewStudents: true, specialties: ['PERFORMANCE'], teachingLanguages: ['HE'], maxStudents: 20, employmentType: 'EMPLOYEE' as const, ratePerDuration: { '30': 80, '45': 100, '60': 120 }, availability: [{ dayOfWeek: 'SUN' as const, startTime: '14:00', endTime: '20:00' }, { dayOfWeek: 'TUE' as const, startTime: '14:00', endTime: '20:00' }, { dayOfWeek: 'THU' as const, startTime: '14:00', endTime: '20:00' }], instruments: [{ instrument: 'פסנתר', teacherName: 'אלה דובין', yearsOfStudy: 15 }], notifications: [], achievements: [], createdAt: '2024-03-03T12:00:00.000Z' },
    { id: 'dir-teacher-011', name: 'יעל דרעי', email: 'teacher-dir-011@harmonia.local', role: 'teacher' as const, conservatoriumId: 'cons-15', conservatoriumName: 'הוד השרון', avatarUrl: 'https://alumahod.com/wp-content/uploads/2025/11/%D7%99%D7%A2%D7%9C-%D7%93%D7%A8%D7%A2%D7%99-200x300.jpg', bio: 'פסנתרנית וזמרת אופרה', approved: true, availableForNewStudents: true, specialties: ['PERFORMANCE'], teachingLanguages: ['HE'], maxStudents: 20, employmentType: 'EMPLOYEE' as const, ratePerDuration: { '30': 80, '45': 100, '60': 120 }, availability: [{ dayOfWeek: 'MON' as const, startTime: '15:00', endTime: '21:00' }, { dayOfWeek: 'WED' as const, startTime: '15:00', endTime: '21:00' }], instruments: [{ instrument: 'פסנתר', teacherName: 'יעל דרעי', yearsOfStudy: 18 }, { instrument: 'שירה', teacherName: 'יעל דרעי', yearsOfStudy: 12 }], notifications: [], achievements: [], createdAt: '2024-03-03T12:00:00.000Z' },
    { id: 'dir-teacher-012', name: 'שרה ויסר', email: 'teacher-dir-012@harmonia.local', role: 'teacher' as const, conservatoriumId: 'cons-15', conservatoriumName: 'הוד השרון', avatarUrl: 'https://alumahod.com/wp-content/uploads/2025/09/%D7%95%D7%99%D7%A1%D7%A8-%D7%A9%D7%A8%D7%94.png', bio: 'פסנתר', approved: true, availableForNewStudents: true, specialties: ['PERFORMANCE'], teachingLanguages: ['HE'], maxStudents: 20, employmentType: 'EMPLOYEE' as const, ratePerDuration: { '30': 80, '45': 100, '60': 120 }, availability: [{ dayOfWeek: 'SUN' as const, startTime: '09:00', endTime: '15:00' }, { dayOfWeek: 'TUE' as const, startTime: '09:00', endTime: '15:00' }, { dayOfWeek: 'THU' as const, startTime: '09:00', endTime: '15:00' }], instruments: [{ instrument: 'פסנתר', teacherName: 'שרה ויסר', yearsOfStudy: 15 }], notifications: [], achievements: [], createdAt: '2024-03-03T12:00:00.000Z' },
    { id: 'dir-teacher-013', name: 'לנה הנקין', email: 'teacher-dir-013@harmonia.local', role: 'teacher' as const, conservatoriumId: 'cons-15', conservatoriumName: 'הוד השרון', avatarUrl: 'https://alumahod.com/wp-content/uploads/2025/09/%D7%94%D7%A0%D7%A7%D7%99%D7%9F-%D7%9C%D7%A0%D7%94-191x300.jpg', bio: 'פסנתר, ניצוח מקהלה', approved: true, availableForNewStudents: true, specialties: ['ENSEMBLE', 'PERFORMANCE'], teachingLanguages: ['HE'], maxStudents: 20, employmentType: 'EMPLOYEE' as const, ratePerDuration: { '30': 80, '45': 100, '60': 120 }, availability: [{ dayOfWeek: 'MON' as const, startTime: '10:00', endTime: '17:00' }, { dayOfWeek: 'WED' as const, startTime: '10:00', endTime: '17:00' }, { dayOfWeek: 'FRI' as const, startTime: '09:00', endTime: '13:00' }], instruments: [{ instrument: 'פסנתר', teacherName: 'לנה הנקין', yearsOfStudy: 18 }], notifications: [], achievements: [], createdAt: '2024-03-03T12:00:00.000Z' },
    { id: 'dir-teacher-014', name: 'אירנה פינקלסון', email: 'teacher-dir-014@harmonia.local', role: 'teacher' as const, conservatoriumId: 'cons-15', conservatoriumName: 'הוד השרון', avatarUrl: 'https://alumahod.com/wp-content/uploads/2025/09/%D7%A4%D7%99%D7%A0%D7%A7%D7%9C%D7%A1%D7%95%D7%9F-%D7%90%D7%99%D7%A8%D7%A0%D7%94.png', bio: 'פסנתר', approved: true, availableForNewStudents: true, specialties: ['PERFORMANCE'], teachingLanguages: ['HE'], maxStudents: 20, employmentType: 'EMPLOYEE' as const, ratePerDuration: { '30': 80, '45': 100, '60': 120 }, availability: [{ dayOfWeek: 'SUN' as const, startTime: '16:00', endTime: '21:00' }, { dayOfWeek: 'WED' as const, startTime: '16:00', endTime: '21:00' }], instruments: [{ instrument: 'פסנתר', teacherName: 'אירנה פינקלסון', yearsOfStudy: 16 }], notifications: [], achievements: [], createdAt: '2024-03-03T12:00:00.000Z' },
    { id: 'dir-teacher-015', name: 'אלכס פינקלסון', email: 'teacher-dir-015@harmonia.local', role: 'teacher' as const, conservatoriumId: 'cons-15', conservatoriumName: 'הוד השרון', avatarUrl: 'https://alumahod.com/wp-content/uploads/2025/09/%D7%A4%D7%99%D7%A0%D7%A7%D7%9C%D7%A1%D7%95%D7%9F-%D7%90%D7%9C%D7%9B%D7%A1.png', bio: 'פסנתר', approved: true, availableForNewStudents: true, specialties: ['PERFORMANCE'], teachingLanguages: ['HE'], maxStudents: 20, employmentType: 'EMPLOYEE' as const, ratePerDuration: { '30': 80, '45': 100, '60': 120 }, availability: [{ dayOfWeek: 'SUN' as const, startTime: '14:00', endTime: '20:00' }, { dayOfWeek: 'TUE' as const, startTime: '14:00', endTime: '20:00' }, { dayOfWeek: 'THU' as const, startTime: '14:00', endTime: '20:00' }], instruments: [{ instrument: 'פסנתר', teacherName: 'אלכס פינקלסון', yearsOfStudy: 16 }], notifications: [], achievements: [], createdAt: '2024-03-03T12:00:00.000Z' },
    { id: 'dir-teacher-016', name: 'גיל פקר', email: 'teacher-dir-016@harmonia.local', role: 'teacher' as const, conservatoriumId: 'cons-15', conservatoriumName: 'הוד השרון', avatarUrl: 'https://alumahod.com/wp-content/uploads/2025/09/%D7%92%D7%99%D7%9C-%D7%A4%D7%A7%D7%A8.png', bio: 'פסנתר ג\'אז', approved: true, availableForNewStudents: true, specialties: ['JAZZ', 'PERFORMANCE'], teachingLanguages: ['HE'], maxStudents: 20, employmentType: 'EMPLOYEE' as const, ratePerDuration: { '30': 80, '45': 100, '60': 120 }, availability: [{ dayOfWeek: 'MON' as const, startTime: '15:00', endTime: '21:00' }, { dayOfWeek: 'WED' as const, startTime: '15:00', endTime: '21:00' }], instruments: [{ instrument: 'פסנתר', teacherName: 'גיל פקר', yearsOfStudy: 15 }], notifications: [], achievements: [], createdAt: '2024-03-03T12:00:00.000Z' },
    { id: 'dir-teacher-017', name: 'שגיב ציוני', email: 'teacher-dir-017@harmonia.local', role: 'teacher' as const, conservatoriumId: 'cons-15', conservatoriumName: 'הוד השרון', avatarUrl: 'https://alumahod.com/wp-content/uploads/2025/09/%D7%A6%D7%99%D7%95%D7%A0%D7%99-%D7%A9%D7%92%D7%99%D7%91.png', bio: 'פסנתר ג\'אז, מעבד ומלחין', approved: true, availableForNewStudents: true, specialties: ['JAZZ', 'THEORY'], teachingLanguages: ['HE'], maxStudents: 20, employmentType: 'EMPLOYEE' as const, ratePerDuration: { '30': 80, '45': 100, '60': 120 }, availability: [{ dayOfWeek: 'SUN' as const, startTime: '09:00', endTime: '15:00' }, { dayOfWeek: 'TUE' as const, startTime: '09:00', endTime: '15:00' }, { dayOfWeek: 'THU' as const, startTime: '09:00', endTime: '15:00' }], instruments: [{ instrument: 'פסנתר', teacherName: 'שגיב ציוני', yearsOfStudy: 15 }], notifications: [], achievements: [], createdAt: '2024-03-03T12:00:00.000Z' },
    { id: 'dir-teacher-018', name: 'נדב עין הגל', email: 'teacher-dir-018@harmonia.local', role: 'teacher' as const, conservatoriumId: 'cons-15', conservatoriumName: 'הוד השרון', avatarUrl: 'https://alumahod.com/wp-content/uploads/2025/12/%D7%A0%D7%93%D7%91-%D7%A2%D7%99%D7%9F-%D7%94%D7%92%D7%9C-300x196.png', bio: 'פסנתר', approved: true, availableForNewStudents: true, specialties: ['PERFORMANCE'], teachingLanguages: ['HE'], maxStudents: 20, employmentType: 'EMPLOYEE' as const, ratePerDuration: { '30': 80, '45': 100, '60': 120 }, availability: [{ dayOfWeek: 'MON' as const, startTime: '10:00', endTime: '17:00' }, { dayOfWeek: 'WED' as const, startTime: '10:00', endTime: '17:00' }, { dayOfWeek: 'FRI' as const, startTime: '09:00', endTime: '13:00' }], instruments: [{ instrument: 'פסנתר', teacherName: 'נדב עין הגל', yearsOfStudy: 14 }], notifications: [], achievements: [], createdAt: '2024-03-03T12:00:00.000Z' },
    // ── cons-66 (קריית אונו) teachers ──
    { id: 'dir-teacher-019', name: 'בר ערמון', email: 'teacher-dir-019@harmonia.local', role: 'teacher' as const, conservatoriumId: 'cons-66', conservatoriumName: 'קריית אונו', avatarUrl: 'https://static.wixstatic.com/media/3a428b_7288fa4a704043e7a6f005dd215653fd~mv2.jpg/v1/crop/x_97,y_0,w_1776,h_1776/fill/w_176,h_176,al_c,q_80,enc_avif/85_edited.jpg', bio: 'מנהל הקונסרבטוריון', approved: true, availableForNewStudents: true, specialties: ['ENSEMBLE'], teachingLanguages: ['HE'], maxStudents: 20, employmentType: 'EMPLOYEE' as const, ratePerDuration: { '30': 80, '45': 100, '60': 120 }, availability: [{ dayOfWeek: 'SUN' as const, startTime: '16:00', endTime: '21:00' }, { dayOfWeek: 'WED' as const, startTime: '16:00', endTime: '21:00' }], instruments: [{ instrument: 'פסנתר', teacherName: 'בר ערמון', yearsOfStudy: 15 }], notifications: [], achievements: [], createdAt: '2024-03-03T12:00:00.000Z' },
    { id: 'dir-teacher-020', name: 'לורה בורלא ששון', email: 'teacher-dir-020@harmonia.local', role: 'teacher' as const, conservatoriumId: 'cons-66', conservatoriumName: 'קריית אונו', avatarUrl: 'https://static.wixstatic.com/media/3a428b_62b103f97aee4decb8394cae5067576c~mv2.jpg/v1/fill/w_176,h_182,al_c,q_80,enc_avif/28%20(3)_edited_edited.jpg', bio: 'ויולה וכינור', approved: true, availableForNewStudents: true, specialties: ['PERFORMANCE'], teachingLanguages: ['HE'], maxStudents: 20, employmentType: 'EMPLOYEE' as const, ratePerDuration: { '30': 80, '45': 100, '60': 120 }, availability: [{ dayOfWeek: 'SUN' as const, startTime: '14:00', endTime: '20:00' }, { dayOfWeek: 'TUE' as const, startTime: '14:00', endTime: '20:00' }, { dayOfWeek: 'THU' as const, startTime: '14:00', endTime: '20:00' }], instruments: [{ instrument: 'כינור', teacherName: 'לורה בורלא ששון', yearsOfStudy: 18 }], notifications: [], achievements: [], createdAt: '2024-03-03T12:00:00.000Z' },
    { id: 'dir-teacher-021', name: 'שריג הזנפלד', email: 'teacher-dir-021@harmonia.local', role: 'teacher' as const, conservatoriumId: 'cons-66', conservatoriumName: 'קריית אונו', avatarUrl: 'https://static.wixstatic.com/media/e5ff77_3d73f9d07a6740bdb381cfb04bed613b~mv2.jpg/v1/crop/x_0,y_122,w_2003,h_2067/fill/w_176,h_182,al_c,q_80,enc_avif/22_3_edited.jpg', bio: 'קלרינט', approved: true, availableForNewStudents: true, specialties: ['PERFORMANCE'], teachingLanguages: ['HE'], maxStudents: 20, employmentType: 'EMPLOYEE' as const, ratePerDuration: { '30': 80, '45': 100, '60': 120 }, availability: [{ dayOfWeek: 'MON' as const, startTime: '15:00', endTime: '21:00' }, { dayOfWeek: 'WED' as const, startTime: '15:00', endTime: '21:00' }], instruments: [{ instrument: 'קלרינט', teacherName: 'שריג הזנפלד', yearsOfStudy: 15 }], notifications: [], achievements: [], createdAt: '2024-03-03T12:00:00.000Z' },
    { id: 'dir-teacher-022', name: 'אדוה חדידה', email: 'teacher-dir-022@harmonia.local', role: 'teacher' as const, conservatoriumId: 'cons-66', conservatoriumName: 'קריית אונו', avatarUrl: 'https://static.wixstatic.com/media/e5ff77_cce729711f8f4fabb3570ec8ba9ebb46~mv2.jpg/v1/fill/w_176,h_182,al_c,q_80,enc_avif/25_3%2520(1)_edited.jpg', bio: 'קלרינט', approved: true, availableForNewStudents: true, specialties: ['PERFORMANCE'], teachingLanguages: ['HE'], maxStudents: 20, employmentType: 'EMPLOYEE' as const, ratePerDuration: { '30': 80, '45': 100, '60': 120 }, availability: [{ dayOfWeek: 'SUN' as const, startTime: '09:00', endTime: '15:00' }, { dayOfWeek: 'TUE' as const, startTime: '09:00', endTime: '15:00' }, { dayOfWeek: 'THU' as const, startTime: '09:00', endTime: '15:00' }], instruments: [{ instrument: 'קלרינט', teacherName: 'אדוה חדידה', yearsOfStudy: 14 }], notifications: [], achievements: [], createdAt: '2024-03-03T12:00:00.000Z' },
    { id: 'dir-teacher-023', name: 'רועי צאיג', email: 'teacher-dir-023@harmonia.local', role: 'teacher' as const, conservatoriumId: 'cons-66', conservatoriumName: 'קריית אונו', avatarUrl: 'https://static.wixstatic.com/media/3a428b_aaa6c24db450432aa1d9114c99a90cca~mv2.jpg/v1/fill/w_176,h_182,al_c,q_80,enc_avif/53_edited_edited.jpg', bio: 'גיטרה', approved: true, availableForNewStudents: true, specialties: ['PERFORMANCE'], teachingLanguages: ['HE'], maxStudents: 20, employmentType: 'EMPLOYEE' as const, ratePerDuration: { '30': 80, '45': 100, '60': 120 }, availability: [{ dayOfWeek: 'MON' as const, startTime: '10:00', endTime: '17:00' }, { dayOfWeek: 'WED' as const, startTime: '10:00', endTime: '17:00' }, { dayOfWeek: 'FRI' as const, startTime: '09:00', endTime: '13:00' }], instruments: [{ instrument: 'גיטרה', teacherName: 'רועי צאיג', yearsOfStudy: 16 }], notifications: [], achievements: [], createdAt: '2024-03-03T12:00:00.000Z' },
    { id: 'dir-teacher-024', name: 'דפנה רביד', email: 'teacher-dir-024@harmonia.local', role: 'teacher' as const, conservatoriumId: 'cons-66', conservatoriumName: 'קריית אונו', avatarUrl: 'https://static.wixstatic.com/media/e5ff77_09faf272546449b7ba5e7623a6a83687~mv2.jpg/v1/fill/w_176,h_182,al_c,q_80,enc_avif/27_3_edited.jpg', bio: 'כינור', approved: true, availableForNewStudents: true, specialties: ['PERFORMANCE'], teachingLanguages: ['HE'], maxStudents: 20, employmentType: 'EMPLOYEE' as const, ratePerDuration: { '30': 80, '45': 100, '60': 120 }, availability: [{ dayOfWeek: 'SUN' as const, startTime: '16:00', endTime: '21:00' }, { dayOfWeek: 'WED' as const, startTime: '16:00', endTime: '21:00' }], instruments: [{ instrument: 'כינור', teacherName: 'דפנה רביד', yearsOfStudy: 17 }], notifications: [], achievements: [], createdAt: '2024-03-03T12:00:00.000Z' },
    { id: 'dir-teacher-025', name: 'ניב עופר', email: 'teacher-dir-025@harmonia.local', role: 'teacher' as const, conservatoriumId: 'cons-66', conservatoriumName: 'קריית אונו', avatarUrl: 'https://static.wixstatic.com/media/e5ff77_c3f571511b4e47bd95026d607cb17bb2~mv2.jpg/v1/crop/x_0,y_465,w_2003,h_2070/fill/w_176,h_182,al_c,q_80,enc_avif/29_1_edited.jpg', bio: 'טרומבון', approved: true, availableForNewStudents: true, specialties: ['PERFORMANCE'], teachingLanguages: ['HE'], maxStudents: 20, employmentType: 'EMPLOYEE' as const, ratePerDuration: { '30': 80, '45': 100, '60': 120 }, availability: [{ dayOfWeek: 'SUN' as const, startTime: '14:00', endTime: '20:00' }, { dayOfWeek: 'TUE' as const, startTime: '14:00', endTime: '20:00' }, { dayOfWeek: 'THU' as const, startTime: '14:00', endTime: '20:00' }], instruments: [{ instrument: 'טרומבון', teacherName: 'ניב עופר', yearsOfStudy: 15 }], notifications: [], achievements: [], createdAt: '2024-03-03T12:00:00.000Z' },
    { id: 'dir-teacher-026', name: 'מריאנה גליקמן', email: 'teacher-dir-026@harmonia.local', role: 'teacher' as const, conservatoriumId: 'cons-66', conservatoriumName: 'קריית אונו', avatarUrl: 'https://static.wixstatic.com/media/e5ff77_25fadef728df4fdf99f8a2555ab76354~mv2.jpg/v1/fill/w_176,h_182,al_c,q_80,enc_avif/11_3_edited.jpg', bio: 'אורגנית', approved: true, availableForNewStudents: true, specialties: ['PERFORMANCE'], teachingLanguages: ['HE'], maxStudents: 20, employmentType: 'EMPLOYEE' as const, ratePerDuration: { '30': 80, '45': 100, '60': 120 }, availability: [{ dayOfWeek: 'MON' as const, startTime: '15:00', endTime: '21:00' }, { dayOfWeek: 'WED' as const, startTime: '15:00', endTime: '21:00' }], instruments: [{ instrument: 'פסנתר', teacherName: 'מריאנה גליקמן', yearsOfStudy: 15 }], notifications: [], achievements: [], createdAt: '2024-03-03T12:00:00.000Z' },
    { id: 'dir-teacher-027', name: 'חיים מזר', email: 'teacher-dir-027@harmonia.local', role: 'teacher' as const, conservatoriumId: 'cons-66', conservatoriumName: 'קריית אונו', avatarUrl: 'https://static.wixstatic.com/media/e5ff77_faed373029a545f89bbfbf842b1c7366~mv2.jpg/v1/fill/w_176,h_182,al_c,q_80,enc_avif/15_3_edited.jpg', bio: 'טובה', approved: true, availableForNewStudents: true, specialties: ['PERFORMANCE'], teachingLanguages: ['HE'], maxStudents: 20, employmentType: 'EMPLOYEE' as const, ratePerDuration: { '30': 80, '45': 100, '60': 120 }, availability: [{ dayOfWeek: 'SUN' as const, startTime: '09:00', endTime: '15:00' }, { dayOfWeek: 'TUE' as const, startTime: '09:00', endTime: '15:00' }, { dayOfWeek: 'THU' as const, startTime: '09:00', endTime: '15:00' }], instruments: [{ instrument: 'טובה', teacherName: 'חיים מזר', yearsOfStudy: 15 }], notifications: [], achievements: [], createdAt: '2024-03-03T12:00:00.000Z' },
    { id: 'dir-teacher-028', name: 'ניר פישקין', email: 'teacher-dir-028@harmonia.local', role: 'teacher' as const, conservatoriumId: 'cons-66', conservatoriumName: 'קריית אונו', avatarUrl: 'https://static.wixstatic.com/media/3a428b_2ef70f2ac9164d30bc9be842f4bda99b~mv2.png/v1/fill/w_176,h_182,al_c,q_85,enc_avif/298696770_1048990335843228_5596559905577286962_n.png', bio: 'בריטון וטרומבון', approved: true, availableForNewStudents: true, specialties: ['PERFORMANCE'], teachingLanguages: ['HE'], maxStudents: 20, employmentType: 'EMPLOYEE' as const, ratePerDuration: { '30': 80, '45': 100, '60': 120 }, availability: [{ dayOfWeek: 'MON' as const, startTime: '10:00', endTime: '17:00' }, { dayOfWeek: 'WED' as const, startTime: '10:00', endTime: '17:00' }, { dayOfWeek: 'FRI' as const, startTime: '09:00', endTime: '13:00' }], instruments: [{ instrument: 'שירה', teacherName: 'ניר פישקין', yearsOfStudy: 12 }], notifications: [], achievements: [], createdAt: '2024-03-03T12:00:00.000Z' },
    { id: 'dir-teacher-029', name: 'תומר כהן', email: 'teacher-dir-029@harmonia.local', role: 'teacher' as const, conservatoriumId: 'cons-66', conservatoriumName: 'קריית אונו', avatarUrl: 'https://static.wixstatic.com/media/3a428b_7af09cd1448d44369c4c6ec2974c45e5~mv2.jpg/v1/crop/x_201,y_0,w_1599,h_1652/fill/w_176,h_182,al_c,q_80,enc_avif/DSCF5726_edited.jpg', bio: 'גיטרה חשמלית', approved: true, availableForNewStudents: true, specialties: ['PERFORMANCE'], teachingLanguages: ['HE'], maxStudents: 20, employmentType: 'EMPLOYEE' as const, ratePerDuration: { '30': 80, '45': 100, '60': 120 }, availability: [{ dayOfWeek: 'SUN' as const, startTime: '16:00', endTime: '21:00' }, { dayOfWeek: 'WED' as const, startTime: '16:00', endTime: '21:00' }], instruments: [{ instrument: 'גיטרה', teacherName: 'תומר כהן', yearsOfStudy: 14 }], notifications: [], achievements: [], createdAt: '2024-03-03T12:00:00.000Z' },
    { id: 'dir-teacher-030', name: 'דנה כהן שריון', email: 'teacher-dir-030@harmonia.local', role: 'teacher' as const, conservatoriumId: 'cons-66', conservatoriumName: 'קריית אונו', avatarUrl: 'https://static.wixstatic.com/media/3a428b_ae834b8360d54b3fa7b000498ed08703~mv2.jpg/v1/fill/w_176,h_182,al_c,q_80,enc_avif/88_edited.jpg', bio: 'קלרינט', approved: true, availableForNewStudents: true, specialties: ['PERFORMANCE'], teachingLanguages: ['HE'], maxStudents: 20, employmentType: 'EMPLOYEE' as const, ratePerDuration: { '30': 80, '45': 100, '60': 120 }, availability: [{ dayOfWeek: 'SUN' as const, startTime: '14:00', endTime: '20:00' }, { dayOfWeek: 'TUE' as const, startTime: '14:00', endTime: '20:00' }, { dayOfWeek: 'THU' as const, startTime: '14:00', endTime: '20:00' }], instruments: [{ instrument: 'קלרינט', teacherName: 'דנה כהן שריון', yearsOfStudy: 15 }], notifications: [], achievements: [], createdAt: '2024-03-03T12:00:00.000Z' },
    { id: 'dir-teacher-031', name: 'דורט פלורנטין', email: 'teacher-dir-031@harmonia.local', role: 'teacher' as const, conservatoriumId: 'cons-66', conservatoriumName: 'קריית אונו', avatarUrl: 'https://static.wixstatic.com/media/e5ff77_192b0341e4b749b2a9301c4e17a25907~mv2.jpg/v1/fill/w_176,h_182,al_c,q_80,enc_avif/5_3_edited.jpg', bio: 'חליליות', approved: true, availableForNewStudents: true, specialties: ['PERFORMANCE'], teachingLanguages: ['HE'], maxStudents: 20, employmentType: 'EMPLOYEE' as const, ratePerDuration: { '30': 80, '45': 100, '60': 120 }, availability: [{ dayOfWeek: 'MON' as const, startTime: '15:00', endTime: '21:00' }, { dayOfWeek: 'WED' as const, startTime: '15:00', endTime: '21:00' }], instruments: [{ instrument: 'חליל צד', teacherName: 'דורט פלורנטין', yearsOfStudy: 16 }], notifications: [], achievements: [], createdAt: '2024-03-03T12:00:00.000Z' },
    { id: 'dir-teacher-032', name: 'רות צרי', email: 'teacher-dir-032@harmonia.local', role: 'teacher' as const, conservatoriumId: 'cons-66', conservatoriumName: 'קריית אונו', avatarUrl: 'https://static.wixstatic.com/media/e5ff77_58a1da86acfa48ec99151d9094c22078~mv2.jpg/v1/fill/w_176,h_182,al_c,q_80,enc_avif/10_1_edited.jpg', bio: 'פסנתר', approved: true, availableForNewStudents: true, specialties: ['PERFORMANCE'], teachingLanguages: ['HE'], maxStudents: 20, employmentType: 'EMPLOYEE' as const, ratePerDuration: { '30': 80, '45': 100, '60': 120 }, availability: [{ dayOfWeek: 'SUN' as const, startTime: '09:00', endTime: '15:00' }, { dayOfWeek: 'TUE' as const, startTime: '09:00', endTime: '15:00' }, { dayOfWeek: 'THU' as const, startTime: '09:00', endTime: '15:00' }], instruments: [{ instrument: 'פסנתר', teacherName: 'רות צרי', yearsOfStudy: 18 }], notifications: [], achievements: [], createdAt: '2024-03-03T12:00:00.000Z' },
    { id: 'dir-teacher-033', name: 'נדב פרידמן', email: 'teacher-dir-033@harmonia.local', role: 'teacher' as const, conservatoriumId: 'cons-66', conservatoriumName: 'קריית אונו', avatarUrl: 'https://static.wixstatic.com/media/3a428b_6dc6891885da4c0fb5a8d94d759671c5~mv2.jpg/v1/crop/x_279,y_0,w_1442,h_1490/fill/w_176,h_182,al_c,q_80,enc_avif/_1%D7%AA%D7%A6%D7%9C%D7%95%D7%9E%D7%99%20%D7%9E%D7%95%D7%A8%D7%99%D7%9D0475_edited.jpg', bio: 'כלי הקשה', approved: true, availableForNewStudents: true, specialties: ['PERFORMANCE'], teachingLanguages: ['HE'], maxStudents: 20, employmentType: 'EMPLOYEE' as const, ratePerDuration: { '30': 80, '45': 100, '60': 120 }, availability: [{ dayOfWeek: 'MON' as const, startTime: '10:00', endTime: '17:00' }, { dayOfWeek: 'WED' as const, startTime: '10:00', endTime: '17:00' }, { dayOfWeek: 'FRI' as const, startTime: '09:00', endTime: '13:00' }], instruments: [{ instrument: 'תופים', teacherName: 'נדב פרידמן', yearsOfStudy: 14 }], notifications: [], achievements: [], createdAt: '2024-03-03T12:00:00.000Z' },
    { id: 'dir-teacher-034', name: 'גונן רוזנברג', email: 'teacher-dir-034@harmonia.local', role: 'teacher' as const, conservatoriumId: 'cons-66', conservatoriumName: 'קריית אונו', avatarUrl: 'https://static.wixstatic.com/media/3a428b_ff5021181442423babda25469afba454~mv2.jpg/v1/fill/w_176,h_182,al_c,q_80,enc_avif/24_edited.jpg', bio: 'תופים וכלי הקשה', approved: true, availableForNewStudents: true, specialties: ['PERFORMANCE'], teachingLanguages: ['HE'], maxStudents: 20, employmentType: 'EMPLOYEE' as const, ratePerDuration: { '30': 80, '45': 100, '60': 120 }, availability: [{ dayOfWeek: 'SUN' as const, startTime: '16:00', endTime: '21:00' }, { dayOfWeek: 'WED' as const, startTime: '16:00', endTime: '21:00' }], instruments: [{ instrument: 'תופים', teacherName: 'גונן רוזנברג', yearsOfStudy: 15 }], notifications: [], achievements: [], createdAt: '2024-03-03T12:00:00.000Z' },
    { id: 'dir-teacher-035', name: 'יאנה וישנבצקי', email: 'teacher-dir-035@harmonia.local', role: 'teacher' as const, conservatoriumId: 'cons-66', conservatoriumName: 'קריית אונו', avatarUrl: '', bio: 'פיתוח קול ופסנתר', approved: true, availableForNewStudents: true, specialties: ['PERFORMANCE'], teachingLanguages: ['HE'], maxStudents: 20, employmentType: 'EMPLOYEE' as const, ratePerDuration: { '30': 80, '45': 100, '60': 120 }, availability: [{ dayOfWeek: 'SUN' as const, startTime: '14:00', endTime: '20:00' }, { dayOfWeek: 'TUE' as const, startTime: '14:00', endTime: '20:00' }, { dayOfWeek: 'THU' as const, startTime: '14:00', endTime: '20:00' }], instruments: [{ instrument: 'שירה', teacherName: 'יאנה וישנבצקי', yearsOfStudy: 12 }, { instrument: 'פסנתר', teacherName: 'יאנה וישנבצקי', yearsOfStudy: 10 }], notifications: [], achievements: [], createdAt: '2024-03-03T12:00:00.000Z' },
    { id: 'dir-teacher-036', name: 'איוונה קיש', email: 'teacher-dir-036@harmonia.local', role: 'teacher' as const, conservatoriumId: 'cons-66', conservatoriumName: 'קריית אונו', avatarUrl: 'https://static.wixstatic.com/media/e5ff77_d5e6f319ace54dc0bab630b1498d1d2e~mv2.jpg/v1/fill/w_176,h_182,al_c,q_80,enc_avif/4_3_edited.jpg', bio: 'תאוריה ופיתוח שמיעה', approved: true, availableForNewStudents: true, specialties: ['THEORY', 'PERFORMANCE'], teachingLanguages: ['HE'], maxStudents: 20, employmentType: 'EMPLOYEE' as const, ratePerDuration: { '30': 80, '45': 100, '60': 120 }, availability: [{ dayOfWeek: 'MON' as const, startTime: '15:00', endTime: '21:00' }, { dayOfWeek: 'WED' as const, startTime: '15:00', endTime: '21:00' }], instruments: [{ instrument: 'פסנתר', teacherName: 'איוונה קיש', yearsOfStudy: 15 }], notifications: [], achievements: [], createdAt: '2024-03-03T12:00:00.000Z' },
    { id: 'dir-teacher-037', name: 'אירינה וישנבצקי', email: 'teacher-dir-037@harmonia.local', role: 'teacher' as const, conservatoriumId: 'cons-66', conservatoriumName: 'קריית אונו', avatarUrl: 'https://static.wixstatic.com/media/e5ff77_8292cf673c3d44b6bbad295985f0b752~mv2.jpg/v1/crop/x_0,y_250,w_1080,h_1116/fill/w_176,h_182,al_c,q_80,enc_avif/9_1_edited.jpg', bio: 'פסנתר', approved: true, availableForNewStudents: true, specialties: ['PERFORMANCE'], teachingLanguages: ['HE'], maxStudents: 20, employmentType: 'EMPLOYEE' as const, ratePerDuration: { '30': 80, '45': 100, '60': 120 }, availability: [{ dayOfWeek: 'SUN' as const, startTime: '09:00', endTime: '15:00' }, { dayOfWeek: 'TUE' as const, startTime: '09:00', endTime: '15:00' }, { dayOfWeek: 'THU' as const, startTime: '09:00', endTime: '15:00' }], instruments: [{ instrument: 'פסנתר', teacherName: 'אירינה וישנבצקי', yearsOfStudy: 18 }], notifications: [], achievements: [], createdAt: '2024-03-03T12:00:00.000Z' },
    { id: 'dir-teacher-038', name: 'אבנר חנני', email: 'teacher-dir-038@harmonia.local', role: 'teacher' as const, conservatoriumId: 'cons-66', conservatoriumName: 'קריית אונו', avatarUrl: 'https://static.wixstatic.com/media/3a428b_28efec23dd2f4b719541b5156b29f133~mv2.jpg/v1/fill/w_176,h_182,al_c,q_80,enc_avif/49_edited.jpg', bio: 'פסנתר', approved: true, availableForNewStudents: true, specialties: ['PERFORMANCE'], teachingLanguages: ['HE'], maxStudents: 20, employmentType: 'EMPLOYEE' as const, ratePerDuration: { '30': 80, '45': 100, '60': 120 }, availability: [{ dayOfWeek: 'MON' as const, startTime: '10:00', endTime: '17:00' }, { dayOfWeek: 'WED' as const, startTime: '10:00', endTime: '17:00' }, { dayOfWeek: 'FRI' as const, startTime: '09:00', endTime: '13:00' }], instruments: [{ instrument: 'פסנתר', teacherName: 'אבנר חנני', yearsOfStudy: 16 }], notifications: [], achievements: [], createdAt: '2024-03-03T12:00:00.000Z' },
    { id: 'dir-teacher-039', name: 'עידו אסא', email: 'teacher-dir-039@harmonia.local', role: 'teacher' as const, conservatoriumId: 'cons-66', conservatoriumName: 'קריית אונו', avatarUrl: 'https://static.wixstatic.com/media/3a428b_5b6774d8e6294246b353a3b9bf482a8f~mv2.jpg/v1/crop/x_93,y_0,w_1814,h_1874/fill/w_176,h_182,al_c,q_80,enc_avif/104_edited.jpg', bio: 'תופים', approved: true, availableForNewStudents: true, specialties: ['PERFORMANCE'], teachingLanguages: ['HE'], maxStudents: 20, employmentType: 'EMPLOYEE' as const, ratePerDuration: { '30': 80, '45': 100, '60': 120 }, availability: [{ dayOfWeek: 'SUN' as const, startTime: '16:00', endTime: '21:00' }, { dayOfWeek: 'WED' as const, startTime: '16:00', endTime: '21:00' }], instruments: [{ instrument: 'תופים', teacherName: 'עידו אסא', yearsOfStudy: 14 }], notifications: [], achievements: [], createdAt: '2024-03-03T12:00:00.000Z' },
    { id: 'dir-teacher-040', name: 'יותם ברק', email: 'teacher-dir-040@harmonia.local', role: 'teacher' as const, conservatoriumId: 'cons-66', conservatoriumName: 'קריית אונו', avatarUrl: 'https://static.wixstatic.com/media/3a428b_59468b8f17734a02b38f3d1de0c2f207~mv2.jpg/v1/crop/x_94,y_0,w_1813,h_1873/fill/w_176,h_182,al_c,q_80,enc_avif/79_edited.jpg', bio: 'סקסופון', approved: true, availableForNewStudents: true, specialties: ['PERFORMANCE'], teachingLanguages: ['HE'], maxStudents: 20, employmentType: 'EMPLOYEE' as const, ratePerDuration: { '30': 80, '45': 100, '60': 120 }, availability: [{ dayOfWeek: 'SUN' as const, startTime: '14:00', endTime: '20:00' }, { dayOfWeek: 'TUE' as const, startTime: '14:00', endTime: '20:00' }, { dayOfWeek: 'THU' as const, startTime: '14:00', endTime: '20:00' }], instruments: [{ instrument: 'סקסופון', teacherName: 'יותם ברק', yearsOfStudy: 15 }], notifications: [], achievements: [], createdAt: '2024-03-03T12:00:00.000Z' },
    { id: 'dir-teacher-041', name: 'אולה בינדר', email: 'teacher-dir-041@harmonia.local', role: 'teacher' as const, conservatoriumId: 'cons-66', conservatoriumName: 'קריית אונו', avatarUrl: 'https://static.wixstatic.com/media/e5ff77_302274a43f7145b380e22f736f0baf0e~mv2.jpg/v1/crop/x_0,y_250,w_1080,h_1116/fill/w_176,h_182,al_c,q_80,enc_avif/13_2_edited.jpg', bio: 'פיתוח קול', approved: true, availableForNewStudents: true, specialties: ['PERFORMANCE'], teachingLanguages: ['HE'], maxStudents: 20, employmentType: 'EMPLOYEE' as const, ratePerDuration: { '30': 80, '45': 100, '60': 120 }, availability: [{ dayOfWeek: 'MON' as const, startTime: '15:00', endTime: '21:00' }, { dayOfWeek: 'WED' as const, startTime: '15:00', endTime: '21:00' }], instruments: [{ instrument: 'שירה', teacherName: 'אולה בינדר', yearsOfStudy: 15 }], notifications: [], achievements: [], createdAt: '2024-03-03T12:00:00.000Z' },
    { id: 'dir-teacher-042', name: 'אליאנה לובנברג', email: 'teacher-dir-042@harmonia.local', role: 'teacher' as const, conservatoriumId: 'cons-66', conservatoriumName: 'קריית אונו', avatarUrl: 'https://static.wixstatic.com/media/e5ff77_5a0fb170b4f64c4e908cad643011e180~mv2.png/v1/fill/w_176,h_182,al_c,q_85,enc_avif/16_1.png', bio: 'כינור וויולה', approved: true, availableForNewStudents: true, specialties: ['PERFORMANCE'], teachingLanguages: ['HE'], maxStudents: 20, employmentType: 'EMPLOYEE' as const, ratePerDuration: { '30': 80, '45': 100, '60': 120 }, availability: [{ dayOfWeek: 'SUN' as const, startTime: '09:00', endTime: '15:00' }, { dayOfWeek: 'TUE' as const, startTime: '09:00', endTime: '15:00' }, { dayOfWeek: 'THU' as const, startTime: '09:00', endTime: '15:00' }], instruments: [{ instrument: 'כינור', teacherName: 'אליאנה לובנברג', yearsOfStudy: 17 }], notifications: [], achievements: [], createdAt: '2024-03-03T12:00:00.000Z' },
    { id: 'dir-teacher-043', name: 'ניר ערמון', email: 'teacher-dir-043@harmonia.local', role: 'teacher' as const, conservatoriumId: 'cons-66', conservatoriumName: 'קריית אונו', avatarUrl: 'https://static.wixstatic.com/media/3a428b_f55209bd11954f82b58de82639b368d8~mv2.jpg/v1/crop/x_67,y_0,w_1867,h_1929/fill/w_176,h_182,al_c,q_80,enc_avif/72_edited.jpg', bio: 'סקסופון', approved: true, availableForNewStudents: true, specialties: ['PERFORMANCE'], teachingLanguages: ['HE'], maxStudents: 20, employmentType: 'EMPLOYEE' as const, ratePerDuration: { '30': 80, '45': 100, '60': 120 }, availability: [{ dayOfWeek: 'MON' as const, startTime: '10:00', endTime: '17:00' }, { dayOfWeek: 'WED' as const, startTime: '10:00', endTime: '17:00' }, { dayOfWeek: 'FRI' as const, startTime: '09:00', endTime: '13:00' }], instruments: [{ instrument: 'סקסופון', teacherName: 'ניר ערמון', yearsOfStudy: 15 }], notifications: [], achievements: [], createdAt: '2024-03-03T12:00:00.000Z' },
    { id: 'dir-teacher-044', name: 'דניאל אדג\'יאשווילי', email: 'teacher-dir-044@harmonia.local', role: 'teacher' as const, conservatoriumId: 'cons-66', conservatoriumName: 'קריית אונו', avatarUrl: 'https://static.wixstatic.com/media/3a428b_494c5f816d634155a1039cf7e2aaf161~mv2.jpg/v1/crop/x_159,y_0,w_1683,h_1739/fill/w_176,h_182,al_c,q_80,enc_avif/80_edited.jpg', bio: 'כינור', approved: true, availableForNewStudents: true, specialties: ['PERFORMANCE'], teachingLanguages: ['HE'], maxStudents: 20, employmentType: 'EMPLOYEE' as const, ratePerDuration: { '30': 80, '45': 100, '60': 120 }, availability: [{ dayOfWeek: 'SUN' as const, startTime: '16:00', endTime: '21:00' }, { dayOfWeek: 'WED' as const, startTime: '16:00', endTime: '21:00' }], instruments: [{ instrument: 'כינור', teacherName: 'דניאל אדג\'יאשווילי', yearsOfStudy: 16 }], notifications: [], achievements: [], createdAt: '2024-03-03T12:00:00.000Z' },
    { id: 'dir-teacher-045', name: 'נועה שירוון', email: 'teacher-dir-045@harmonia.local', role: 'teacher' as const, conservatoriumId: 'cons-66', conservatoriumName: 'קריית אונו', avatarUrl: 'https://static.wixstatic.com/media/3a428b_4e2440d5ed104667ad3d265155c0e115~mv2.jpg/v1/crop/x_299,y_0,w_1401,h_1448/fill/w_176,h_182,al_c,q_80,enc_avif/60_edited.jpg', bio: 'חלילית', approved: true, availableForNewStudents: true, specialties: ['PERFORMANCE'], teachingLanguages: ['HE'], maxStudents: 20, employmentType: 'EMPLOYEE' as const, ratePerDuration: { '30': 80, '45': 100, '60': 120 }, availability: [{ dayOfWeek: 'SUN' as const, startTime: '14:00', endTime: '20:00' }, { dayOfWeek: 'TUE' as const, startTime: '14:00', endTime: '20:00' }, { dayOfWeek: 'THU' as const, startTime: '14:00', endTime: '20:00' }], instruments: [{ instrument: 'חליל צד', teacherName: 'נועה שירוון', yearsOfStudy: 14 }], notifications: [], achievements: [], createdAt: '2024-03-03T12:00:00.000Z' },
    { id: 'dir-teacher-046', name: 'אלון מלניק', email: 'teacher-dir-046@harmonia.local', role: 'teacher' as const, conservatoriumId: 'cons-66', conservatoriumName: 'קריית אונו', avatarUrl: 'https://static.wixstatic.com/media/3a428b_45b2c44947e342e2b67a837020cb9b39~mv2.jpg/v1/crop/x_291,y_0,w_1419,h_1466/fill/w_176,h_182,al_c,q_80,enc_avif/63_edited.jpg', bio: 'מנצח תזמורת', approved: true, availableForNewStudents: true, specialties: ['ENSEMBLE'], teachingLanguages: ['HE'], maxStudents: 20, employmentType: 'EMPLOYEE' as const, ratePerDuration: { '30': 80, '45': 100, '60': 120 }, availability: [{ dayOfWeek: 'MON' as const, startTime: '15:00', endTime: '21:00' }, { dayOfWeek: 'WED' as const, startTime: '15:00', endTime: '21:00' }], instruments: [{ instrument: 'פסנתר', teacherName: 'אלון מלניק', yearsOfStudy: 15 }], notifications: [], achievements: [], createdAt: '2024-03-03T12:00:00.000Z' },
    { id: 'dir-teacher-047', name: 'ליאור מישל וירוט', email: 'teacher-dir-047@harmonia.local', role: 'teacher' as const, conservatoriumId: 'cons-66', conservatoriumName: 'קריית אונו', avatarUrl: 'https://static.wixstatic.com/media/3a428b_dd3e1472562c4157aa83ba8ab69e5d6b~mv2.jpg/v1/crop/x_334,y_0,w_1333,h_1377/fill/w_176,h_182,al_c,q_80,enc_avif/34_edited.jpg', bio: 'אבוב', approved: true, availableForNewStudents: true, specialties: ['PERFORMANCE'], teachingLanguages: ['HE'], maxStudents: 20, employmentType: 'EMPLOYEE' as const, ratePerDuration: { '30': 80, '45': 100, '60': 120 }, availability: [{ dayOfWeek: 'SUN' as const, startTime: '09:00', endTime: '15:00' }, { dayOfWeek: 'TUE' as const, startTime: '09:00', endTime: '15:00' }, { dayOfWeek: 'THU' as const, startTime: '09:00', endTime: '15:00' }], instruments: [{ instrument: 'אבוב', teacherName: 'ליאור מישל וירוט', yearsOfStudy: 15 }], notifications: [], achievements: [], createdAt: '2024-03-03T12:00:00.000Z' },
    { id: 'dir-teacher-048', name: 'מעיין זיטמן-פורת', email: 'teacher-dir-048@harmonia.local', role: 'teacher' as const, conservatoriumId: 'cons-66', conservatoriumName: 'קריית אונו', avatarUrl: 'https://static.wixstatic.com/media/3a428b_af30550657b445b285a38805fa977bc9~mv2.jpg/v1/crop/x_355,y_0,w_1289,h_1332/fill/w_176,h_182,al_c,q_80,enc_avif/39_edited.jpg', bio: 'פיתוח קול', approved: true, availableForNewStudents: true, specialties: ['PERFORMANCE'], teachingLanguages: ['HE'], maxStudents: 20, employmentType: 'EMPLOYEE' as const, ratePerDuration: { '30': 80, '45': 100, '60': 120 }, availability: [{ dayOfWeek: 'MON' as const, startTime: '10:00', endTime: '17:00' }, { dayOfWeek: 'WED' as const, startTime: '10:00', endTime: '17:00' }, { dayOfWeek: 'FRI' as const, startTime: '09:00', endTime: '13:00' }], instruments: [{ instrument: 'שירה', teacherName: 'מעיין זיטמן-פורת', yearsOfStudy: 12 }], notifications: [], achievements: [], createdAt: '2024-03-03T12:00:00.000Z' },
    { id: 'dir-teacher-049', name: 'איתמר ציון', email: 'teacher-dir-049@harmonia.local', role: 'teacher' as const, conservatoriumId: 'cons-66', conservatoriumName: 'קריית אונו', avatarUrl: 'https://static.wixstatic.com/media/3a428b_4b50ee76df7f4aa7b4c594a6aa804d75~mv2.jpg/v1/crop/x_159,y_0,w_1517,h_1568/fill/w_176,h_182,al_c,q_80,enc_avif/41_edited_edited.jpg', bio: 'פסנתר', approved: true, availableForNewStudents: true, specialties: ['PERFORMANCE'], teachingLanguages: ['HE'], maxStudents: 20, employmentType: 'EMPLOYEE' as const, ratePerDuration: { '30': 80, '45': 100, '60': 120 }, availability: [{ dayOfWeek: 'SUN' as const, startTime: '16:00', endTime: '21:00' }, { dayOfWeek: 'WED' as const, startTime: '16:00', endTime: '21:00' }], instruments: [{ instrument: 'פסנתר', teacherName: 'איתמר ציון', yearsOfStudy: 16 }], notifications: [], achievements: [], createdAt: '2024-03-03T12:00:00.000Z' },
    { id: 'dir-teacher-050', name: 'תמר דויטש', email: 'teacher-dir-050@harmonia.local', role: 'teacher' as const, conservatoriumId: 'cons-66', conservatoriumName: 'קריית אונו', avatarUrl: 'https://static.wixstatic.com/media/3a428b_0fa4f2f103784ca89866f5a9b8436838~mv2.jpg/v1/crop/x_261,y_0,w_1479,h_1528/fill/w_176,h_182,al_c,q_80,enc_avif/66_edited.jpg', bio: 'צ\'לו', approved: true, availableForNewStudents: true, specialties: ['PERFORMANCE'], teachingLanguages: ['HE'], maxStudents: 20, employmentType: 'EMPLOYEE' as const, ratePerDuration: { '30': 80, '45': 100, '60': 120 }, availability: [{ dayOfWeek: 'SUN' as const, startTime: '14:00', endTime: '20:00' }, { dayOfWeek: 'TUE' as const, startTime: '14:00', endTime: '20:00' }, { dayOfWeek: 'THU' as const, startTime: '14:00', endTime: '20:00' }], instruments: [{ instrument: 'צ\'לו', teacherName: 'תמר דויטש', yearsOfStudy: 17 }], notifications: [], achievements: [], createdAt: '2024-03-03T12:00:00.000Z' },
    { id: 'dir-teacher-051', name: 'חנן בכר', email: 'teacher-dir-051@harmonia.local', role: 'teacher' as const, conservatoriumId: 'cons-66', conservatoriumName: 'קריית אונו', avatarUrl: 'https://static.wixstatic.com/media/3a428b_7d33aed5dd2b42ff8fd4b0ef104e254f~mv2.jpg/v1/crop/x_205,y_0,w_1589,h_1642/fill/w_176,h_182,al_c,q_80,enc_avif/58_edited.jpg', bio: 'מלווה בפסנתר', approved: true, availableForNewStudents: true, specialties: ['PERFORMANCE'], teachingLanguages: ['HE'], maxStudents: 20, employmentType: 'EMPLOYEE' as const, ratePerDuration: { '30': 80, '45': 100, '60': 120 }, availability: [{ dayOfWeek: 'MON' as const, startTime: '15:00', endTime: '21:00' }, { dayOfWeek: 'WED' as const, startTime: '15:00', endTime: '21:00' }], instruments: [{ instrument: 'פסנתר', teacherName: 'חנן בכר', yearsOfStudy: 18 }], notifications: [], achievements: [], createdAt: '2024-03-03T12:00:00.000Z' },
    { id: 'dir-teacher-052', name: 'עמרי לנדה', email: 'teacher-dir-052@harmonia.local', role: 'teacher' as const, conservatoriumId: 'cons-66', conservatoriumName: 'קריית אונו', avatarUrl: '', bio: 'הפקה מוזיקלית', approved: true, availableForNewStudents: true, specialties: ['PERFORMANCE'], teachingLanguages: ['HE'], maxStudents: 20, employmentType: 'EMPLOYEE' as const, ratePerDuration: { '30': 80, '45': 100, '60': 120 }, availability: [{ dayOfWeek: 'SUN' as const, startTime: '09:00', endTime: '15:00' }, { dayOfWeek: 'TUE' as const, startTime: '09:00', endTime: '15:00' }, { dayOfWeek: 'THU' as const, startTime: '09:00', endTime: '15:00' }], instruments: [{ instrument: 'פסנתר', teacherName: 'עמרי לנדה', yearsOfStudy: 12 }], notifications: [], achievements: [], createdAt: '2024-03-03T12:00:00.000Z' },
    { id: 'dir-teacher-053', name: 'דור סמוכה', email: 'teacher-dir-053@harmonia.local', role: 'teacher' as const, conservatoriumId: 'cons-66', conservatoriumName: 'קריית אונו', avatarUrl: '', bio: 'גיטרה בס', approved: true, availableForNewStudents: true, specialties: ['PERFORMANCE'], teachingLanguages: ['HE'], maxStudents: 20, employmentType: 'EMPLOYEE' as const, ratePerDuration: { '30': 80, '45': 100, '60': 120 }, availability: [{ dayOfWeek: 'MON' as const, startTime: '10:00', endTime: '17:00' }, { dayOfWeek: 'WED' as const, startTime: '10:00', endTime: '17:00' }, { dayOfWeek: 'FRI' as const, startTime: '09:00', endTime: '13:00' }], instruments: [{ instrument: 'גיטרה', teacherName: 'דור סמוכה', yearsOfStudy: 13 }], notifications: [], achievements: [], createdAt: '2024-03-03T12:00:00.000Z' },
    { id: 'dir-teacher-054', name: 'שאלי הרשקו', email: 'teacher-dir-054@harmonia.local', role: 'teacher' as const, conservatoriumId: 'cons-66', conservatoriumName: 'קריית אונו', avatarUrl: '', bio: 'טרומבון', approved: true, availableForNewStudents: true, specialties: ['PERFORMANCE'], teachingLanguages: ['HE'], maxStudents: 20, employmentType: 'EMPLOYEE' as const, ratePerDuration: { '30': 80, '45': 100, '60': 120 }, availability: [{ dayOfWeek: 'SUN' as const, startTime: '16:00', endTime: '21:00' }, { dayOfWeek: 'WED' as const, startTime: '16:00', endTime: '21:00' }], instruments: [{ instrument: 'טרומבון', teacherName: 'שאלי הרשקו', yearsOfStudy: 14 }], notifications: [], achievements: [], createdAt: '2024-03-03T12:00:00.000Z' },
    { id: 'dir-teacher-055', name: 'חן שלו', email: 'teacher-dir-055@harmonia.local', role: 'teacher' as const, conservatoriumId: 'cons-66', conservatoriumName: 'קריית אונו', avatarUrl: '', bio: 'מנצחת מקהלות', approved: true, availableForNewStudents: true, specialties: ['ENSEMBLE'], teachingLanguages: ['HE'], maxStudents: 20, employmentType: 'EMPLOYEE' as const, ratePerDuration: { '30': 80, '45': 100, '60': 120 }, availability: [{ dayOfWeek: 'SUN' as const, startTime: '14:00', endTime: '20:00' }, { dayOfWeek: 'TUE' as const, startTime: '14:00', endTime: '20:00' }, { dayOfWeek: 'THU' as const, startTime: '14:00', endTime: '20:00' }], instruments: [{ instrument: 'שירה', teacherName: 'חן שלו', yearsOfStudy: 15 }], notifications: [], achievements: [], createdAt: '2024-03-03T12:00:00.000Z' },
    { id: 'dir-teacher-056', name: 'דן ורון', email: 'teacher-dir-056@harmonia.local', role: 'teacher' as const, conservatoriumId: 'cons-66', conservatoriumName: 'קריית אונו', avatarUrl: '', bio: 'חצוצרה', approved: true, availableForNewStudents: true, specialties: ['PERFORMANCE'], teachingLanguages: ['HE'], maxStudents: 20, employmentType: 'EMPLOYEE' as const, ratePerDuration: { '30': 80, '45': 100, '60': 120 }, availability: [{ dayOfWeek: 'MON' as const, startTime: '15:00', endTime: '21:00' }, { dayOfWeek: 'WED' as const, startTime: '15:00', endTime: '21:00' }], instruments: [{ instrument: 'חצוצרה', teacherName: 'דן ורון', yearsOfStudy: 15 }], notifications: [], achievements: [], createdAt: '2024-03-03T12:00:00.000Z' },
    { id: 'dir-teacher-057', name: 'צביקי מורן', email: 'teacher-dir-057@harmonia.local', role: 'teacher' as const, conservatoriumId: 'cons-66', conservatoriumName: 'קריית אונו', avatarUrl: '', bio: 'קרן יער', approved: true, availableForNewStudents: true, specialties: ['PERFORMANCE'], teachingLanguages: ['HE'], maxStudents: 20, employmentType: 'EMPLOYEE' as const, ratePerDuration: { '30': 80, '45': 100, '60': 120 }, availability: [{ dayOfWeek: 'SUN' as const, startTime: '09:00', endTime: '15:00' }, { dayOfWeek: 'TUE' as const, startTime: '09:00', endTime: '15:00' }, { dayOfWeek: 'THU' as const, startTime: '09:00', endTime: '15:00' }], instruments: [{ instrument: 'קרן יער', teacherName: 'צביקי מורן', yearsOfStudy: 14 }], notifications: [], achievements: [], createdAt: '2024-03-03T12:00:00.000Z' },
    { id: 'dir-teacher-058', name: 'אסנת ברנר-סיון', email: 'teacher-dir-058@harmonia.local', role: 'teacher' as const, conservatoriumId: 'cons-66', conservatoriumName: 'קריית אונו', avatarUrl: '', bio: 'קרן יער', approved: true, availableForNewStudents: true, specialties: ['PERFORMANCE'], teachingLanguages: ['HE'], maxStudents: 20, employmentType: 'EMPLOYEE' as const, ratePerDuration: { '30': 80, '45': 100, '60': 120 }, availability: [{ dayOfWeek: 'MON' as const, startTime: '10:00', endTime: '17:00' }, { dayOfWeek: 'WED' as const, startTime: '10:00', endTime: '17:00' }, { dayOfWeek: 'FRI' as const, startTime: '09:00', endTime: '13:00' }], instruments: [{ instrument: 'קרן יער', teacherName: 'אסנת ברנר-סיון', yearsOfStudy: 14 }], notifications: [], achievements: [], createdAt: '2024-03-03T12:00:00.000Z' },
    { id: 'dir-teacher-059', name: 'מריצ\'ל לורנס', email: 'teacher-dir-059@harmonia.local', role: 'teacher' as const, conservatoriumId: 'cons-66', conservatoriumName: 'קריית אונו', avatarUrl: '', bio: 'צ\'לו', approved: true, availableForNewStudents: true, specialties: ['PERFORMANCE'], teachingLanguages: ['HE'], maxStudents: 20, employmentType: 'EMPLOYEE' as const, ratePerDuration: { '30': 80, '45': 100, '60': 120 }, availability: [{ dayOfWeek: 'SUN' as const, startTime: '16:00', endTime: '21:00' }, { dayOfWeek: 'WED' as const, startTime: '16:00', endTime: '21:00' }], instruments: [{ instrument: 'צ\'לו', teacherName: 'מריצ\'ל לורנס', yearsOfStudy: 16 }], notifications: [], achievements: [], createdAt: '2024-03-03T12:00:00.000Z' },
    { id: 'dir-teacher-060', name: 'מילה ספוז\'ניקוב סמרה', email: 'teacher-dir-060@harmonia.local', role: 'teacher' as const, conservatoriumId: 'cons-66', conservatoriumName: 'קריית אונו', avatarUrl: '', bio: 'מלווה בפסנתר', approved: true, availableForNewStudents: true, specialties: ['PERFORMANCE'], teachingLanguages: ['HE'], maxStudents: 20, employmentType: 'EMPLOYEE' as const, ratePerDuration: { '30': 80, '45': 100, '60': 120 }, availability: [{ dayOfWeek: 'SUN' as const, startTime: '14:00', endTime: '20:00' }, { dayOfWeek: 'TUE' as const, startTime: '14:00', endTime: '20:00' }, { dayOfWeek: 'THU' as const, startTime: '14:00', endTime: '20:00' }], instruments: [{ instrument: 'פסנתר', teacherName: 'מילה ספוז\'ניקוב סמרה', yearsOfStudy: 15 }], notifications: [], achievements: [], createdAt: '2024-03-03T12:00:00.000Z' },
    { id: 'dir-teacher-061', name: 'יוליה דולוב', email: 'teacher-dir-061@harmonia.local', role: 'teacher' as const, conservatoriumId: 'cons-66', conservatoriumName: 'קריית אונו', avatarUrl: '', bio: 'ליווי פסנתר', approved: true, availableForNewStudents: true, specialties: ['PERFORMANCE'], teachingLanguages: ['HE'], maxStudents: 20, employmentType: 'EMPLOYEE' as const, ratePerDuration: { '30': 80, '45': 100, '60': 120 }, availability: [{ dayOfWeek: 'MON' as const, startTime: '15:00', endTime: '21:00' }, { dayOfWeek: 'WED' as const, startTime: '15:00', endTime: '21:00' }], instruments: [{ instrument: 'פסנתר', teacherName: 'יוליה דולוב', yearsOfStudy: 17 }], notifications: [], achievements: [], createdAt: '2024-03-03T12:00:00.000Z' },
    { id: 'dir-teacher-062', name: 'אולגה סנדרסקייה', email: 'teacher-dir-062@harmonia.local', role: 'teacher' as const, conservatoriumId: 'cons-66', conservatoriumName: 'קריית אונו', avatarUrl: '', bio: 'פיתוח קול', approved: true, availableForNewStudents: true, specialties: ['PERFORMANCE'], teachingLanguages: ['HE'], maxStudents: 20, employmentType: 'EMPLOYEE' as const, ratePerDuration: { '30': 80, '45': 100, '60': 120 }, availability: [{ dayOfWeek: 'SUN' as const, startTime: '09:00', endTime: '15:00' }, { dayOfWeek: 'TUE' as const, startTime: '09:00', endTime: '15:00' }, { dayOfWeek: 'THU' as const, startTime: '09:00', endTime: '15:00' }], instruments: [{ instrument: 'שירה', teacherName: 'אולגה סנדרסקייה', yearsOfStudy: 14 }], notifications: [], achievements: [], createdAt: '2024-03-03T12:00:00.000Z' },
    { id: 'dir-teacher-063', name: 'רז ארנון', email: 'teacher-dir-063@harmonia.local', role: 'teacher' as const, conservatoriumId: 'cons-66', conservatoriumName: 'קריית אונו', avatarUrl: '', bio: 'כלי הקשה ותופים', approved: true, availableForNewStudents: true, specialties: ['PERFORMANCE'], teachingLanguages: ['HE'], maxStudents: 20, employmentType: 'EMPLOYEE' as const, ratePerDuration: { '30': 80, '45': 100, '60': 120 }, availability: [{ dayOfWeek: 'MON' as const, startTime: '10:00', endTime: '17:00' }, { dayOfWeek: 'WED' as const, startTime: '10:00', endTime: '17:00' }, { dayOfWeek: 'FRI' as const, startTime: '09:00', endTime: '13:00' }], instruments: [{ instrument: 'תופים', teacherName: 'רז ארנון', yearsOfStudy: 13 }], notifications: [], achievements: [], createdAt: '2024-03-03T12:00:00.000Z' },
    { id: 'dir-teacher-064', name: 'אילנה וינוקור', email: 'teacher-dir-064@harmonia.local', role: 'teacher' as const, conservatoriumId: 'cons-66', conservatoriumName: 'קריית אונו', avatarUrl: '', bio: 'אורגנית', approved: true, availableForNewStudents: true, specialties: ['PERFORMANCE'], teachingLanguages: ['HE'], maxStudents: 20, employmentType: 'EMPLOYEE' as const, ratePerDuration: { '30': 80, '45': 100, '60': 120 }, availability: [{ dayOfWeek: 'SUN' as const, startTime: '16:00', endTime: '21:00' }, { dayOfWeek: 'WED' as const, startTime: '16:00', endTime: '21:00' }], instruments: [{ instrument: 'פסנתר', teacherName: 'אילנה וינוקור', yearsOfStudy: 16 }], notifications: [], achievements: [], createdAt: '2024-03-03T12:00:00.000Z' },
    { id: 'dir-teacher-065', name: 'דניאלה ברקוביץ\'', email: 'teacher-dir-065@harmonia.local', role: 'teacher' as const, conservatoriumId: 'cons-66', conservatoriumName: 'קריית אונו', avatarUrl: '', bio: 'חליל צד', approved: true, availableForNewStudents: true, specialties: ['PERFORMANCE'], teachingLanguages: ['HE'], maxStudents: 20, employmentType: 'EMPLOYEE' as const, ratePerDuration: { '30': 80, '45': 100, '60': 120 }, availability: [{ dayOfWeek: 'SUN' as const, startTime: '14:00', endTime: '20:00' }, { dayOfWeek: 'TUE' as const, startTime: '14:00', endTime: '20:00' }, { dayOfWeek: 'THU' as const, startTime: '14:00', endTime: '20:00' }], instruments: [{ instrument: 'חליל צד', teacherName: 'דניאלה ברקוביץ\'', yearsOfStudy: 15 }], notifications: [], achievements: [], createdAt: '2024-03-03T12:00:00.000Z' },
    { id: 'dir-teacher-066', name: 'מרי אידה ברשינסקי', email: 'teacher-dir-066@harmonia.local', role: 'teacher' as const, conservatoriumId: 'cons-66', conservatoriumName: 'קריית אונו', avatarUrl: '', bio: 'פסנתר', approved: true, availableForNewStudents: true, specialties: ['PERFORMANCE'], teachingLanguages: ['HE'], maxStudents: 20, employmentType: 'EMPLOYEE' as const, ratePerDuration: { '30': 80, '45': 100, '60': 120 }, availability: [{ dayOfWeek: 'MON' as const, startTime: '15:00', endTime: '21:00' }, { dayOfWeek: 'WED' as const, startTime: '15:00', endTime: '21:00' }], instruments: [{ instrument: 'פסנתר', teacherName: 'מרי אידה ברשינסקי', yearsOfStudy: 17 }], notifications: [], achievements: [], createdAt: '2024-03-03T12:00:00.000Z' },
    { id: 'dir-teacher-067', name: 'עדן גיאת', email: 'teacher-dir-067@harmonia.local', role: 'teacher' as const, conservatoriumId: 'cons-66', conservatoriumName: 'קריית אונו', avatarUrl: '', bio: 'פסנתר', approved: true, availableForNewStudents: true, specialties: ['PERFORMANCE'], teachingLanguages: ['HE'], maxStudents: 20, employmentType: 'EMPLOYEE' as const, ratePerDuration: { '30': 80, '45': 100, '60': 120 }, availability: [{ dayOfWeek: 'SUN' as const, startTime: '09:00', endTime: '15:00' }, { dayOfWeek: 'TUE' as const, startTime: '09:00', endTime: '15:00' }, { dayOfWeek: 'THU' as const, startTime: '09:00', endTime: '15:00' }], instruments: [{ instrument: 'פסנתר', teacherName: 'עדן גיאת', yearsOfStudy: 12 }], notifications: [], achievements: [], createdAt: '2024-03-03T12:00:00.000Z' },
    { id: 'dir-teacher-068', name: 'רחל אילת', email: 'teacher-dir-068@harmonia.local', role: 'teacher' as const, conservatoriumId: 'cons-66', conservatoriumName: 'קריית אונו', avatarUrl: '', bio: 'חליל צד', approved: true, availableForNewStudents: true, specialties: ['PERFORMANCE'], teachingLanguages: ['HE'], maxStudents: 20, employmentType: 'EMPLOYEE' as const, ratePerDuration: { '30': 80, '45': 100, '60': 120 }, availability: [{ dayOfWeek: 'MON' as const, startTime: '10:00', endTime: '17:00' }, { dayOfWeek: 'WED' as const, startTime: '10:00', endTime: '17:00' }, { dayOfWeek: 'FRI' as const, startTime: '09:00', endTime: '13:00' }], instruments: [{ instrument: 'חליל צד', teacherName: 'רחל אילת', yearsOfStudy: 15 }], notifications: [], achievements: [], createdAt: '2024-03-03T12:00:00.000Z' },
    // ── ICM (Israel Conservatory of Music, Tel Aviv) — cons-84 ────────
    { id: 'dir-teacher-069', name: 'דניאל תנחלסון', email: 'teacher-dir-069@harmonia.local', role: 'teacher' as const, conservatoriumId: 'cons-84', conservatoriumName: 'תל אביב', avatarUrl: '', bio: 'ויולה ורכז מחלקת כלי קשת', approved: true, availableForNewStudents: true, specialties: ['PERFORMANCE'], teachingLanguages: ['HE', 'EN'], maxStudents: 20, employmentType: 'EMPLOYEE' as const, ratePerDuration: { '30': 100, '45': 130, '60': 160 }, availability: [{ dayOfWeek: 'SUN' as const, startTime: '14:00', endTime: '20:00' }, { dayOfWeek: 'TUE' as const, startTime: '14:00', endTime: '20:00' }, { dayOfWeek: 'THU' as const, startTime: '14:00', endTime: '19:00' }], instruments: [{ instrument: 'ויולה', teacherName: 'דניאל תנחלסון', yearsOfStudy: 18 }], notifications: [], achievements: [], createdAt: '2024-03-03T12:00:00.000Z' },
    { id: 'dir-teacher-070', name: 'מיכל בית הלחמי', email: 'teacher-dir-070@harmonia.local', role: 'teacher' as const, conservatoriumId: 'cons-84', conservatoriumName: 'תל אביב', avatarUrl: '', bio: 'קלרינט ורכזת מחלקת כלי נשיפה', approved: true, availableForNewStudents: true, specialties: ['PERFORMANCE', 'ENSEMBLE'], teachingLanguages: ['HE'], maxStudents: 20, employmentType: 'EMPLOYEE' as const, ratePerDuration: { '30': 100, '45': 130, '60': 160 }, availability: [{ dayOfWeek: 'MON' as const, startTime: '15:00', endTime: '21:00' }, { dayOfWeek: 'WED' as const, startTime: '15:00', endTime: '21:00' }], instruments: [{ instrument: 'קלרינט', teacherName: 'מיכל בית הלחמי', yearsOfStudy: 20 }], notifications: [], achievements: [], createdAt: '2024-03-03T12:00:00.000Z' },
    { id: 'dir-teacher-071', name: 'קורל קנליס', email: 'teacher-dir-071@harmonia.local', role: 'teacher' as const, conservatoriumId: 'cons-84', conservatoriumName: 'תל אביב', avatarUrl: '', bio: 'כינור וויולה', approved: true, availableForNewStudents: true, specialties: ['PERFORMANCE'], teachingLanguages: ['HE', 'EN'], maxStudents: 15, employmentType: 'EMPLOYEE' as const, ratePerDuration: { '30': 100, '45': 130, '60': 160 }, availability: [{ dayOfWeek: 'SUN' as const, startTime: '10:00', endTime: '16:00' }, { dayOfWeek: 'TUE' as const, startTime: '10:00', endTime: '16:00' }, { dayOfWeek: 'THU' as const, startTime: '10:00', endTime: '16:00' }], instruments: [{ instrument: 'כינור', teacherName: 'קורל קנליס', yearsOfStudy: 16 }, { instrument: 'ויולה', teacherName: 'קורל קנליס', yearsOfStudy: 10 }], notifications: [], achievements: [], createdAt: '2024-03-03T12:00:00.000Z' },
];

// ── Additional mock students (cons-15 and cons-66) ─────────────────
const additionalStudents: User[] = [
    { id: 'student-user-3', name: 'נועם בן-דוד', email: 'student3@example.com', role: 'student', conservatoriumId: 'cons-15', conservatoriumName: 'הוד השרון', avatarUrl: 'https://i.pravatar.cc/150?u=student3', idNumber: '311111111', schoolName: 'תיכון הדרים, הוד השרון', schoolSymbol: '44570001', birthDate: '2007-09-01', city: 'הוד השרון', gender: 'זכר', phone: '050-3333333', grade: 'יא', conservatoriumStudyYears: 5, instruments: [{ instrument: 'כינור', teacherName: 'דפנה רביד', yearsOfStudy: 5 }], approved: true, notifications: [], weeklyPracticeGoal: 90, achievements: [], createdAt: '2024-09-01T12:00:00.000Z' },
    { id: 'student-user-4', name: 'שני אלמוג', email: 'student4@example.com', role: 'student', conservatoriumId: 'cons-15', conservatoriumName: 'הוד השרון', avatarUrl: 'https://i.pravatar.cc/150?u=student4', idNumber: '411111111', schoolName: 'חט"ב שמגר, הוד השרון', schoolSymbol: '44570002', birthDate: '2009-04-12', city: 'הוד השרון', gender: 'נקבה', phone: '052-4444444', grade: 'ז', conservatoriumStudyYears: 2, instruments: [{ instrument: 'פסנתר', teacherName: 'טליה גבעון', yearsOfStudy: 2 }], approved: true, notifications: [], weeklyPracticeGoal: 60, achievements: [], createdAt: '2024-09-01T12:00:00.000Z' },
    { id: 'student-user-5', name: 'אריק שמש', email: 'student5@example.com', role: 'student', conservatoriumId: 'cons-15', conservatoriumName: 'הוד השרון', avatarUrl: 'https://i.pravatar.cc/150?u=student5', idNumber: '511111111', schoolName: 'תיכון הדרים, הוד השרון', schoolSymbol: '44570001', birthDate: '2006-11-20', city: 'כפר סבא', gender: 'זכר', phone: '054-5555555', grade: 'יב', conservatoriumStudyYears: 9, instruments: [{ instrument: 'גיטרה', teacherName: 'רועי צאיג', yearsOfStudy: 7 }, { instrument: 'פסנתר', teacherName: 'גיל פקר', yearsOfStudy: 2 }], approved: true, notifications: [], weeklyPracticeGoal: 120, achievements: [], createdAt: '2024-09-01T12:00:00.000Z' },
    { id: 'student-user-6', name: 'יובל לוין', email: 'student6@example.com', role: 'student', conservatoriumId: 'cons-66', conservatoriumName: 'קריית אונו', avatarUrl: 'https://i.pravatar.cc/150?u=student6', idNumber: '611111111', schoolName: 'תיכון אורות, קריית אונו', schoolSymbol: '55660001', birthDate: '2008-03-05', city: 'קריית אונו', gender: 'זכר', phone: '050-6666666', grade: 'ט', conservatoriumStudyYears: 4, instruments: [{ instrument: 'קלרינט', teacherName: 'שריג הזנפלד', yearsOfStudy: 4 }], approved: true, notifications: [], weeklyPracticeGoal: 75, achievements: [], createdAt: '2024-09-01T12:00:00.000Z' },
    { id: 'student-user-7', name: 'מיכל רוזן', email: 'student7@example.com', role: 'student', conservatoriumId: 'cons-66', conservatoriumName: 'קריית אונו', avatarUrl: 'https://i.pravatar.cc/150?u=student7', idNumber: '711111111', schoolName: 'תיכון אורות, קריית אונו', schoolSymbol: '55660001', birthDate: '2007-07-18', city: 'קריית אונו', gender: 'נקבה', phone: '052-7777777', grade: 'י', conservatoriumStudyYears: 6, instruments: [{ instrument: 'כינור', teacherName: 'דפנה רביד', yearsOfStudy: 6 }, { instrument: 'ויולה', teacherName: 'לורה בורלא ששון', yearsOfStudy: 2 }], approved: true, notifications: [], weeklyPracticeGoal: 90, achievements: [], createdAt: '2024-09-01T12:00:00.000Z' },
    { id: 'student-user-8', name: 'דניאל ברגר', email: 'student8@example.com', role: 'student', conservatoriumId: 'cons-66', conservatoriumName: 'קריית אונו', avatarUrl: 'https://i.pravatar.cc/150?u=student8', idNumber: '811111111', schoolName: 'חט"ב ביאליק, קריית אונו', schoolSymbol: '55660002', birthDate: '2010-01-30', city: 'קריית אונו', gender: 'זכר', phone: '054-8888888', grade: 'ו', conservatoriumStudyYears: 1, instruments: [{ instrument: 'גיטרה', teacherName: 'רועי צאיג', yearsOfStudy: 1 }], approved: true, notifications: [], weeklyPracticeGoal: 45, achievements: [], createdAt: '2024-09-01T12:00:00.000Z' },
];

// ── Additional mock parents ────────────────────────────────────────
const additionalParents: User[] = [
    { id: 'parent-user-2', name: 'רונית בן-דוד', email: 'parent2@example.com', role: 'parent', conservatoriumId: 'cons-15', conservatoriumName: 'הוד השרון', avatarUrl: 'https://i.pravatar.cc/150?u=parent2', idNumber: '922222222', phone: '050-9999990', approved: true, notifications: [], achievements: [], createdAt: '2024-09-01T12:00:00.000Z' },
    { id: 'parent-user-3', name: 'גלעד שמש', email: 'parent3@example.com', role: 'parent', conservatoriumId: 'cons-15', conservatoriumName: 'הוד השרון', avatarUrl: 'https://i.pravatar.cc/150?u=parent3', idNumber: '922222923', phone: '050-9999991', approved: true, notifications: [], achievements: [], createdAt: '2024-09-01T12:00:00.000Z' },
    { id: 'parent-user-4', name: 'אורי לוין', email: 'parent4@example.com', role: 'parent', conservatoriumId: 'cons-66', conservatoriumName: 'קריית אונו', avatarUrl: 'https://i.pravatar.cc/150?u=parent4', idNumber: '922222924', phone: '054-9999992', approved: true, notifications: [], achievements: [], createdAt: '2024-09-01T12:00:00.000Z' },
    { id: 'parent-user-5', name: 'לימור ברגר', email: 'parent5@example.com', role: 'parent', conservatoriumId: 'cons-66', conservatoriumName: 'קריית אונו', avatarUrl: 'https://i.pravatar.cc/150?u=parent5', idNumber: '922222925', phone: '054-9999993', approved: true, notifications: [], achievements: [], createdAt: '2024-09-01T12:00:00.000Z' },
];

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

// Synthetic dev-mode user — matches the claims returned by auth-utils.ts DEV FALLBACK
export const devUser: User = {
    id: 'dev-user', name: 'Dev Admin', email: 'dev@harmonia.local', role: 'site_admin', conservatoriumId: 'dev-conservatorium', conservatoriumName: 'Dev Conservatorium', avatarUrl: 'https://i.pravatar.cc/150?u=dev', idNumber: '000000000', phone: '000-0000000', approved: true, notifications: [], achievements: [], createdAt: '2024-03-03T12:00:00.000Z',
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
    devUser,
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
    ...conservatoriumAdminUsers,
    ...directoryTeacherUsers,
    ...additionalStudents,
    ...additionalParents,
].filter((v, i, a) => a.findIndex(t => (t.id === v.id)) === i); // Remove duplicates

export const mockFormSubmissions: FormSubmission[] = [
    { id: 'form-101', formType: 'רסיטל בגרות', academicYear: 'תשפ"ד', grade: 'יב', studentId: studentUser.id, studentName: studentUser.name, status: 'PENDING_ADMIN', submissionDate: '2024-05-20', totalDuration: '12:30', repertoire: [{ id: 'bach-wtc1-prelude-c', composer: 'יוהאן סבסטיאן באך', title: 'פרלוד ופוגה בדו מז\'ור, רי"ב 846 (מתוך הפסנתר המושווה, ספר א\')', duration: '04:00', genre: 'בארוק' }, { id: 'chopin-nocturne-op9-no2', composer: 'פרדריק שופן', title: 'נוקטורן במי במול מז\'ור, אופ. 9 מס\' 2', duration: '05:00', genre: 'רומנטי' }, { id: 'beethoven-fur-elise', composer: 'לודוויג ואן בטהובן', title: 'לאליזה (Für Elise)', duration: '03:00', genre: 'קלאסי' },], conservatoriumName: studentUser.conservatoriumName, conservatoriumManagerName: 'יעל פלסטניאר (מנהלת)', applicantDetails: { birthDate: studentUser.birthDate, city: studentUser.city, gender: studentUser.gender, phone: studentUser.phone }, schoolDetails: { schoolName: studentUser.schoolName, hasMusicMajor: true, isMajorParticipant: true, plansTheoryExam: true }, teacherDetails: { name: studentUser.instruments?.[0]?.teacherName, yearsWithTeacher: studentUser.instruments?.[0]?.yearsOfStudy, }, instrumentDetails: { instrument: studentUser.instruments?.[0].instrument, yearsOfStudy: studentUser.instruments?.[0].yearsOfStudy } },
    { id: 'form-102', formType: 'כנס / אירוע', studentId: studentUser2.id, studentName: studentUser2.name, status: 'FINAL_APPROVED', submissionDate: '2024-05-18', totalDuration: '08:15', repertoire: [{ id: 'mozart-sonata-16', composer: 'וולפגנג אמדאוס מוצרט', title: 'סונאטה לפסנתר מס\' 16 בדו מז\'ור, ק. 545 "סונאטה פשוטה"', duration: '08:15', genre: 'קלאסי' },], conservatoriumName: studentUser2.conservatoriumName, conservatoriumManagerName: 'יעל פלסטניאר (מנהלת)', signatureUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAACWCAYAAABkW7XSAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAARnSURBVOgN7dRBDQAgEMCw9/6/9EIBCa9A1c2AAdgbCxRYgQUGLMCgAgUWGLCAgQoUWGDCAgYqUGCBBQYswKACBRYYsICBCgRXYAEGFigwAYMKFFhgwAICJlBgAQGLAahAgQUWGLCAgQoUWGDCAgYq0HwBDK+xMv2+4DEAAAAASUVORK5CYII=', signedAt: '2024-05-19', calculatedPrice: 10, paymentStatus: 'paid', },
    { id: 'form-103', formType: 'מבחן שלב', studentId: otherStudent.id, studentName: otherStudent.name, status: 'DRAFT', submissionDate: '2024-05-21', totalDuration: '04:00', repertoire: [{ id: 'comp-clementi', composer: 'קלמנטי', title: 'סונטינה אופ. 36 מס\' 1', duration: '04:00', genre: 'קלאסי' },], conservatoriumName: otherStudent.conservatoriumName, },
    { id: 'form-104', formType: 'רסיטל בגרות', academicYear: 'תשפ"ג', grade: 'יא', studentId: 'user-7', studentName: 'רבקה גולן', status: 'REJECTED', teacherComment: 'נא לבחור יצירה נוספת מהתקופה הרומנטית.', submissionDate: '2024-05-15', totalDuration: '09:00', repertoire: [{ id: 'comp-haydn', composer: 'היידן', title: 'סונטה ברה מז\'ור', duration: '09:00', genre: 'קלאסי' },], conservatoriumName: 'מרכז למוסיקה ובימת אמנויות רעננה', },
    { id: 'form-105', formType: 'רסיטל בגרות', academicYear: 'תשפ"ד', grade: 'יא', studentId: studentUser2.id, studentName: studentUser2.name, status: 'REVISION_REQUIRED', ministryComment: 'הרפרטואר אינו מאוזן דיו. יש להחליף את אחת היצירות הקלאסיות ביצירה מהמאה ה-20.', submissionDate: '2024-05-23', totalDuration: '21:00', repertoire: [{ id: 'bach-wtc1-prelude-c', composer: 'יוהאן סבסטיאן באך', title: 'פרלוד ופוגה בדו מז\'ור, רי"ב 846 (מתוך הפסנתר המושווה, ספר א\')', duration: '04:00', genre: 'בארוק' }, { id: 'mozart-eine-kleine', composer: 'וולפגנג אמדאוס מוצרט', title: 'מוזיקת לילה זעירה (Eine kleine Nachtmusik), סרנדה מס\' 13', duration: '05:45', genre: 'קלאסי' }, { id: 'chopin-nocturne-op9-no2', composer: 'פרדריק שופן', title: 'נוקטורן במי במול מז\'ור, אופ. 9 מס\' 2', duration: '04:30', genre: 'רומנטי' }, { id: 'beethoven-moonlight-sonata', composer: 'לודוויג ואן בטהובן', title: 'סונאטה לפסנתר מס\' 14 בדו דיאז מינור, אופ. 27 מס\' 2 "אור ירח"', duration: '15:00', genre: 'קלאסי' }], conservatoriumName: studentUser2.conservatoriumName, applicantDetails: { birthDate: studentUser2.birthDate, city: studentUser2.city, gender: studentUser2.gender, phone: studentUser2.phone }, schoolDetails: { schoolName: studentUser2.schoolName, hasMusicMajor: false, isMajorParticipant: false, plansTheoryExam: true }, teacherDetails: { name: teacherUser.name, }, instrumentDetails: { instrument: studentUser2.instruments?.[0].instrument, yearsOfStudy: studentUser2.instruments?.[0].yearsOfStudy } },
];
export const mockConservatoriumInstruments: ConservatoriumInstrument[] = [
  { id: 'piano', conservatoriumId: 'cons-15', names: { he: 'פסנתר', en: 'Piano', ru: 'Фортепиано', ar: 'بيانو' }, isActive: true, teacherCount: 1, availableForRegistration: true, availableForRental: true },
  { id: 'violin', conservatoriumId: 'cons-15', names: { he: 'כינור', en: 'Violin', ru: 'Скрипка', ar: 'كمان' }, isActive: true, teacherCount: 1, availableForRegistration: true, availableForRental: true },
  { id: 'flute', conservatoriumId: 'cons-15', names: { he: 'חליל', en: 'Flute', ru: 'Флейта', ar: 'ناي' }, isActive: true, teacherCount: 1, availableForRegistration: true, availableForRental: true },
  { id: 'guitar', conservatoriumId: 'cons-15', names: { he: 'גיטרה', en: 'Guitar', ru: 'Гитара', ar: 'جيتار' }, isActive: true, teacherCount: 1, availableForRegistration: true, availableForRental: true },
  { id: 'cello', conservatoriumId: 'cons-15', names: { he: "צ'לו", en: 'Cello', ru: 'Виолончель', ar: 'تشيلو' }, isActive: true, teacherCount: 0, availableForRegistration: true, availableForRental: true },
  { id: 'drums', conservatoriumId: 'cons-15', names: { he: 'תופים', en: 'Drums', ru: 'Ударные', ar: 'طبول' }, isActive: true, teacherCount: 0, availableForRegistration: true, availableForRental: true },
  { id: 'saxophone', conservatoriumId: 'cons-15', names: { he: 'סקסופון', en: 'Saxophone', ru: 'Саксофон', ar: 'ساكسوفون' }, isActive: true, teacherCount: 1, availableForRegistration: true, availableForRental: true },
  { id: 'clarinet', conservatoriumId: 'cons-15', names: { he: 'קלרינט', en: 'Clarinet', ru: 'Кларнет', ar: 'كلارينيت' }, isActive: true, teacherCount: 1, availableForRegistration: true, availableForRental: true },
];

export const mockLessonPackages: LessonPackage[] = [
  {
    id: 'pkg-monthly-45',
    conservatoriumId: 'cons-15',
    names: { he: 'חבילה חודשית', en: 'Monthly Plan', ru: 'Ежемесячный план', ar: 'خطة شهرية' },
    type: 'monthly',
    lessonCount: 4,
    durationMinutes: 45,
    priceILS: 500,
    isActive: true,
  },
  {
    id: 'pkg-semester-45',
    conservatoriumId: 'cons-15',
    names: { he: 'חבילת סמסטר', en: 'Semester Pack', ru: 'Семестровый пакет', ar: 'باقة فصلية' },
    type: 'semester',
    lessonCount: 16,
    durationMinutes: 45,
    priceILS: 1800,
    isActive: true,
  },
  {
    id: 'pkg-single-45',
    conservatoriumId: 'cons-15',
    names: { he: 'שיעור בודד', en: 'Single Lesson', ru: 'Разовый урок', ar: 'درس واحد' },
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
    // ── Additional lessons for cons-15 directory teachers ──
    { id: 'lesson-4', conservatoriumId: 'cons-15', teacherId: 'dir-teacher-006', studentId: 'student-user-4', instrument: 'פסנתר', startTime: '2026-03-08T15:00:00.000Z', durationMinutes: 45, type: 'RECURRING', bookingSource: 'PARENT', roomId: 'room-1', isVirtual: false, status: 'SCHEDULED', createdAt: '2026-03-01T12:00:00.000Z', updatedAt: '2026-03-01T12:00:00.000Z', isCreditConsumed: false },
    { id: 'lesson-5', conservatoriumId: 'cons-15', teacherId: 'dir-teacher-006', studentId: 'student-user-4', instrument: 'פסנתר', startTime: '2026-03-15T15:00:00.000Z', durationMinutes: 45, type: 'RECURRING', bookingSource: 'PARENT', roomId: 'room-1', isVirtual: false, status: 'SCHEDULED', createdAt: '2026-03-01T12:00:00.000Z', updatedAt: '2026-03-01T12:00:00.000Z', isCreditConsumed: false },
    { id: 'lesson-6', conservatoriumId: 'cons-15', teacherId: 'dir-teacher-018', studentId: 'student-user-3', instrument: 'פסנתר', startTime: '2026-03-09T17:00:00.000Z', durationMinutes: 45, type: 'RECURRING', bookingSource: 'ADMIN', roomId: 'room-2', isVirtual: false, status: 'SCHEDULED', createdAt: '2026-03-01T12:00:00.000Z', updatedAt: '2026-03-01T12:00:00.000Z', isCreditConsumed: false },
    { id: 'lesson-7', conservatoriumId: 'cons-15', teacherId: 'dir-teacher-017', studentId: 'student-user-5', instrument: 'פסנתר', startTime: '2026-03-10T18:00:00.000Z', durationMinutes: 60, type: 'RECURRING', bookingSource: 'STUDENT_SELF', roomId: 'room-1', isVirtual: false, status: 'SCHEDULED', createdAt: '2026-03-01T12:00:00.000Z', updatedAt: '2026-03-01T12:00:00.000Z', isCreditConsumed: false },
    { id: 'lesson-8', conservatoriumId: 'cons-66', teacherId: 'dir-teacher-021', studentId: 'student-user-6', instrument: 'קלרינט', startTime: '2026-03-08T16:00:00.000Z', durationMinutes: 45, type: 'RECURRING', bookingSource: 'STUDENT_SELF', isVirtual: false, status: 'SCHEDULED', createdAt: '2026-03-01T12:00:00.000Z', updatedAt: '2026-03-01T12:00:00.000Z', isCreditConsumed: false },
    { id: 'lesson-9', conservatoriumId: 'cons-66', teacherId: 'dir-teacher-024', studentId: 'student-user-7', instrument: 'כינור', startTime: '2026-03-09T14:00:00.000Z', durationMinutes: 45, type: 'RECURRING', bookingSource: 'PARENT', isVirtual: false, status: 'SCHEDULED', createdAt: '2026-03-01T12:00:00.000Z', updatedAt: '2026-03-01T12:00:00.000Z', isCreditConsumed: false },
    { id: 'lesson-10', conservatoriumId: 'cons-66', teacherId: 'dir-teacher-023', studentId: 'student-user-8', instrument: 'גיטרה', startTime: '2026-03-10T17:00:00.000Z', durationMinutes: 45, type: 'RECURRING', bookingSource: 'STUDENT_SELF', isVirtual: false, status: 'SCHEDULED', createdAt: '2026-03-01T12:00:00.000Z', updatedAt: '2026-03-01T12:00:00.000Z', isCreditConsumed: false },
    // ── Past completed lessons for history ──
    { id: 'lesson-11', conservatoriumId: 'cons-15', teacherId: 'teacher-user-1', studentId: 'student-user-1', instrument: 'פסנתר', startTime: '2026-02-25T16:00:00.000Z', durationMinutes: 45, type: 'RECURRING', bookingSource: 'STUDENT_SELF', roomId: 'room-1', isVirtual: false, status: 'COMPLETED', createdAt: '2026-02-20T12:00:00.000Z', updatedAt: '2026-02-25T16:45:00.000Z', isCreditConsumed: true },
    { id: 'lesson-12', conservatoriumId: 'cons-15', teacherId: 'teacher-user-1', studentId: 'student-user-2', instrument: 'כינור', startTime: '2026-02-26T17:00:00.000Z', durationMinutes: 60, type: 'RECURRING', bookingSource: 'PARENT', roomId: 'room-2', isVirtual: false, status: 'COMPLETED', createdAt: '2026-02-20T12:00:00.000Z', updatedAt: '2026-02-26T18:00:00.000Z', isCreditConsumed: true },
    { id: 'lesson-13', conservatoriumId: 'cons-15', teacherId: 'dir-teacher-006', studentId: 'student-user-4', instrument: 'פסנתר', startTime: '2026-03-01T15:00:00.000Z', durationMinutes: 45, type: 'RECURRING', bookingSource: 'PARENT', roomId: 'room-1', isVirtual: false, status: 'COMPLETED', createdAt: '2026-02-20T12:00:00.000Z', updatedAt: '2026-03-01T15:45:00.000Z', isCreditConsumed: true },
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
        names: { he: 'קרן סיוע כלכלי', en: 'Financial Aid for Disadvantaged Families' },
        descriptions: { he: 'חינוך מוסיקלי שווה לכל ילד, ללא קשר למצבו הכלכלי.', en: 'Equal music education for every child regardless of financial background.' },
        isActive: true,
        targetAmountILS: 250000,
        raisedAmountILS: 125000,
    },
    {
        id: 'cause-excellence',
        conservatoriumId: 'cons-15',
        category: 'excellence',
        priority: 2,
        names: { he: 'מלגות מצוינות', en: 'Excellence Scholarships' },
        descriptions: { he: 'תמיכה בתלמידים מחוננים לפיתוח כישרונם.', en: 'Support gifted students in developing their talent.' },
        isActive: true,
        targetAmountILS: 120000,
        raisedAmountILS: 56000,
    },
    {
        id: 'cause-equipment',
        conservatoriumId: 'cons-15',
        category: 'equipment',
        priority: 3,
        names: { he: 'ציוד מוסיקלי לתלמידים', en: 'Musical Equipment for Students' },
        descriptions: { he: 'רכישת כלי נגינה להשאלה לתלמידים.', en: 'Purchase instruments for student loans.' },
        isActive: true,
        targetAmountILS: 90000,
        raisedAmountILS: 22500,
    },
    {
        id: 'cause-events',
        conservatoriumId: 'cons-15',
        category: 'events',
        priority: 4,
        names: { he: 'תחרויות ופסטיבלים', en: 'Competitions & Festivals' },
        descriptions: { he: 'מימון השתתפות תלמידים בתחרויות מוסיקה ארציות ובינלאומיות.', en: 'Fund student participation in national and international competitions.' },
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
      he: 'תרגלו כל יום כדי לפתח כישורים מוסיקליים.',
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
