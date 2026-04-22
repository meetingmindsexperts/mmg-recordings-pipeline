import { task, logger as triggerLogger } from '@trigger.dev/sdk';
import type { JobRef } from './processRecording.js';
import { NotImplementedError } from '../src/lib/errors.js';

// CLAUDE.md §8: 2 attempts only — renders are expensive; alert on failure.
export const renderVideo = task({
  id: 'render-video',
  retry: { maxAttempts: 2 },
  run: async (payload: JobRef) => {
    triggerLogger.info('renderVideo start', { jobId: payload.jobId });
    // TODO: POST to FFMPEG_WORKER_URL /render with bearer auth,
    // pass {jobId, inputS3Key, cuts, outputS3Key} — body stays small.
    // Worker does the heavy lifting; this task just awaits completion.
    // transition status: analyzing -> editing -> (leave at editing for uploadAndNotify).
    throw new NotImplementedError('renderVideo.run');
  },
});
