import { task, logger as triggerLogger } from '@trigger.dev/sdk';
import type { JobRef } from './processRecording.js';
import { NotImplementedError } from '../src/lib/errors.js';

// CLAUDE.md §8: 5 attempts, exponential backoff for Zoom flakiness.
export const downloadAndStore = task({
  id: 'download-and-store',
  retry: {
    maxAttempts: 5,
    factor: 2,
    minTimeoutInMs: 2_000,
    maxTimeoutInMs: 60_000,
    randomize: true,
  },
  run: async (payload: JobRef) => {
    triggerLogger.info('downloadAndStore start', { jobId: payload.jobId });
    // TODO: read job, fetch fresh download URL via ZoomClient (not webhook token),
    // stream to S3 Bahrain at recordings/{hash(meeting_uuid)}/original.mp4,
    // extract audio to audio.m4a, transition status: downloading -> downloaded.
    throw new NotImplementedError('downloadAndStore.run');
  },
});
