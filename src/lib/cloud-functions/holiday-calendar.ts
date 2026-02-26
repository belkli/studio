/**
 * @fileoverview Cloud Function spec for Israeli holiday calendar integration.
 * SDD-P1 (Administrator) requires national holiday calendar integration
 * to prevent scheduling lessons on holidays.
 * Uses the Hebcal API (https://www.hebcal.com/hebcal) for Jewish calendar dates.
 */

import type { ClosureDate, ClosureDateType } from '@/lib/types';

/**
 * getIsraeliHolidaysForYear — Callable Cloud Function
 * 
 * Fetches Israeli national holidays from the Hebcal API and
 * creates ClosureDate documents for each one.
 * 
 * Hebcal API query:
 * GET https://www.hebcal.com/hebcal?v=1&cfg=json&maj=on&min=off&mod=off
 *     &nx=off&year={year}&month=x&ss=off&mf=off&c=off
 *     &geo=pos&latitude=32.08&longitude=34.78&tzid=Asia/Jerusalem
 * 
 * Returns 20-25 holidays/year. We create a ClosureDate for each,
 * marked as isRecurring (shifts each year per Jewish calendar).
 */

// Israeli holidays that always close conservatoriums
const MANDATORY_CLOSURE_HOLIDAYS = [
    'Rosh Hashana',
    'Yom Kippur',
    'Sukkot',
    'Shmini Atzeret',
    'Simchat Torah',
    'Pesach',
    'Shavuot',
    'Yom HaAtzma\'ut',   // Independence Day
    'Yom HaZikaron',     // Memorial Day
];

// Holidays where closure is conservatorium-specific
const OPTIONAL_CLOSURE_HOLIDAYS = [
    'Tu BiShvat',
    'Purim',
    'Lag BaOmer',
    'Chanukah',
];

/**
 * Maps a Hebcal API holiday to a ClosureDate document.
 */
export function mapHebcalToClosureDate(
    hebcalEntry: { title: string; date: string; hebrew: string; category: string },
    conservatoriumId: string
): ClosureDate {
    const isMandatory = MANDATORY_CLOSURE_HOLIDAYS.some(h =>
        hebcalEntry.title.includes(h)
    );

    return {
        date: hebcalEntry.date,
        type: 'NATIONAL_HOLIDAY' as ClosureDateType,
        name: hebcalEntry.title,
        nameHe: hebcalEntry.hebrew,
        affectsAllTeachers: isMandatory,
        isRecurring: true,
        jewishCalendarRef: hebcalEntry.category,
    };
}

/**
 * generateYearlySlots — Callable Cloud Function (admin only)
 * 
 * SDD-P1: Generates SCHEDULED lesson slots for an entire academic year
 * based on teacher availability templates, accounting for holidays.
 * 
 * Steps:
 * 1. Fetch all teacher availability templates for the conservatorium
 * 2. Fetch all ClosureDate documents for the academic year
 * 3. For each teacher, for each day of the year:
 *    a. Skip if day falls on a closure date
 *    b. Skip if day is Shabbat (Saturday)
 *    c. Create a SCHEDULED slot for each availability block
 * 4. Batch write in chunks of 400 documents (Firestore limit: 500)
 * 
 * SDD-P9 architecture note:
 * For 10 teachers × 4 students × 40 weeks = 1,600 slots per year
 * — well within Firestore's capabilities.
 */
export interface GenerateYearlySlotsSpec {
    input: {
        conservatoriumId: string;
        academicYearStart: string; // 'YYYY-MM-DD' (typically September 1)
        academicYearEnd: string;   // 'YYYY-MM-DD' (typically June 30)
    };
    batchSize: 400;
}
