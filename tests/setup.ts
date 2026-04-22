// Bootstraps env for vitest BEFORE src/config.ts loads. Defaults are safe
// dummy values that satisfy the zod schema — real secrets are never needed
// for DB-level tests. DATABASE_URL points at the docker-compose Postgres;
// override via the shell to run against a different instance.

const defaults: Record<string, string> = {
  NODE_ENV: 'test',
  PORT: '3000',
  PUBLIC_URL: 'http://localhost:3000',
  DATABASE_URL: 'postgres://mmg:mmg@localhost:5433/mmg_recordings',
  AWS_REGION: 'me-central-1',
  S3_BUCKET: 'mmg-recordings-bahrain-test',
  ZOOM_ACCOUNT_ID: 'test',
  ZOOM_CLIENT_ID: 'test',
  ZOOM_CLIENT_SECRET: 'test',
  ZOOM_WEBHOOK_SECRET_TOKEN: 'test-zoom-webhook-secret',
  ASSEMBLYAI_API_KEY: 'test',
  ASSEMBLYAI_WEBHOOK_SECRET: 'test-assemblyai-webhook-secret',
  TRIGGER_SECRET_KEY: 'test',
  TRIGGER_API_URL: 'https://api.trigger.dev',
  DROPBOX_APP_KEY: 'test',
  DROPBOX_APP_SECRET: 'test',
  DROPBOX_REFRESH_TOKEN: 'test',
  FFMPEG_WORKER_URL: 'http://127.0.0.1:8080',
  FFMPEG_WORKER_SHARED_SECRET: 'test',
  SLACK_WEBHOOK_URL: 'https://hooks.slack.com/services/TEST/TEST/TEST',
};

for (const [key, value] of Object.entries(defaults)) {
  if (process.env[key] === undefined || process.env[key] === '') {
    process.env[key] = value;
  }
}
