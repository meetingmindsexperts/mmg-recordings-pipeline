import { task, wait, logger as triggerLogger } from '@trigger.dev/sdk';
import type { JobRef } from './processRecording.js';
import { NotImplementedError } from '../src/lib/errors.js';

// CLAUDE.md §8: 3 attempts. Creates a wait token (2h timeout) consumed by the
// AssemblyAI webhook handler via wait.completeToken.
export const submitTranscription = task({
  id: 'submit-transcription',
  retry: { maxAttempts: 3 },
  run: async (payload: JobRef) => {
    triggerLogger.info('submitTranscription start', { jobId: payload.jobId });
    // TODO: presign audio.m4a (1h), submit to AssemblyAI with webhook params,
    // persist transcript_id, create wait token (2h), store token mapping,
    // transition status: downloaded -> transcribing, then wait.forToken.
    void wait; // silence unused-import until wiring lands
    throw new NotImplementedError('submitTranscription.run');
  },
});
