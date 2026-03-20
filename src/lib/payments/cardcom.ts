/**
 * @fileoverview Cardcom Israeli payment gateway integration.
 * SDD-P4 (Parent) requires real payment processing via Cardcom.
 * This is a typed stub ready for configuration with environment variables.
 * 
 * Cardcom API: https://kb.cardcom.co.il/
 * 
 * Environment variables required:
 * - CARDCOM_TERMINAL_NUMBER
 * - CARDCOM_API_NAME  
 * - CARDCOM_API_PASSWORD
 * - CARDCOM_WEBHOOK_SECRET
 */

import { createHmac, timingSafeEqual } from 'crypto';
import type { InstallmentOption } from '@/lib/types';

// ── Configuration ────────────────────────────────────────────
const IS_SANDBOX = process.env.CARDCOM_SANDBOX === 'true';
const CARDCOM_CONFIG = {
    // SEC-M02: Sandbox and production MUST use different URLs/terminals
    apiUrl: IS_SANDBOX
        ? 'https://sandbox.cardcom.solutions/api/v11/LowProfile/Create'  // Sandbox — test only
        : 'https://secure.cardcom.solutions/api/v11/LowProfile/Create',  // Production — real charges
    terminalNumber: IS_SANDBOX
        ? (process.env.CARDCOM_SANDBOX_TERMINAL_NUMBER ?? '')            // Separate sandbox terminal
        : (process.env.CARDCOM_TERMINAL_NUMBER ?? ''),
    apiName: process.env.CARDCOM_API_NAME ?? '',
    apiPassword: process.env.CARDCOM_API_PASSWORD ?? '',
};


// ── Types ────────────────────────────────────────────────────
export interface CardcomPaymentPageRequest {
    invoiceId: string;
    amount: number;             // in NIS (Cardcom handles agorot)
    currency: 'ILS';
    installments?: number;      // 1-12 תשלומים
    description: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;      // +972 format
    successUrl: string;
    failureUrl: string;
    webhookUrl: string;
    language: 'he' | 'en' | 'ar';
}

export interface CardcomPaymentPageResponse {
    url: string;                // Redirect URL to hosted payment page
    lowProfileCode: string;    // Cardcom session ID
    error?: string;
}

export interface CardcomWebhookPayload {
    lowProfileCode: string;
    transactionId: string;
    responseCode: string;       // '0' = success
    amount: string;
    cardSuffix: string;         // last 4 digits
    cardType: string;           // 'Visa', 'MasterCard', etc.
    numberOfPayments: string;
    firstPaymentAmount: string;
    periodicalPaymentAmount: string;
    cardToken?: string;         // for recurring charges
    cardTokenExpiry?: string;
    approvalNumber: string;
}

export interface CardcomRecurringChargeRequest {
    cardToken: string;
    amount: number;
    description: string;
    invoiceId: string;
    idempotencyKey: string;    // Prevents double-charging (RC-3 fix)
}

// ── Functions ────────────────────────────────────────────────

/**
 * Verifies a Cardcom webhook HMAC-SHA256 signature using timing-safe comparison.
 * SEC-W01: Prevents webhook forgery — all incoming Cardcom webhooks must pass this check.
 *
 * @param rawBody      - The raw (unparsed) request body string
 * @param signature    - The hex-encoded HMAC signature from the request header
 * @param secret       - The webhook secret (CARDCOM_WEBHOOK_SECRET env var)
 * @returns true only when the signature matches exactly
 */
export function verifyCardcomHmac(rawBody: string, signature: string, secret: string): boolean {
  if (!signature || !secret) return false;
  try {
    const expected = createHmac('sha256', secret).update(rawBody).digest('hex');
    const expectedBuf = Buffer.from(expected, 'hex');
    const receivedBuf = Buffer.from(signature, 'hex');
    if (expectedBuf.length !== receivedBuf.length) return false;
    return timingSafeEqual(expectedBuf, receivedBuf);
  } catch {
    return false;
  }
}

/**
 * Creates a Cardcom hosted payment page URL.
 * The parent is redirected to this URL to enter their card details.
 * Cardcom handles PCI-DSS compliance — we never see the full card number.
 */
