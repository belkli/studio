import { existsSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { config as loadEnv } from 'dotenv';

loadEnv({ path: '.env.local', override: false });
loadEnv({ override: false });

const [, , sqlFile] = process.argv;
if (!sqlFile) {
  console.error('Usage: node scripts/db/run-sql-file.mjs <sql-file-path>');
  process.exit(1);
}

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('Missing DATABASE_URL in environment.');
  process.exit(1);
}

const resolvedFile = path.resolve(process.cwd(), sqlFile);
if (!existsSync(resolvedFile)) {
  console.error(`SQL file not found: ${resolvedFile}`);
  process.exit(1);
}

const result = spawnSync(
  'psql',
  [
    '--no-psqlrc',
    '--dbname',
    databaseUrl,
    '-v',
    'ON_ERROR_STOP=1',
    '-f',
    resolvedFile,
  ],
  {
    stdio: 'inherit'
  }
);

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}
