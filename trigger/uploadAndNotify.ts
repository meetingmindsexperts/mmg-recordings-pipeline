import { task, logger as triggerLogger } from '@trigger.dev/sdk';
import type { JobRef } from './processRecording.js';
import { NotImplementedError } from '../src/lib/errors.js';

// CLAUDE.md §8: 5 attempts.
export const uploadAndNotify = task({
  id: 'upload-and-notify',
  retry: {
    maxAttempts: 5,
    factor: 2,
    minTimeoutInMs: 2_000,
    maxTimeoutInMs: 60_000,
  },
  run: async (payload: JobRef) => {
    triggerLogger.info('uploadAndNotify start', { jobId: payload.jobId });
    // TODO: download edited.mp4 from S3, Dropbox uploadAndShare,
    // persist output_url, transition status: editing -> uploading -> complete,
    // send email success (optional in v1) or failure on rejection.
    throw new NotImplementedError('uploadAndNotify.run');
  },
});
