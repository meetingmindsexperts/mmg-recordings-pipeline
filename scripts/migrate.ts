import { readdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool, closePool } from '../src/db/client.js';
import { logger } from '../src/lib/logger.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = join(__dirname, '..', 'src', 'db', 'migrations');

async function ensureTrackingTable(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
}

async function getApplied(): Promise<Set<string>> {
  const { rows } = await pool.query<{ name: string }>('SELECT name FROM schema_migrations');
  return new Set(rows.map((r) => r.name));
}

function listMigrationFiles(): string[] {
  return readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort();
}

async function applyMigration(name: string): Promise<void> {
  const sql = readFileSync(join(MIGRATIONS_DIR, name), 'utf8');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('INSERT INTO schema_migrations(name) VALUES ($1)', [name]);
    await client.query('COMMIT');
    logger.info({ migration: name }, 'migration applied');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function main(): Promise<void> {
  await ensureTrackingTable();
  const applied = await getApplied();
  const files = listMigrationFiles();

  let count = 0;
  for (const file of files) {
    if (applied.has(file)) {
      logger.debug({ migration: file }, 'skip (already applied)');
      continue;
    }
    await applyMigration(file);
    count += 1;
  }

  logger.info({ count, total: files.length }, 'migrations complete');
}

main()
  .catch((err: unknown) => {
    logger.error({ err }, 'migration failed');
    process.exitCode = 1;
  })
  .finally(() => {
    void closePool();
  });
