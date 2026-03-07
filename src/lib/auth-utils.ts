/**
 * @fileoverview Server-side authentication and authorization utilities.
 *
 * Provides:
 * - verifyAuth(): Validates Firebase session cookie via Admin SDK
 * - requireRole(): Enforces role-based access control on Server Actions
 * - getClaimsFromRequest(): Reads claims injected by middleware headers
 * - withAuth(): Higher-order function wrapping Server Actions with auth + Zod validation
 */
import { headers } from 'next/headers';
import { getAdminAuth } from '@/lib/firebase-admin';
import type { UserRole } from '@/lib/types';

// ── Types ─────────────────────────────────────────────────────

export interface HarmoniaClaims {
  uid: string;
  email: string;
  role: UserRole;
  conservatoriumId: string;
  approved: boolean;
}

// ── Claims from middleware headers ────────────────────────────

/**
 * Read user claims from request headers injected by middleware.
 * These headers are set by src/middleware.ts after JWT validation.
 * Returns null if headers are not present (unauthenticated request).
 */
export async function getClaimsFromRequest(): Promise<HarmoniaClaims | null> {
  const headerStore = await headers();
  const uid = headerStore.get('x-user-id');
  const role = headerStore.get('x-user-role');
  const conservatoriumId = headerStore.get('x-user-conservatorium-id');
  const approved = headerStore.get('x-user-approved');
  const email = headerStore.get('x-user-email');

  if (!uid || !role) {
    return null;
  }

  return {
    uid,
    email: email || '',
    role: role as UserRole,
    conservatoriumId: conservatoriumId || '',
    approved: approved === 'true',
  };
}

// ── Session cookie verification ───────────────────────────────

const SESSION_COOKIE_NAME = '__session';
const SESSION_EXPIRY_MS = 14 * 24 * 60 * 60 * 1000; // 14 days

/**
 * Verify the Firebase session cookie using the Admin SDK.
 *
 * This is the authoritative server-side verification. The middleware
 * performs a lightweight JWT decode for header injection, but Server
 * Actions must call this function for cryptographic verification.
 *
 * When FIREBASE_SERVICE_ACCOUNT_KEY is not set (local dev), falls back
 * to reading claims from middleware headers.
 */
export async function verifyAuth(): Promise<HarmoniaClaims> {
  // Try Admin SDK verification first
  const adminAuth = getAdminAuth();

  if (adminAuth) {
    try {
      const { cookies } = await import('next/headers');
      const cookieStore = await cookies();
      const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;

      if (!sessionCookie) {
        throw new Error('UNAUTHENTICATED');
      }

      const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);

      return {
        uid: decodedClaims.uid,
        email: decodedClaims.email || '',
        role: (decodedClaims.role as UserRole) || 'student',
        conservatoriumId: (decodedClaims.conservatoriumId as string) || '',
        approved: decodedClaims.approved === true,
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      if (message === 'UNAUTHENTICATED') throw new Error('UNAUTHENTICATED');
      console.error('[auth-utils] Session cookie verification failed:', message);
      throw new Error('UNAUTHENTICATED');
    }
  }

  // Fallback: read from middleware-injected headers (local dev without Admin SDK)
  const claims = await getClaimsFromRequest();
  if (claims) {
    return claims;
  }

  // No Admin SDK and no middleware headers — dev mode automatic fallback.
  //
  // SECURITY NOTE (QA-MED-05): This fallback grants site_admin privileges,
  // which is intentionally permissive for local development only. Safe in
  // production because:
  //   1. Firebase App Hosting sets NODE_ENV='production' at build time —
  //      cannot be overridden by request headers or cookies.
  //   2. In production, FIREBASE_SERVICE_ACCOUNT_KEY is always set (via
  //      Secret Manager), so the Admin SDK branch above handles all auth.
  //   3. This code path is unreachable when the Admin SDK is configured.
  //
  // Exists solely so `npm run dev` works without Firebase credentials.
  if (process.env.NODE_ENV !== 'production') {
    console.warn(
      '\n[auth-utils] *** DEV-ONLY FALLBACK ACTIVE ***\n' +
      '  No Admin SDK configured — using synthetic dev session (site_admin).\n' +
      '  Set FIREBASE_SERVICE_ACCOUNT_KEY to use real authentication.\n'
    );
    return {
      uid: 'dev-user',
      email: 'dev@harmonia.local',
      role: 'site_admin' as UserRole,
      conservatoriumId: 'dev-conservatorium',
      approved: true,
    };
  }

  throw new Error('UNAUTHENTICATED');
}

