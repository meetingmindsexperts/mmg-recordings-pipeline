import { ExternalApiError } from './errors.js';

export interface FetchWithTimeoutOptions extends RequestInit {
  timeoutMs: number;
  service: string;
}

export async function fetchWithTimeout(
  url: string,
  { timeoutMs, service, ...init }: FetchWithTimeoutOptions,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...init, signal: controller.signal });
    return res;
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new ExternalApiError(service, `Request timed out after ${timeoutMs}ms`, undefined, err);
    }
    throw new ExternalApiError(
      service,
      err instanceof Error ? err.message : 'Network error',
      undefined,
      err,
    );
  } finally {
    clearTimeout(timer);
  }
}
