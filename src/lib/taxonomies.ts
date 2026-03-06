import type { PerformanceGenre } from '@/lib/types';

export const priceMatrix: Record<string, Record<string, Record<number, number>>> = {
  A: {
    Small: { 10: 10, 15: 15, 20: 20, 25: 25, 30: 30 },
    Medium: { 10: 15, 15: 20, 20: 25, 25: 30, 30: 35 },
    Large: { 10: 20, 15: 25, 20: 30, 25: 35, 30: 40 },
  },
  B: {
    Small: { 10: 12, 15: 16, 20: 22, 25: 27, 30: 32 },
    Medium: { 10: 16, 15: 22, 20: 27, 25: 32, 30: 37 },
    Large: { 10: 22, 15: 27, 20: 30, 25: 35, 30: 42 },
  },
  C: {
    Small: { 10: 13, 15: 18, 20: 23, 25: 28, 30: 33 },
    Medium: { 10: 18, 15: 23, 20: 28, 25: 33, 30: 38 },
    Large: { 10: 23, 15: 28, 20: 33, 25: 38, 30: 43 },
  },
};

export const instruments = [
  'פסנתר',
  'כינור',
  "צ'לו",
  'גיטרה',
  'חליל צד',
  'קלרינט',
  'סקסופון',
  'תופים',
  'שירה',
];

export const genres = [
  'קלאסי',
  "ג'אז",
  'קל',
  'ישראלי',
  'פופ',
  'רוק',
  'עממי',
  'בארוק',
  'רומנטי',
  'אימפרסיוניסטי',
  'מודרני',
];

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

export const performanceGenres: { id: PerformanceGenre; label: string }[] = [
  { id: 'CLASSICAL', label: 'קלאסי' },
  { id: 'JAZZ', label: "ג'אז" },
  { id: 'KLEZMER', label: 'כליזמר' },
  { id: 'MIDDLE_EASTERN', label: 'מוזיקת עולם/מזרחית' },
  { id: 'POPULAR', label: 'פופ/רוק' },
  { id: 'LITURGICAL', label: 'ליטורגי' },
];

export const languages = [
  { id: 'HE', label: 'עברית' },
  { id: 'EN', label: 'אנגלית' },
  { id: 'AR', label: 'ערבית' },
  { id: 'RU', label: 'רוסית' },
];

export const schools = [
  { symbol: '44570001', name: 'תיכון הדרים, הוד השרון' },
  { symbol: '12345678', name: 'תיכון חדש, תל אביב' },
  { symbol: '87654321', name: 'תיכון הראשונים, הרצליה' },
  { symbol: '11223344', name: 'בית ספר לאמנויות, ירושלים' },
  { symbol: '22334455', name: 'תיכון אלון, רמת השרון' },
  { symbol: '99887766', name: 'תיכון קלעי, גבעתיים' },
];

export const examLevels = ['בגרות (יחידה 1)', 'בגרות (5 יחידות)', 'אקדמאי', 'אחר'];
export const examTypes = ['ביצוע (רסיטל)', 'תאוריה', 'משולב'];
