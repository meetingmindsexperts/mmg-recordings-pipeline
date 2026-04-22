import crypto from 'node:crypto';
import type { AddressInfo } from 'node:net';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildApp } from '../../src/index.js';
import { verifyZoomSignature } from '../../src/webhooks/zoom.js';
import { WebhookSignatureError } from '../../src/lib/errors.js';

const SECRET = process.env.ZOOM_WEBHOOK_SECRET_TOKEN as string;

function signZoom(timestamp: string, rawBody: string): string {
  const hmac = crypto.createHmac('sha256', SECRET);
  hmac.update(`v0:${timestamp}:${rawBody}`);
  return `v0=${hmac.digest('hex')}`;
}

describe('zoom webhook signature verification', () => {
  it('rejects a request with no x-zm-signature header', () => {
    expect(() => verifyZoomSignature(Buffer.from('{}'), '123', undefined)).toThrow(
      WebhookSignatureError,
    );
    expect(() => verifyZoomSignature(Buffer.from('{}'), undefined, 'v0=abc')).toThrow(
      WebhookSignatureError,
    );
  });

  it('rejects a request with a mismatched signature', () => {
    const body = Buffer.from('{"event":"recording.completed"}');
    const ts = '1700000000';
    const goodSig = signZoom(ts, body.toString('utf8'));
    // Flip one hex char — same length, wrong digest.
    const lastChar = goodSig.slice(-1);
    const replacement = lastChar === '0' ? '1' : '0';
    const tampered = goodSig.slice(0, -1) + replacement;

    expect(() => verifyZoomSignature(body, ts, tampered)).toThrow(WebhookSignatureError);
  });

  it('accepts a request with a valid v0=<hmac> signature', () => {
    const body = Buffer.from('{"event":"recording.completed"}');
    const ts = '1700000000';
    const sig = signZoom(ts, body.toString('utf8'));

    expect(() => verifyZoomSignature(body, ts, sig)).not.toThrow();
  });

  it('uses crypto.timingSafeEqual (length mismatch does not throw)', () => {
    // timingSafeEqual itself throws on length mismatch, so verifyZoomSignature
    // must length-check before calling it. Provide a shorter signature and
    // confirm we get a WebhookSignatureError (mismatch), not a RangeError.
    const body = Buffer.from('{}');
    const ts = '1700000000';

    let caught: unknown;
    try {
      verifyZoomSignature(body, ts, 'v0=deadbeef');
    } catch (err) {
      caught = err;
    }

    expect(caught).toBeInstanceOf(WebhookSignatureError);
  });

  describe('endpoint.url_validation', () => {
    let server: import('node:http').Server;
    let baseUrl: string;

    beforeAll(async () => {
      const app = buildApp();
      await new Promise<void>((resolve) => {
        server = app.listen(0, '127.0.0.1', () => resolve());
      });
      const { port } = server.address() as AddressInfo;
      baseUrl = `http://127.0.0.1:${port}`;
    });

    afterAll(async () => {
      await new Promise<void>((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
      });
    });

    it('responds to endpoint.url_validation with {plainToken, encryptedToken}', async () => {
      const plainToken = 'abc-plain-token';
      const bodyStr = JSON.stringify({
        event: 'endpoint.url_validation',
        payload: { plainToken },
      });
      const ts = Math.floor(Date.now() / 1000).toString();

      const res = await fetch(`${baseUrl}/webhooks/zoom`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-zm-request-timestamp': ts,
          'x-zm-signature': signZoom(ts, bodyStr),
        },
        body: bodyStr,
      });

      expect(res.status).toBe(200);
      const json = (await res.json()) as { plainToken: string; encryptedToken: string };
      expect(json.plainToken).toBe(plainToken);
      expect(json.encryptedToken).toBe(
        crypto.createHmac('sha256', SECRET).update(plainToken).digest('hex'),
      );
    });
  });
});
