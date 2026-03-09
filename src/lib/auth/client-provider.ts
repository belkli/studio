/**
 * @fileoverview Client-side auth provider factory.
 * Safe to import from 'use client' components — never pulls in server-only code.
 *
 * Reads NEXT_PUBLIC_AUTH_PROVIDER (browser-visible) to select the implementation.
 * Falls back to 'firebase'.
 */

import type { IClientAuthProvider } from './provider';

export type { IClientAuthProvider };

/**
 * Get the configured client-side auth provider (browser only).
 * Uses NEXT_PUBLIC_AUTH_PROVIDER so the value is available in the browser bundle.
 */
export async function getClientAuthProvider(): Promise<IClientAuthProvider> {
  const which = (process.env.NEXT_PUBLIC_AUTH_PROVIDER || 'firebase').trim().toLowerCase();

  if (which === 'supabase') {
    const { SupabaseClientAuthProvider } = await import('./supabase-provider');
    return new SupabaseClientAuthProvider();
  } else {
    const { FirebaseClientAuthProvider } = await import('./firebase-client-provider');
    return new FirebaseClientAuthProvider();
  }
}
