import type { DatabaseAdapter } from './types';

let dbInstance: DatabaseAdapter | null = null;

export async function getDb(): Promise<DatabaseAdapter> {
  if (dbInstance) {
    return dbInstance;
  }

  const backend = resolveBackend();

  switch (backend) {
    case 'mock': {
      const { MemoryDatabaseAdapter, buildDefaultSeed } = await import('./adapters/shared');
      dbInstance = new MemoryDatabaseAdapter(buildDefaultSeed());
      break;
    }
    case 'firebase': {
      const { FirebaseAdapter } = await import('./adapters/firebase');
      dbInstance = new FirebaseAdapter();
      break;
    }
    case 'postgres': {
      const { PostgresAdapter } = await import('./adapters/postgres');
      dbInstance = new PostgresAdapter(requireEnv('DATABASE_URL'));
      break;
    }
    case 'supabase': {
      const { SupabaseAdapter } = await import('./adapters/supabase');
      dbInstance = await SupabaseAdapter.create(
        requireEnv('SUPABASE_URL'),
        requireEnv('SUPABASE_SERVICE_KEY')
      );
      break;
    }
    case 'pocketbase': {
      const { PocketBaseAdapter } = await import('./adapters/pocketbase');
      dbInstance = new PocketBaseAdapter(requireEnv('POCKETBASE_URL'));
      break;
    }
    default:
      throw new Error(`Unknown DB_BACKEND: ${backend}`);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adapterName = (dbInstance as any)?.constructor?.name || 'UnknownAdapter';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const source = (dbInstance as any)?.source || 'primary';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fallbackReason = (dbInstance as any)?.fallbackReason || '';
  console.info(
    `[db] resolved backend=${backend} adapter=${adapterName} source=${source}${fallbackReason ? ` reason=${fallbackReason}` : ''}`
  );

  if (!dbInstance) throw new Error('[db] dbInstance not initialized');
  return dbInstance;
}

function resolveBackend(): string {
  const explicit = (process.env.DB_BACKEND || '').trim().toLowerCase();

  if (explicit) {
    return explicit;
  }

  // Prefer Postgres when configured, otherwise use mock data.
  if (process.env.DATABASE_URL) {
    return 'postgres';
  }

  return 'mock';
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}
