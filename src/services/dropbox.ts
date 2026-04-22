import { NotImplementedError } from '../lib/errors.js';

export interface DropboxUploadResult {
  path: string;
  sharedLink: string;
}

/**
 * Upload the edited MP4 to Dropbox via the official SDK and create a shared link.
 * Destination layout: /MMG Recordings/{entity}/{YYYY-MM}/{meeting_topic}.mp4 (CLAUDE.md §8).
 */
export async function uploadAndShare(_jobId: string, _localPath: string): Promise<DropboxUploadResult> {
  throw new NotImplementedError('dropbox.uploadAndShare');
}
