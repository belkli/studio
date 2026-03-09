/**
 * @fileoverview Server-side auth provider factory.
 * NEVER import this from 'use client' components — it pulls in firebase-admin / supabase admin.
 *
 * Marked server-only to cause a build error if accidentally imported client-side.
 */
import 'server-only';

import type { IServerAuthProvider } from './provider';

export type { IServerAuthProvider };

let _serverProvider: IServerAuthProvider | null = null;

/**
 * Get the configured server-side auth provider.
 * Reads AUTH_PROVIDER env var: 'firebase' (default) | 'supabase'
 * Lazy-initialised and cached per server process.
 */
export async function getServerAuthProvider(): Promise<IServerAuthProvider> {
  if (_serverProvider) return _serverProvider;

  const which = (process.env.AUTH_PROVIDER || 'firebase').trim().toLowerCase();

  if (which === 'supabase') {
    const { SupabaseServerAuthProvider } = await import('./supabase-provider');
    _serverProvider = new SupabaseServerAuthProvider();
  } else {
    const { FirebaseServerAuthProvider } = await import('./firebase-server-provider');
    _serverProvider = new FirebaseServerAuthProvider();
  }

  console.info(`[auth] server provider = ${which}`);
  return _serverProvider;
}

/** Reset cached provider — only for tests. */
export function _resetServerProviderCache() {
  _serverProvider = null;
}
