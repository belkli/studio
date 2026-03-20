/**
 * Twilio SMS Inbound Webhook — STOP Handler (Amendment 40)
 *
 * Processes inbound SMS replies. When a user sends "STOP" or "סור",
 * their MARKETING consent is revoked and a confirmation TwiML is returned.
 *
 * Twilio sends POST with application/x-www-form-urlencoded body.
 */

import { createHmac } from 'crypto';
import { NextResponse } from 'next/server';
import { normalizeIsraeliPhone } from '@/lib/notifications/dispatcher';
import { getDb } from '@/lib/db';
import { logAccess } from '@/lib/compliance-log';

// ── Twilio Signature Validation ─────────────────────────────

function validateTwilioSignature(
    signature: string,
    url: string,
    params: Record<string, string>,
    authToken: string,
): boolean {
    // Sort params alphabetically by key and concatenate key+value
    const data = url + Object.keys(params)
        .sort()
        .reduce((acc, key) => acc + key + params[key], '');

    const expected = createHmac('sha1', authToken)
        .update(data, 'utf-8')
        .digest('base64');

    return signature === expected;
}

// ── TwiML Response Helper ───────────────────────────────────

function twimlResponse(message?: string): NextResponse {
    const body = message
        ? `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${message}</Message></Response>`
        : '<?xml version="1.0" encoding="UTF-8"?><Response></Response>';

    return new NextResponse(body, {
        status: 200,
        headers: { 'Content-Type': 'text/xml' },
    });
}

// ── Handler ─────────────────────────────────────────────────

export async function POST(request: Request): Promise<NextResponse> {
    const contentType = request.headers.get('content-type') ?? '';
    if (!contentType.includes('application/x-www-form-urlencoded')) {
        return new NextResponse('Bad Request', { status: 400 });
    }

    const formData = await request.formData();
    const params: Record<string, string> = {};
    formData.forEach((value, key) => {
        params[key] = String(value);
    });

    const from = params.From ?? '';
    const body = params.Body ?? '';

    // Twilio signature validation
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const webhookUrl = process.env.TWILIO_WEBHOOK_URL;

    if (authToken && webhookUrl) {
        const signature = request.headers.get('x-twilio-signature') ?? '';
        if (!validateTwilioSignature(signature, webhookUrl, params, authToken)) {
            console.warn('[SMS Inbound] Invalid Twilio signature');
            return new NextResponse('Forbidden', { status: 403 });
        }
    } else {
        console.warn('[SMS Inbound] TWILIO_AUTH_TOKEN or TWILIO_WEBHOOK_URL not set — skipping signature validation');
    }

    // Normalize and check for STOP keywords
    const normalizedBody = body.trim();
    const isStopRequest = /^(STOP|סור)$/i.test(normalizedBody) ||
        normalizedBody.toUpperCase().includes('STOP') ||
        normalizedBody.includes('סור');

    if (!isStopRequest) {
        // Non-STOP message — acknowledge with empty TwiML
        return twimlResponse();
    }

    // STOP flow: revoke MARKETING consent
    const normalizedPhone = normalizeIsraeliPhone(from);
    const db = await getDb();

    // Look up user by phone
    let userId = 'unknown';
    let conservatoriumId = '';

    try {
        const allUsers = await db.users.list();
        const matchedUser = allUsers.find((u) => {
            const userPhone = (u as Record<string, unknown>).phone as string | undefined;
            return userPhone && normalizeIsraeliPhone(userPhone) === normalizedPhone;
        });

        if (matchedUser) {
            userId = matchedUser.id;
            conservatoriumId = matchedUser.conservatoriumId ?? '';

            // Revoke MARKETING consent
            try {
                const allConsents = await db.consentRecords.list();
                const marketingConsent = allConsents.find(
                    (c) => c.userId === userId && c.consentType === 'MARKETING' && !c.revokedAt,
                );
                if (marketingConsent) {
                    await db.consentRecords.update(marketingConsent.id, {
                        revokedAt: new Date().toISOString(),
                    });
                }
            } catch (err) {
                console.error('[SMS Inbound] Failed to revoke consent:', err);
            }
        } else {
            console.warn(`[SMS Inbound] No user found for phone ${normalizedPhone}`);
        }
    } catch (err) {
        console.error('[SMS Inbound] User lookup failed:', err);
    }

    // Log the opt-out
    await logAccess({
        action: 'CONSENT_REVOKED',
        resourceId: userId,
        userId: 'sms_stop_handler',
        conservatoriumId,
        resourceType: 'marketing_consent',
        reason: 'opt_out_via_sms',
    });

    return twimlResponse('הוסרת בהצלחה מרשימת התפוצה.');
}
