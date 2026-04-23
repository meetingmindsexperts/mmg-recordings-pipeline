import { config as loadEnv } from 'dotenv';
import { z } from 'zod';
import { ConfigError } from './lib/errors.js';

// Load `.env` first, then let `.env.local` override for local overrides that
// should not be checked in. Values already in process.env (e.g., tests/setup.ts
// or a shell export) always win because dotenv does not overwrite by default.
loadEnv();
loadEnv({ path: '.env.local' });

const schema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  PUBLIC_URL: z.string().url(),

  DATABASE_URL: z.string().min(1),

  AWS_REGION: z.string().min(1),
  S3_BUCKET: z.string().min(1),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),

  ZOOM_ACCOUNT_ID: z.string().min(1),
  ZOOM_CLIENT_ID: z.string().min(1),
  ZOOM_CLIENT_SECRET: z.string().min(1),
  ZOOM_WEBHOOK_SECRET_TOKEN: z.string().min(1),

  ASSEMBLYAI_API_KEY: z.string().min(1),
  ASSEMBLYAI_WEBHOOK_SECRET: z.string().min(1),

  TRIGGER_SECRET_KEY: z.string().min(1),
  TRIGGER_API_URL: z.string().url().default('https://api.trigger.dev'),

  DROPBOX_APP_KEY: z.string().min(1),
  DROPBOX_APP_SECRET: z.string().min(1),
  DROPBOX_REFRESH_TOKEN: z.string().min(1),

  FFMPEG_WORKER_URL: z.string().url(),
  FFMPEG_WORKER_SHARED_SECRET: z.string().min(1),

  ALERT_EMAIL_FROM: z.string().email(),
  // Comma-separated list of recipients. Consumers split on `,` and trim.
  ALERT_EMAIL_TO: z.string().min(1),
});

export type Config = z.infer<typeof schema>;

function load(): Config {
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join('.') || '(root)'}: ${i.message}`)
      .join('\n');
    throw new ConfigError(`Invalid environment configuration:\n${issues}`);
  }
  return parsed.data;
}

export const config: Config = load();
