import { NotImplementedError } from '../lib/errors.js';

/**
 * Zoom Server-to-Server OAuth client.
 *
 * Use to fetch a fresh download URL rather than trusting the `download_token`
 * on the webhook payload (it expires in ~1h). See CLAUDE.md §8.
 */
export class ZoomClient {
  async getAccessToken(): Promise<string> {
    throw new NotImplementedError('ZoomClient.getAccessToken');
  }

  async getRecordingDownloadUrl(_meetingUuid: string, _recordingFileId: string): Promise<string> {
    throw new NotImplementedError('ZoomClient.getRecordingDownloadUrl');
  }

  async getUser(_userId: string): Promise<{ email: string }> {
    throw new NotImplementedError('ZoomClient.getUser');
  }
}
