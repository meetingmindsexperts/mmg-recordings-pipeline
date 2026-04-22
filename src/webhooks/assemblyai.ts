import crypto from 'node:crypto';
import type { Request, RequestHandler, Response } from 'express';
import { config } from '../config.js';
import { WebhookSignatureError } from '../lib/errors.js';
import { logger } from '../lib/logger.js';

// We set the auth header name + value on each AssemblyAI submission; it echoes
// the value back on the webhook. We compare timing-safe.
const AUTH_HEADER_NAME = 'x-assemblyai-auth';

export function verifyAssemblyAiAuth(headerValue: string | undefined): void {
  if (!headerValue) {
    throw new WebhookSignatureError('Missing AssemblyAI auth header');
  }
  const expected = Buffer.from(config.ASSEMBLYAI_WEBHOOK_SECRET, 'utf8');
  const received = Buffer.from(headerValue, 'utf8');
  if (expected.length !== received.length || !crypto.timingSafeEqual(expected, received)) {
    throw new WebhookSignatureError('AssemblyAI auth header mismatch');
  }
}

export const assemblyAiWebhookHandler: RequestHandler = (req: Request, res: Response) => {
  try {
    verifyAssemblyAiAuth(req.header(AUTH_HEADER_NAME) ?? undefined);
  } catch (err) {
    if (err instanceof WebhookSignatureError) {
      logger.warn({ err: err.message }, 'assemblyai auth verification failed');
      res.status(401).json({ error: 'invalid auth' });
      return;
    }
    throw err;
  }

  // TODO(v1): parse {transcript_id, status}, look up job, call wait.completeToken(tokenId, payload)
  //   and transition status: transcribing -> transcribed.
  logger.info('assemblyai webhook received (stub)');
  res.status(501).json({ error: 'not implemented' });
};
