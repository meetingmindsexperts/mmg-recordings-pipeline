import { task, logger as triggerLogger } from '@trigger.dev/sdk';
import { NotImplementedError } from '../src/lib/errors.js';

export interface JobRef {
  jobId: string;
}

// Parent orchestration task. Payload is ONLY {jobId} (CLAUDE.md §4 rule 1).
// Tasks read state from Postgres and write back; Trigger.dev is not the source of truth.
export const processRecording = task({
  id: 'process-recording',
  maxDuration: 60 * 60 * 3,
  retry: { maxAttempts: 1 },
  run: async (payload: JobRef) => {
    triggerLogger.info('processRecording start', { jobId: payload.jobId });
    // TODO(v1): read job from pg, then triggerAndWait children in order:
    //   downloadAndStore -> submitTranscription (waits on token) -> analyzeSilenceAndFillers
    //   -> renderVideo -> uploadAndNotify
    throw new NotImplementedError('processRecording.run');
  },
});
