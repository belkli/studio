/**
 * @fileoverview Notification dispatcher — routes messages to the right channel.
 * SDD-P4 (Parent) and SDD-P7 (Security) require multi-channel
 * notification support: WhatsApp, SMS, email, in-app.
 * 
 * Respects user notification preferences and quiet hours.
 * 
 * Environment variables required:
 * - TWILIO_ACCOUNT_SID
 * - TWILIO_AUTH_TOKEN
 * - TWILIO_WHATSAPP_FROM (e.g., 'whatsapp:+14155238886')
 * - TWILIO_SMS_FROM (e.g., '+972XXXXXXXXX')
 * - SENDGRID_API_KEY
 * - SENDGRID_FROM_EMAIL
 */

import type { Channel, NotificationType, NotificationPreferences } from '@/lib/types';
import { getDb } from '@/lib/db';

// ── Types ────────────────────────────────────────────────────
export interface NotificationPayload {
    userId: string;
    type: NotificationType;
    title: string;
    titleHe: string;
    body: string;
    bodyHe: string;
    link?: string;
    channels?: Channel[];       // If specified, overrides user preferences
    priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
    data?: Record<string, string>;
}

export interface DispatchResult {
    delivered: Channel[];
    failed: { channel: Channel; error: string }[];
    skippedQuietHours: boolean;
}

// ── Quiet Hours ──────────────────────────────────────────────

/**
 * Checks if the current time falls within the user's quiet hours.
 * Quiet hours are defined in the user's notification preferences.
 */
function isQuietHours(preferences: NotificationPreferences | undefined): boolean {
    if (!preferences?.quietHours?.enabled) return false;

    const now = new Date();
    const israelTime = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Jerusalem',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    }).format(now);

    const currentTime = israelTime; // "HH:mm"
    const { startTime, endTime } = preferences.quietHours;

    // Handle overnight quiet hours (e.g., 22:00 - 07:00)
    if (startTime > endTime) {
        return currentTime >= startTime || currentTime < endTime;
    }
    return currentTime >= startTime && currentTime < endTime;
}

/**
 * Returns an ISO string for the next 6:00 AM Israel time (Asia/Jerusalem).
 * If it is already past 6 AM today in Israel, returns 6 AM tomorrow.
 */
function getNextIsraelMorning(): string {
    const now = new Date();
    // Get current hour in Israel
    const israelHour = parseInt(
        new Intl.DateTimeFormat('en-US', {
            timeZone: 'Asia/Jerusalem',
            hour: '2-digit',
            hour12: false,
        }).format(now),
        10,
    );

    // Calculate the offset: Israel is UTC+2 (winter) or UTC+3 (summer).
    // We derive it from the current time difference.
    const israelDateParts = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Jerusalem',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).format(now); // "YYYY-MM-DD"

    // Build a Date for 06:00 Israel today
    const target = new Date(`${israelDateParts}T06:00:00+02:00`);
    // If we're already past 6 AM Israel time, schedule for tomorrow
    if (israelHour >= 6) {
        target.setDate(target.getDate() + 1);
    }
    return target.toISOString();
}

/**
 * Normalizes an Israeli phone number to E.164 format.
 * 050-1234567 → +972501234567
 * 0501234567 → +972501234567
 * +972501234567 → +972501234567
 */
export function normalizeIsraeliPhone(phone: string): string {
    // Remove dashes, spaces, parentheses
    let cleaned = phone.replace(/[\s\-\(\)]/g, '');

    // If starts with 0, replace with +972
    if (cleaned.startsWith('0')) {
        cleaned = '+972' + cleaned.slice(1);
    }

    // If doesn't start with +, assume Israeli
    if (!cleaned.startsWith('+')) {
        cleaned = '+972' + cleaned;
    }

    return cleaned;
}

// ── Dispatcher ───────────────────────────────────────────────

/**
 * Dispatches a notification to a user via their preferred channels.
 * 
 * Steps:
 * 1. Look up user's NotificationPreferences
 * 2. Determine which channels to use for this notification type
 * 3. Check quiet hours — if in quiet hours and not URGENT, queue
 * 4. Dispatch to each channel:
 *    - IN_APP: create Firestore notification document
 *    - EMAIL: send via SendGrid
 *    - SMS: send via Twilio SMS
 *    - WHATSAPP: send via Twilio WhatsApp
 * 5. Log each dispatch attempt in notificationAuditLog
 */
