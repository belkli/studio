import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Validates an Israeli ID number.
 * @param id The ID number as a string.
 * @returns True if the ID is valid, false otherwise.
 */
export function isValidIsraeliID(id: string): boolean {
  if (!id || id.length !== 9 || isNaN(Number(id))) {
    return false;
  }

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    let digit = parseInt(id[i]);
    if (i % 2 === 1) {
      digit *= 2;
      if (digit > 9) {
        digit = digit % 10 + Math.floor(digit / 10);
      }
    }
    sum += digit;
  }

  return sum % 10 === 0;
}
