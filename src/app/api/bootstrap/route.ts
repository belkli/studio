import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

type BootstrapBackend = 'postgres' | 'supabase' | 'mock';

type BootstrapMeta = {
  backend: BootstrapBackend;
  source: 'primary' | 'fallback';
  fallbackReason?: string;
};

function resolveConfiguredBackend(): BootstrapBackend {
  const explicit = (process.env.DB_BACKEND || '').trim().toLowerCase();
  if (explicit === 'postgres' || explicit === 'supabase' || explicit === 'mock') {
    return explicit;
  }
  if (process.env.DATABASE_URL) return 'postgres';
  if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY) return 'supabase';
  if (process.env.POCKETBASE_URL) return 'mock';
  return 'mock';
}

function inferAdapterBackend(db: unknown): BootstrapBackend {
  const ctorName = (db as any)?.constructor?.name || '';
  if (ctorName.includes('Postgres')) return 'postgres';
  if (ctorName.includes('Supabase')) return 'supabase';
  if (ctorName.includes('Firebase')) return 'mock';
  if (ctorName.includes('PocketBase')) return 'mock';
  return 'mock';
}

function buildMeta(db: unknown): BootstrapMeta {
  const source = (db as any)?.source === 'fallback' ? 'fallback' : 'primary';
  const fallbackReason = (db as any)?.fallbackReason;
  const backend = inferAdapterBackend(db) || resolveConfiguredBackend();
  return {
    backend,
    source,
    fallbackReason: source === 'fallback' ? fallbackReason : undefined,
  };
}

async function loadMockExtras() {
  const { getMockBootstrapExtras } = await import('@/lib/db/default-memory-seed');
  return getMockBootstrapExtras();
}

export async function GET() {
  try {
    const db = await getDb();

    const [
      users,
      conservatoriums,
      conservatoriumInstruments,
      lessonPackages,
      lessons,
      forms,
      events,
      rooms,
      branches,
      payrolls,
      repertoire,
      scholarships,
      rentals,
      payments,
      announcements,
      alumni,
      masterClasses,
      donationCauses,
      donations,
    ] = await Promise.all([
      db.users.list(),
      db.conservatoriums.list(),
      db.conservatoriumInstruments.list(),
      db.lessonPackages.list(),
      db.lessons.list(),
      db.forms.list(),
      db.events.list(),
      db.rooms.list(),
      db.branches.list(),
      db.payrolls.list(),
      db.repertoire.list(),
      db.scholarships.list(),
      db.rentals.list(),
      db.payments.list(),
      db.announcements.list(),
      db.alumni.list(),
      db.masterClasses.list(),
      db.donationCauses.list(),
      db.donations.list(),
    ]);

    const meta = buildMeta(db);
    const shouldUseMockExtras = meta.backend === 'mock' || meta.source === 'fallback';

    const responseBody: Record<string, unknown> = {
      meta,
      users,
      conservatoriums,
      conservatoriumInstruments,
      lessonPackages,
      lessons,
      forms,
      events,
      rooms,
      branches,
      payrolls,
      repertoire,
      scholarships,
      rentals,
      payments,
      announcements,
      alumni,
      masterClasses,
      donationCauses,
      donations,
    };

    if (shouldUseMockExtras) {
      Object.assign(responseBody, await loadMockExtras());
    }

    console.info(
      `[api/bootstrap] backend=${meta.backend} source=${meta.source}${meta.fallbackReason ? ` reason=${meta.fallbackReason}` : ''} users=${users.length} conservatoriums=${conservatoriums.length} lessons=${lessons.length}`
    );

    return NextResponse.json(responseBody, { status: 200 });
  } catch (error) {
    console.error('[api/bootstrap] failed', error);
    return NextResponse.json({ error: 'bootstrap_failed' }, { status: 500 });
  }
}

