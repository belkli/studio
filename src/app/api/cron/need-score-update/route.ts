/**
 * Cron job: recompute NeedScore for all Section-46-enabled conservatoria.
 * Runs hourly via Vercel Cron (schedule in vercel.json).
 * Requires CRON_SECRET env var for authorization.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { buildNeedScoreInputs, computeNeedScore } from '@/lib/need-score-updater';
import type { NeedScoreUpdateResult } from '@/lib/need-score-updater';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();

  let db;
  try {
    db = await getDb();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ updated: 0, skipped: `db init failed: ${msg}`, ranAt: now.toISOString() });
  }

  if (!db.conservatoriums) {
    return NextResponse.json({ updated: 0, skipped: 'db adapter does not support conservatoriums', ranAt: now.toISOString() });
  }

  const allConservatoria = await db.conservatoriums.list();
  const allApplications = await db.scholarships.list();
  const results: NeedScoreUpdateResult[] = [];
  const errors: string[] = [];

  for (const cons of allConservatoria) {
    if (!cons.donations?.section46Enabled) continue;

    try {
      const inputs = buildNeedScoreInputs(cons, allApplications, now);
      const newScore = computeNeedScore(inputs);
      const oldScore = cons.donations.needScore ?? 0;

      await db.conservatoriums.update(cons.id, {
        donations: {
          ...cons.donations,
          needScore: newScore,
          needScoreUpdatedAt: now.toISOString(),
        },
      } as Partial<typeof cons>);

      results.push({
        conservatoriumId: cons.id,
        oldScore,
        newScore,
        section46Enabled: true,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`${cons.id}: ${msg}`);
    }
  }

  return NextResponse.json({
    updated: results.length,
    total: allConservatoria.length,
    errors: errors.length > 0 ? errors : undefined,
    ranAt: now.toISOString(),
  });
}