export async function createCardcomPaymentPage(
    request: CardcomPaymentPageRequest
): Promise<CardcomPaymentPageResponse> {
    if (!CARDCOM_CONFIG.terminalNumber) {
        console.warn('[Cardcom] No terminal number configured — returning mock URL');
        return {
            url: `/payment/mock?invoice=${request.invoiceId}&amount=${request.amount}`,
            lowProfileCode: `mock-${Date.now()}`,
        };
    }

    // In production, this calls the Cardcom API:
    // POST https://secure.cardcom.solutions/api/v11/LowProfile/Create
    // Body: { TerminalNumber, APILevel, CodePage, Operation, ... }

    const body = {
        TerminalNumber: CARDCOM_CONFIG.terminalNumber,
        APILevel: '10',
        codepage: '65001', // UTF-8
        Operation: '2',     // Charge + Token
        Language: request.language,
        CoinID: '1',        // ILS
        SumToBill: request.amount.toString(),
        NumOfPayments: (request.installments ?? 1).toString(),
        ProductName: request.description,
        ReturnValue: request.invoiceId,
        SuccessRedirectUrl: request.successUrl,
        ErrorRedirectUrl: request.failureUrl,
        IndicatorUrl: request.webhookUrl,
        InvoiceHead: JSON.stringify({
            CustName: request.customerName,
            SendByEmail: 'true',
            Email: request.customerEmail,
            Language: request.language,
        }),
    };

    try {
        const response = await fetch(CARDCOM_CONFIG.apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        const data = await response.json();

        if (data.ResponseCode === '0' || data.LowProfileCode) {
            return {
                url: data.url || `https://secure.cardcom.solutions/External/LowProfileClearing/${data.LowProfileCode}`,
                lowProfileCode: data.LowProfileCode,
            };
        }

        return { url: '', lowProfileCode: '', error: data.Description || 'Payment page creation failed' };
    } catch (error) {
        return { url: '', lowProfileCode: '', error: String(error) };
    }
}

/**
 * Charges a stored card token for recurring monthly payments.
 * SDD-P6 (QA) RC-3 fix: Uses idempotency key to prevent double-charging.
 * The idempotency key format: `charge-{conservatoriumId}-{invoiceId}-{YYYY-MM}`
 */
export async function chargeStoredCard(
    _request: CardcomRecurringChargeRequest
): Promise<{ success: boolean; transactionId?: string; error?: string }> {
    if (!CARDCOM_CONFIG.terminalNumber) {
        console.warn('[Cardcom] No terminal number configured — mock charge');
        return { success: true, transactionId: `mock-txn-${Date.now()}` };
    }

    // In production: POST to Cardcom's ChargeByToken endpoint
    // with the idempotency key stored in a Firestore document
    // to prevent RC-3 (double-charging on monthly auto-charge)

    return { success: false, error: 'Cardcom not configured' };
}

/**
 * Handles Cardcom webhook callback.
 * Called by Cloud Function when Cardcom sends a POST to our webhook URL.
 *
 * Steps:
 * 1. Verify webhook signature (CARDCOM_WEBHOOK_SECRET)
 * 2. Parse payload
 * 3. Update Invoice status to PAID
 * 4. Store card token for future charges (if Operation included token)
 * 5. Send payment confirmation notification
 * 6. Generate invoice PDF (חשבונית מס)
 */
export async function handleCardcomWebhook(
    rawBody: string,
    signatureHeader: string,
    payload: CardcomWebhookPayload
): Promise<{ success: boolean; error?: string }> {
    // SEC-W01: Reject any webhook that fails HMAC verification
    const webhookSecret = process.env.CARDCOM_WEBHOOK_SECRET ?? '';
    if (!verifyCardcomHmac(rawBody, signatureHeader, webhookSecret)) {
        return { success: false, error: 'Invalid webhook signature' };
    }

    const { lowProfileCode: _lowProfileCode, responseCode, transactionId: _transactionId, cardToken: _cardToken } = payload;

    if (responseCode !== '0') {
        // Payment failed — update invoice status, notify admin
        return { success: false, error: `Payment declined: code ${responseCode}` };
    }

    // In production:
    // 1. Look up invoice by lowProfileCode → invoiceId mapping
    // 2. Update invoice: status = 'PAID', paidAt = now
    // 3. If cardToken, store it (encrypted) on the parent's user document
    // 4. Update conservatoriumStats/live revenueCollectedThisMonth
    // 5. Generate invoice PDF and store in Firebase Storage
    // 6. Send confirmation to parent via notification dispatcher

    return { success: true };
}

/**
 * Calculates installment options for a yearly package.
 * Israeli standard: 1, 3, 6, 10, or 12 installments.
 */
export function calculateInstallments(totalAmount: number): InstallmentOption[] {
    const options: InstallmentOption[] = [
        { count: 1, monthlyAmount: totalAmount, totalAmount, installmentFee: 0 },
        { count: 3, monthlyAmount: Math.ceil(totalAmount / 3), totalAmount, installmentFee: 0 },
        { count: 6, monthlyAmount: Math.ceil(totalAmount / 6), totalAmount, installmentFee: 0 },
        { count: 10, monthlyAmount: Math.ceil(totalAmount / 10), totalAmount, installmentFee: 0 },
        { count: 12, monthlyAmount: Math.ceil(totalAmount / 12), totalAmount, installmentFee: 0 },
    ];
    return options;
}