// ── Role-based access control ─────────────────────────────────

/**
 * Enforce that the current user has one of the allowed roles.
 * Optionally verify that the user belongs to the same conservatorium.
 * Global admin roles (site_admin, superadmin) bypass tenant isolation.
 *
 * @param allowedRoles - Array of roles permitted to execute this action
 * @param conservatoriumIdMustMatch - If provided, the user's conservatoriumId must match
 * @returns The verified claims
 * @throws Error with code 'FORBIDDEN' or 'TENANT_MISMATCH'
 */
const GLOBAL_ADMIN_ROLES: UserRole[] = ['site_admin', 'superadmin'];

export async function requireRole(
  allowedRoles: UserRole[],
  conservatoriumIdMustMatch?: string
): Promise<HarmoniaClaims> {
  const claims = await verifyAuth();

  if (!claims.approved) {
    throw new Error('ACCOUNT_NOT_APPROVED');
  }

  if (!allowedRoles.includes(claims.role)) {
    throw new Error('FORBIDDEN');
  }

  // Global admins bypass tenant isolation — they manage all conservatoriums
  if (conservatoriumIdMustMatch && !GLOBAL_ADMIN_ROLES.includes(claims.role) && claims.conservatoriumId !== conservatoriumIdMustMatch) {
    throw new Error('TENANT_MISMATCH');
  }

  return claims;
}

// ── withAuth wrapper ──────────────────────────────────────────

/**
 * Higher-order function that wraps a Server Action with:
 * 1. Authentication verification (verifyAuth)
 * 2. Zod input validation
 * 3. Structured error handling
 */
export function withAuth<Schema extends { parse(data: unknown): unknown; _input: unknown; _output: unknown }, R>(
  schema: Schema,
  action: (input: Schema['_output']) => Promise<R>
) {
  return async (input: Schema['_input']): Promise<R> => {
    try {
      await verifyAuth();
      const parsedInput = schema.parse(input);
      return await action(parsedInput);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      const name = error instanceof Error ? error.name : '';

      if (message === 'UNAUTHENTICATED') {
        throw new Error('Authentication required. Please log in.');
      }
      if (message === 'FORBIDDEN') {
        throw new Error('You do not have permission to perform this action.');
      }
      if (message === 'TENANT_MISMATCH') {
        throw new Error('You do not have access to this conservatorium.');
      }
      if (message === 'ACCOUNT_NOT_APPROVED') {
        throw new Error('Your account has not been approved yet.');
      }

      console.error('Server Action Error:', error);
      if (name === 'ZodError') {
        throw new Error('Invalid input provided to server action.');
      }
      throw new Error('An error occurred while processing the request.');
    }
  };
}

// ── Session cookie creation (for login API route) ─────────────

/**
 * Create a Firebase session cookie from a Firebase ID token.
 * Called by the /api/auth/login route after client-side authentication.
 *
 * @param idToken - The Firebase ID token from the client
 * @returns The session cookie string
 */
export async function createSessionCookie(idToken: string): Promise<string> {
  const adminAuth = getAdminAuth();
  if (!adminAuth) {
    throw new Error('Firebase Admin SDK is not configured');
  }

  const sessionCookie = await adminAuth.createSessionCookie(idToken, {
    expiresIn: SESSION_EXPIRY_MS,
  });

  return sessionCookie;
}

/**
 * Revoke the current session by revoking the user's refresh tokens.
 * Called by the /api/auth/logout route.
 */
export async function revokeSession(uid: string): Promise<void> {
  const adminAuth = getAdminAuth();
  if (!adminAuth) {
    throw new Error('Firebase Admin SDK is not configured');
  }

  await adminAuth.revokeRefreshTokens(uid);
}
