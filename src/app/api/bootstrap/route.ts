import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  try {
    const db = await getDb();

    const [
      users,
      conservatoriums,
      lessons,
      forms,
      events,
      rooms,
      payrolls,
    ] = await Promise.all([
      db.users.list(),
      db.conservatoriums.list(),
      db.lessons.list(),
      db.forms.list(),
      db.events.list(),
      db.rooms.list(),
      db.payrolls.list(),
    ]);

    return NextResponse.json(
      {
        users,
        conservatoriums,
        lessons,
        forms,
        events,
        rooms,
        payrolls,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[api/bootstrap] failed', error);
    return NextResponse.json({ error: 'bootstrap_failed' }, { status: 500 });
  }
}
