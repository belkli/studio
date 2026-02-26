/**
 * @fileoverview Cloud Function spec for Google Calendar two-way sync.
 * SDD-P2 (Teacher) requires synchronizing lesson slots with
 * the teacher's personal Google Calendar.
 */

import type { LessonSlot, GoogleCalendarIntegration } from '@/lib/types';

/**
 * syncTeacherCalendars — Scheduled Function (every 15 minutes)
 * 
 * Two-way sync between Harmonia lesson slots and Google Calendar.
 * 
 * Outbound (Harmonia → Google Calendar):
 * 1. Query all SCHEDULED lesson slots that have been created/modified
 *    since lastSyncAt
 * 2. For each slot:
 *    a. If no googleCalendarEventId → create Google Calendar event
 *    b. If googleCalendarEventId exists → update Google Calendar event
 *    c. If slot was CANCELLED → delete Google Calendar event
 * 3. Store googleCalendarEventId on the LessonSlot document
 * 
 * Inbound (Google Calendar → Harmonia):
 * 1. Fetch teacher's calendar events since lastSyncAt
 * 2. Check for external events that block lesson times
 * 3. If conflict found, create a TeacherException document
 * 4. Notify admin about the availability change
 * 
 * OAuth flow:
 * - Teacher clicks "Connect Google Calendar" in settings
 * - Firebase Auth with Google provider (offline access for refresh token)
 * - Store tokens in the teacher's User document (encrypted)
 * 
 * Rate limits:
 * - Google Calendar API: 1,000,000 queries/day (free tier)
 * - At 10 teachers × 4 syncs/hour × 16 hours = 640 queries/day — trivial
 */
export interface SyncTeacherCalendarsSpec {
    schedule: 'every 15 minutes';
    timezone: 'Asia/Jerusalem';
}

/**
 * Creates a Google Calendar event from a Harmonia lesson slot.
 */
export function lessonToCalendarEvent(
    slot: LessonSlot,
    studentName: string,
    instrument: string,
    roomName?: string
): GoogleCalendarEventPayload {
    const startDate = new Date(slot.startTime);
    const endDate = new Date(startDate.getTime() + slot.durationMinutes * 60000);

    return {
        summary: `🎵 ${instrument} — ${studentName}`,
        description: [
            `Harmonia Lesson`,
            `Student: ${studentName}`,
            `Instrument: ${instrument}`,
            roomName ? `Room: ${roomName}` : '',
            slot.isVirtual ? `Virtual: ${slot.meetingLink}` : '',
        ].filter(Boolean).join('\n'),
        start: {
            dateTime: startDate.toISOString(),
            timeZone: 'Asia/Jerusalem',
        },
        end: {
            dateTime: endDate.toISOString(),
            timeZone: 'Asia/Jerusalem',
        },
        reminders: {
            useDefault: false,
            overrides: [
                { method: 'popup', minutes: 15 },
            ],
        },
        colorId: slot.type === 'MAKEUP' ? '6' : '9', // Banana = makeup, Grape = regular
    };
}

// Type for Google Calendar API event payload
interface GoogleCalendarEventPayload {
    summary: string;
    description: string;
    start: { dateTime: string; timeZone: string };
    end: { dateTime: string; timeZone: string };
    reminders: { useDefault: boolean; overrides: { method: string; minutes: number }[] };
    colorId: string;
}
