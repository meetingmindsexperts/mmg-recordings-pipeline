import { NotImplementedError } from '../lib/errors.js';

export type AlertKind = 'job_failed' | 'job_stuck' | 'worker_unreachable';

export interface AlertPayload {
  meeting_uuid?: string;
  error_stage?: string;
  error?: string;
  triggerRunUrl?: string;
  detail?: string;
}

/**
 * Post a Slack alert. Three kinds only in v1 — see CLAUDE.md §11.
 * Never include transcript contents or attendee PII.
 */
export async function postAlert(_kind: AlertKind, _payload: AlertPayload): Promise<void> {
  throw new NotImplementedError('slack.postAlert');
}
