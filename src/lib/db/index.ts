import type { DatabaseAdapter } from './types';

let dbInstance: DatabaseAdapter | null = null;

export async function getDb(): Promise<DatabaseAdapter> {
  if (dbInstance) {
    return dbInstance;
  }

  const backend = process.env.DB_BACKEND ?? 'firebase';

  switch (backend) {
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
      dbInstance = new SupabaseAdapter(
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

  return dbInstance;
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}