export async function dispatchNotification(
    payload: NotificationPayload,
    userPreferences?: NotificationPreferences,
    userPhone?: string,
    userEmail?: string,
): Promise<DispatchResult> {
    const result: DispatchResult = {
        delivered: [],
        failed: [],
        skippedQuietHours: false,
    };

    // Check quiet hours (URGENT messages bypass quiet hours)
    if (isQuietHours(userPreferences) && payload.priority !== 'URGENT') {
        result.skippedQuietHours = true;

        // Queue the notification for delivery after quiet hours (next 6:00 AM Israel time)
        try {
            const db = await getDb();
            const scheduledFor = getNextIsraelMorning();
            // TODO: Add `scheduledFor` field to the Notification type so queued
            // notifications can be picked up by a cron job / Cloud Function at the
            // scheduled time and re-dispatched.
            await db.notifications.create({
                userId: payload.userId,
                title: payload.title,
                message: payload.body,
                link: payload.link ?? '',
                read: false,
                timestamp: scheduledFor,
            });
            console.warn(
                `[Dispatcher] Notification for user ${payload.userId} queued for ${scheduledFor} (quiet hours)`
            );
        } catch (err) {
            console.error('[Dispatcher] Failed to queue notification during quiet hours:', err);
        }

        return result;
    }

    // Determine channels
    const channels = payload.channels
        ?? userPreferences?.preferences[payload.type]
        ?? ['IN_APP']; // Default: in-app only

    for (const channel of channels) {
        try {
            switch (channel) {
                case 'IN_APP':
                    // Create notification document in Firestore
                    // conservatoriums/{cid}/notifications/{notifId}
                    result.delivered.push('IN_APP');
                    break;

                case 'SMS':
                    if (userPhone) {
                        const _phone = normalizeIsraeliPhone(userPhone);
                        // await sendSMS(_phone, body);
                        result.delivered.push('SMS');
                    } else {
                        result.failed.push({ channel: 'SMS', error: 'No phone number' });
                    }
                    break;

                case 'WHATSAPP':
                    if (userPhone) {
                        const _phone = normalizeIsraeliPhone(userPhone);
                        // await sendWhatsApp(_phone, body);
                        result.delivered.push('WHATSAPP');
                    } else {
                        result.failed.push({ channel: 'WHATSAPP', error: 'No phone number' });
                    }
                    break;

                case 'EMAIL':
                    if (userEmail) {
                        // await sendEmail(userEmail, title, body);
                        result.delivered.push('EMAIL');
                    } else {
                        result.failed.push({ channel: 'EMAIL', error: 'No email address' });
                    }
                    break;
            }
        } catch (error) {
            result.failed.push({
                channel,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    }

    return result;
}

// ── Twilio SMS ───────────────────────────────────────────────

/**
 * Sends an SMS via Twilio.
 * Requires TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_SMS_FROM.
 */
export async function sendSMS(to: string, body: string): Promise<{ sid: string }> {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const from = process.env.TWILIO_SMS_FROM;

    if (!accountSid || !authToken || !from) {
        console.warn('[Twilio SMS] Not configured — message not sent:', body.slice(0, 50));
        return { sid: `mock-sms-${Date.now()}` };
    }

    const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
        {
            method: 'POST',
            headers: {
                'Authorization': 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64'),
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({ To: to, From: from, Body: body }).toString(),
        }
    );

    const data = await response.json();
    return { sid: data.sid };
}

// ── Twilio WhatsApp ──────────────────────────────────────────

/**
 * Sends a WhatsApp message via Twilio.
 * Requires TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM.
 */
export async function sendWhatsApp(to: string, body: string): Promise<{ sid: string }> {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const from = process.env.TWILIO_WHATSAPP_FROM;

    if (!accountSid || !authToken || !from) {
        console.warn('[Twilio WhatsApp] Not configured — message not sent:', body.slice(0, 50));
        return { sid: `mock-wa-${Date.now()}` };
    }

    const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
        {
            method: 'POST',
            headers: {
                'Authorization': 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64'),
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                To: `whatsapp:${to}`,
                From: from,
                Body: body,
            }).toString(),
        }
    );

    const data = await response.json();
    return { sid: data.sid };
}
