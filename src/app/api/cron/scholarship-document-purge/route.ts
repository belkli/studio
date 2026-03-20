/**
 * Cron job: purge scholarship document URLs 12 months post-decision.
 * Invoked by Vercel Cron on schedule defined in vercel.json.
 * Requires CRON_SECRET env var for authorization.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { logAccess } from '@/lib/compliance-log';
import { selectApplicationsForDocumentPurge } from '@/lib/scholarship-purge';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
  const db = await getDb();
  const allApplications = await db.scholarships.list();
  const toPurge = selectApplicationsForDocumentPurge(allApplications, now);

  let purgedCount = 0;
  const errors: string[] = [];

  for (const app of toPurge) {
    try {
      await db.scholarships.update(app.id, { documents: [] });
      await logAccess({
        userId: 'SYSTEM',
        conservatoriumId: app.conservatoriumId,
        resourceType: 'ScholarshipApplication',
        resourceId: app.id,
        action: 'PII_DELETED',
      });
      purgedCount++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`${app.id}: ${msg}`);
    }
  }

  return NextResponse.json({
    purged: purgedCount,
    total: toPurge.length,
    errors: errors.length > 0 ? errors : undefined,
    ranAt: now.toISOString(),
  });
}
