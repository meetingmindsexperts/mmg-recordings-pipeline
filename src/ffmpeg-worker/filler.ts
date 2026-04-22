import { NotImplementedError } from '../lib/errors.js';

export interface Word {
  text: string;
  start: number; // seconds
  end: number; // seconds
  confidence?: number;
}

export interface FillerCut {
  startSec: number;
  endSec: number;
  word: string;
}

// Conservative default list; tweakable per entity later.
export const DEFAULT_FILLERS: readonly string[] = [
  'um',
  'uh',
  'uhm',
  'erm',
  'ah',
  'like',
  'you know',
  'i mean',
  'sort of',
  'kind of',
];

/**
 * From AssemblyAI word-level timestamps, produce cuts that remove filler words
 * (and short leading/trailing whitespace). See CLAUDE.md §17: always apply a
 * 50-100ms acrossfade at every join during render.
 */
export function findFillerCuts(
  _words: Word[],
  _fillers: readonly string[] = DEFAULT_FILLERS,
): FillerCut[] {
  throw new NotImplementedError('findFillerCuts');
}
