// src/lib/auth/supabase-client.ts

/**
 * @fileoverview Supabase browser client for client-side auth operations.
 * Mirrors firebase-client.ts. Only initialises if NEXT_PUBLIC_SUPABASE_URL
 * and NEXT_PUBLIC_SUPABASE_ANON_KEY are set.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

let cachedClient: SupabaseClient | null = null;

export function getSupabaseBrowserClient(): SupabaseClient | null {
  if (cachedClient) return cachedClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) return null;

  // Dynamic import to avoid bundling when not used
  // (will be tree-shaken when AUTH_PROVIDER !== 'supabase')
  const { createBrowserClient } = require('@supabase/ssr') as typeof import('@supabase/ssr');
  cachedClient = createBrowserClient(url, key);
  return cachedClient;
}
