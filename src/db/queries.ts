import type { PoolClient } from 'pg';
import { pool } from './client.js';

export type JobStatus =
  | 'received'
  | 'downloading'
  | 'downloaded'
  | 'transcribing'
  | 'transcribed'
  | 'analyzing'
  | 'editing'
  | 'uploading'
  | 'complete'
  | 'failed';

export interface Attempt {
  stage: string;
  at: string;
  outcome: string;
}

export interface RecordingJob {
  id: string;
  zoom_meeting_uuid: string;
  zoom_recording_id: string | null;
  status: JobStatus;
  entity: string | null;
  source_metadata: unknown;
  s3_prefix: string | null;
  transcript_id: string | null;
  cuts: unknown;
  output_url: string | null;
  error: string | null;
  error_stage: string | null;
  attempts: Attempt[];
  created_at: Date;
  updated_at: Date;
}

export interface InsertRecordingJobInput {
  zoom_meeting_uuid: string;
  zoom_recording_id: string | null;
  entity: string | null;
  source_metadata: unknown;
}

type Runner = Pick<PoolClient, 'query'>;

function runner(client?: PoolClient): Runner {
  return client ?? pool;
}

const SELECT_COLUMNS = `
  id,
  zoom_meeting_uuid,
  zoom_recording_id,
  status,
  entity,
  source_metadata,
  s3_prefix,
  transcript_id,
  cuts,
  output_url,
  error,
  error_stage,
  attempts,
  created_at,
  updated_at
`;

/**
 * INSERT ... ON CONFLICT (zoom_meeting_uuid) DO NOTHING RETURNING id.
 * Returns null if the row already exists (duplicate Zoom webhook).
 * See CLAUDE.md §9.
 */
export async function insertRecordingJob(
  input: InsertRecordingJobInput,
  client?: PoolClient,
): Promise<{ id: string } | null> {
  const result = await runner(client).query<{ id: string }>(
    `
    INSERT INTO recording_jobs (zoom_meeting_uuid, zoom_recording_id, status, entity, source_metadata)
    VALUES ($1, $2, 'received', $3, $4)
    ON CONFLICT (zoom_meeting_uuid) DO NOTHING
    RETURNING id
    `,
    [input.zoom_meeting_uuid, input.zoom_recording_id, input.entity, input.source_metadata],
  );
  return result.rows[0] ?? null;
}

export async function getJobById(id: string, client?: PoolClient): Promise<RecordingJob | null> {
  const result = await runner(client).query<RecordingJob>(
    `SELECT ${SELECT_COLUMNS} FROM recording_jobs WHERE id = $1`,
    [id],
  );
  return result.rows[0] ?? null;
}

export async function getJobByMeetingUuid(
  meetingUuid: string,
  client?: PoolClient,
): Promise<RecordingJob | null> {
  const result = await runner(client).query<RecordingJob>(
    `SELECT ${SELECT_COLUMNS} FROM recording_jobs WHERE zoom_meeting_uuid = $1`,
    [meetingUuid],
  );
  return result.rows[0] ?? null;
}

/**
 * Idempotent status transition. Returns true iff exactly one row was updated.
 * A false return means the row is not in `from` (duplicate worker, drift, or
 * already-advanced state) — the caller should log and no-op. See CLAUDE.md §7.
 */
export async function transitionStatus(
  id: string,
  from: JobStatus,
  to: JobStatus,
  client?: PoolClient,
): Promise<boolean> {
  const result = await runner(client).query(
    `UPDATE recording_jobs
       SET status = $3, updated_at = now()
     WHERE id = $1 AND status = $2`,
    [id, from, to],
  );
  return result.rowCount === 1;
}

export async function markFailed(
  id: string,
  errorStage: JobStatus,
  message: string,
  client?: PoolClient,
): Promise<void> {
  await runner(client).query(
    `UPDATE recording_jobs
       SET status = 'failed',
           error = $2,
           error_stage = $3,
           updated_at = now()
     WHERE id = $1`,
    [id, message, errorStage],
  );
}

export async function appendAttempt(
  id: string,
  attempt: { stage: JobStatus; outcome: 'started' | 'succeeded' | 'failed' },
  client?: PoolClient,
): Promise<void> {
  await runner(client).query(
    `UPDATE recording_jobs
       SET attempts = attempts || jsonb_build_array(
             jsonb_build_object(
               'stage', $2::text,
               'outcome', $3::text,
               'at', to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
             )
           ),
           updated_at = now()
     WHERE id = $1`,
    [id, attempt.stage, attempt.outcome],
  );
}
