import { pino, type Logger } from 'pino';
import { config } from '../config.js';

export const logger = pino({
  level: config.NODE_ENV === 'production' ? 'info' : 'debug',
  base: { service: 'mmg-recording-pipeline' },
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers["x-zm-signature"]',
      'req.headers["x-assemblyai-auth"]',
      '*.ZOOM_CLIENT_SECRET',
      '*.ZOOM_WEBHOOK_SECRET_TOKEN',
      '*.ASSEMBLYAI_API_KEY',
      '*.ASSEMBLYAI_WEBHOOK_SECRET',
      '*.DROPBOX_REFRESH_TOKEN',
      '*.TRIGGER_SECRET_KEY',
      '*.FFMPEG_WORKER_SHARED_SECRET',
      '*.AWS_SECRET_ACCESS_KEY',
    ],
    censor: '[redacted]',
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

export function withJobId(meetingUuid: string): Logger {
  return logger.child({ meeting_uuid: meetingUuid });
}
