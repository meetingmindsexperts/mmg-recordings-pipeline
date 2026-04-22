import crypto from 'node:crypto';
import type { Request, RequestHandler, Response } from 'express';
import { tasks } from '@trigger.dev/sdk';
import type { processRecording } from '../../trigger/processRecording.js';
import { config } from '../config.js';
import { WebhookSignatureError } from '../lib/errors.js';
import { logger } from '../lib/logger.js';
import { insertRecordingJob } from '../db/queries.js';

// Zoom webhook signature:
//   message = `v0:${x-zm-request-timestamp}:${rawBody}`
//   signature = `v0=${hex(hmac-sha256(message, ZOOM_WEBHOOK_SECRET_TOKEN))}`
// See CLAUDE.md §8 and §12.
export function verifyZoomSignature(
  rawBody: Buffer,
  timestamp: string | undefined,
  signature: string | undefined,
): void {
  if (!timestamp || !signature) {
    throw new WebhookSignatureError('Missing Zoom signature headers');
  }
  const message = `v0:${timestamp}:${rawBody.toString('utf8')}`;
  const computed =
    'v0=' +
    crypto
      .createHmac('sha256', config.ZOOM_WEBHOOK_SECRET_TOKEN)
      .update(message)
      .digest('hex');
  const a = Buffer.from(computed, 'utf8');
  const b = Buffer.from(signature, 'utf8');
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    throw new WebhookSignatureError('Zoom signature mismatch');
  }
}

export function buildUrlValidationResponse(plainToken: string): {
  plainToken: string;
  encryptedToken: string;
} {
  const encryptedToken = crypto
    .createHmac('sha256', config.ZOOM_WEBHOOK_SECRET_TOKEN)
    .update(plainToken)
    .digest('hex');
  return { plainToken, encryptedToken };
}

interface ZoomRawRequest extends Request {
  body: Buffer;
}

interface ZoomRecordingFile {
  id?: string;
  recording_type?: string;
}

interface ZoomRecordingObject {
  uuid?: string;
  id?: number | string;
  topic?: string;
  host_email?: string;
  recording_files?: ZoomRecordingFile[];
}

interface ZoomWebhookBody {
  event?: string;
  payload?: {
    plainToken?: string;
    object?: ZoomRecordingObject;
  };
}

// CLAUDE.md §17: prefer shared_screen_with_speaker_view for webinar post-production.
function pickRecordingFileId(object: ZoomRecordingObject | undefined): string | null {
  const files = object?.recording_files;
  if (!Array.isArray(files) || files.length === 0) return null;
  const preferred = files.find((f) => f.recording_type === 'shared_screen_with_speaker_view');
  const chosen = preferred ?? files[0];
  return chosen?.id ?? null;
}

export const zoomWebhookHandler: RequestHandler = async (req: Request, res: Response) => {
  const raw = (req as ZoomRawRequest).body;
  if (!Buffer.isBuffer(raw)) {
    res.status(400).json({ error: 'raw body not preserved' });
    return;
  }

  try {
    verifyZoomSignature(
      raw,
      req.header('x-zm-request-timestamp') ?? undefined,
      req.header('x-zm-signature') ?? undefined,
    );
  } catch (err) {
    if (err instanceof WebhookSignatureError) {
      logger.warn({ err: err.message }, 'zoom signature verification failed');
      res.status(401).json({ error: 'invalid signature' });
      return;
    }
    throw err;
  }

  let body: ZoomWebhookBody;
  try {
    body = JSON.parse(raw.toString('utf8')) as ZoomWebhookBody;
  } catch {
    res.status(400).json({ error: 'invalid json' });
    return;
  }

  const event = body.event;

  if (event === 'endpoint.url_validation' && body.payload?.plainToken) {
    res.status(200).json(buildUrlValidationResponse(body.payload.plainToken));
    return;
  }

  if (event === 'recording.completed') {
    const meetingUuid = body.payload?.object?.uuid;
    if (!meetingUuid) {
      logger.warn({ event }, 'recording.completed missing payload.object.uuid');
      res.status(400).json({ error: 'missing meeting uuid' });
      return;
    }

    try {
      const inserted = await insertRecordingJob({
        zoom_meeting_uuid: meetingUuid,
        zoom_recording_id: pickRecordingFileId(body.payload?.object),
        entity: null, // v1.5: infer from host email
        source_metadata: body,
      });

      if (!inserted) {
        // Duplicate webhook (CLAUDE.md §9). Do not re-trigger.
        logger.info({ meeting_uuid: meetingUuid }, 'zoom webhook duplicate, ignored');
        res.status(200).json({ ok: true, duplicate: true });
        return;
      }

      const handle = await tasks.trigger<typeof processRecording>('process-recording', {
        jobId: inserted.id,
      });

      logger.info(
        { meeting_uuid: meetingUuid, job_id: inserted.id, run_id: handle.id },
        'recording.completed accepted, processRecording triggered',
      );
      res.status(200).json({ ok: true, jobId: inserted.id });
      return;
    } catch (err) {
      logger.error({ err, meeting_uuid: meetingUuid }, 'recording.completed handler failed');
      res.status(500).json({ error: 'internal error' });
      return;
    }
  }

  // recording.transcript_completed and meeting.ended: accept and log only per CLAUDE.md §8.
  logger.info({ event }, 'zoom webhook received (observed, no action)');
  res.status(200).json({ ok: true, event });
};
