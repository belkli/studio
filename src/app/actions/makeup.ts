'use server';
import { withAuth } from '@/lib/auth-utils';
import { getDb } from '@/lib/db';
import { z } from 'zod';

const ExtendMakeupSchema = z.object({
  creditId: z.string().min(1),
  newExpiresAt: z.string().datetime(),
});

export const extendMakeupWindowAction = withAuth(
  ExtendMakeupSchema,
  async (data) => {
    const db = await getDb();
    await db.makeupCredits.update(data.creditId, { expiresAt: data.newExpiresAt });
    return { success: true };
  }
);
