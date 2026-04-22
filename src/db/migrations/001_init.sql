-- 001_init.sql
-- Initial schema. Forward-only; do not edit after it has been applied anywhere.
-- See CLAUDE.md §6.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS recording_jobs (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zoom_meeting_uuid   TEXT UNIQUE NOT NULL,
  zoom_recording_id   TEXT,
  status              TEXT NOT NULL,
  entity              TEXT,
  source_metadata     JSONB NOT NULL,
  s3_prefix           TEXT,
  transcript_id       TEXT,
  cuts                JSONB,
  output_url          TEXT,
  error               TEXT,
  error_stage         TEXT,
  attempts            JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_recording_jobs_status  ON recording_jobs(status);
CREATE INDEX IF NOT EXISTS idx_recording_jobs_created ON recording_jobs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_recording_jobs_entity  ON recording_jobs(entity) WHERE entity IS NOT NULL;
