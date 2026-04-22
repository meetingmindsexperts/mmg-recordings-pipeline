import { NotImplementedError } from '../lib/errors.js';

export interface SilenceDetectOptions {
  thresholdDb: number; // e.g. -30
  minDurationSec: number; // e.g. 0.6
}

export interface SilenceSpan {
  startSec: number;
  endSec: number;
}

/**
 * Detect silences in the audio using ffmpeg's silencedetect filter.
 * Returns non-overlapping spans in source timeline.
 */
export async function detectSilences(
  _audioPath: string,
  _opts: SilenceDetectOptions,
): Promise<SilenceSpan[]> {
  throw new NotImplementedError('detectSilences');
}
