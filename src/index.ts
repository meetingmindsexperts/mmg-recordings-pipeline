import express, { type Request, type Response } from 'express';
import { pinoHttp } from 'pino-http';
import { config } from './config.js';
import { logger } from './lib/logger.js';
import { closePool } from './db/client.js';
import { zoomWebhookHandler } from './webhooks/zoom.js';
import { assemblyAiWebhookHandler } from './webhooks/assemblyai.js';

export function buildApp(): express.Express {
  const app = express();

  app.use(pinoHttp({ logger }));

  // CRITICAL (CLAUDE.md §8): webhook routes need the RAW body for signature
  // verification, so register express.raw BEFORE the global express.json().
  app.post('/webhooks/zoom', express.raw({ type: '*/*', limit: '2mb' }), zoomWebhookHandler);
  app.post(
    '/webhooks/assemblyai',
    express.raw({ type: '*/*', limit: '2mb' }),
    assemblyAiWebhookHandler,
  );

  app.use(express.json({ limit: '1mb' }));

  app.get('/healthz', (_req: Request, res: Response) => {
    res.json({ ok: true });
  });

  return app;
}

function main(): void {
  const app = buildApp();
  const server = app.listen(config.PORT, () => {
    logger.info({ port: config.PORT, env: config.NODE_ENV }, 'mmg-recording-pipeline listening');
  });

  const shutdown = (signal: string): void => {
    logger.info({ signal }, 'shutdown signal received');
    server.close(() => {
      closePool()
        .catch((err: unknown) => logger.error({ err }, 'error closing pg pool'))
        .finally(() => process.exit(0));
    });
    setTimeout(() => {
      logger.warn('forcing exit after shutdown timeout');
      process.exit(1);
    }, 10_000).unref();
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
