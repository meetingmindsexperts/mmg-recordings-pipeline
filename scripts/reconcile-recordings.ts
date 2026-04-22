import { logger } from '../src/lib/logger.js';
import { closePool } from '../src/db/client.js';

// v1.5: nightly cron. Pull the last 24-48h of recordings from Zoom REST API,
// diff against recording_jobs, and insert any that were missed by webhooks.
// See CLAUDE.md §16.
async function main(): Promise<void> {
  logger.warn('reconcile-recordings: not implemented (v1.5 feature)');
}

main()
  .catch((err: unknown) => {
    logger.error({ err }, 'reconcile failed');
    process.exitCode = 1;
  })
  .finally(() => {
    void closePool();
  });
