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

function runPsql(args) {
  return spawnSync('psql', args, {
    stdio: 'inherit',
    env: { ...process.env, PGCLIENTENCODING: 'UTF8' },
  });
}

function quoteSqlText(value) {
  return value.replace(/'/g, "''");
}

function quoteSqlIdent(value) {
  return `"${value.replace(/"/g, '""')}"`;
}

const terminateResult = runPsql([
  '--no-psqlrc',
  '--dbname',
  adminUrl.toString(),
  '-v',
  'ON_ERROR_STOP=1',
  '-c',
  `SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${quoteSqlText(dbName)}' AND pid <> pg_backend_pid();`,
]);
if (terminateResult.status !== 0) process.exit(terminateResult.status ?? 1);

const dropResult = runPsql([
  '--no-psqlrc',
  '--dbname',
  adminUrl.toString(),
  '-v',
  'ON_ERROR_STOP=1',
  '-c',
  `DROP DATABASE IF EXISTS ${quoteSqlIdent(dbName)};`,
]);
if (dropResult.status !== 0) process.exit(dropResult.status ?? 1);

const createResult = runPsql([
  '--no-psqlrc',
  '--dbname',
  adminUrl.toString(),
  '-v',
  'ON_ERROR_STOP=1',
  '-c',
  `CREATE DATABASE ${quoteSqlIdent(dbName)};`,
]);
if (createResult.status !== 0) process.exit(createResult.status ?? 1);

const schemaPath = path.resolve(process.cwd(), 'scripts/db/schema.sql');
const seedPath = path.resolve(process.cwd(), 'scripts/db/seed.sql');
const repertoireSeedPath = path.resolve(process.cwd(), 'scripts/db/repertoire.seed.sql');

for (const filePath of [schemaPath, seedPath, repertoireSeedPath]) {
  const runResult = runPsql([
    '--no-psqlrc',
    '--dbname',
    databaseUrl,
    '-v',
    'ON_ERROR_STOP=1',
    '-f',
    filePath,
  ]);
  if (runResult.status !== 0) process.exit(runResult.status ?? 1);
}

console.log('Database reset complete (drop/recreate + schema + seed + repertoire).');
