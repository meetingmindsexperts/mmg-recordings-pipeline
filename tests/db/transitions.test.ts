import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { pool, closePool } from '../../src/db/client.js';
import {
  appendAttempt,
  getJobById,
  getJobByMeetingUuid,
  insertRecordingJob,
  markFailed,
  transitionStatus,
} from '../../src/db/queries.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const MIGRATION_SQL = readFileSync(
  join(__dirname, '..', '..', 'src', 'db', 'migrations', '001_init.sql'),
  'utf8',
);

function uniqueMeetingUuid(label: string): string {
  return `${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

async function insertReceivedJob(label: string): Promise<string> {
  const inserted = await insertRecordingJob({
    zoom_meeting_uuid: uniqueMeetingUuid(label),
    zoom_recording_id: 'rec-1',
    entity: 'MME',
    source_metadata: { event: 'recording.completed' },
  });
  if (!inserted) throw new Error('fixture insert returned null');
  return inserted.id;
}

describe('recording_jobs status transitions', () => {
  beforeAll(async () => {
    await pool.query(MIGRATION_SQL);
  });

  afterAll(async () => {
    await closePool();
  });

  beforeEach(async () => {
    await pool.query('TRUNCATE recording_jobs');
  });

  it('transitionStatus returns true when the expected prior status matches', async () => {
    const id = await insertReceivedJob('transition-ok');

    const ok = await transitionStatus(id, 'received', 'downloading');

    expect(ok).toBe(true);
    const job = await getJobById(id);
    expect(job?.status).toBe('downloading');
  });

  it('transitionStatus returns false (zero rows updated) when status drifted', async () => {
    const id = await insertReceivedJob('transition-drift');
    await transitionStatus(id, 'received', 'downloading');

    // Another worker tries to advance from the stale "received" state.
    const ok = await transitionStatus(id, 'received', 'downloaded');

    expect(ok).toBe(false);
    const job = await getJobById(id);
    expect(job?.status).toBe('downloading');
  });

  it('a second INSERT with the same zoom_meeting_uuid returns null (idempotent)', async () => {
    const uuid = uniqueMeetingUuid('idempotent');
    const first = await insertRecordingJob({
      zoom_meeting_uuid: uuid,
      zoom_recording_id: 'rec-1',
      entity: 'MME',
      source_metadata: { event: 'recording.completed' },
    });
    expect(first).not.toBeNull();

    const second = await insertRecordingJob({
      zoom_meeting_uuid: uuid,
      zoom_recording_id: 'rec-1',
      entity: 'MME',
      source_metadata: { event: 'recording.completed' },
    });

    expect(second).toBeNull();
    const job = await getJobByMeetingUuid(uuid);
    expect(job?.id).toBe(first?.id);
  });

  it('appendAttempt pushes to the attempts JSONB array', async () => {
    const id = await insertReceivedJob('append-attempt');

    await appendAttempt(id, { stage: 'downloading', outcome: 'started' });
    await appendAttempt(id, { stage: 'downloading', outcome: 'succeeded' });

    const job = await getJobById(id);
    expect(job?.attempts).toHaveLength(2);
    expect(job?.attempts[0]).toMatchObject({ stage: 'downloading', outcome: 'started' });
    expect(job?.attempts[1]).toMatchObject({ stage: 'downloading', outcome: 'succeeded' });
    expect(typeof job?.attempts[0]?.at).toBe('string');
  });

  it('markFailed sets error, error_stage, and transitions to failed', async () => {
    const id = await insertReceivedJob('mark-failed');
    await transitionStatus(id, 'received', 'downloading');

    await markFailed(id, 'downloading', 'zoom 502 bad gateway');

    const job = await getJobById(id);
    expect(job?.status).toBe('failed');
    expect(job?.error).toBe('zoom 502 bad gateway');
    expect(job?.error_stage).toBe('downloading');
  });
});
