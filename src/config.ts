import 'dotenv/config';
import { z } from 'zod';
import { ConfigError } from './lib/errors.js';

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

  SLACK_WEBHOOK_URL: z.string().url(),
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
