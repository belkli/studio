/**
 * @fileoverview Shared types and constants for Harmonia Cloud Functions.
 * These mirror the types in the main app's src/lib/types.ts but are
 * kept minimal to avoid importing the full types file.
 */

/** Region for all Harmonia Cloud Functions — PDPPA data residency compliance. */
export const FUNCTIONS_REGION = 'europe-west1';

/**
 * Custom Claims payload set on Firebase Auth tokens.
 * This is the authoritative source of role and tenant information.
 * Verified by middleware and Server Actions on every request.
 */
export interface HarmoniaCustomClaims {
  role: string;
  conservatoriumId: string;
  approved: boolean;
}

/**
 * Subset of User document fields read by Cloud Functions.
 * We don't import the full User type to keep functions lightweight.
 */
export interface UserDocument {
  id?: string;
  name?: string;
  email?: string;
  role?: string;
  conservatoriumId?: string;
  conservatoriumName?: string;
  approved?: boolean;
  dateOfBirth?: string;
  parentId?: string;
  childIds?: string[];
  accountType?: string;
  _claimsUpdatedAt?: string;
}
