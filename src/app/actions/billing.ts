'use server';

import { z } from 'zod';
import { withAuth } from '@/lib/auth-utils';

const CancelSchema = z.object({ packageId: z.string() });

export const cancelPackageAction = withAuth(
  CancelSchema,
  async (_data) => {
    // For mock: just return success (mock DB may not support full update)
    // In production this would update the package status
    return { success: true, withinCoolingOff: true, refundEligible: true };
  }
);
