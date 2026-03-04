import { z } from 'zod';

const israeliIdRegex = /^\d{9}$/;

export function validateIsraeliId(id: string): boolean {
  if (id.length !== 9) return false;
  const digits = id.split('').map(Number);
  let sum = 0;
  for (let i = 0; i < 9; i += 1) {
    let d = digits[i] * ((i % 2) + 1);
    if (d > 9) d -= 9;
    sum += d;
  }
  return sum % 10 === 0;
}

export const userBaseSchema = z.object({
  nationalId: z
    .string()
    .min(1, 'ID required')
    .regex(israeliIdRegex, 'ID must be exactly 9 digits')
    .refine(validateIsraeliId, 'Invalid Israeli ID'),
});
