/**
 * @fileoverview Server Actions for Firebase Auth session management.
 *
 * createSessionAction: Exchanges a Firebase ID token for a server-side
 *   session cookie (__session). Called after client-side signInWithEmailAndPassword.
 *
 * signOutAction: Deletes the __session cookie and revokes refresh tokens.
 *   Called when the user clicks "Log out".
 */
'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createSessionCookie, revokeSession, verifyAuth } from '@/lib/auth-utils';

const SESSION_COOKIE_NAME = '__session';
const SESSION_MAX_AGE = 14 * 24 * 60 * 60; // 14 days in seconds

/**
 * Exchange a Firebase ID token for a server-side session cookie.
 *
 * @param idToken - The Firebase ID token obtained from getIdToken() on the client
 * @returns { ok: true } on success, or { ok: false, error: string } on failure
 */
export async function createSessionAction(
  idToken: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!idToken || typeof idToken !== 'string') {
    return { ok: false, error: 'Missing or invalid ID token' };
  }

  try {
    const sessionCookie = await createSessionCookie(idToken);

    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_MAX_AGE,
    });

    // Clear the legacy mock cookie
    cookieStore.delete('harmonia-user');

    return { ok: true };
  } catch (error) {
    console.error('[createSessionAction] Failed:', error);
    return { ok: false, error: 'Failed to create session. Please try again.' };
  }
}

/**
 * Sign out the current user by:
 * 1. Revoking Firebase refresh tokens (server-side)
 * 2. Deleting the __session cookie
 * 3. Deleting the legacy harmonia-user cookie
 * 4. Redirecting to /login
 */
export async function signOutAction(): Promise<void> {
  try {
    const claims = await verifyAuth();
    await revokeSession(claims.uid);
  } catch {
    // User may already be logged out — proceed with cookie cleanup
  }

  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
  cookieStore.delete('harmonia-user');

  redirect('/login');
}
