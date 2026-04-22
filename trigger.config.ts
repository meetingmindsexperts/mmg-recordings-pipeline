import { defineConfig } from '@trigger.dev/sdk';

// Project ref is injected at deploy time via the TRIGGER_PROJECT_REF env var
// (set in the Trigger.dev dashboard).
export default defineConfig({
  project: process.env.TRIGGER_PROJECT_REF ?? 'proj_utamzxuserusospnymaw',
  dirs: ['./trigger'],
  runtime: 'node',
  logLevel: 'info',
  // Per CLAUDE.md §4: only jobId crosses the border. Keep payloads small.
  maxDuration: 60 * 60 * 3, // 3h upper bound for transcription + render
  retries: {
    enabledInDev: true,
    default: {
      maxAttempts: 3,
      factor: 2,
      minTimeoutInMs: 1000,
      maxTimeoutInMs: 60_000,
      randomize: true,
    },
  },
});
