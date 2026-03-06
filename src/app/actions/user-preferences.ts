'use server';

import { z } from 'zod';
import { requireRole } from '@/lib/auth-utils';
import { getDb } from '@/lib/db';

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

    await requireRole([
      'student',
      'parent',
      'teacher',
      'conservatorium_admin',
      'delegated_admin',
      'site_admin',
    ]);

    const db = await getDb();
    await db.users.update(parsed.data.userId, {
      preferredLanguage: parsed.data.preferredLanguage,
    });

    return { success: true };
  } catch {
    return { success: false, error: 'Failed to update language preference' };
  }
}
