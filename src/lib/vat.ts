import type { PricingConfig } from '@/lib/types';

/**
 * Current statutory VAT rate for Israel.
 * Raised from 17% to 18% on 1 January 2025.
 *
 * This constant is the global fallback. Conservatoriums may override it via
 * pricingConfig.vatRate (stored in their Conservatorium record and editable
 * by conservatorium_admin / site_admin in Settings → Pricing).
 */
export const VAT_RATE = 0.18; // Israel 18% (since Jan 2025)

/**
 * Returns the effective VAT rate for a conservatorium.
 * Uses pricingConfig.vatRate if set, otherwise falls back to VAT_RATE.
 */
export function getVatRate(pricingConfig?: PricingConfig): number {
  return pricingConfig?.vatRate ?? VAT_RATE;
}

/** Returns price including VAT, rounded to nearest shekel */
export function addVAT(priceBeforeVAT: number, rate: number = VAT_RATE): number {
  return Math.round(priceBeforeVAT * (1 + rate));
}

/** Returns formatted price string: "₪120 כולל מע״מ" */
export function formatWithVAT(priceBeforeVAT: number, locale: string = 'he', rate: number = VAT_RATE): string {
  const total = addVAT(priceBeforeVAT, rate);
  const labels: Record<string, string> = {
    he: `₪${total} כולל מע״מ`,
    en: `₪${total} incl. VAT`,
    ar: `₪${total} شامل ضريبة القيمة المضافة`,
    ru: `₪${total} включая НДС`,
  };
  return labels[locale] ?? labels.he;
}

/** Returns VAT breakdown: { net, vat, total } */
export function vatBreakdown(netAmount: number, rate: number = VAT_RATE): { net: number; vat: number; total: number } {
  const vat = Math.round(netAmount * rate);
  return { net: netAmount, vat, total: netAmount + vat };
}
