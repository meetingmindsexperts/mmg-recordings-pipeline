import { logger } from '../src/lib/logger.js';
import { closePool } from '../src/db/client.js';

function parseJobId(): string | null {
  const idx = process.argv.indexOf('--job-id');
  if (idx === -1 || idx === process.argv.length - 1) return null;
  return process.argv[idx + 1] ?? null;
}

// Reset a failed job to its prior non-failed state and re-trigger processRecording.
// See CLAUDE.md §7: failed is terminal; this is the only sanctioned way out.
async function main(): Promise<void> {
  const jobId = parseJobId();
  if (!jobId) {
    logger.error('usage: npm run replay -- --job-id <uuid>');
    process.exitCode = 2;
    return;
  }
  logger.warn({ jobId }, 'replay-job: not implemented');
}

main()
  .catch((err: unknown) => {
    logger.error({ err }, 'replay failed');
    process.exitCode = 1;
  })
  .finally(() => {
    void closePool();
  });
