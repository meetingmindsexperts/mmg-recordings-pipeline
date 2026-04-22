import crypto from 'node:crypto';
import express, { type Request, type RequestHandler, type Response } from 'express';
import { config } from '../config.js';
import { logger } from '../lib/logger.js';

const WORKER_PORT = 8080;

const bearerAuth: RequestHandler = (req, res, next) => {
  const header = req.header('authorization');
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'missing bearer token' });
    return;
  }
  const provided = Buffer.from(header.slice('Bearer '.length), 'utf8');
  const expected = Buffer.from(config.FFMPEG_WORKER_SHARED_SECRET, 'utf8');
  if (provided.length !== expected.length || !crypto.timingSafeEqual(provided, expected)) {
    res.status(401).json({ error: 'invalid bearer token' });
    return;
  }
  next();
};

export function buildWorkerApp(): express.Express {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.get('/healthz', (_req: Request, res: Response) => {
    res.json({ ok: true });
  });

  app.post('/render', bearerAuth, (_req: Request, res: Response) => {
    // TODO(v1): accept {jobId, inputS3Key, cuts, outputS3Key}, pull original from S3,
    // run ffmpeg with silencedetect results + filler cuts, apply acrossfade at every join,
    // upload result back to S3, return 200. See CLAUDE.md §17.
    res.status(501).json({ error: 'not implemented' });
  });

  return app;
}

function main(): void {
  const app = buildWorkerApp();
  app.listen(WORKER_PORT, () => {
    logger.info({ port: WORKER_PORT }, 'ffmpeg worker listening');
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
