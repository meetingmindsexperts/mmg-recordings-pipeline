import { NotImplementedError } from '../lib/errors.js';

export interface TranscriptionSubmission {
  transcriptId: string;
}

/**
 * Submit a pre-signed S3 audio URL to AssemblyAI with webhook parameters.
 * Must include webhook_url, webhook_auth_header_name, webhook_auth_header_value
 * on every submission. See CLAUDE.md §8.
 */
export async function submitTranscription(_jobId: string): Promise<TranscriptionSubmission> {
  throw new NotImplementedError('submitTranscription');
}

export async function fetchTranscript(_transcriptId: string): Promise<unknown> {
  throw new NotImplementedError('fetchTranscript');
}
