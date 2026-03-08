export const VAT_RATE = 0.17; // Israel 17%

/** Returns price including VAT, rounded to nearest shekel */
export function addVAT(priceBeforeVAT: number): number {
  return Math.round(priceBeforeVAT * (1 + VAT_RATE));
}

/** Returns formatted price string: "₪120 כולל מע״מ" */
export function formatWithVAT(priceBeforeVAT: number, locale: string = 'he'): string {
  const total = addVAT(priceBeforeVAT);
  const labels: Record<string, string> = {
    he: `₪${total} כולל מע״מ`,
    en: `₪${total} incl. VAT`,
    ar: `₪${total} شامل ضريبة القيمة المضافة`,
    ru: `₪${total} включая НДС`,
  };
  return labels[locale] ?? labels.he;
}

/** Returns VAT breakdown: { net, vat, total } */
export function vatBreakdown(netAmount: number): { net: number; vat: number; total: number } {
  const vat = Math.round(netAmount * VAT_RATE);
  return { net: netAmount, vat, total: netAmount + vat };
}
