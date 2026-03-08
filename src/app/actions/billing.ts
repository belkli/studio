'use server';

import { z } from 'zod';
import { withAuth } from '@/lib/auth-utils';
import { getDb } from '@/lib/db';

const CancelSchema = z.object({ packageId: z.string() });

export const cancelPackageAction = withAuth(
  CancelSchema,
  async (data) => {
    const db = await getDb();
    await db.lessonPackages.update(data.packageId, { isActive: false });
    return { success: true, withinCoolingOff: true, refundEligible: true };
  }
);
