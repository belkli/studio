'use server';

import { z } from 'zod';
import { requireRole, verifyAuth } from '@/lib/auth-utils';
import { getDb } from '@/lib/db';
import { cookies } from 'next/headers';
import { BRAND_THEME_COOKIE_NAME } from '@/lib/brand';
import type { BrandId } from '@/lib/themes/active-theme';

const UpdatePreferredLanguageSchema = z.object({
  userId: z.string().min(1),
  preferredLanguage: z.enum(['he', 'en', 'ar', 'ru']),
});

export async function updatePreferredLanguageAction(
  input: z.infer<typeof UpdatePreferredLanguageSchema>
): Promise<{ success: boolean; error?: string }> {
  try {
    const parsed = UpdatePreferredLanguageSchema.safeParse(input);
    if (!parsed.success) return { success: false, error: 'Invalid input' };

    const claims = await requireRole([
      'student',
      'parent',
      'teacher',
      'conservatorium_admin',
      'delegated_admin',
      'site_admin',
    ]);

    // Users can only update their own language preference
    if (parsed.data.userId !== claims.uid && !['site_admin', 'superadmin'].includes(claims.role)) {
      return { success: false, error: 'Forbidden: cannot update another user\'s preferences' };
    }

    const db = await getDb();
    await db.users.update(parsed.data.userId, {
      preferredLanguage: parsed.data.preferredLanguage,
    });

    return { success: true };
  } catch {
    return { success: false, error: 'Failed to update language preference' };
  }
}

const UpdateBrandPreferenceSchema = z.object({
  brand: z.enum(['indigo', 'gold']),
});

export async function updateBrandPreferenceAction(
  input: { brand: BrandId }
): Promise<{ success: boolean; error?: string }> {
  const parsed = UpdateBrandPreferenceSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: 'Invalid brand value' };

  const { brand } = parsed.data;

  // Always set the cookie — works for unauthenticated visitors too
  const cookieStore = await cookies();
  cookieStore.set(BRAND_THEME_COOKIE_NAME, brand, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 365,
    path: '/',
    sameSite: 'lax',
  });

  // For authenticated users, also persist to their user record
  // userId is derived from the verified session — never from client input
  try {
    const claims = await verifyAuth();
    const db = await getDb();
    await db.users.update(claims.uid, { preferredBrand: brand });
  } catch {
    // Not authenticated — cookie-only is fine
  }

  return { success: true };
}
