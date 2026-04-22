import { task, logger as triggerLogger } from '@trigger.dev/sdk';
import type { JobRef } from './processRecording.js';
import { NotImplementedError } from '../src/lib/errors.js';

// Deterministic analysis: silencedetect + filler-word list.
// Default retry policy is fine.
export const analyzeSilenceAndFillers = task({
  id: 'analyze-silence-and-fillers',
  run: async (payload: JobRef) => {
    triggerLogger.info('analyzeSilenceAndFillers start', { jobId: payload.jobId });
    // TODO: read transcript.json + audio.m4a, compute cuts, write cuts.json to S3,
    // persist cuts to recording_jobs.cuts (JSONB),
    // transition status: transcribed -> analyzing -> (leave at analyzing for renderVideo to pick up).
    throw new NotImplementedError('analyzeSilenceAndFillers.run');
  },
});
