import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { config as loadEnv } from 'dotenv';

loadEnv({ path: '.env.local', override: false });
loadEnv({ override: false });

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('Missing DATABASE_URL in environment.');
  process.exit(1);
}

const parsed = new URL(databaseUrl);
const dbName = decodeURIComponent(parsed.pathname.replace(/^\//, ''));

if (!dbName) {
  console.error('DATABASE_URL must include a database name.');
  process.exit(1);
}

const adminUrl = new URL(databaseUrl);
adminUrl.pathname = '/postgres';

function runPsql(args, captureOutput = false) {
  return spawnSync('psql', args, {
    stdio: captureOutput ? 'pipe' : 'inherit',
    encoding: captureOutput ? 'utf8' : undefined
  });
}

function quoteSqlText(value) {
  return value.replace(/'/g, "''");
}

function quoteSqlIdent(value) {
  return `"${value.replace(/"/g, '""')}"`;
}

const existsResult = runPsql(
  [
    '--no-psqlrc',
    '--tuples-only',
    '--no-align',
    '--quiet',
    '--dbname',
    adminUrl.toString(),
    '-v',
    'ON_ERROR_STOP=1',
    '-c',
    `SELECT 1 FROM pg_database WHERE datname='${quoteSqlText(dbName)}';`,
  ],
  true
);

if (existsResult.status !== 0) {
  process.stderr.write(existsResult.stderr || 'Failed to check database existence.\n');
  process.exit(existsResult.status ?? 1);
}

const exists = (existsResult.stdout || '').trim() === '1';

if (!exists) {
  const createResult = runPsql([
    '--no-psqlrc',
    '--dbname',
    adminUrl.toString(),
    '-v',
    'ON_ERROR_STOP=1',
    '-c',
    `CREATE DATABASE ${quoteSqlIdent(dbName)};`,
  ]);

  if (createResult.status !== 0) {
    process.exit(createResult.status ?? 1);
  }
}

const schemaPath = path.resolve(process.cwd(), 'scripts/db/schema.sql');
const seedPath = path.resolve(process.cwd(), 'scripts/db/seed.sql');

for (const filePath of [schemaPath, seedPath]) {
  const runResult = runPsql([
    '--no-psqlrc',
    '--dbname',
    databaseUrl,
    '-v',
    'ON_ERROR_STOP=1',
    '-f',
    filePath,
  ]);

  if (runResult.status !== 0) {
    process.exit(runResult.status ?? 1);
  }
}

console.log('Database reset complete.');
