import { S3Client } from '@aws-sdk/client-s3';
import { config } from '../config.js';
import { NotImplementedError } from '../lib/errors.js';

// Prefer instance profile over static access keys on EC2 (CLAUDE.md §12).
export const s3Client: S3Client = new S3Client({
  region: config.AWS_REGION,
  credentials:
    config.AWS_ACCESS_KEY_ID && config.AWS_SECRET_ACCESS_KEY
      ? {
          accessKeyId: config.AWS_ACCESS_KEY_ID,
          secretAccessKey: config.AWS_SECRET_ACCESS_KEY,
        }
      : undefined,
});

export async function presignGet(_key: string, _expiresInSeconds = 3600): Promise<string> {
  throw new NotImplementedError('presignGet');
}

export async function presignPut(_key: string, _expiresInSeconds = 3600): Promise<string> {
  throw new NotImplementedError('presignPut');
}

export async function headObject(_key: string): Promise<{ exists: boolean; size?: number }> {
  throw new NotImplementedError('headObject');
}
