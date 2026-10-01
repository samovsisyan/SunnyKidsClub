import { config } from '../config.js';
import { LocalStorageDriver } from './local.js';
import { S3StorageDriver } from './s3.js';
import type { StorageDriver } from './types.js';

function createDriver(): StorageDriver {
  switch (config.storage.driver) {
    case 's3':
      return new S3StorageDriver(config.storage.s3);
    case 'local':
    default:
      return new LocalStorageDriver(config.storage.uploadDir);
  }
}

export const storage = createDriver();

/** URL used by the frontend for a stored object. */
export function fileUrl(key: string | null | undefined, isPublic: boolean): string | null {
  if (!key) return null;
  return (isPublic && storage.publicUrl(key)) || `/media/${key}`;
}

export type { StorageDriver };
