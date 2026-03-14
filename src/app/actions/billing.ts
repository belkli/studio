'use server';

import { z } from 'zod';
import { withAuth } from '@/lib/auth-utils';
import { getDb } from '@/lib/db';

const CancelSchema = z.object({ packageId: z.string() });

export const cancelPackageAction = withAuth(
  CancelSchema,
  async (data) => {
    const db = await getDb();
    const pkg = await db.lessonPackages.findById(data.packageId);
    if (!pkg) return { success: false, error: 'Package not found' };

    await db.lessonPackages.update(data.packageId, { isActive: false });

    const pkgWithDates = pkg as typeof pkg & { createdAt?: string; validFrom?: string };
    const purchaseDate = new Date(pkgWithDates.createdAt || pkgWithDates.validFrom || Date.now());
    const daysSincePurchase = (Date.now() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24);
    const withinCoolingOff = daysSincePurchase <= 14;

    return { success: true, withinCoolingOff, refundEligible: withinCoolingOff };
  }
);
